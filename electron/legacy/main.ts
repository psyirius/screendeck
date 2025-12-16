import { app, BrowserWindow } from 'electron'
import { initializeIpcHandlers } from './ipcHandlers'
import { initializeWebApi } from './web-api'
import createTray from './tray'
import { initializeDeviceIds, createSatellite } from './utils'
import { createDeviceWindows } from './device'
import { loadHotkeysFromStore } from './hotkeys'
import { electronApp, optimizer } from '@electron-toolkit/utils'
import { globalContext } from './global'

// Initialize the Companion Satellite client and device windows
function init() {
    globalContext.satelliteClient = null
    globalContext.deviceWindows = new Map()
    globalContext.keyStates = new Map()
    globalContext.hotkeyPromptWindow = null
    globalContext.hotkeyContext = null
    globalContext.registeredHotkeys = new Map()
    globalContext.settingsWindow = null

    globalContext.trayParentWindow = new BrowserWindow({
        show: false,
        width: 0,
        height: 0,
        frame: false,
        transparent: true,
        skipTaskbar: true,
    })

    initializeDeviceIds() //ensure at least one deviceId exists
    initializeIpcHandlers() // Set up IPC handlers
    createDeviceWindows() // Create device windows
    createSatellite() // Initialize the Companion Satellite client
    loadHotkeysFromStore() // Load hotkeys from the store
}

app.whenReady().then(() => {
    // Set app user model id for windows
    electronApp.setAppUserModelId('com.josephadams.screendeck')

    if (process.platform === 'darwin') {
        app.dock?.hide() // Hide the dock icon on macOS
    }

    // Default open or close DevTools by F12 in development
    // and ignore CommandOrControl + R in production.
    // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
    app.on('browser-window-created', (_, window) => {
        optimizer.watchWindowShortcuts(window)
    })

    init() // Initialize the app, IPC handlers, and device windows
    initializeWebApi() // Initialize Socket.IO server
    createTray() // Create the system tray icon

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createDeviceWindows()
        }
    })

    app.on('window-all-closed', () => {
        //don't do anything unless closed by the tray
    })

    app.on('before-quit', () => {
        console.log('App is quitting...')
    })

    app.on('will-quit', () => {
        console.log('App will quit...')
    })

    app.on('quit', () => {
        console.log('App has quit.')
    })
})
