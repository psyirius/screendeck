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

// Define the shape of window.electronAPI
declare global {
    interface Window {
        electronAPI?: any;
    }
}

export class ElectronAPIAdapter implements SharedAPI {
    private api: any;

    constructor() {
        this.api = window.electronAPI;
    }

    getDeviceConfig(deviceId: string): Promise<DeviceConfig> {
        return this.api.invoke('getDeviceConfig', deviceId);
    }
    getKeypadBounds(deviceId: string): Promise<any> {
        return this.api.invoke('getKeypadBounds', deviceId);
    }
    resizeKeypadWindow(args: ResizeKeypadArgs): Promise<void> {
        return this.api.invoke('resizeKeypadWindow', args);
    }
    closeKeypad(deviceId: string): Promise<void> {
        return this.api.invoke('closeKeypad', deviceId);
    }
    keyPress(args: KeyPressArgs): void {
        this.api.send('keyPress', args);
    }
    getKeyConfig(args: { deviceId: string; keyIndex: number }): Promise<KeyConfig> {
        return this.api.invoke('getKeyConfig', args);
    }
    updateKeyConfig(args: UpdateKeyConfigArgs): Promise<void> {
        return this.api.invoke('updateKeyConfig', args);
    }
    assignHotkey(args: AssignHotkeyArgs): Promise<boolean> {
        return this.api.invoke('assignHotkey', args);
    }
    clearHotkey(args: ClearHotkeyArgs): Promise<boolean> {
        return this.api.invoke('clearHotkey', args);
    }
    getHotkeyContext(): Promise<HotkeyContext | undefined> {
        return this.api.invoke('getHotkeyContext');
    }
    setHotkeyContext(args: { deviceId: string; keyIndex: number; imageBase64?: string | null }): Promise<void> {
        return this.api.invoke('setHotkeyContext', args);
    }

    openHotkeyPrompt(): Promise<void> {
        return this.api.invoke('openHotkeyPrompt');
    }
    closeHotkeyPrompt(): Promise<void> {
        return this.api.invoke('closeHotkeyPrompt');
    }
    saveSettings(settings: any): Promise<void> {
        return this.api.invoke('saveSettings', settings);
    }
    getSettings(): Promise<any> {
        return this.api.invoke('getSettings');
    }
    getAllDevices(): Promise<Device[]> {
        return this.api.invoke('getAllDevices');
    }
    createNewDevice(): Promise<void> {
        return this.api.invoke('createNewDevice');
    }
    deleteDevice(deviceId: string): Promise<void> {
        return this.api.invoke('deleteDevice', deviceId);
    }
    updateDeviceConfig(args: { deviceId: string; config: Partial<DeviceConfig> }): Promise<void> {
        return this.api.invoke('updateDeviceConfig', args);
    }
    getNextProfileName(): Promise<string> {
        return this.api.invoke('getNextProfileName');
    }
    sendProfileName(name: string): void {
        this.api.send('profileNameResult', name);
    }

    // Event Listeners - Wrappers
    // Note: The Electron preload exposes specific methods like onDraw.
    // We'll wrap them to return a "remove listener" function if possible, or just accept the platform behavior.
    // Electron's preload methods usually just add listeners. Removing is trickier unless exposed.
    // The preload defines `onDraw: (callback) => ipcRenderer.on('draw', ...)`
    // It does NOT return a cleanup function. For now, we will just call the method.
    // Future improvement: Update preload to return a cleanup or expose ipcRenderer.removeListener.

    onDraw(callback: (event: any, keyObj: any) => void): () => void {
        this.api.onDraw(callback);
        return () => { }; // No cleanup available in current preload
    }
    onShowDeviceLabel(callback: (data: { show: boolean; deviceId: string }) => void): () => void {
        this.api.onShowDeviceLabel(callback);
        return () => { };
    }
    onDisablePress(callback: (event: any, disabled: boolean) => void): () => void {
        this.api.onDisablePress(callback);
        return () => { };
    }
    onAutoHide(callback: (event: any, autoHide: boolean) => void): () => void {
        this.api.onAutoHide(callback);
        return () => { };
    }
    onHideEmptyKeys(callback: (event: any, hideEmptyKeys: boolean) => void): () => void {
        this.api.onHideEmptyKeys(callback);
        return () => { };
    }
    onUpdateBackground(callback: (event: any, data: { backgroundColor: string; backgroundOpacity: number }) => void): () => void {
        this.api.onUpdateBackground(callback);
        return () => { };
    }
    onRebuildGrid(callback: (event: any, data: { columnCount: number; rowCount: number }) => void): () => void {
        this.api.onRebuildGrid(callback);
        return () => { };
    }
    onBrightness(callback: (event: any, brightness: number) => void): () => void {
        this.api.onBrightness(callback);
        return () => { };
    }
    onIdentify(callback: () => void): () => void {
        this.api.onIdentify(callback);
        return () => { };
    }
    onClearDeck(callback: () => void): () => void {
        this.api.onClearDeck(callback);
        return () => { };
    }
    onLockedState(callback: (event: any, data: any) => void): () => void {
        this.api.onLockedState(callback);
        return () => { };
    }
    onKeyEvent(callback: (event: any, keyObj: any) => void): () => void {
        this.api.onKeyEvent(callback);
        return () => { };
    }
}

export class SocketIOAPIAdapter implements SharedAPI {
    private socket: Socket;

    constructor() {
        // Connect to the server. Assumes server is serving socket.io.
        // If specific URL needed, it can be passed or configured.
        this.socket = io();
    }

    getDeviceConfig(deviceId: string): Promise<DeviceConfig> {
        return this.socket.emitWithAck('getDeviceConfig', deviceId);
    }
    getKeypadBounds(deviceId: string): Promise<any> {
        return this.socket.emitWithAck('getKeypadBounds', deviceId);
    }
    resizeKeypadWindow(args: ResizeKeypadArgs): Promise<void> {
        return this.socket.emitWithAck('resizeKeypadWindow', args);
    }
    closeKeypad(deviceId: string): Promise<void> {
        return this.socket.emitWithAck('closeKeypad', deviceId);
    }
    keyPress(args: KeyPressArgs): void {
        this.socket.emit('keyPress', args);
    }
    getKeyConfig(args: { deviceId: string; keyIndex: number }): Promise<KeyConfig> {
        return this.socket.emitWithAck('getKeyConfig', args);
    }
    updateKeyConfig(args: UpdateKeyConfigArgs): Promise<void> {
        return this.socket.emitWithAck('updateKeyConfig', args);
    }
    assignHotkey(args: AssignHotkeyArgs): Promise<boolean> {
        return this.socket.emitWithAck('assignHotkey', args);
    }
    clearHotkey(args: ClearHotkeyArgs): Promise<boolean> {
        return this.socket.emitWithAck('clearHotkey', args);
    }
    getHotkeyContext(): Promise<HotkeyContext | undefined> {
        return this.socket.emitWithAck('getHotkeyContext');
    }
    setHotkeyContext(args: { deviceId: string; keyIndex: number; imageBase64?: string | null }): Promise<void> {
        return this.socket.emitWithAck('setHotkeyContext', args);
    }

    openHotkeyPrompt(): Promise<void> {
        return this.socket.emitWithAck('openHotkeyPrompt');
    }
    closeHotkeyPrompt(): Promise<void> {
        return this.socket.emitWithAck('closeHotkeyPrompt');
    }
    saveSettings(settings: any): Promise<void> {
        return this.socket.emitWithAck('saveSettings', settings);
    }
    getSettings(): Promise<any> {
        return this.socket.emitWithAck('getSettings');
    }
    getAllDevices(): Promise<Device[]> {
        return this.socket.emitWithAck('getAllDevices');
    }
    createNewDevice(): Promise<void> {
        return this.socket.emitWithAck('createNewDevice');
    }
    deleteDevice(deviceId: string): Promise<void> {
        return this.socket.emitWithAck('deleteDevice', deviceId);
    }
    updateDeviceConfig(args: { deviceId: string; config: Partial<DeviceConfig> }): Promise<void> {
        return this.socket.emitWithAck('updateDeviceConfig', args);
    }
    getNextProfileName(): Promise<string> {
        return this.socket.emitWithAck('getNextProfileName');
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

    if (window.electronAPI) {
        console.log('Using Electron API Adapter');
        clientInstance = new ElectronAPIAdapter();
    } else {
        console.log('Using Socket.IO API Adapter');
        clientInstance = new SocketIOAPIAdapter();
    }
    return clientInstance;
}
