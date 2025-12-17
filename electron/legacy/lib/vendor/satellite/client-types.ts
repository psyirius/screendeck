export interface DeviceRegisterInputVariable {
    id: string
    type: 'input'
    name: string
    description?: string
}

export interface DeviceRegisterOutputVariable {
    id: string
    type: 'output'
    name: string
    description?: string
}

export interface DeviceRegisterProps {
    brightness: boolean
    surfaceManifest: SatelliteSurfaceLayout
    transferVariables?: Array<DeviceRegisterInputVariable | DeviceRegisterOutputVariable>
    pincodeMap: SurfacePincodeMap | null
}

export interface DeviceRegisterPropsComplete extends DeviceRegisterProps {
    gridSize: GridSize
    fallbackBitmapSize: number
}

export interface SatelliteSurfaceLayout {
    stylePresets: {
        default: SatelliteControlStylePreset
        [k: string]: SatelliteControlStylePreset
    }
    controls: {
        [k: string]: SatelliteControlDefinition
    }
}

export interface SatelliteControlStylePreset {
    bitmap?: SatelliteConfigSize
    text?: boolean
    textStyle?: boolean
    colors?: 'hex' | 'rgb'
}

export interface SatelliteConfigSize {
    w: number
    h: number
}

export interface GridSize {
    rows: number
    columns: number
}

export interface SatelliteControlDefinition {
    row: number
    column: number
    stylePreset?: string
}

export type SurfacePincodeMap =
    | SurfacePincodeMapPageSingle
    | SurfacePincodeMapPageMultiple
    | SurfacePincodeMapCustom
export interface SurfacePincodeMapCustom {
    type: 'custom'
}
export interface SurfacePincodeMapPageSingle extends SurfacePincodeMapPageEntry {
    type: 'single-page'
    pincode: [number, number] | null
}
export interface SurfacePincodeMapPageMultiple {
    type: 'multiple-page'
    pincode: [number, number]
    nextPage: [number, number]
    pages: Partial<SurfacePincodeMapPageEntry>[]
}
export interface SurfacePincodeMapPageEntry {
    0: [number, number]
    1: [number, number]
    2: [number, number]
    3: [number, number]
    4: [number, number]
    5: [number, number]
    6: [number, number]
    7: [number, number]
    8: [number, number]
    9: [number, number]
}

export interface ClientCapabilities {
    supportsSurfaceManifest: boolean
}

export interface CompanionClient {
    get displayHost(): string
    get capabilities(): ClientCapabilities

    keyDown(
        surfaceId: string,
        controlId: string,
        controlDefinition: SatelliteControlDefinition
    ): void
    keyUp(surfaceId: string, controlId: string, controlDefinition: SatelliteControlDefinition): void
    rotateLeft(
        surfaceId: string,
        controlId: string,
        controlDefinition: SatelliteControlDefinition
    ): void
    rotateRight(
        surfaceId: string,
        controlId: string,
        controlDefinition: SatelliteControlDefinition
    ): void
    pincodeKey(surfaceId: string, keyCode: number): void

    sendVariableValue(surfaceId: string, variable: string, value: any): void
}

export interface SurfaceProxyDrawProps {
    deviceId: string
    keyIndex: number | undefined
    controlId: string | undefined
    image?: Buffer
    color?: string // hex
    text?: string
}

// ------------------------------------------------------------------------------------------------------------------ //

// Utility function to ensure a value is never
export function assertNever(value: never): never {
    throw new Error(`Unexpected value: ${value}`)
}

// Default TCP port for Companion Satellite
export const DEFAULT_TCP_PORT = 16622

export const DEFAULT_BASE_RESOLUTION = 72
