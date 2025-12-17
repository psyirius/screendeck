import { ipcMain } from 'electron';
import {
    Device,
    DeviceConfig,
    KeyConfig,
    KeyPressArgs,
    ResizeKeypadArgs,
    UpdateKeyConfigArgs,
    AssignHotkeyArgs,
    ClearHotkeyArgs,
    HotkeyContext
} from './types';

// Placeholder imports for legacy logic - in a real migration we would move logic here or import it
// Since we are "not existing in main yet", we will structure the adapter to receive the implementation or just define the handlers.

export class ElectronMainAdapter {
    constructor() { }

    registerHandlers() {
        // Device Management
        this.handle('getDeviceConfig', this.getDeviceConfig.bind(this));
        this.handle('getKeypadBounds', this.getKeypadBounds.bind(this));
        this.handle('resizeKeypadWindow', this.resizeKeypadWindow.bind(this));
        this.handle('closeKeypad', this.closeKeypad.bind(this));
        this.handle('createNewDevice', this.createNewDevice.bind(this));
        this.handle('deleteDevice', this.deleteDevice.bind(this));
        this.handle('getAllDevices', this.getAllDevices.bind(this));
        this.handle('updateDeviceConfig', this.updateDeviceConfig.bind(this));

        // Key Management
        this.on('keyPress', this.keyPress.bind(this));
        this.handle('getKeyConfig', this.getKeyConfig.bind(this));
        this.handle('updateKeyConfig', this.updateKeyConfig.bind(this));

        // Hotkeys
        this.handle('assignHotkey', this.assignHotkey.bind(this));
        this.handle('clearHotkey', this.clearHotkey.bind(this));
        this.handle('getHotkeyContext', this.getHotkeyContext.bind(this));
        this.handle('setHotkeyContext', this.setHotkeyContext.bind(this));
        this.handle('openHotkeyPrompt', this.openHotkeyPrompt.bind(this));
        this.handle('closeHotkeyPrompt', this.closeHotkeyPrompt.bind(this));

        // Settings / Profile
        this.handle('saveSettings', this.saveSettings.bind(this));
        this.handle('getSettings', this.getSettings.bind(this));
        this.handle('getNextProfileName', this.getNextProfileName.bind(this));

        // Legacy / Misc
        // 'showDeviceLabels' was in legacy ipcHandlers, but maybe not in SharedAPI explicitly as a request?
        // Checked Client: it has `onShowDeviceLabel` event, but maybe no request to toggle it from client?
        // Legacy ipcHandlers has `ipcMain.handle('showDeviceLabels', ...)`
        // If it's not in SharedAPI, we might skip or add it.
        // Client types: `onShowDeviceLabel`.
        // Client buttons.tsx: `api.onShowDeviceLabel(...)`.
        // But is there a request to TRIGGER it?
        // Legacy ipcHandlers line 280: `ipcMain.handle('showDeviceLabels', ...)`
        // It seems the client CAN trigger it (e.g. for testing or context menu?).
        // In SharedAPI client definition, I didn't see `showDeviceLabels` request, only event listener.
        // Wait, `onShowDeviceLabel` in client is `(callback) => () => void`.
        // The *Server* emits it.
        // The `ipcMain.handle` in legacy suggests the renderer *calls* it to set state?
        // "showDeviceLabels" channel: `(_event, show) => showDeviceLabels(show)`
        // We'll leave it as a comment for now if not in SharedAPI.
    }

    private handle(channel: string, handler: (event: Electron.IpcMainInvokeEvent, ...args: any[]) => Promise<any> | any) {
        // In a real implementation we might want to check for duplicates or wrap errors
        ipcMain.handle(channel, handler);
    }

    private on(channel: string, listener: (event: Electron.IpcMainEvent, ...args: any[]) => void) {
        ipcMain.on(channel, listener);
    }

    // --- Implementation Stubs (to be filled with moved logic) ---

    async getDeviceConfig(_event: any, _deviceId: string): Promise<DeviceConfig> {
        throw new Error("Not implemented");
    }

    async getKeypadBounds(_event: any, _deviceId: string): Promise<any> {
        throw new Error("Not implemented");
    }

    async resizeKeypadWindow(_event: any, _args: ResizeKeypadArgs): Promise<void> {
        throw new Error("Not implemented");
    }

    async closeKeypad(_event: any, _deviceId: string): Promise<void> {
        throw new Error("Not implemented");
    }

    keyPress(_event: any, _args: KeyPressArgs): void {
        // Fire and forget
    }

    async getKeyConfig(_event: any, _args: { deviceId: string; keyIndex: number }): Promise<KeyConfig> {
        throw new Error("Not implemented");
    }

    async updateKeyConfig(_event: any, _args: UpdateKeyConfigArgs): Promise<void> {
        throw new Error("Not implemented");
    }

    async assignHotkey(_event: any, _args: AssignHotkeyArgs): Promise<boolean> {
        throw new Error("Not implemented");
    }

    async clearHotkey(_event: any, _args: ClearHotkeyArgs): Promise<boolean> {
        throw new Error("Not implemented");
    }

    async getHotkeyContext(_event: any): Promise<HotkeyContext | undefined> {
        throw new Error('Not implemented')
    }

    async setHotkeyContext(_event: any, _args: { deviceId: string; keyIndex: number; image?: Uint8Array | ArrayBuffer | null }): Promise<void> {
        throw new Error("Not implemented");
    }

    async openHotkeyPrompt(_event: any): Promise<void> {
        throw new Error("Not implemented");
    }

    async closeHotkeyPrompt(_event: any): Promise<void> {
        throw new Error("Not implemented");
    }

    async saveSettings(_event: any, _settings: any): Promise<void> {
        throw new Error("Not implemented");
    }

    async getSettings(_event: any): Promise<any> {
        throw new Error("Not implemented");
    }

    async createNewDevice(_event: any): Promise<void> {
        throw new Error("Not implemented");
    }

    async deleteDevice(_event: any, _deviceId: string): Promise<void> {
        throw new Error("Not implemented");
    }

    async getAllDevices(_event: any): Promise<Device[]> {
        throw new Error("Not implemented");
    }

    async updateDeviceConfig(_event: any, _args: { deviceId: string; config: Partial<DeviceConfig> }): Promise<void> {
        throw new Error("Not implemented");
    }

    async getNextProfileName(_event: any): Promise<string> {
        throw new Error("Not implemented");
    }
}
