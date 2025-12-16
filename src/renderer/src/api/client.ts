import {
    SharedAPI,
    DeviceConfig,
    KeyConfig,
    KeyPressArgs,
    ResizeKeypadArgs,
    UpdateKeyConfigArgs,
    AssignHotkeyArgs,
    ClearHotkeyArgs,
    HotkeyContext,
    Device
} from './types';
import { io, Socket } from 'socket.io-client';

// TODO: gen it with random with vite define
const ELECTRON_API_KEY = 'SCREENDECK_ELECTRON_API'

// defined in preload script
export interface ElectronAPI {
    invoke: (channel: string, data?: any) => Promise<any>
    send: (channel: string, data?: any) => void
    on: (channel: string, func: (...args: any[]) => void) => void
}

declare global {
    interface Window {
        [ELECTRON_API_KEY]?: ElectronAPI
    }
}

export class ElectronAPIAdapter implements SharedAPI {
    private api: ElectronAPI;

    public static available(): boolean {
        return !!window[ELECTRON_API_KEY]
    }

    constructor() {
        if (!ElectronAPIAdapter.available()) {
            throw new Error('Electron API is not available in this environment.')
        }
        this.api = window[ELECTRON_API_KEY]!;
    }

    getDeviceConfig(deviceId: string): Promise<DeviceConfig> {
        return this.api.invoke('getDeviceConfig', deviceId)
    }
    getKeypadBounds(deviceId: string): Promise<any> {
        return this.api.invoke('getKeypadBounds', deviceId)
    }
    resizeKeypadWindow(args: ResizeKeypadArgs): Promise<void> {
        return this.api.invoke('resizeKeypadWindow', args)
    }
    closeKeypad(deviceId: string): Promise<void> {
        return this.api.invoke('closeKeypad', deviceId)
    }
    keyPress(args: KeyPressArgs): void {
        this.api.send('keyPress', args)
    }
    getKeyConfig(args: { deviceId: string; keyIndex: number }): Promise<KeyConfig> {
        return this.api.invoke('getKeyConfig', args)
    }
    updateKeyConfig(args: UpdateKeyConfigArgs): Promise<void> {
        return this.api.invoke('updateKeyConfig', args)
    }
    assignHotkey(args: AssignHotkeyArgs): Promise<boolean> {
        return this.api.invoke('assignHotkey', args)
    }
    clearHotkey(args: ClearHotkeyArgs): Promise<boolean> {
        return this.api.invoke('clearHotkey', args)
    }
    getHotkeyContext(): Promise<HotkeyContext | undefined> {
        return this.api.invoke('getHotkeyContext')
    }
    setHotkeyContext(args: {
        deviceId: string
        keyIndex: number
        imageBase64?: string | null
    }): Promise<void> {
        return this.api.invoke('setHotkeyContext', args)
    }

    openHotkeyPrompt(): Promise<void> {
        return this.api.invoke('openHotkeyPrompt')
    }
    closeHotkeyPrompt(): Promise<void> {
        return this.api.invoke('closeHotkeyPrompt')
    }
    saveSettings(settings: any): Promise<void> {
        return this.api.invoke('saveSettings', settings)
    }
    getSettings(): Promise<any> {
        return this.api.invoke('getSettings')
    }
    getAllDevices(): Promise<Device[]> {
        return this.api.invoke('getAllDevices')
    }
    createNewDevice(): Promise<void> {
        return this.api.invoke('createNewDevice')
    }
    deleteDevice(deviceId: string): Promise<void> {
        return this.api.invoke('deleteDevice', deviceId)
    }
    updateDeviceConfig(args: { deviceId: string; config: Partial<DeviceConfig> }): Promise<void> {
        return this.api.invoke('updateDeviceConfig', args)
    }
    getNextProfileName(): Promise<string> {
        return this.api.invoke('getNextProfileName')
    }
    sendProfileName(name: string): void {
        this.api.send('profileNameResult', name)
    }

    // Event Listeners - Wrappers
    // Note: The Electron preload exposes specific methods like onDraw.
    // We'll wrap them to return a "remove listener" function if possible, or just accept the platform behavior.
    // Electron's preload methods usually just add listeners. Removing is trickier unless exposed.
    // The preload defines `onDraw: (callback) => ipcRenderer.on('draw', ...)`
    // It does NOT return a cleanup function. For now, we will just call the method.
    // Future improvement: Update preload to return a cleanup or expose ipcRenderer.removeListener.

    onDraw(callback: (event: any, keyObj: any) => void): () => void {
        this.api.on('draw', (event, data) => callback(event, data))
        return () => {} // No cleanup available in current preload
    }
    onShowDeviceLabel(callback: (data: { show: boolean; deviceId: string }) => void): () => void {
        this.api.on('showDeviceLabel', (_, data) => callback(data))
        return () => {}
    }
    onDisablePress(callback: (event: any, disabled: boolean) => void): () => void {
        this.api.on('disablePress', (event, data) => callback(event, data))
        return () => {}
    }
    onAutoHide(callback: (event: any, autoHide: boolean) => void): () => void {
        this.api.on('autoHide', (event, data) => callback(event, data))
        return () => {}
    }
    onHideEmptyKeys(callback: (event: any, hideEmptyKeys: boolean) => void): () => void {
        this.api.on('hideEmptyKeys', (event, data) => callback(event, data))
        return () => {}
    }
    onUpdateBackground(
        callback: (event: any, data: { backgroundColor: string; backgroundOpacity: number }) => void
    ): () => void {
        this.api.on('updateBackground', (event, data) => callback(event, data))
        return () => {}
    }
    onRebuildGrid(
        callback: (event: any, data: { columnCount: number; rowCount: number }) => void
    ): () => void {
        this.api.on('rebuildGrid', (event, data) => callback(event, data))
        return () => {}
    }
    onBrightness(callback: (event: any, brightness: number) => void): () => void {
        this.api.on('brightness', (event, brightness) => callback(event, brightness))
        return () => {}
    }
    onIdentify(callback: () => void): () => void {
        this.api.on('identify', () => callback())
        return () => {}
    }
    onClearDeck(callback: () => void): () => void {
        this.api.on('clearDeck', () => callback())
        return () => {}
    }
    onLockedState(callback: (event: any, data: any) => void): () => void {
        this.api.on('lockedState', (event, data) => callback(event, data))
        return () => {}
    }
    onKeyEvent(callback: (event: any, keyObj: any) => void): () => void {
        this.api.on('keyEvent', (event, keyObj) => callback(event, keyObj))
        return () => {}
    }
}

export class SocketIOAPIAdapter implements SharedAPI {
    private socket: Socket;

    constructor() {
        // Connect to the server. Assumes server is serving socket.io.
        // If specific URL needed, it can be passed or configured.
        this.socket = io();
    }
    private async request<T>(event: string, ...args: any[]): Promise<T> {
        const response = await this.socket.emitWithAck(event, ...args)
        if (response && response.success) {
            return response.data
        }
        throw new Error(response?.error || 'Unknown error')
    }

    getDeviceConfig(deviceId: string): Promise<DeviceConfig> {
        return this.request('getDeviceConfig', deviceId)
    }
    getKeypadBounds(deviceId: string): Promise<any> {
        return this.request('getKeypadBounds', deviceId)
    }
    resizeKeypadWindow(args: ResizeKeypadArgs): Promise<void> {
        return this.request('resizeKeypadWindow', args)
    }
    closeKeypad(deviceId: string): Promise<void> {
        return this.request('closeKeypad', deviceId)
    }
    keyPress(args: KeyPressArgs): void {
        this.socket.emit('keyPress', args);
    }
    getKeyConfig(args: { deviceId: string; keyIndex: number }): Promise<KeyConfig> {
        return this.request('getKeyConfig', args)
    }
    updateKeyConfig(args: UpdateKeyConfigArgs): Promise<void> {
        return this.request('updateKeyConfig', args)
    }
    assignHotkey(args: AssignHotkeyArgs): Promise<boolean> {
        return this.request('assignHotkey', args)
    }
    clearHotkey(args: ClearHotkeyArgs): Promise<boolean> {
        return this.request('clearHotkey', args)
    }
    getHotkeyContext(): Promise<HotkeyContext | undefined> {
        return this.request('getHotkeyContext')
    }
    setHotkeyContext(args: {
        deviceId: string
        keyIndex: number
        imageBase64?: string | null
    }): Promise<void> {
        return this.request('setHotkeyContext', args)
    }

    openHotkeyPrompt(): Promise<void> {
        return this.request('openHotkeyPrompt')
    }
    closeHotkeyPrompt(): Promise<void> {
        return this.request('closeHotkeyPrompt')
    }
    saveSettings(settings: any): Promise<void> {
        return this.request('saveSettings', settings)
    }
    getSettings(): Promise<any> {
        return this.request('getSettings')
    }
    getAllDevices(): Promise<Device[]> {
        return this.request('getAllDevices')
    }
    createNewDevice(): Promise<void> {
        return this.request('createNewDevice')
    }
    deleteDevice(deviceId: string): Promise<void> {
        return this.request('deleteDevice', deviceId)
    }
    updateDeviceConfig(args: {
        deviceId: string
        config: Partial<DeviceConfig>
    }): Promise<void> {
        return this.request('updateDeviceConfig', args)
    }
    getNextProfileName(): Promise<string> {
        return this.request('getNextProfileName')
    }
    sendProfileName(name: string): void {
        this.socket.emit('profileNameResult', name);
    }

    // Event Listeners
    private wrapListener(event: string, callback: (...args: any[]) => void): () => void {
        this.socket.on(event, callback);
        return () => {
            this.socket.off(event, callback);
        };
    }

    onDraw(callback: (event: any, keyObj: any) => void): () => void {
        return this.wrapListener('draw', (keyObj) => callback(null, keyObj)); // SocketIO might just send data, no event obj
    }

    // Note: Socket.IO args might slightly differ (no synthetic event object usually).
    // Adapting callback signatures to match expected SharedAPI signature.

    onShowDeviceLabel(callback: (data: { show: boolean; deviceId: string }) => void): () => void {
        return this.wrapListener('showDeviceLabel', (data) => callback(data)); // assuming data comes as first arg
    }
    onDisablePress(callback: (event: any, disabled: boolean) => void): () => void {
        return this.wrapListener('disablePress', (disabled) => callback(null, disabled));
    }
    onAutoHide(callback: (event: any, autoHide: boolean) => void): () => void {
        return this.wrapListener('autoHide', (autoHide) => callback(null, autoHide));
    }
    onHideEmptyKeys(callback: (event: any, hideEmptyKeys: boolean) => void): () => void {
        return this.wrapListener('hideEmptyKeys', (hideEmptyKeys) => callback(null, hideEmptyKeys));
    }
    onUpdateBackground(callback: (event: any, data: { backgroundColor: string; backgroundOpacity: number }) => void): () => void {
        return this.wrapListener('updateBackground', (data) => callback(null, data));
    }
    onRebuildGrid(callback: (event: any, data: { columnCount: number; rowCount: number }) => void): () => void {
        return this.wrapListener('rebuildGrid', (data) => callback(null, data));
    }
    onBrightness(callback: (event: any, brightness: number) => void): () => void {
        return this.wrapListener('brightness', (brightness) => callback(null, brightness));
    }
    onIdentify(callback: () => void): () => void {
        return this.wrapListener('identify', callback);
    }
    onClearDeck(callback: () => void): () => void {
        return this.wrapListener('clearDeck', callback);
    }
    onLockedState(callback: (event: any, data: any) => void): () => void {
        return this.wrapListener('lockedState', (data) => callback(null, data));
    }
    onKeyEvent(callback: (event: any, keyObj: any) => void): () => void {
        return this.wrapListener('keyEvent', (keyObj) => callback(null, keyObj));
    }
}

// Factory
let clientInstance: SharedAPI | null = null;

export function getAPIClient(): SharedAPI {
    if (clientInstance) return clientInstance;

    if (ElectronAPIAdapter.available()) {
        console.log('Using Electron API Adapter')
        clientInstance = new ElectronAPIAdapter()
    } else {
        console.log('Using Socket.IO API Adapter')
        clientInstance = new SocketIOAPIAdapter()
    }
    return clientInstance;
}
