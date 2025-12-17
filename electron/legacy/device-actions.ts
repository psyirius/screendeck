import Store from 'electron-store'
import { defaultSettings } from './defaults'
import { globalContext } from './global'
import { createNewDevice, getControlById, getControlIdByXY, refreshDeviceRegisterProps } from './device'
import { createSatellite } from './utils'
import { DeviceRegisterPropsComplete } from './lib/vendor/satellite/client-types'

const store = new Store({ defaults: defaultSettings })

const getDeviceConfig = (deviceId: string) => {
    const columnCount = store.get(`device.${deviceId}.columnCount`, 8)
    const rowCount = store.get(`device.${deviceId}.rowCount`, 4)
    const bitmapSize = store.get(`device.${deviceId}.bitmapSize`, 72)
    const alwaysOnTop = store.get(`device.${deviceId}.alwaysOnTop`, false)
    const movable = store.get(`device.${deviceId}.movable`, true)
    const disablePress = store.get(`device.${deviceId}.disablePress`, false)
    const autoHide = store.get(`device.${deviceId}.autoHide`, false)
    const hideEmptyKeys = store.get(`device.${deviceId}.hideEmptyKeys`, false)
    const backgroundColor = store.get(`device.${deviceId}.backgroundColor`, '#000000')
    const backgroundOpacity = store.get(`device.${deviceId}.backgroundOpacity`, 0.5)

    return {
        columnCount,
        rowCount,
        bitmapSize,
        alwaysOnTop,
        movable,
        disablePress,
        autoHide,
        hideEmptyKeys,
        backgroundColor,
        backgroundOpacity,
    }
}

const getKeyConfig = (deviceId: string, keyIndex: number) => {
    return {
        isEncoder: store.get(`device.${deviceId}.key.${keyIndex}.isEncoder`, false),
        stepSize: store.get(`device.${deviceId}.key.${keyIndex}.stepSize`, 10),
    }
}

const updateKeyConfig = (deviceId: string, keyIndex: number, keyConfig: any) => {
    const isEncoder = keyConfig.isEncoder ?? false
    const stepSize = keyConfig.stepSize ?? 10
    store.set(`device.${deviceId}.key.${keyIndex}.isEncoder`, isEncoder)
    store.set(`device.${deviceId}.key.${keyIndex}.stepSize`, stepSize)
}

const emitKeyAction = (deviceId: string, x: number, y: number, action: string) => {
    if (!globalContext.satelliteClient) {
        throw new Error('Satellite client not initialized yet.')
    }

    const disablePress = store.get(`device.${deviceId}.disablePress`, false)
    if (disablePress) {
        console.log(`Button presses disabled for ${deviceId}. Ignoring.`)
        return
    }

    const controlId = getControlIdByXY(x, y);
    const control = getControlById(deviceId, controlId);

    if (!control) {
        throw new Error(`Control not found for device ${deviceId} at (${x}, ${y})`)
    }

    switch (action) {
        case 'down':
            globalContext.satelliteClient.keyDown(deviceId, controlId, control)
            break
        case 'up':
            globalContext.satelliteClient.keyUp(deviceId, controlId, control)
            break
        case 'rotateLeft':
            globalContext.satelliteClient.rotateLeft(deviceId, controlId, control)
            break
        case 'rotateRight':
            globalContext.satelliteClient.rotateRight(deviceId, controlId, control)
            break
    }
}

const toggleKeyIsEncoder = (deviceId: string, keyIndex: number) => {
    const current = store.get(`device.${deviceId}.key.${keyIndex}.isEncoder`, false)
    const newValue = !current
    store.set(`device.${deviceId}.key.${keyIndex}.isEncoder`, newValue)
    return newValue
}

const createDevice = () => {
    const newDeviceId = createNewDevice()

    let deviceIds = store.get('deviceIds', []) as string[]
    deviceIds.push(newDeviceId)
    store.set('deviceIds', deviceIds)

    return newDeviceId
}

const getAllDevices = () => {
    const deviceIds = store.get('deviceIds', []) as string[]
    return deviceIds.map((id) => ({
        deviceId: id,
        name: store.get(`device.${id}.name`, ''),
        columnCount: store.get(`device.${id}.columnCount`, 8),
        rowCount: store.get(`device.${id}.rowCount`, 4),
        bitmapSize: store.get(`device.${id}.bitmapSize`, 72),
        alwaysOnTop: store.get(`device.${id}.alwaysOnTop`, false),
        movable: store.get(`device.${id}.movable`, true),
        disablePress: store.get(`device.${id}.disablePress`, false),
        autoHide: store.get(`device.${id}.autoHide`, false),
        hideEmptyKeys: store.get(`device.${id}.hideEmptyKeys`, false),
        backgroundColor: store.get(`device.${id}.backgroundColor`, '#000000'),
        backgroundOpacity: store.get(`device.${id}.backgroundOpacity`, 0.5),
    }))
}

const updateDeviceConfig = (deviceId: string, config: any) => {
    let needsDeviceUpdate = false

    // Check if key properties have actually changed
    for (const key of ['columnCount', 'rowCount', 'bitmapSize']) {
        const oldValue = store.get(`device.${deviceId}.${key}`)
        const newValue = config[key]

        if (newValue !== undefined && newValue !== oldValue) {
            needsDeviceUpdate = true
            break
        }
    }

    // Save all config values
    Object.entries(config).forEach(([key, value]) => {
        const fullKey = `device.${deviceId}.${key}`

        if (value === undefined) {
            store.delete(fullKey as any)
        } else {
            store.set(fullKey, value)
        }
    })

    if (needsDeviceUpdate) {
        // If the Satellite client is connected and key properties changed, update the device config
        if (!globalContext.satelliteClient) {
            throw new Error('Satellite client not initialized yet.')
        }

        console.log(`Device ${deviceId} config changed, updating Satellite client...`)
        globalContext.satelliteClient.removeDevice(deviceId)

        // Refresh the device register props in the store
        refreshDeviceRegisterProps(deviceId)

        globalContext.satelliteClient.addDevice(
            deviceId,
            'ScreenDeck',
            store.get(`device.${deviceId}.registerProps`) as DeviceRegisterPropsComplete
        )
    }

    return needsDeviceUpdate;
}

const deleteDevice = (deviceId: string) => {
    let deviceIds = store.get('deviceIds', []) as string[]
    deviceIds = deviceIds.filter((id) => id !== deviceId)
    store.set('deviceIds', deviceIds)

    // Remove all device-specific settings
    const keys = Object.keys(store.store)
    keys.forEach((key) => {
        if (key.startsWith(`device.${deviceId}.`)) {
            store.delete(key as any)
        }
    })

    // If the Satellite client is connected, remove the device
    if (!globalContext.satelliteClient) {
        throw new Error('Satellite client not initialized yet.')
    }

    console.log(`Removing device ${deviceId} from Satellite client...`)
    globalContext.satelliteClient.removeDevice(deviceId)
}

const getSettings = () => {
    return store.store;
}

const deviceInit = (deviceId: string) => {
    // validate device id
    const deviceConfig = store.get(`device.${deviceId}.columnCount`)
    if (!deviceConfig) {
        throw new Error(`Device ${deviceId} not found in store.`)
    }

    if (!globalContext.satelliteClient) {
        throw new Error('Satellite client not initialized yet.')
    }

    console.log(`Initializing device ${deviceId} in Satellite client...`)
    globalContext.satelliteClient.removeDevice(deviceId)

    // Refresh the device register props in the store
    refreshDeviceRegisterProps(deviceId);

    // add the device again (so that we get draw commands)
    globalContext.satelliteClient.addDevice(
        deviceId,
        'ScreenDeck',
        store.get(`device.${deviceId}.registerProps`) as DeviceRegisterPropsComplete
    )

    return getDeviceConfig(deviceId)
}

const saveConnectionSettings = (newSettings: any) => {
    const previousIP = store.get('companionIP', '127.0.0.1')
    const previousPort = store.get('companionPort', 16622)

    store.set(newSettings)

    const newIP = newSettings.companionIP
    const newPort = newSettings.companionPort

    if (newIP !== previousIP || newPort !== previousPort) {
        console.log('Companion IP or port changed, restarting connection...')

        if (globalContext.satelliteClient) {
            globalContext.satelliteClient.disconnect() // Your close method for the new API
            globalContext.satelliteClient = null
        }

        // Wait briefly, then reconnect with the new IP/port
        setTimeout(() => {
            createSatellite() // Your function to initialize the Satellite client
        }, 500)
    }
}

const setDeviceHidden = (deviceId: string, hidden: boolean) => {
    store.set(`device.${deviceId}.hidden`, hidden)
}

const updateDeviceKeyConfig = (deviceId: string, keyIndex: number, keyConfig: any) => {
    // Save to store
    const keyConfigs = store.get(`device.${deviceId}.keys`, {}) as Record<number, { hotkey?: string }>
    keyConfigs[keyIndex] = {
        ...(keyConfigs[keyIndex] || {}),
        ...keyConfig,
    }
    store.set(`device.${deviceId}.keys`, keyConfigs)
}

export {
    deviceInit,
    getDeviceConfig,
    updateDeviceKeyConfig,
    getKeyConfig,
    emitKeyAction,
    updateKeyConfig,
    toggleKeyIsEncoder,
    createDevice,
    getAllDevices,
    deleteDevice,
    updateDeviceConfig,
    saveConnectionSettings,
    getSettings,
    setDeviceHidden,
}
