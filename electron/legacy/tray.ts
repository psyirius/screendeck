import { Tray, Menu, nativeImage, app } from 'electron'
import Store from 'electron-store'
import createSettingsWindow from './settings'
import {
    loadProfile,
    deleteProfile,
    saveProfile,
    promptForProfileName,
} from './utils'
import { ProfilesStore } from './types'
import { unregisterAllHotkeys } from './hotkeys'
import trayIcon from '../../assets/tray-icon.png?asset'
import { globalContext } from './global'
import { webDeviceActions } from './web-api'

let tray: Tray | null = null
const store = new Store()

export default function createTray() {
    // Create the tray icon using nativeImage and resize it to the desired size
    const image = nativeImage.createFromPath(trayIcon)
    tray = new Tray(image.resize({ width: 16, height: 16 }))

    tray.setToolTip('ScreenDeck')

    tray.on('click', () => {
        tray?.popUpContextMenu()
    })

    updateTrayMenu()
}

// Function to update the tray menu based on the window state
function updateTrayMenu() {
    if (!tray || tray.isDestroyed()) {
        console.log('Tray has been destroyed; skipping menu update.')
        return
    }

    // Retrieve stored values
    const companionIP = store.get('companionIP', '127.0.0.1') as string
    const version = app.getVersion()

    // Build context menu with version, IP, and Device ID
    const topMenuItems = [
        { label: `ScreenDeck Version: ${version || ''}`, enabled: false },
        { label: `Companion IP: ${companionIP || ''}`, enabled: false },
        {
            label: `Companion Version: ${globalContext.satelliteClient?.companionVersion || 'Unknown'}`,
            enabled: false,
        },
        {
            label: `Satellite API Version: ${globalContext.satelliteClient?.companionApiVersion || 'Unknown'}`,
            enabled: false,
        },
        {
            label: `Connected: ${globalContext.satelliteClient?.connected ? 'Yes' : 'No'}`,
            enabled: false,
        },
        { type: 'separator' },
        {
            label: `Hide All Screen Decks`,
            type: 'normal',
            click: () => {
                globalContext.deviceWindows.forEach((win) => {
                    if (win.isVisible()) {
                        win.hide()
                        store.set(`device.${win.webContents.id}.hidden`, true)
                    }
                })
                updateTrayMenu()
            },
        },
        {
            label: `Show All Screen Decks`,
            type: 'normal',
            click: () => {
                globalContext.deviceWindows.forEach((win) => {
                    if (!win.isVisible()) {
                        win.show()
                        store.set(`device.${win.webContents.id}.hidden`, false)
                    }
                })
                updateTrayMenu()
            },
        },
        { type: 'separator' },
    ] as Electron.MenuItemConstructorOptions[]

    const devices = store.get('deviceIds') as string[]
    const deviceMenuItems = devices.map((deviceId) => {
        const win = globalContext.deviceWindows.get(deviceId)
        const isVisible = win?.isVisible() ?? false
        const isDisabled = store.get(`device.${deviceId}.disablePress`, false)

        return {
            label: deviceId,
            submenu: [
                {
                    label: 'Identify',
                    type: 'normal',
                    click: () => {
                        const win = globalContext.deviceWindows.get(deviceId)
                        if (win) {
                            //show the window if it's hidden
                            if (!isVisible) {
                                win.show()
                                store.set(`device.${deviceId}.hidden`, false)
                            }
                            // TODO: IPC
                            win.webContents.send('identify')
                            updateTrayMenu()
                        }
                        webDeviceActions.identify(deviceId);
                    },
                },
                {
                    label: isVisible ? 'Hide' : 'Show',
                    type: 'normal',
                    click: () => {
                        const win = globalContext.deviceWindows.get(deviceId)
                        if (win) {
                            if (win.isVisible()) {
                                win.hide()
                                store.set(`device.${deviceId}.hidden`, true)
                            } else {
                                win.show()
                                store.set(`device.${deviceId}.hidden`, false)
                            }
                            updateTrayMenu()
                        }
                    },
                },
                {
                    label: isDisabled
                        ? 'Enable Button Presses'
                        : 'Disable Button Presses',
                    type: 'normal',
                    click: () => {
                        const newState = !isDisabled
                        store.set(`device.${deviceId}.disablePress`, newState)

                        const win = globalContext.deviceWindows.get(deviceId)
                        if (win) {
                            // TODO: IPC
                            win.webContents.send('disablePress', newState)
                        }
                        webDeviceActions.setDisablePress(deviceId, newState);

                        updateTrayMenu()
                    },
                },
            ],
        }
    }) as Electron.MenuItemConstructorOptions[]

    const profiles = store.get('profiles', {}) as ProfilesStore
    // const profileNames = Object.keys(profiles)

    const loadProfileMenu = Object.entries(profiles).map(([id, profile]) => ({
        label: profile.name,
        click: () => loadProfile(id),
    }))

    const deleteProfileMenu = Object.entries(profiles).map(([id, profile]) => ({
        label: profile.name,
        click: () => deleteProfile(id),
    }))

    const profileMenuItems = [
        { type: 'separator' },
        {
            label: 'Save Current Profile',
            click: async () => {
                const profileName = await promptForProfileName()
                if (profileName) saveProfile(profileName)
            },
        },
        { label: 'Load Profile', submenu: loadProfileMenu },
        { label: 'Delete Profile', submenu: deleteProfileMenu },
    ] as Electron.MenuItemConstructorOptions[]

    const bottomMenuItems = [
        { type: 'separator' },
        {
            label: 'Settings',
            type: 'normal',
            click: () => {
                // Open settings window
                createSettingsWindow()
            },
        },
        {
            label: 'Quit',
            type: 'normal',
            click: () => {
                // Disconnect Companion client
                if (globalContext.satelliteClient) {
                    globalContext.satelliteClient.disconnect() // or .disconnect() based on your API
                }

                // Close all device windows
                globalContext.deviceWindows?.forEach((win) => {
                    win.close()
                })

                unregisterAllHotkeys()

                // Destroy the tray
                if (tray) {
                    tray.destroy()
                }

                // Quit the app
                app.quit()

                setTimeout(() => {
                    console.log('Force exiting app...')
                    process.exit(0)
                }, 1000)
            },
        },
    ] as Electron.MenuItemConstructorOptions[]

    const contextMenu = Menu.buildFromTemplate([
        ...topMenuItems,
        ...deviceMenuItems,
        ...profileMenuItems,
        ...bottomMenuItems,
    ])

    if (tray) {
        tray?.setContextMenu(contextMenu)
    }
}

export { updateTrayMenu }
