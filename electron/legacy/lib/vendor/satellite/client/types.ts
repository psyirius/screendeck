// https://github.com/bitfocus/companion-satellite/blob/v2.6.0/satellite/src/*.ts
// took from multiple type definition files and combined here for easier reference

import type { PixelFormat } from '@julusian/image-rs'
import type { CardGenerator } from '../graphics/cards'

export interface DeviceDrawProps {
    deviceId: string
    /** @deprecated TODO: is this needed? */
    keyIndex: number
    controlId: string
    row: number
    column: number
    image?: DeviceDrawImageFn
    color?: string // hex
    text?: string
}

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

export type SurfaceId = string

export type DeviceDrawImageFn = (
    width: number,
    height: number,
    format: PixelFormat
) => Promise<Buffer>

export interface SurfaceInstance {
    readonly pluginId: string

    readonly surfaceId: SurfaceId
    readonly productName: string

    close(): Promise<void>

    initDevice(): Promise<void>

    deviceAdded(): Promise<void>

    setBrightness(percent: number): Promise<void>

    blankDevice(): Promise<void>

    draw(signal: AbortSignal, data: DeviceDrawProps): Promise<void>

    onVariableValue?(name: string, value: string): void

    onLockedStatus?(locked: boolean, characterCount: number): void

    showStatus(
        signal: AbortSignal,
        cardGenerator: CardGenerator,
        hostname: string,
        status: string
    ): Promise<void>
}

export interface SurfaceContext {
    get isLocked(): boolean
    // get displayHost(): string

    get capabilities(): ClientCapabilities

    disconnect(error: Error): void

    keyDownById(controlId: string): void
    keyUpById(controlId: string): void
    keyDownUpById(controlId: string): void
    rotateLeftById(controlId: string): void
    rotateRightById(controlId: string): void

    sendVariableValue(variable: string, value: any): void
}

export interface SurfaceProxyDrawProps {
    deviceId: string
    keyIndex: number | undefined
    controlId: string | undefined
    image?: Buffer
    color?: string // hex
    text?: string
}
