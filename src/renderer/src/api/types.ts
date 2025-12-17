// Logger interface for API adapters
export interface Logger {
    log(message: string, ...args: any[]): void
    error(message: string, ...args: any[]): void
}

// type Brand<B> = { __brand: B }
// export type Branded<T, B> = T & Brand<B>

declare const deviceIdSymbol: unique symbol

// export type DeviceId = number & { [deviceIdSymbol]: void }

export type DeviceId = string & { __brand: 'DeviceId' }
// export type DeviceId = string & { [deviceIdSymbol]: void }

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
    deviceId: string;
    keyIndex: number;
    imageBase64?: string | null;
    currentHotkeys?: Array<{ hotkey: string; deviceId: string; keyIndex: number; imageBase64: string | null }>;
}

export interface SharedAPI {
    is(key: string): boolean

    // Requests
    deviceInit(deviceId: string): Promise<DeviceConfig>
    getDeviceConfig(deviceId: string): Promise<DeviceConfig>
    getKeypadBounds(deviceId: string): Promise<any>
    resizeKeypadWindow(args: ResizeKeypadArgs): Promise<void>
    closeKeypad(deviceId: string): Promise<void>
    keyPress(args: KeyPressArgs): void // usually void as it's fire-and-forget often, but let's check
    getKeyConfig(args: { deviceId: string; keyIndex: number }): Promise<KeyConfig>
    updateKeyConfig(args: UpdateKeyConfigArgs): Promise<void>
    assignHotkey(args: AssignHotkeyArgs): Promise<boolean>
    clearHotkey(args: ClearHotkeyArgs): Promise<boolean>
    getHotkeyContext(): Promise<HotkeyContext | undefined>
    openHotkeyPrompt(): Promise<void>
    closeHotkeyPrompt(): Promise<void>
    saveSettings(settings: any): Promise<void>
    getSettings(): Promise<any>
    getAllDevices(): Promise<Device[]>
    createNewDevice(): Promise<void>
    deleteDevice(deviceId: string): Promise<void>
    updateDeviceConfig(args: { deviceId: string; config: Partial<DeviceConfig> }): Promise<void>
    getNextProfileName(): Promise<string>
    sendProfileName(name: string): void
    setHotkeyContext(args: {
        deviceId: string
        keyIndex: number
        imageBase64?: string | null
    }): Promise<void>

    // Events - we'll define subscription methods
    onDraw(callback: (event: any, keyObj: any) => void): () => void
    onShowDeviceLabel(callback: (data: { show: boolean; deviceId: string }) => void): () => void
    onDisablePress(callback: (event: any, disabled: boolean) => void): () => void
    onAutoHide(callback: (event: any, autoHide: boolean) => void): () => void
    onHideEmptyKeys(callback: (event: any, hideEmptyKeys: boolean) => void): () => void
    onUpdateBackground(
        callback: (event: any, data: { backgroundColor: string; backgroundOpacity: number }) => void
    ): () => void
    onRebuildGrid(
        callback: (event: any, data: { columnCount: number; rowCount: number }) => void
    ): () => void
    onBrightness(callback: (event: any, brightness: number) => void): () => void
    onIdentify(callback: () => void): () => void
    onClearDeck(callback: () => void): () => void
    onLockedState(callback: (event: any, data: any) => void): () => void
    onKeyEvent(callback: (event: any, keyObj: any) => void): () => void
}
