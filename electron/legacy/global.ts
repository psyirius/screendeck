import type { CompanionSatelliteClient } from './lib/vendor/satellite/client'

export const globalContext = {
    satelliteClient: null as CompanionSatelliteClient | null,
    deviceWindows: new Map<string, Electron.BrowserWindow>(),
    keyStates: new Map<
        string,
        Map<
            number,
            {
                imageBase64?: string
                color?: string
                text?: string
            }
        >
    >(),
    hotkeyPromptWindow: null as Electron.BrowserWindow | null,
    hotkeyContext: null as
        | {
            deviceId: string
            keyIndex: number
            imageBase64: string
        }
        | null,
    registeredHotkeys: new Map<string, { deviceId: string; keyIndex: number; imageBase64: string }>(),
    trayParentWindow: null as unknown as Electron.BrowserWindow,
    settingsWindow: null as Electron.BrowserWindow | null,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    webSocketServer: null as any | null,
}
