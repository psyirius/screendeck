import { ipcMain, BrowserWindow } from 'electron'
import * as path from 'path'
import { getNextProfileName } from './utils'
import { updateTrayMenu } from './tray'
import { registerHotkey, unregisterHotkey } from './hotkeys'
import {
    createDeviceWindow,
    calculateWindowSize,
    showDeviceLabels,
} from './device'
import { is } from '@electron-toolkit/utils'
import { globalContext } from './global'
import {
    createDevice,
    deleteDevice,
    deviceInit,
    emitKeyAction,
    getAllDevices,
    getDeviceConfig,
    getKeyConfig,
    getSettings,
    saveConnectionSettings,
    setDeviceHidden,
    toggleKeyIsEncoder,
    updateDeviceConfig,
    updateDeviceKeyConfig,
    updateKeyConfig,
} from './device-actions'

export function initializeIpcHandlers() {
    // TODO: IPC
    ipcMain.handle('getDeviceConfig', (_, deviceId) => getDeviceConfig(deviceId))

    // TODO: IPC
    ipcMain.handle('getKeypadBounds', (_event, deviceId) => {
        const win = globalContext.deviceWindows?.get(deviceId)
        if (win) {
            const bounds = win.getBounds()
            const cfg = getDeviceConfig(deviceId)
            return { ...bounds, bitmapSize: cfg.bitmapSize }
        }
        return null
    })

    // TODO: IPC
    ipcMain.handle('resizeKeypadWindow', (_event, { deviceId, width, height }) => {
        const win = globalContext.deviceWindows?.get(deviceId)
        if (win) {
            win.setBounds({
                ...win.getBounds(),
                width,
                height,
            })
        }
    })

    // TODO: IPC
    ipcMain.handle('closeKeypad', (_event, deviceId) => {
        const win = globalContext.deviceWindows?.get(deviceId)
        if (win) {
            win.hide()
            setDeviceHidden(deviceId, true);
        }

        updateTrayMenu()
    })

    // TODO: IPC
    ipcMain.on('keyPress', (_event, { deviceId, x, y, action }) => {
        return emitKeyAction(deviceId, x, y, action)
    })

    // TODO: IPC
    ipcMain.handle('getKeyConfig', (_event, { deviceId, keyIndex }) => {
        return getKeyConfig(deviceId, keyIndex)
    })

    // TODO: IPC
    ipcMain.handle('updateKeyConfig', (_event, { deviceId, keyIndex, config }) => {
        return updateKeyConfig(deviceId, keyIndex, config)
    })

    // TODO: IPC
    ipcMain.handle('toggleEncoder', (_event, { deviceId, keyIndex }) => {
        return toggleKeyIsEncoder(deviceId, keyIndex)
    })

    // TODO: IPC (electron-only)
    ipcMain.handle('setBrightness', (_event, brightness) => {
        globalContext.deviceWindows?.forEach((win) => {
            // TODO: IPC
            win.webContents.send('brightness', brightness)
        })
    })

    // TODO: IPC (electron-only)
    ipcMain.handle('setHotkeyContext', (_event, { deviceId, keyIndex, imageBase64 }) => {
        globalContext.hotkeyContext = { deviceId, keyIndex, imageBase64 }
    })

    // TODO: IPC (electron-only)
    ipcMain.handle('getHotkeyContext', (_event) => {
        const context = globalContext.hotkeyContext // deviceId, keyIndex, imageBase64

        if (!context) {
            return undefined
        }

        const { deviceId, keyIndex, imageBase64 } = context

        // Get list of current hotkeys
        const hotkeys = [] as Array<{
            hotkey: string
            deviceId: string
            keyIndex: number
            imageBase64: string | null
        }>
        for (const [hotkey, mapping] of globalContext.registeredHotkeys.entries()) {
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

    // TODO: IPC (electron-only)
    ipcMain.handle('openHotkeyPrompt', () => {
        if (globalContext.hotkeyPromptWindow && !globalContext.hotkeyPromptWindow.isDestroyed()) {
            globalContext.hotkeyPromptWindow.focus()
            return
        }

        const focusedWindow = BrowserWindow.getFocusedWindow()
        const win = new BrowserWindow({
            width: 500,
            height: 800,
            modal: true, // 👈 This makes it modal
            ...(focusedWindow ? { parent: focusedWindow } : {}),
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

        // HMR for renderer base on electron-vite cli.
        // Load the remote URL for development or the local html file for production.
        if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
            win.loadURL(`${process.env['ELECTRON_RENDERER_URL']}/?page=hotkeyPrompt`)
        } else {
            win.loadFile(path.join(__dirname, '../renderer/index.html'), {
                query: { page: 'hotkeyPrompt' },
            })
        }

        //show dev tools
        win.webContents.openDevTools({ mode: 'detach' })

        win.on('show', () => showDeviceLabels(true))
        win.on('hide', () => showDeviceLabels(false))
        win.on('close', () => showDeviceLabels(false))

        globalContext.hotkeyPromptWindow = win

        win.on('closed', () => {
            globalContext.hotkeyPromptWindow = null
        })
    })

    // TODO: IPC (electron-only)
    ipcMain.handle('closeHotkeyPrompt', () => {
        if (globalContext.hotkeyPromptWindow && !globalContext.hotkeyPromptWindow.isDestroyed()) {
            globalContext.hotkeyPromptWindow.close()
        }
    })

    // TODO: IPC (electron-only)
    ipcMain.handle('assignHotkey', (_event, { deviceId, keyIndex, hotkey }) => {
        // const columnCount = store.get(`device.${deviceId}.columnCount`, 8)
        // const x = keyIndex % columnCount
        // const y = Math.floor(keyIndex / columnCount)

        // Register in hotkeys.ts
        const success = registerHotkey(hotkey, deviceId, keyIndex)
        if (success) {
            updateDeviceKeyConfig(deviceId, keyIndex, { hotkey });
        }

        return success
    })

    // TODO: IPC (electron-only)
    ipcMain.handle('clearHotkey', (_event, { deviceId, keyIndex, hotkey }) => {
        unregisterHotkey(hotkey)

        updateDeviceKeyConfig(deviceId, keyIndex, { hotkey: undefined });

        return true
    })

    // TODO: IPC (electron-only)
    ipcMain.handle('showDeviceLabels', (_event, show) => {
        showDeviceLabels(show)
    })

    // TODO: IPC
    ipcMain.handle('createNewDevice', () => {
        const newDeviceId = createDevice();

        // Create the window
        createDeviceWindow(newDeviceId)

        return newDeviceId
    })

    // TODO: IPC
    ipcMain.handle('getAllDevices', () => {
        return getAllDevices();
    })

    // TODO: IPC
    ipcMain.handle('updateDeviceConfig', (_event, { deviceId, config }) => {
        const needsDeviceUpdate = updateDeviceConfig(deviceId, config);

        const cfg = getDeviceConfig(deviceId)

        console.log(`Device ${deviceId} config updated:`, cfg)

        // Update the BrowserWindow properties
        const win = globalContext.deviceWindows.get(deviceId)
        if (win) {
            if (cfg.alwaysOnTop !== undefined) {
                win.setAlwaysOnTop(Boolean(cfg.alwaysOnTop))
            }
            if (cfg.movable !== undefined) {
                win.setMovable(Boolean(cfg.movable))
            }
            if (cfg.disablePress !== undefined) {
                // TODO: IPC
                win.webContents.send('disablePress', Boolean(cfg.disablePress))
            }
            if (cfg.autoHide !== undefined) {
                // TODO: IPC
                win.webContents.send('autoHide', Boolean(cfg.autoHide))
            }
            if (cfg.hideEmptyKeys !== undefined) {
                //resizeWindowForDevice(deviceId)
                // TODO: IPC
                win.webContents.send('hideEmptyKeys', Boolean(cfg.hideEmptyKeys))
            }

            // Resize window if columnCount/rowCount/bitmapSize changed
            if (needsDeviceUpdate) {
                const { width, height } = calculateWindowSize(cfg.columnCount, cfg.rowCount, cfg.bitmapSize)

                win.setSize(width, height)

                // TODO: IPC
                win.webContents.send('rebuildGrid', {
                    columnCount: cfg.columnCount,
                    rowCount: cfg.rowCount,
                })
            }

            // Update background color/opacity *live*
            if (cfg.backgroundColor !== undefined || cfg.backgroundOpacity !== undefined) {
                console.log('Updating background color/opacity:', {
                    backgroundColor: cfg.backgroundColor,
                    backgroundOpacity: cfg.backgroundOpacity,
                })

                // TODO: IPC
                win.webContents.send('updateBackground', {
                    backgroundColor: cfg.backgroundColor,
                    backgroundOpacity: cfg.backgroundOpacity,
                })
            }

            win.show()
        }

        updateTrayMenu()
    })

    // TODO: IPC
    ipcMain.handle('deleteDevice', (_event, deviceId) => {
        // Close the window
        const win = globalContext.deviceWindows.get(deviceId)
        if (win) {
            win.close()
            globalContext.deviceWindows.delete(deviceId)
        }

        deleteDevice(deviceId)

        console.log(`Device ${deviceId} deleted.`)
    })

    // TODO: IPC
    ipcMain.handle('getSettings', () => {
        return getSettings();
    })

    // Handle saving settings
    // TODO: IPC
    ipcMain.handle('saveSettings', (_event, newSettings) => {
        saveConnectionSettings(newSettings);
    })

    // TODO: IPC
    ipcMain.handle('deviceInit', async (_, deviceId: string) => {
        return deviceInit(deviceId)
    })

    // TODO: IPC
    ipcMain.handle('closeSettingsWindow', () => {
        const settingsWindow = globalContext.settingsWindow
        if (settingsWindow) {
            settingsWindow.close()
        }
    })

    //PROFILE MANAGEMENT
    // TODO: IPC
    ipcMain.handle('getNextProfileName', () => {
        return getNextProfileName()
    })
}
