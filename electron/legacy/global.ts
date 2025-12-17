import type { CompanionSatelliteClient } from './lib/vendor/satellite/client'
import type { MdnsAnnouncer } from './mdns-announcer'
import type { FastifyInstance } from 'fastify'

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
    webServer: null as unknown as FastifyInstance,
    webSocketServer: null as any | null,
    mdnsAnnouncer: null as unknown as MdnsAnnouncer,
}
