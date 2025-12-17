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
    Device,
    Logger
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
    private api: ElectronAPI
    private logger: Logger

    public static available(): boolean {
        return !!window[ELECTRON_API_KEY]
    }

    public is(key: string): boolean {
        return ElectronAPIAdapter.available() && key === 'electron';
    }

    constructor(logger: Logger) {
        if (!ElectronAPIAdapter.available()) {
            throw new Error('Electron API is not available in this environment.')
        }
        this.api = window[ELECTRON_API_KEY]!
        this.logger = logger
    }

    private async invoke<T>(channel: string, ...args: any[]): Promise<T> {
        this.logger.log(`[Electron] -> Invoke: ${channel}`, ...args)
        try {
            const result = await this.api.invoke(channel, ...args)
            this.logger.log(`[Electron] <- Result: ${channel}`, result)
            return result
        } catch (error) {
            this.logger.error(`[Electron] <- Error: ${channel}`, error)
            throw error
        }
    }

    deviceInit(deviceId: string): Promise<DeviceConfig> {
        return this.invoke('deviceInit', deviceId)
    }
    getDeviceConfig(deviceId: string): Promise<DeviceConfig> {
        return this.invoke('getDeviceConfig', deviceId)
    }
    getKeypadBounds(deviceId: string): Promise<any> {
        return this.invoke('getKeypadBounds', deviceId)
    }
    resizeKeypadWindow(args: ResizeKeypadArgs): Promise<void> {
        return this.invoke('resizeKeypadWindow', args)
    }
    closeKeypad(deviceId: string): Promise<void> {
        return this.invoke('closeKeypad', deviceId)
    }
    keyPress(args: KeyPressArgs): void {
        this.logger.log(`[Electron] -> Send: keyPress`, args)
        this.api.send('keyPress', args)
    }
    getKeyConfig(args: { deviceId: string; keyIndex: number }): Promise<KeyConfig> {
        return this.invoke('getKeyConfig', args)
    }
    updateKeyConfig(args: UpdateKeyConfigArgs): Promise<void> {
        return this.invoke('updateKeyConfig', args)
    }
    assignHotkey(args: AssignHotkeyArgs): Promise<boolean> {
        return this.invoke('assignHotkey', args)
    }
    clearHotkey(args: ClearHotkeyArgs): Promise<boolean> {
        return this.invoke('clearHotkey', args)
    }
    getHotkeyContext(): Promise<HotkeyContext | undefined> {
        return this.invoke('getHotkeyContext')
    }
    setHotkeyContext(args: {
        deviceId: string
        keyIndex: number
        imageBase64?: string | null
    }): Promise<void> {
        return this.invoke('setHotkeyContext', args)
    }

    openHotkeyPrompt(): Promise<void> {
        return this.invoke('openHotkeyPrompt')
    }
    closeHotkeyPrompt(): Promise<void> {
        return this.invoke('closeHotkeyPrompt')
    }
    saveSettings(settings: any): Promise<void> {
        return this.invoke('saveSettings', settings)
    }
    getSettings(): Promise<any> {
        return this.invoke('getSettings')
    }
    getAllDevices(): Promise<Device[]> {
        return this.invoke('getAllDevices')
    }
    createNewDevice(): Promise<void> {
        return this.invoke('createNewDevice')
    }
    deleteDevice(deviceId: string): Promise<void> {
        return this.invoke('deleteDevice', deviceId)
    }
    updateDeviceConfig(args: { deviceId: string; config: Partial<DeviceConfig> }): Promise<void> {
        return this.invoke('updateDeviceConfig', args)
    }
    getNextProfileName(): Promise<string> {
        return this.invoke('getNextProfileName')
    }
    sendProfileName(name: string): void {
        this.logger.log(`[Electron] -> Send: profileNameResult`, name)
        this.api.send('profileNameResult', name)
    }

    // Event Listeners - Wrappers
    private wrapListener(event: string, callback: (...args: any[]) => void): () => void {
        const wrapper = (...args: any[]) => {
            this.logger.log(`[Electron] <- Event: ${event}`, ...args)
            callback(...args)
        }
        this.api.on(event, wrapper)
        return () => {
            // No removal available on api interface yet
        }
    }

    onDraw(callback: (event: any, keyObj: any) => void): () => void {
        return this.wrapListener('draw', (event, data) => callback(event, data))
    }
    onShowDeviceLabel(callback: (data: { show: boolean; deviceId: string }) => void): () => void {
        return this.wrapListener('showDeviceLabel', (_, data) => callback(data))
    }
    onDisablePress(callback: (event: any, disabled: boolean) => void): () => void {
        return this.wrapListener('disablePress', (event, data) => callback(event, data))
    }
    onAutoHide(callback: (event: any, autoHide: boolean) => void): () => void {
        return this.wrapListener('autoHide', (event, data) => callback(event, data))
    }
    onHideEmptyKeys(callback: (event: any, hideEmptyKeys: boolean) => void): () => void {
        return this.wrapListener('hideEmptyKeys', (event, data) => callback(event, data))
    }
    onUpdateBackground(
        callback: (event: any, data: { backgroundColor: string; backgroundOpacity: number }) => void
    ): () => void {
        return this.wrapListener('updateBackground', (event, data) => callback(event, data))
    }
    onRebuildGrid(
        callback: (event: any, data: { columnCount: number; rowCount: number }) => void
    ): () => void {
        return this.wrapListener('rebuildGrid', (event, data) => callback(event, data))
    }
    onBrightness(callback: (event: any, brightness: number) => void): () => void {
        return this.wrapListener('brightness', (event, brightness) => callback(event, brightness))
    }
    onIdentify(callback: () => void): () => void {
        return this.wrapListener('identify', () => callback())
    }
    onClearDeck(callback: () => void): () => void {
        return this.wrapListener('clearDeck', () => callback())
    }
    onLockedState(callback: (event: any, data: any) => void): () => void {
        return this.wrapListener('lockedState', (event, data) => callback(event, data))
    }
    onKeyEvent(callback: (event: any, keyObj: any) => void): () => void {
        return this.wrapListener('keyEvent', (event, keyObj) => callback(event, keyObj))
    }
}

export class SocketIOAPIAdapter implements SharedAPI {
    private socket: Socket
    private logger: Logger

    public is(key: string): boolean {
        return key === 'socketio' || key === 'web';
    }

    constructor(logger: Logger) {
        this.logger = logger
        // Connect to the server. Assumes server is serving socket.io.
        // If specific URL needed, it can be passed or configured.
        this.socket = io()
        this.socket.on('connect', () => {
            this.logger.log('[SocketIO] Connected')
        })
        this.socket.on('disconnect', () => {
            this.logger.log('[SocketIO] Disconnected')
        })
        this.socket.on('connect_error', (err) => {
            this.logger.error('[SocketIO] Connection Error', err)
        })
    }
    private async request<T>(event: string, ...args: any[]): Promise<T> {
        this.logger.log(`[SocketIO] -> Request: ${event}`, ...args)
        try {
            const response = await this.socket.emitWithAck(event, ...args)
            if (response && response.success) {
                this.logger.log(`[SocketIO] <- Response: ${event}`, response.data)
                return response.data
            }
            this.logger.error(`[SocketIO] <- Error: ${event}`, response?.error)
            throw new Error(response?.error || 'Unknown error')
        } catch (error) {
            this.logger.error(`[SocketIO] <- Fail: ${event}`, error)
            throw error
        }
    }

    deviceInit(deviceId: string): Promise<DeviceConfig> {
        return this.request('deviceInit', deviceId)
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
        this.logger.log(`[SocketIO] -> Emit: keyPress`, args)
        this.socket.emit('keyPress', args)
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
    updateDeviceConfig(args: { deviceId: string; config: Partial<DeviceConfig> }): Promise<void> {
        return this.request('updateDeviceConfig', args)
    }
    getNextProfileName(): Promise<string> {
        return this.request('getNextProfileName')
    }
    sendProfileName(name: string): void {
        this.logger.log(`[SocketIO] -> Emit: profileNameResult`, name)
        this.socket.emit('profileNameResult', name)
    }

    // Event Listeners
    private wrapListener(event: string, callback: (...args: any[]) => void): () => void {
        const wrapper = (...args: any[]) => {
            this.logger.log(`[SocketIO] <- Event: ${event}`, ...args)
            callback(...args)
        }
        this.socket.on(event, wrapper)
        return () => {
            this.socket.off(event, wrapper)
        }
    }

    onDraw(callback: (event: any, keyObj: any) => void): () => void {
        return this.wrapListener('draw', (keyObj) => callback(null, keyObj)) // SocketIO might just send data, no event obj
    }

    // Note: Socket.IO args might slightly differ (no synthetic event object usually).
    // Adapting callback signatures to match expected SharedAPI signature.

    onShowDeviceLabel(callback: (data: { show: boolean; deviceId: string }) => void): () => void {
        return this.wrapListener('showDeviceLabel', (data) => callback(data)) // assuming data comes as first arg
    }
    onDisablePress(callback: (event: any, disabled: boolean) => void): () => void {
        return this.wrapListener('disablePress', (disabled) => callback(null, disabled))
    }
    onAutoHide(callback: (event: any, autoHide: boolean) => void): () => void {
        return this.wrapListener('autoHide', (autoHide) => callback(null, autoHide))
    }
    onHideEmptyKeys(callback: (event: any, hideEmptyKeys: boolean) => void): () => void {
        return this.wrapListener('hideEmptyKeys', (hideEmptyKeys) => callback(null, hideEmptyKeys))
    }
    onUpdateBackground(
        callback: (event: any, data: { backgroundColor: string; backgroundOpacity: number }) => void
    ): () => void {
        return this.wrapListener('updateBackground', (data) => callback(null, data))
    }
    onRebuildGrid(
        callback: (event: any, data: { columnCount: number; rowCount: number }) => void
    ): () => void {
        return this.wrapListener('rebuildGrid', (data) => callback(null, data))
    }
    onBrightness(callback: (event: any, brightness: number) => void): () => void {
        return this.wrapListener('brightness', (brightness) => callback(null, brightness))
    }
    onIdentify(callback: () => void): () => void {
        return this.wrapListener('identify', callback)
    }
    onClearDeck(callback: () => void): () => void {
        return this.wrapListener('clearDeck', callback)
    }
    onLockedState(callback: (event: any, data: any) => void): () => void {
        return this.wrapListener('lockedState', (data) => callback(null, data))
    }
    onKeyEvent(callback: (event: any, keyObj: any) => void): () => void {
        return this.wrapListener('keyEvent', (keyObj) => callback(null, keyObj))
    }
}

// ConsoleLogger implementation
export const ConsoleLogger: Logger = {
    log(message: string, ...args: any[]): void {
        console.log(message, ...args)
    },
    error(message: string, ...args: any[]): void {
        console.error(message, ...args)
    }
}

// Factory
let clientInstance: SharedAPI | null = null;

export function getAPIClient(): SharedAPI {
    if (clientInstance) return clientInstance;

    const logger = ConsoleLogger;

    if (ElectronAPIAdapter.available()) {
        logger.log('Using Electron API Adapter')
        clientInstance = new ElectronAPIAdapter(logger)
    } else {
        logger.log('Using Socket.IO API Adapter')
        clientInstance = new SocketIOAPIAdapter(logger)
    }
    return clientInstance;
}
