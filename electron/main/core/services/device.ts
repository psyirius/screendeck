import { EventEmitter } from 'events';
import generateUuid from 'short-uuid';
import { Store } from '../store';

export type DeviceMode = 'popup_window' | 'web_ui';

export interface BaseDeviceConfig {
    columns: number;
    rows: number;
    bitmapSize: number;
    displayName: string;
    name: string;
    enabled: boolean;
    lastConnected?: number;
}

export interface PopupWindowDeviceConfig extends BaseDeviceConfig {
    mode: 'popup_window';
    alwaysOnTop?: boolean;
    movable?: boolean;
    disablePress?: boolean;
    autoHide?: boolean;
    hideEmptyKeys?: boolean;
    backgroundColor?: string;
    backgroundOpacity?: number;
}

export interface WebUIDeviceConfig extends BaseDeviceConfig {
    mode: 'web_ui';
    port?: number;
    networkInterface?: string;
    hostname?: string;
}

export type DeviceConfig = PopupWindowDeviceConfig | WebUIDeviceConfig;

export type DeviceId = string & { __brand: 'DeviceId' }

export type Device = DeviceConfig & { id: DeviceId };

export interface DeviceManagerEvents {
    'device-created': (device: Device) => void;
    'device-updated': (device: Device) => void;
    'device-deleted': (device: Device) => void;
    'device-connected': (id: DeviceId) => void;
    'device-disconnected': (id: DeviceId, reason: string) => void;
    'device-error': (id: DeviceId, error: Error) => void;
}

export declare interface DeviceManager {
    on<U extends keyof DeviceManagerEvents>(
        event: U,
        listener: DeviceManagerEvents[U]
    ): this;

    emit<U extends keyof DeviceManagerEvents>(
        event: U,
        ...args: Parameters<DeviceManagerEvents[U]>
    ): boolean;
}

export class DeviceManager extends EventEmitter {
    private static _instance: DeviceManager;
    private devices: Map<DeviceId, Device> = new Map();
    private connectedDevices: Set<DeviceId> = new Set();
    private store!: Store;
    private readonly STORE_KEY = 'devices';

    private constructor() {
        super();
    }

    public static get instance(): DeviceManager {
        if (!this._instance) {
            this._instance = new DeviceManager();
        }
        return this._instance;
    }

    public async initialize(store: Store): Promise<void> {
        this.store = store;
        await this.load();
        await this.connectEnabledDevices();
    }

    public getAllDevices(): Device[] {
        return Array.from(this.devices.values());
    }

    public getDevice(id: DeviceId): Device | undefined {
        return this.devices.get(id);
    }

    public async createDevice(config: Partial<DeviceConfig> & { mode?: DeviceMode } = {}): Promise<Device> {
        this.validateConfig(config);

        const id = generateUuid.generate() as unknown as DeviceId;
        const baseConfig: BaseDeviceConfig = {
            columns: config.columns ?? 3,
            rows: config.rows ?? 2,
            bitmapSize: config.bitmapSize ?? 72,
            displayName: config.displayName ?? 'New Device',
            name: config.name ?? `device_${id}`,
            enabled: config.enabled ?? true,
        };

        let newDevice: Device;

        if (config.mode === 'web_ui') {
            newDevice = {
                ...baseConfig,
                ...config,
                id,
                mode: 'web_ui'
            } as Device;
        } else {
            // Default to popup_window
            newDevice = {
                ...baseConfig,
                ...config,
                id,
                mode: 'popup_window',
                alwaysOnTop: (config as PopupWindowDeviceConfig).alwaysOnTop ?? false,
                movable: (config as PopupWindowDeviceConfig).movable ?? true,
            } as Device;
        }

        this.devices.set(id, newDevice);
        await this.save();
        this.emit('device-created', newDevice);

        if (newDevice.enabled) {
            await this.connectDevice(id);
        }

        return newDevice;
    }

    public async updateDevice(id: DeviceId, config: Partial<DeviceConfig>): Promise<void> {
        const existingDevice = this.devices.get(id);
        if (existingDevice) {
            this.validateConfig(config);

            // We need to be careful with spread here if mode changes, but for partial updates it's mostly safe
            // However, switching modes via update might need validation.
            // For now, simple object update.
            const updatedDevice = { ...existingDevice, ...config } as Device;
            this.devices.set(id, updatedDevice);
            await this.save();
            this.emit('device-updated', updatedDevice);

            // Handle enabled/disabled toggle
            if (config.enabled === true && !this.isConnected(id)) {
                await this.connectDevice(id);
            } else if (config.enabled === false && this.isConnected(id)) {
                await this.disconnectDevice(id, 'disabled');
            }
        } else {
            throw new Error(`Device with ID ${id} not found.`);
        }
    }

    public async deleteDevice(id: DeviceId): Promise<void> {
        const device = this.devices.get(id);
        if (!device) return;

        // Disconnect if connected
        if (this.connectedDevices.has(id)) {
            await this.disconnectDevice(id, 'device-deleted');
        }

        const initialLength = this.devices.size;
        this.devices.delete(id);

        if (this.devices.size !== initialLength) {
            await this.save();
            this.emit('device-deleted', device);
        }
    }

    public async connectDevice(id: DeviceId): Promise<void> {
        const device = this.getDevice(id);
        if (!device) {
            throw new Error(`Device with ID ${id} not found.`);
        }

        if (!this.connectedDevices.has(id)) {
            try {
                // In a real implementation, actual connection logic would go here.
                // For Web UI, check port availability?
                // For now, just mark connected and update timestamp.

                this.connectedDevices.add(id);

                const updatedDevice = { ...device, lastConnected: Date.now() };
                this.devices.set(id, updatedDevice);
                await this.save(); // Persist the timestamp

                this.emit('device-connected', id);
            } catch (error: any) {
                this.emit('device-error', id, error);
            }
        }
    }

    public async disconnectDevice(id: DeviceId, reason: string = 'unknown'): Promise<void> {
        if (this.connectedDevices.has(id)) {
            this.connectedDevices.delete(id);
            this.emit('device-disconnected', id, reason);
        }
    }

    public isConnected(id: DeviceId): boolean {
        return this.connectedDevices.has(id);
    }

    public async connectEnabledDevices(): Promise<void> {
        for (const device of this.devices.values()) {
            if (device.enabled && !this.isConnected(device.id)) {
                await this.connectDevice(device.id);
            }
        }
    }

    private validateConfig(config: Partial<DeviceConfig>): void {
        if (config.columns !== undefined && (!Number.isInteger(config.columns) || config.columns <= 0)) {
            throw new Error('columns must be a positive integer');
        }
        if (config.rows !== undefined && (!Number.isInteger(config.rows) || config.rows <= 0)) {
            throw new Error('rows must be a positive integer');
        }
        if ((config as WebUIDeviceConfig).port !== undefined && (!Number.isInteger((config as WebUIDeviceConfig).port) || (config as WebUIDeviceConfig).port! <= 0)) {
            throw new Error('port must be a positive integer');
        }
    }

    private async save(): Promise<void> {
        if (!this.store) return;
        await this.store.set(this.STORE_KEY, Array.from(this.devices.values()));
    }

    private async load(): Promise<void> {
        if (!this.store) return;
        const loadedDevices = await this.store.get<Device[]>(this.STORE_KEY);
        this.devices.clear();
        if (loadedDevices) {
            loadedDevices.forEach(d => this.devices.set(d.id, d));
        }
    }
}
