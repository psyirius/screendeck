import Fastify from 'fastify'
import socketioServer from 'fastify-socket.io'
import fastifyStatic from '@fastify/static'
import Store from 'electron-store'
import { defaultSettings } from './defaults'
import { globalContext } from './global'
import { updateTrayMenu } from './tray'
import { registerHotkey, unregisterHotkey } from './hotkeys'
import {
    createNewDevice,
    createDeviceWindow,
    calculateWindowSize,
    showDeviceLabels,
} from './device'
import { getNextProfileName, createSatellite } from './utils'
import { BrowserWindow } from 'electron'
import { is } from '@electron-toolkit/utils'
import * as path from 'path'

const store = new Store({ defaults: defaultSettings })

export async function initializeWebApi() {
    const fastify = Fastify({
        logger: is.dev
    })

    await fastify.register(socketioServer, {
        cors: {
            origin: '*',
            methods: ['GET', 'POST'],
        },
    })

    await fastify.register(fastifyStatic, {
        root: path.join(__dirname, '../renderer'),
        prefix: '/',
    })

    const SOCKET_PORT = 3001

    fastify.ready((err) => {
        if (err) throw err

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const io = (fastify as any).io
        globalContext.webSocketServer = io

        console.log(`Socket.IO server ready on port ${SOCKET_PORT}`)

        io.on('connection', (socket) => {
            console.log('New Socket.IO connection:', socket.id)

            // Helper to mimic ipcMain.handle (request-response)
            const handle = (eventName: string, handler: (data: any) => any) => {
                socket.on(eventName, async (data, callback) => {
                    try {
                        const result = await handler(data)
                        if (callback) callback({ success: true, data: result })
                    } catch (error: any) {
                        console.error(`Error in ${eventName} handler:`, error)
                        if (callback)
                            callback({ success: false, error: error.message })
                    }
                })
            }

            // Helper to mimic ipcMain.on (one-way)
            const on = (eventName: string, handler: (data: any) => void) => {
                socket.on(eventName, (data) => {
                    try {
                        handler(data)
                    } catch (error) {
                        console.error(`Error in ${eventName} listener:`, error)
                    }
                })
            }

            // --- Implementation of Handlers matching ipcHandlers.ts ---

            handle('getDeviceConfig', (deviceId) => {
                const columnCount = store.get(
                    `device.${deviceId}.columnCount`,
                    8
                )
                const rowCount = store.get(`device.${deviceId}.rowCount`, 4)
                const bitmapSize = store.get(
                    `device.${deviceId}.bitmapSize`,
                    72
                )
                const alwaysOnTop = store.get(
                    `device.${deviceId}.alwaysOnTop`,
                    false
                )
                const movable = store.get(`device.${deviceId}.movable`, true)
                const disablePress = store.get(
                    `device.${deviceId}.disablePress`,
                    false
                )
                const autoHide = store.get(`device.${deviceId}.autoHide`, false)
                const hideEmptyKeys = store.get(
                    `device.${deviceId}.hideEmptyKeys`,
                    false
                )
                const backgroundColor = store.get(
                    `device.${deviceId}.backgroundColor`,
                    '#000000'
                )
                const backgroundOpacity = store.get(
                    `device.${deviceId}.backgroundOpacity`,
                    0.5
                )

                return {
                    columnCount,
                    rowCount,
                    bitmapSize,
                    alwaysOnTop,
                    movable,
                    disablePress,
                    autoHide,
                    hideEmptyKeys,
                    backgroundColor,
                    backgroundOpacity,
                }
            })

            handle('getKeypadBounds', (deviceId) => {
                const win = globalContext.deviceWindows?.get(deviceId)
                if (win) {
                    const bounds = win.getBounds()
                    const bitmapSize = store.get(
                        `device.${deviceId}.bitmapSize`,
                        72
                    )
                    return { ...bounds, bitmapSize }
                }
                return null
            })

            handle('resizeKeypadWindow', ({ deviceId, width, height }) => {
                const win = globalContext.deviceWindows?.get(deviceId)
                if (win) {
                    win.setBounds({
                        ...win.getBounds(),
                        width,
                        height,
                    })
                }
            })

            handle('closeKeypad', (deviceId) => {
                const win = globalContext.deviceWindows?.get(deviceId)
                if (win) {
                    win.hide()
                    store.set(`device.${deviceId}.hidden`, true)
                }
                updateTrayMenu()
            })

            // Handle keyPress events (one-way)
            on('keyPress', ({ deviceId, x, y, action }) => {
                if (!globalContext.satelliteClient) return

                const disablePress = store.get(
                    `device.${deviceId}.disablePress`,
                    false
                )
                if (disablePress) {
                    console.log(
                        `Button presses disabled for ${deviceId}. Ignoring.`
                    )
                    return
                }

                if (action === 'down') {
                    globalContext.satelliteClient.keyDownXY(deviceId, x, y)
                } else if (action === 'up') {
                    globalContext.satelliteClient.keyUpXY(deviceId, x, y)
                } else if (action === 'rotateLeft') {
                    globalContext.satelliteClient.rotateLeftXY(deviceId, x, y)
                } else if (action === 'rotateRight') {
                    globalContext.satelliteClient.rotateRightXY(deviceId, x, y)
                }
            })

            handle('getKeyConfig', ({ deviceId, keyIndex }) => {
                return {
                    isEncoder: store.get(
                        `device.${deviceId}.key.${keyIndex}.isEncoder`,
                        false
                    ),
                    stepSize: store.get(
                        `device.${deviceId}.key.${keyIndex}.stepSize`,
                        10
                    ),
                }
            })

            handle('updateKeyConfig', ({ deviceId, keyIndex, config }) => {
                const isEncoder = config.isEncoder ?? false
                const stepSize = config.stepSize ?? 10
                store.set(
                    `device.${deviceId}.key.${keyIndex}.isEncoder`,
                    isEncoder
                )
                store.set(
                    `device.${deviceId}.key.${keyIndex}.stepSize`,
                    stepSize
                )
            })

            handle('toggleEncoder', ({ deviceId, keyIndex }) => {
                const current = store.get(
                    `device.${deviceId}.key.${keyIndex}.isEncoder`,
                    false
                )
                const newValue = !current
                store.set(
                    `device.${deviceId}.key.${keyIndex}.isEncoder`,
                    newValue
                )
                return newValue
            })

            handle('setBrightness', (brightness) => {
                globalContext.deviceWindows?.forEach((win) => {
                    win.webContents.send('brightness', brightness)
                })
            })

            // HOTKEYS
            handle(
                'setHotkeyContext',
                ({ deviceId, keyIndex, imageBase64 }) => {
                    globalContext.hotkeyContext = {
                        deviceId,
                        keyIndex,
                        imageBase64,
                    }
                }
            )

            handle('getHotkeyContext', () => {
                const context = globalContext.hotkeyContext
                if (!context) return undefined

                const { deviceId, keyIndex, imageBase64 } = context

                const hotkeys = [] as Array<{
                    hotkey: string
                    deviceId: string
                    keyIndex: number
                    imageBase64: string | null
                }>
                for (const [
                    hotkey,
                    mapping,
                ] of globalContext.registeredHotkeys.entries()) {
                    hotkeys.push({
                        hotkey,
                        deviceId: mapping.deviceId,
                        keyIndex: mapping.keyIndex,
                        imageBase64: mapping.imageBase64,
                    })
                }

                return {
                    deviceId,
                    keyIndex,
                    imageBase64,
                    currentHotkeys: hotkeys,
                }
            })

            handle('openHotkeyPrompt', () => {
                if (
                    globalContext.hotkeyPromptWindow &&
                    !globalContext.hotkeyPromptWindow.isDestroyed()
                ) {
                    globalContext.hotkeyPromptWindow.focus()
                    return
                }

                // Note: For web-triggered hotkey prompt, we might not have a focused window
                // and parent might default to null.
                const win = new BrowserWindow({
                    width: 500,
                    height: 800,
                    modal: true,
                    resizable: false,
                    minimizable: false,
                    maximizable: false,
                    frame: false,
                    title: 'Assign Hotkey',
                    webPreferences: {
                        preload: path.join(__dirname, '../preload/index.js'),
                        contextIsolation: true,
                    },
                })

                if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
                    win.loadURL(
                        `${process.env['ELECTRON_RENDERER_URL']}/?page=hotkeyPrompt`
                    )
                } else {
                    win.loadFile(
                        path.join(__dirname, '../renderer/index.html'),
                        {
                            query: { page: 'hotkeyPrompt' },
                        }
                    )
                }

                win.webContents.openDevTools({ mode: 'detach' })

                win.on('show', () => showDeviceLabels(true))
                win.on('hide', () => showDeviceLabels(false))
                win.on('close', () => showDeviceLabels(false))

                globalContext.hotkeyPromptWindow = win

                win.on('closed', () => {
                    globalContext.hotkeyPromptWindow = null
                })
            })

            handle('closeHotkeyPrompt', () => {
                if (
                    globalContext.hotkeyPromptWindow &&
                    !globalContext.hotkeyPromptWindow.isDestroyed()
                ) {
                    globalContext.hotkeyPromptWindow.close()
                }
            })

            handle('assignHotkey', ({ deviceId, keyIndex, hotkey }) => {
                const success = registerHotkey(hotkey, deviceId, keyIndex)
                if (success) {
                    const keyConfig = store.get(
                        `device.${deviceId}.keys`,
                        {}
                    ) as Record<number, { hotkey?: string }>
                    keyConfig[keyIndex] = {
                        ...(keyConfig[keyIndex] || {}),
                        hotkey,
                    }
                    store.set(`device.${deviceId}.keys`, keyConfig)
                }
                return success
            })

            handle('clearHotkey', ({ deviceId, keyIndex, hotkey }) => {
                unregisterHotkey(hotkey)

                const keyConfig = store.get(
                    `device.${deviceId}.keys`,
                    {}
                ) as Record<number, { hotkey?: string }>
                if (keyConfig[keyIndex]) {
                    delete keyConfig[keyIndex].hotkey
                    store.set(`device.${deviceId}.keys`, keyConfig)
                }

                return true
            })

            handle('showDeviceLabels', (show) => {
                showDeviceLabels(show)
            })

            // SETTINGS
            handle('createNewDevice', () => {
                const newDeviceId = createNewDevice()

                let deviceIds = store.get('deviceIds', []) as string[]
                deviceIds.push(newDeviceId)
                store.set('deviceIds', deviceIds)

                createDeviceWindow(newDeviceId)

                globalContext.satelliteClient?.addDevice(
                    newDeviceId,
                    'ScreenDeck',
                    {
                        columnCount: store.get(
                            `device.${newDeviceId}.columnCount`,
                            8
                        ),
                        rowCount: store.get(
                            `device.${newDeviceId}.rowCount`,
                            4
                        ),
                        bitmapSize: store.get(
                            `device.${newDeviceId}.bitmapSize`,
                            72
                        ),
                        colours: true,
                        text: true,
                        brightness: true,
                        pincodeMap: null,
                    }
                )

                return newDeviceId
            })

            handle('getAllDevices', () => {
                const deviceIds = store.get('deviceIds', []) as string[]
                return deviceIds.map((id) => ({
                    deviceId: id,
                    name: store.get(`device.${id}.name`, ''),
                    columnCount: store.get(`device.${id}.columnCount`, 8),
                    rowCount: store.get(`device.${id}.rowCount`, 4),
                    bitmapSize: store.get(`device.${id}.bitmapSize`, 72),
                    alwaysOnTop: store.get(`device.${id}.alwaysOnTop`, false),
                    movable: store.get(`device.${id}.movable`, true),
                    disablePress: store.get(`device.${id}.disablePress`, false),
                    autoHide: store.get(`device.${id}.autoHide`, false),
                    hideEmptyKeys: store.get(
                        `device.${id}.hideEmptyKeys`,
                        false
                    ),
                    backgroundColor: store.get(
                        `device.${id}.backgroundColor`,
                        '#000000'
                    ),
                    backgroundOpacity: store.get(
                        `device.${id}.backgroundOpacity`,
                        0.5
                    ),
                }))
            })

            handle('updateDeviceConfig', ({ deviceId, config }) => {
                let needsDeviceUpdate = false

                for (const key of ['columnCount', 'rowCount', 'bitmapSize']) {
                    const oldValue = store.get(`device.${deviceId}.${key}`)
                    const newValue = config[key]

                    if (newValue !== undefined && newValue !== oldValue) {
                        needsDeviceUpdate = true
                        break
                    }
                }

                Object.entries(config).forEach(([key, value]) => {
                    const fullKey = `device.${deviceId}.${key}`
                    if (value === undefined) {
                        store.delete(fullKey as any)
                    } else {
                        store.set(fullKey, value)
                    }
                })

                console.log(
                    `Device ${deviceId} config updated via Socket.IO:`,
                    config
                )

                const win = globalContext.deviceWindows.get(deviceId)
                if (win) {
                    if (config.alwaysOnTop !== undefined)
                        win.setAlwaysOnTop(Boolean(config.alwaysOnTop))
                    if (config.movable !== undefined)
                        win.setMovable(Boolean(config.movable))
                    if (config.disablePress !== undefined)
                        win.webContents.send(
                            'disablePress',
                            Boolean(config.disablePress)
                        )
                    if (config.autoHide !== undefined)
                        win.webContents.send(
                            'autoHide',
                            Boolean(config.autoHide)
                        )
                    if (config.hideEmptyKeys !== undefined)
                        win.webContents.send(
                            'hideEmptyKeys',
                            Boolean(config.hideEmptyKeys)
                        )

                    if (needsDeviceUpdate) {
                        const columnCount = store.get(
                            `device.${deviceId}.columnCount`,
                            8
                        )
                        const rowCount = store.get(
                            `device.${deviceId}.rowCount`,
                            4
                        )
                        const bitmapSize = store.get(
                            `device.${deviceId}.bitmapSize`,
                            72
                        )

                        const { width, height } = calculateWindowSize(
                            columnCount,
                            rowCount,
                            bitmapSize
                        )

                        win.setSize(width, height)

                        if (globalContext.satelliteClient) {
                            globalContext.satelliteClient.removeDevice(deviceId)
                            globalContext.satelliteClient.addDevice(
                                deviceId,
                                'ScreenDeck',
                                {
                                    columnCount: store.get(
                                        `device.${deviceId}.columnCount`,
                                        8
                                    ),
                                    rowCount: store.get(
                                        `device.${deviceId}.rowCount`,
                                        4
                                    ),
                                    bitmapSize: store.get(
                                        `device.${deviceId}.bitmapSize`,
                                        72
                                    ),
                                    colours: true,
                                    text: true,
                                    brightness: true,
                                    pincodeMap: null,
                                }
                            )
                        }

                        win.webContents.send('rebuildGrid', {
                            columnCount,
                            rowCount,
                        })
                    }

                    if (
                        config.backgroundColor !== undefined ||
                        config.backgroundOpacity !== undefined
                    ) {
                        const backgroundColor = store.get(
                            `device.${deviceId}.backgroundColor`,
                            '#000000'
                        )
                        const backgroundOpacity = store.get(
                            `device.${deviceId}.backgroundOpacity`,
                            0.5
                        )

                        win.webContents.send('updateBackground', {
                            backgroundColor,
                            backgroundOpacity,
                        })
                    }

                    win.show()
                }
                updateTrayMenu()
            })

            handle('deleteDevice', (deviceId) => {
                let deviceIds = store.get('deviceIds', []) as string[]
                deviceIds = deviceIds.filter((id) => id !== deviceId)
                store.set('deviceIds', deviceIds)

                const keys = Object.keys(store.store)
                keys.forEach((key) => {
                    if (key.startsWith(`device.${deviceId}.`)) {
                        store.delete(key as any)
                    }
                })

                const win = globalContext.deviceWindows.get(deviceId)
                if (win) {
                    win.close()
                    globalContext.deviceWindows.delete(deviceId)
                }

                if (globalContext.satelliteClient) {
                    globalContext.satelliteClient.removeDevice(deviceId)
                }
                console.log(`Device ${deviceId} deleted via Socket.IO.`)
            })

            handle('getSettings', () => {
                return store.store
            })

            handle('saveSettings', (newSettings) => {
                const previousIP = store.get('companionIP', '127.0.0.1')
                const previousPort = store.get('companionPort', 16622)

                store.set(newSettings)

                const newIP = newSettings.companionIP
                const newPort = newSettings.companionPort

                if (newIP !== previousIP || newPort !== previousPort) {
                    console.log(
                        'Companion IP or port changed, restarting connection...'
                    )

                    if (globalContext.satelliteClient) {
                        globalContext.satelliteClient.disconnect()
                        globalContext.satelliteClient = null
                    }

                    setTimeout(() => {
                        createSatellite()
                    }, 500)
                }
            })

            handle('closeSettingsWindow', () => {
                const settingsWindow = globalContext.settingsWindow
                if (settingsWindow) {
                    settingsWindow.close()
                }
            })

            handle('getNextProfileName', () => {
                return getNextProfileName()
            })
        })
    })

    try {
        await fastify.listen({ port: SOCKET_PORT, host: '0.0.0.0' })
        console.log(`Fastify server listening on port ${SOCKET_PORT}`)
    } catch (err) {
        fastify.log.error(err)
    }

    return fastify
}
