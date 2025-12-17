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
    rowCount: number
    columnCount: number
    bitmapSize: number | null
    colours: boolean
    text: boolean
    transferVariables?: Array<DeviceRegisterInputVariable | DeviceRegisterOutputVariable>
    pincodeMap: SurfacePincodeMap | null
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

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface ClientCapabilities {
    // For future use to support new functionality
}

export interface CompanionClient {
    get displayHost(): string

    keyDownXY(deviceId: string, x: number, y: number): void
    keyUpXY(deviceId: string, x: number, y: number): void
    rotateLeftXY(deviceId: string, x: number, y: number): void
    rotateRightXY(deviceId: string, x: number, y: number): void
    pincodeKey(deviceId: string, keyCode: number): void

    sendVariableValue(deviceId: string, variable: string, value: any): void
}

export interface SurfaceProxyDrawProps {
    deviceId: string
    keyIndex: number
    image?: Buffer
    color?: string // hex
    text?: string
}

// Utility function to ensure a value is never
export function assertNever(value: never): never {
    throw new Error(`Unexpected value: ${value}`)
}

// Default TCP port for Companion Satellite
export const DEFAULT_TCP_PORT = 16622

export const DEFAULT_BASE_RESOLUTION = 72
