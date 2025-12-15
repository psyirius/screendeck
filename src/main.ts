import { app, BrowserWindow } from 'electron'
import { initializeIpcHandlers } from './ipcHandlers'
import createTray from './tray'
import { initializeDeviceIds, createSatellite } from './utils'
import { createDeviceWindows } from './device'
import { loadHotkeysFromStore } from './hotkeys'

// Initialize the Companion Satellite client and device windows
function init() {
    global.satelliteClient = null
    global.deviceWindows = new Map()
    global.keyStates = new Map()
    global.hotkeyPromptWindow = null
    global.hotkeyContext = null
    global.registeredHotkeys = new Map()
    global.settingsWindow = null

    global.trayParentWindow = new BrowserWindow({
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
    if (process.platform === 'darwin') {
        app.dock?.hide() // Hide the dock icon on macOS
    }

    init() // Initialize the app, IPC handlers, and device windows
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
