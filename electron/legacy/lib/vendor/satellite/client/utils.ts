import type {
    DeviceRegisterPropsComplete,
    GridSize,
    SatelliteConfigSize,
    SatelliteSurfaceLayout,
} from './types'
// import { Pincode4x3, Pincode5x3 } from '../device/pincode'

export function assertNever(_v: never): void {
    // Nothing to do
}

export function calculateGridSize(surfaceLayout: SatelliteSurfaceLayout): GridSize {
    return Object.values(surfaceLayout.controls).reduce(
        (gridSize, control): GridSize => ({
            columns: Math.max(gridSize.columns, control.column + 1),
            rows: Math.max(gridSize.rows, control.row + 1),
        }),
        { columns: 0, rows: 0 }
    )
}

export function createDeviceRegisterProps(
    rows: number,
    columns: number,
    {
        text,
        textStyle,
        colors,
        bitmap,
    }: {
        text?: boolean
        textStyle?: boolean
        colors?: 'hex' | 'rgb'
        bitmap?: SatelliteConfigSize | undefined
    }
): DeviceRegisterPropsComplete {
    const surfaceManifest: SatelliteSurfaceLayout = {
        stylePresets: {
            default: {
                // if we use canvas rendering (to get the exact graphics)
                bitmap,
                // these are optional, if using bitmap already
                text,
                textStyle,
                colors,
            },
        },
        controls: {}, // populated below
    }

    const NUM_KEYS = columns * rows

    // Define controls based on current device configuration
    for (let i = 0; i < NUM_KEYS; i++) {
        const row = Math.floor(i / columns)
        const column = i % columns

        surfaceManifest.controls[`${row}/${column}`] = {
            row,
            column,
        }
    }

    let bitmapSize = surfaceManifest.stylePresets.default.bitmap
    if (!bitmapSize) {
        bitmapSize = Object.values(surfaceManifest.stylePresets).find((s) => !!s.bitmap)?.bitmap
    }

    return {
        surfaceManifest,
        // TODO
        // uses client.sendVariableValue(deviceId, id/name, value) for sending input variable updates
        // uses client.on('variableValue', { deviceId, id/name, value }) for listening to output variable
        transferVariables: [
            {
                id: 'tbarLeds',
                type: 'output',
                name: 'T-bar LED pattern',
                description:
                    'Set the pattern of LEDs on the T-bar. Use numbers -16 to 16, positive numbers light up from the bottom, negative from the top.',
            },
            {
                id: 'batteryLevel',
                type: 'input',
                name: 'Battery percentage',
                description: 'The battery level of the controller, in range 0-1',
            },
        ],
        gridSize: calculateGridSize(surfaceManifest),
        fallbackBitmapSize: bitmapSize ? Math.min(bitmapSize.h, bitmapSize.w) : 0,
        brightness: true,
        // if null we don't get locked state updates, but an initial draw for lockout
        // if we supply a pincode map, we get locked state updates, but no initial draws.
        // - So if we get lockedState updates, we have to handle initial draws ourselves.
        // - we also get lockedState whenever we send a pincode via client.pincodeKey()
        // - when a pincode ack lockedState update return false, companion draws the full surface again.
        // Use 2 modes for pincode:
        // 1) null - no lockedState updates, but initial draw of lockscreen from companion
        // 2) pincodeMap - lockedState updates, but no initial draw, so we have to handle that ourselves.
        // Using 2 options for pincode handling in our surfaces.
        // 1) Keys: show lockscreen on the keys, but if the Grid size is <= 4x3, we can show a warning.
        // 2) UI: show lockscreen in the UI using the configured pincodeMap. This works for all grid sizes.
        // 3) Auto: if the grid size is >= 4x3, use keys, else use UI.
        // Auto is default for now.
        // Options for pincodeMap:
        // - null (Companion draws the lockscreen, we don't handle lockedState updates, default: 5x3)
        // - Pincode4x3(), Pincode4x4(), Pincode5x3(), Pincode6x2()
        // - custom map: user can define their own map here.
        pincodeMap: null,
        // pincodeMap: Pincode4x3(),
        // pincodeMap: {
        //     type: 'single-page',
        //     pincode: [1, 2],
        //     0: [3, 2],
        //     1: [0, 0],
        //     2: [1, 0],
        //     3: [2, 0],
        //     4: [3, 0],
        //     5: [0, 1],
        //     6: [1, 1],
        //     7: [2, 1],
        //     8: [3, 1],
        //     9: [0, 2],
        // },
    }
}
