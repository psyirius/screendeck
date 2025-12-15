import { BrowserWindow } from 'electron'
import * as path from 'path'
import { showDeviceLabels } from './device'
import { showDevTools } from './utils'

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
        width: 500,
        height: 600,
        alwaysOnTop: true,
        resizable: false,
        title: 'Settings',
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
        },
    })

    settingsWindow.removeMenu();

    settingsWindow.loadFile(path.join(__dirname, '../public/settings.html'))

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
