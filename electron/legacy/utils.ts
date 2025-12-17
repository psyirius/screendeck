import { app, BrowserWindow, ipcMain } from 'electron'
import Store from 'electron-store'
import ShortUniqueId from 'short-uuid'
import { defaultSettings } from './defaults'
import * as path from 'node:path'
import { createNewDevice, showWindows } from './device'
import { CompanionSatelliteClient } from './client'
import { updateTrayMenu } from './tray'
import { ProfilesStore } from './types'
import { showNotification } from './notification'
import { unregisterAllHotkeys } from './hotkeys'
import { is } from '@electron-toolkit/utils'
import { globalContext } from './global'
import { webDeviceActions } from './web-api'

const store = new Store({ defaults: defaultSettings })

export const showDevTools = is.dev || (process.env.DEBUG_PROD === 'true')

// Initialize the deviceIds list (runs on first app launch)
export function initializeDeviceIds() {
    let deviceIds = store.get('deviceIds') as string[] | undefined

    if (!deviceIds || deviceIds.length === 0) {
        const newDeviceId = createNewDevice()
        store.set('deviceIds', [newDeviceId])
    }
}

// ===========================
// Companion Satellite Client
// ===========================

export function createSatellite() {
    // Create the CompanionSatelliteClient
    if (globalContext.satelliteClient?.connected) {
        console.log('[Satellite] Already connected, skipping initialization')
        return
    }

    globalContext.satelliteClient = new CompanionSatelliteClient({ debug: true })

    // Handle connection events
    globalContext.satelliteClient.on('log', (msg) => console.log(`[Satellite] ${msg}`))
    globalContext.satelliteClient.on('error', (err) => console.error(`[Satellite Error] ${err}`))

    globalContext.satelliteClient.on('connected', () => {
        console.log('[Satellite] Connected Event Received')
        // Register devices
        setTimeout(() => {
            const deviceIds = store.get('deviceIds') as string[] | []
            for (const deviceId of deviceIds) {
                console.log(`[Satellite] Adding device: ${deviceId}`)
                globalContext.satelliteClient?.addDevice(deviceId, 'ScreenDeck', {
                    columnCount: store.get(`device.${deviceId}.columnCount`, 8),
                    rowCount: store.get(`device.${deviceId}.rowCount`, 4),
                    bitmapSize: store.get(`device.${deviceId}.bitmapSize`, 72),
                    colours: true,
                    text: true,
                    brightness: true,
                    pincodeMap: null,
                })
            }

            updateTrayMenu()
            showWindows()
        }, 500)
    })

    globalContext.satelliteClient.on('draw', (data) => {
        console.log(`[Satellite] Draw event for device ${data.deviceId}`)
        console.log('[Satellite] Draw data:', data)

        //save the image to global.keyStates
        data.imageBase64 = data.image?.toString('base64') || undefined

        //save to global.keyStates
        if (!globalContext.keyStates.has(data.deviceId)) {
            globalContext.keyStates.set(data.deviceId, new Map())
        }

        // If this key is a registered hotkey, update its bitmap reference too
        for (const [_hotkey, mapping] of globalContext.registeredHotkeys.entries()) {
            if (mapping.deviceId === data.deviceId && mapping.keyIndex === data.keyIndex) {
                // Update the bitmap for this hotkey (optional redundancy)
                mapping.imageBase64 = data.imageBase64 ?? ''
            }
        }

        const deviceKeyStates = globalContext.keyStates.get(data.deviceId)
        if (deviceKeyStates) {
            deviceKeyStates.set(data.keyIndex, {
                imageBase64: data.imageBase64,
                color: data.color,
                text: data.text,
            })
        }

        // Send the draw event to the corresponding device window
        const win = globalContext.deviceWindows.get(data.deviceId)
        if (win) {
            //resizeWindowForDevice(data.deviceId)
            // TODO: IPC
            win.webContents.send('draw', data)
        }
        webDeviceActions.draw(data.deviceId, data);
    })

    globalContext.satelliteClient.on('clearDeck', (data) => {
        const win = globalContext.deviceWindows.get(data.deviceId)
        if (win) {
            // TODO: IPC
            win.webContents.send('clearDeck')
        }
        webDeviceActions.clearDeck(data.deviceId);
    })

    globalContext.satelliteClient.on('brightness', (data) => {
        const win = globalContext.deviceWindows.get(data.deviceId)
        if (win) {
            // TODO: IPC
            win.webContents.send('brightness', data.percent)
        }
        webDeviceActions.setBrightness(data.deviceId, data.percent);
    })

    globalContext.satelliteClient.on('lockedState', (data) => {
        const win = globalContext.deviceWindows.get(data.deviceId)
        if (win) {
            // TODO: IPC
            win.webContents.send('lockedState', data)
        }
        webDeviceActions.setLockedState(data.deviceId, data)
    })

    // Connect to Companion
    globalContext.satelliteClient
        .connect({
            mode: 'tcp',
            host: store.get('companionIP', '127.0.0.1') as string, // FIXME: use from settings
            port: store.get('companionPort', 16622) as number, // FIXME: use from settings
        })
        .then(() => {
            console.log('[Satellite] Connection established successfully')
        })
        .catch((err) => {
            console.error(`[Satellite] Connection failed: ${err}`)
        })
}

// ===========================
// Profile Management
// ===========================

function generateProfileId() {
    const uuidGenerator = ShortUniqueId()
    return `profile-${uuidGenerator.new()}`
}

export function promptForProfileName(): Promise<string | undefined> {
    return new Promise((resolve) => {
        const promptWindow = new BrowserWindow({
            width: 500,
            height: 200,
            resizable: false,
            minimizable: false,
            maximizable: false,
            modal: true,
            show: false,
            parent: BrowserWindow.getFocusedWindow() || undefined,
            webPreferences: {
                preload: path.join(__dirname, '../preload/index.js'),
                contextIsolation: true,
                nodeIntegration: false,
            },
        })

        //show dev tools
        if (showDevTools) {
            promptWindow.webContents.openDevTools({
                mode: 'detach', // Open in a separate window
            })
        }

        // HMR for renderer base on electron-vite cli.
        // Load the remote URL for development or the local html file for production.
        if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
            promptWindow.loadURL(`${process.env['ELECTRON_RENDERER_URL']}/?page=profilePrompt`)
        } else {
            promptWindow.loadFile(path.join(__dirname, '../renderer/index.html'), {
                query: { page: 'profilePrompt' },
            })
        }

        promptWindow.once('ready-to-show', () => {
            promptWindow.show()
        })

        // Listen for the input from the renderer
        // TODO: IPC
        // TODO: move this to a more central ipc handler
        ipcMain.once('profileNameResult', (_event, result) => {
            resolve(result)
            promptWindow.close()
        })

        promptWindow.on('closed', () => {
            resolve(undefined)
        })
    })
}

export function getNextProfileName() {
    const existingProfiles = store.get('profiles', {}) as ProfilesStore // object of profiles
    let maxNumber = 0

    Object.values(existingProfiles).forEach((profile) => {
        const match = profile.name?.match(/^Profile (\d+)$/)
        if (match) {
            const num = parseInt(match[1])
            if (num > maxNumber) maxNumber = num
        }
    })

    return `Profile ${maxNumber + 1}`
}

export function saveProfile(profileName: string) {
    const profileId = generateProfileId()

    const profiles: ProfilesStore = store.get('profiles', {})
    profiles[profileId] = {
        name: profileName,
        deviceIds: store.get('deviceIds', []),
        devices: store.get('device', {}),
    }
    store.set('profiles', profiles)

    console.log(`Profile "${profileName}" saved as ${profileId}.`)
    showNotification(
        'Profile Saved',
        `Profile "${profileName}" has been saved successfully.`
    )

    updateTrayMenu()
}

export function loadProfile(profileId: string) {
    const profiles = store.get('profiles', {}) as ProfilesStore
    const profile = profiles[profileId]

    if (!profile) return

    const profileName = profile.name

    console.log(`Loading profile "${profileName}" with ID ${profileId}`)
    console.log('Profile details:', profile)

    // Close all current windows
    globalContext.deviceWindows.forEach((win) => win.close())
    globalContext.deviceWindows.clear()

    // Remove all current devices from satellite
    if (globalContext.satelliteClient) {
        const currentDeviceIds = store.get('deviceIds', []) as string[]
        for (const deviceId of currentDeviceIds) {
            console.log(`[Satellite] Removing device: ${deviceId}`)
            globalContext.satelliteClient.removeDevice(deviceId)
        }
    }

    // Remove all 'device.<deviceId>.' keys from store
    const currentDeviceIds = store.get('deviceIds', []) as string[]
    for (const deviceId of currentDeviceIds) {
        const keysToRemove = Object.keys(store.store).filter((key) =>
            key.startsWith(`device.${deviceId}.`)
        )
        for (const key of keysToRemove) {
            store.delete(key as any)
        }
    }

    //unregister all hotkeys for devices
    unregisterAllHotkeys()

    // Set deviceIds and restore device configs from profile
    store.set('deviceIds', profile.deviceIds)

    for (const deviceId of profile.deviceIds) {
        const deviceConfig = profile.devices[deviceId]
        if (deviceConfig) {
            Object.entries(deviceConfig).forEach(([key, value]) => {
                store.set(`device.${deviceId}.${key}`, value)
            })
        }
    }

    //restart the app
    app.relaunch()
    app.exit(0)

    /*
    // Recreate device windows
    createDeviceWindows()
    const deviceIds = store.get('deviceIds', []) as string[]
    console.log(`Recreating windows for devices: ${deviceIds.join(', ')}`)
    for (const deviceId of deviceIds) {
        console.log(`[Satellite] Adding device: ${deviceId}`)
        global.satelliteClient?.addDevice(deviceId, 'ScreenDeck', {
            columnCount: store.get(`device.${deviceId}.columnCount`, 8),
            rowCount: store.get(`device.${deviceId}.rowCount`, 4),
            bitmapSize: store.get(`device.${deviceId}.bitmapSize`, 72),
            colours: true,
            text: true,
            brightness: true,
            pincodeMap: null,
        })
    }

    showWindows()

    //register hotkeys for the new devices
    loadHotkeysFromStore()

    console.log(`Profile "${profileName}" loaded.`)

    showNotification(
        'Profile Loaded',
        `Profile "${profileName}" has been loaded successfully.`
    )

    store.set('currentProfile', profileId)

    updateTrayMenu()*/
}

export function deleteProfile(profileId: string) {
    const profiles = store.get('profiles', {}) as ProfilesStore
    const profile = profiles[profileId]
    if (!profile) return
    const profileName = profiles[profileId]?.name
    delete profiles[profileId]
    store.set('profiles', profiles)
    console.log(`Profile "${profileName}" deleted.`)
    showNotification(
        'Profile Deleted',
        `Profile "${profileName}" has been deleted successfully.`
    )
    updateTrayMenu()
}
