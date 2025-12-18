import type {
    DeviceRegisterPropsComplete,
    GridSize,
    SatelliteConfigSize,
    SatelliteSurfaceLayout,
} from './client-types'

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
        pincodeMap: null,
    }
}
