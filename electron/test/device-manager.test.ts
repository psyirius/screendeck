import { DeviceManager } from '../main/core/services/device';
import { FileStore } from '../main/core/store';
import { join } from 'path';
import { promises as fs } from 'fs';
import { tmpdir } from 'os';

async function runTests() {
    console.log('Starting DeviceManager tests with Store and Events...');

    const tempDir = await fs.mkdtemp(join(tmpdir(), 'device-manager-events-test-'));
    console.log(`Using temp dir: ${tempDir}`);

    try {
        const storePath = join(tempDir, 'store.json');

        const store = new FileStore(storePath);
        const manager = DeviceManager.instance;
        await manager.initialize(store);
        console.log('Initialized.');

        // Setup Event Listeners
        let eventCreated: any = null;
        let eventUpdated: any = null;
        let eventDeleted: any = null;

        manager.on('device-created', (d) => { eventCreated = d; });
        manager.on('device-updated', (d) => { eventUpdated = d; });
        manager.on('device-deleted', (d) => { eventDeleted = d; });

        // 2a. Create Popup Device (Default)
        const device1 = await manager.createDevice({ displayName: 'Event Test Device' });
        console.log(`Created device: ${device1.displayName} (${device1.id}), Mode: ${device1.mode}`);

        if (device1.mode !== 'popup_window') {
            throw new Error('Default mode is not popup_window');
        }

        if (!eventCreated || eventCreated.id !== device1.id) {
            throw new Error('Event failed: device-created not fired or incorrect');
        }

        // 2b. Create Web UI Device
        eventCreated = null; // Reset event for next creation
        const webDevice = await manager.createDevice({
            displayName: 'Web Test',
            mode: 'web_ui',
            networkInterface: 'eth0',
            hostname: 'screendeck.local'
        });
        console.log(`Created Web UI device: ${webDevice.displayName}, Mode: ${webDevice.mode}`);

        if (webDevice.mode !== 'web_ui') throw new Error('Web UI mode failed');
        if ((webDevice as any).networkInterface !== 'eth0') throw new Error('networkInterface failed');
        if ((webDevice as any).hostname !== 'screendeck.local') throw new Error('hostname failed');

        if (!eventCreated || eventCreated.id !== webDevice.id) { // Check for webDevice creation event
            throw new Error('Event failed: device-created not fired or incorrect for webDevice');
        }
        console.log('Event device-created verified.');

        // 2. Update
        await manager.updateDevice(device1.id, { displayName: 'Updated Event Device' });

        if (!eventUpdated || eventUpdated.displayName !== 'Updated Event Device') {
            throw new Error('Event failed: device-updated not fired or incorrect');
        }
        console.log('Event device-updated verified.');

        // 3. Lifecycle (Connect/Disconnect)
        let eventConnected: any = null;
        let eventDisconnected: { id: any, reason: string } | null = null;
        manager.on('device-connected', (id) => { eventConnected = id; });
        manager.on('device-disconnected', (id, reason) => { eventDisconnected = { id, reason }; });

        // Connect (Should auto-connect on enable if implemented, or explicit connect)
        await manager.connectDevice(device1.id);
        if (!manager.isConnected(device1.id)) throw new Error('Connect failed: isConnected false');
        if (eventConnected !== device1.id) throw new Error('Event failed: device-connected');
        console.log('Connect verified.');

        // Disconnect
        await manager.disconnectDevice(device1.id, 'user-request');
        if (manager.isConnected(device1.id)) throw new Error('Disconnect failed: isConnected true');
        if (!eventDisconnected || eventDisconnected.id !== device1.id || eventDisconnected.reason !== 'user-request') {
            throw new Error(`Event failed: device-disconnected (reason: ${eventDisconnected?.reason})`);
        }
        console.log('Disconnect verified.');

        // 3b. Validation Test
        try {
            await manager.updateDevice(device1.id, { columns: 0 });
            throw new Error('Validation failed: Should have thrown error for columns=0');
        } catch (e: any) {
            if (!e.message.includes('positive integer')) throw e;
            console.log('Validation verified.');
        }

        // 4. Delete
        await manager.deleteDevice(device1.id);

        if (!eventDeleted || eventDeleted.id !== device1.id) {
            throw new Error('Event failed: device-deleted not fired or incorrect');
        }
        console.log('Event device-deleted verified.');

        console.log('All tests passed!');

    } catch (error) {
        console.error('Test failed:', error);
        process.exit(1);
    } finally {
        await fs.rm(tempDir, { recursive: true, force: true });
        console.log('Cleanup done.');
    }
}

runTests();
