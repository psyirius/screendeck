import { globalShortcut } from 'electron'
import Store from 'electron-store'
import { globalContext } from './global'
import { getControlById, getControlIdByXY } from './device'

const store = new Store()

export function registerHotkey(
    hotkey: string,
    deviceId: string,
    keyIndex: number
): boolean {
    if (globalShortcut.isRegistered(hotkey)) {
        console.warn(`Hotkey ${hotkey} is already in use`)
        return false
    }

    try {
        const columnCount = store.get(
            `device.${deviceId}.columnCount`,
            8
        ) as number
        const x = keyIndex % columnCount
        const y = Math.floor(keyIndex / columnCount)

        globalShortcut.register(hotkey, () => {
            const controlId = getControlIdByXY(x, y);
            const control = getControlById(deviceId, controlId);
            if (!control) {
                throw new Error(`Control not found for device ${deviceId} at (${x}, ${y})`)
            }
            globalContext.satelliteClient?.keyDown(deviceId, controlId, control);
            setTimeout(
                () => globalContext.satelliteClient?.keyUp(deviceId, controlId, control),
                100
            )
        })

        // let imageBase64 = ''
        // const deviceMap = globalState.keyStates.get(deviceId)
        //
        // if (deviceMap) {
        //     const keyState = deviceMap.get(keyIndex)
        //
        //     if (keyState) {
        //         imageBase64 = keyState.imageBase64 || ''
        //     }
        // }

        globalContext.registeredHotkeys.set(hotkey, {
            deviceId,
            keyIndex,
            imageBase64: '',
        })
        console.log(
            `Registered hotkey: ${hotkey} for ${deviceId} key ${keyIndex}`
        )
        return true
    } catch (error) {
        console.error(`Failed to register hotkey ${hotkey}:`, error)
        return false
    }
}

export function unregisterHotkey(hotkey: string) {
    if (globalShortcut.isRegistered(hotkey)) {
        globalShortcut.unregister(hotkey)
        globalContext.registeredHotkeys.delete(hotkey)
        console.log(`Unregistered hotkey: ${hotkey}`)
    }
}

export function unregisterAllHotkeysForDevice(deviceId: string) {
    for (const [hotkey, mapping] of globalContext.registeredHotkeys.entries()) {
        if (mapping.deviceId === deviceId) {
            unregisterHotkey(hotkey)
        }
    }
}

export function unregisterAllHotkeys() {
    globalShortcut.unregisterAll()
    globalContext.registeredHotkeys.clear()
    console.log('Unregistered all hotkeys')
}

export function isHotkeyConflict(
    hotkey: string,
    deviceId: string,
    keyIndex: number
): boolean {
    const mapping = globalContext.registeredHotkeys.get(hotkey)
    if (!mapping) return false

    // If it's already mapped to this key, no problem
    return !(mapping.deviceId === deviceId && mapping.keyIndex === keyIndex);
}

// Reload all hotkeys from the store at startup
export function loadHotkeysFromStore() {
    const deviceIds = store.get('deviceIds', []) as string[]
    for (const deviceId of deviceIds) {
        const keys = store.get(`device.${deviceId}.keys`, {}) as Record<
            string,
            any
        >
        for (const [keyIndexStr, keyConfig] of Object.entries(keys)) {
            const keyIndex = parseInt(keyIndexStr)
            if (keyConfig.hotkey) {
                const hotkey = keyConfig.hotkey
                registerHotkey(hotkey, deviceId, keyIndex)
            }
        }
    }
}
