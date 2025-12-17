export type DeviceId = string & { __brand: 'DeviceId' }

export interface DeviceConfig {
    columnCount: number;
    rowCount: number;
    bitmapSize: number;
    alwaysOnTop?: boolean;
    movable?: boolean;
    disablePress?: boolean;
    autoHide?: boolean;
    hideEmptyKeys?: boolean;
    backgroundColor?: string;
    backgroundOpacity?: number;
    name?: string;
    enabled?: boolean;
}

export interface Device extends DeviceConfig {
    deviceId: string;
}

export interface KeyConfig {
    isEncoder: boolean;
    stepSize: number;
}

export interface KeyPressArgs {
    deviceId: string;
    x: number;
    y: number;
    action: string;
}

export interface ResizeKeypadArgs {
    deviceId: string;
    width: number;
    height: number;
}

export interface UpdateKeyConfigArgs {
    deviceId: string;
    keyIndex: number;
    config: Partial<KeyConfig>;
}

export interface AssignHotkeyArgs {
    deviceId: string;
    keyIndex: number;
    hotkey: string;
}

export interface ClearHotkeyArgs {
    deviceId: string;
    keyIndex: number;
    hotkey: string;
}

export interface HotkeyContext {
    deviceId: string
    keyIndex: number
    image?: Uint8Array | ArrayBuffer | null
    currentHotkeys?: Array<{
        hotkey: string
        deviceId: string
        keyIndex: number
        image?: Uint8Array | ArrayBuffer | null
    }>
}
