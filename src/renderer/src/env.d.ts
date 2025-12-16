/// <reference types="vite/client" />

// export interface DeviceConfig {
//     columnCount: number
//     rowCount: number
//     bitmapSize: number
//     alwaysOnTop: boolean
//     movable: boolean
//     disablePress: boolean
//     autoHide: boolean
//     hideEmptyKeys: boolean
//     backgroundColor: string
//     backgroundOpacity: number
// }
//
// export interface KeyConfig {
//     isEncoder: boolean
//     stepSize: number
// }
//
// export interface ElectronAPI {
//     invoke: (channel: string, data?: any) => Promise<any>
//     send: (channel: string, data?: any) => void
//     getNextProfileName: () => Promise<string>
//     sendProfileName: (name: string | null) => void
//     onShowDeviceLabel: (callback: (data: { deviceId: string; show: boolean }) => void) => void
//     onKeyEvent: (callback: (event: any, keyObj: any) => void) => void
//     onDraw: (callback: (event: any, data: any) => void) => void
//     onUpdateBackground: (callback: (event: any, data: any) => void) => void
//     onRebuildGrid: (callback: (event: any, data: any) => void) => void
//     onDisablePress: (callback: (event: any, disabled: boolean) => void) => void
//     onAutoHide: (callback: (event: any, autoHide: boolean) => void) => void
//     onHideEmptyKeys: (callback: (event: any, hideEmptyKeys: boolean) => void) => void
//     onIdentify: (callback: () => void) => void
//     onBrightness: (callback: (event: any, brightness: number) => void) => void
//     onClearDeck: (callback: (event: any) => void) => void
//     onLockedState: (callback: (event: any, data: any) => void) => void
//     getDeviceConfig: (deviceId: string) => Promise<DeviceConfig>
//     saveSettings: (newSettings: any) => Promise<void>
// }
//
// declare global {
//     interface Window {
//         electronAPI: ElectronAPI
//     }
// }
