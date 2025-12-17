import { GridSize, SatelliteConfigSize, SatelliteSurfaceLayout } from './client-types'

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
    bitmap?: SatelliteConfigSize | undefined
) {
    const surfaceManifest: SatelliteSurfaceLayout = {
        stylePresets: {
            default: {
                bitmap,
            },
        },
        controls: {},
    }

    const NUM_KEYS = columns * rows;

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
        gridSize: calculateGridSize(surfaceManifest),
        fallbackBitmapSize: bitmapSize ? Math.min(bitmapSize.h, bitmapSize.w) : 0,
        brightness: true,
        pincodeMap: null,
    }
}
