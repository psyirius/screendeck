declare global {
    var satelliteClient: CompanionSatelliteClient | null
    var deviceWindows: Map<string, Electron.BrowserWindow>
    var keyStates: Map<
        string,
        Map<
            number,
            {
                imageBase64?: string
                color?: string
                text?: string
                // add more fields as needed (e.g., textColor, fontSize)
            }
        >
    >
    var hotkeyPromptWindow: Electron.BrowserWindow | null
    var hotkeyContext: {
        deviceId: string
        keyIndex: number
        imageBase64: string
    } | null
    var registeredHotkeys: Map<
        string,
        { deviceId: string; keyIndex: number; imageBase64: string }
    >
    var trayParentWindow: Electron.BrowserWindow
    var settingsWindow: Electron.BrowserWindow | null
}

export type KeyObj = {
    key?: number
    type?: string
    bitmap?: string
    color?: string
    textColor?: string
    text?: string
    fontSize?: string
}

export interface DeviceConfig {
    columnCount: number
    rowCount: number
    bitmapSize: number
    backgroundColor?: string
    backgroundOpacity?: string
    alwaysOnTop: boolean
    movable: boolean
    disablePress: boolean
    autoHide: boolean
    hideEmptyKeys: boolean
    bounds?: Electron.Rectangle | null
}

export interface Profile {
    name: string
    deviceIds: string[]
    devices: Record<string, DeviceConfig>
}

export type ProfilesStore = Record<string, Profile>
