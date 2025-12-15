import { BrowserWindow } from 'electron'
import * as path from 'path'
import { showDeviceLabels } from './device'
import { showDevTools } from './utils'
import { is } from '@electron-toolkit/utils'

let settingsWindow: BrowserWindow | null = null

export default function createSettingsWindow() {
    if (settingsWindow) {
        //show the existing window if it exists
        if (settingsWindow.isMinimized()) {
            settingsWindow.restore()
        }
        if (!settingsWindow.isVisible()) {
            settingsWindow.show()
        }
        settingsWindow.focus()
        return
    }

    settingsWindow = new BrowserWindow({
        width: 520,
        height: 680,
        alwaysOnTop: true,
        // resizable: false,
        title: 'Settings',
        webPreferences: {
            preload: path.join(__dirname, '../preload/index.js'),
        },
    })

    settingsWindow.removeMenu()

    // HMR for renderer base on electron-vite cli.
    // Load the remote URL for development or the local html file for production.
    if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
        settingsWindow.loadURL(`${process.env['ELECTRON_RENDERER_URL']}/?page=settings`)
    } else {
        settingsWindow.loadFile(path.join(__dirname, '../renderer/index.html'), {
            query: { page: 'settings' },
        })
    }

    //show devtools
    if (showDevTools) {
        settingsWindow.webContents.openDevTools({
            mode: 'detach', // Open in a separate window
        })
    }

    settingsWindow.on('closed', () => {
        settingsWindow = null
    })

    settingsWindow.on('show', () => showDeviceLabels(true))
    settingsWindow.on('hide', () => showDeviceLabels(false))
    settingsWindow.on('close', () => showDeviceLabels(false))

    global.settingsWindow = settingsWindow
}
