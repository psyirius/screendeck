import React, { useEffect } from 'react'
import { hexToRgba } from './color';
import { getAPIClient } from '@/api/client';
import logo from '@/assets/images/logo.png?url';
import { XIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
// import { cn } from './lib/utils';

const api = getAPIClient();

// --- Styles ---
const styles = `
    /* Allow the main body area to be draggable */
    body {
        app-region: drag;
        margin: 0;
        padding: 0;
        display: flex;
        justify-content: flex-end;
        align-items: center;
        height: 100vh;
        background: transparent;
        /* Prevent pull-to-refresh and overscroll effects */
        overscroll-behavior: none;
    }

    /* Draggable area that encapsulates the keypad */
    .draggable-area {
        width: 100%;
        height: 100%;
        display: flex;
        justify-content: flex-end;
        align-items: center;
        app-region: drag;
    }

    /* Keypad styles */
    .keypad {
        /* display: grid; */ /* we set it later */
        gap: 10px;
        padding: 20px;
        /* Safe area insets for notched devices */
        padding-top: max(20px, env(safe-area-inset-top));
        padding-bottom: max(20px, env(safe-area-inset-bottom));
        padding-left: max(20px, env(safe-area-inset-left));
        padding-right: max(20px, env(safe-area-inset-right));
        background: rgba(0, 0, 0, 0.5);
        /* border-radius: 8px; */
        /*backdrop-filter: blur(10px);*/
        /* Prevent unwanted touch gestures */
        touch-action: manipulation;
    }

    #keypad {
        position: relative;
        height: 100%;
    }

    .device-label {
        position: absolute;
        top: 5px;
        left: 5px;
        background: rgba(0, 0, 0, 0.6);
        color: white;
        font-size: 12px;
        padding: 2px 6px;
        border-radius: 3px;
        z-index: 100;
        display: none;
    }

    /* Button and interactive elements should not affect drag */
    .key {
        app-region: no-drag;
        position: relative;
        background-color: #444;
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 10px;
        font-size: 16px;
        cursor: pointer;
        overflow: hidden;
        box-sizing: border-box;
        /* Smooth transitions for visual feedback */
        transition: transform 0.1s ease, filter 0.1s ease;
        /* Prevent touch delays and unwanted gestures */
        touch-action: manipulation;
        -webkit-tap-highlight-color: transparent;
    }

    /* Canvas sizing within keys */
    .key canvas {
        display: block;
        width: 100%;
        height: 100%;
        object-fit: contain;
        border-radius: inherit;
    }

    /* Key entrance animation */
    @keyframes keyPopIn {
        0% {
            opacity: 0;
            transform: scale(0.3);
        }
        70% {
            transform: scale(1.05);
        }
        100% {
            opacity: 1;
            transform: scale(1);
        }
    }

    .key.animate-in {
        animation: keyPopIn 0.3s ease-out forwards;
    }

    .key.hidden-init {
        opacity: 0;
        transform: scale(0.3);
        display: flex !important; /* Ensure keys take up space even when hidden */
    }

    .key:hover {
        background-color: #555;
    }

    /* Visual touch/press feedback */
    .key.pressed {
        transform: scale(0.92);
        filter: brightness(0.8);
    }

    .key:active {
        transform: scale(0.92);
        filter: brightness(0.8);
    }

    .key.encoder {
        outline: 2px dashed #ffa500;
        border-radius: 50%;
        cursor: grab;
        position: relative;
        transition:
            transform 0.1s ease,
            box-shadow 0.1s ease;
        box-shadow: inset 0 0 5px rgba(255, 165, 0, 0.5);
        background-color: #222;
    }

    .key.encoder.rotateLeft {
        transform: rotate(-15deg);
    }

    .key.encoder.rotateRight {
        transform: rotate(15deg);
    }

    .encoder {
        cursor: grab;
    }

    .key.encoder:active {
        cursor: grabbing;
    }

    /*
    .encoder::after {
        content: '';
        position: absolute;
        top: 4px;
        left: 4px;
        right: 4px;
        bottom: 4px;
        border: 2px dashed #ffa500;
        border-radius: 8px;
        pointer-events: none;
    }*/

    .window-container {
        position: relative;
        width: 100%;
        height: 100%;
    }

    .close-button {
        app-region: no-drag;
        position: absolute;
        top: 6px;
        right: 6px;
        padding: 4px;
        background: rgba(0, 0, 0, 0.5);
        border: none;
        color: white;
        cursor: pointer;
        z-index: 100;
        border-radius: 9999px;
        aspect-ratio: 1 / 1;
        opacity: 0; /* Hide by default */
        transition: opacity 0.2s ease;
    }

    /*#closeButton {
        opacity: 0;
        pointer-events: none;
        transition: opacity 0.3s ease;
    }*/

    .window-container:hover .close-button {
        opacity: 1; /* Show on hover */
    }

    .keypad:hover .close-button {
        opacity: 1;
    }

    .close-button:hover {
        background-color: rgb(21, 21, 21);
        color: #fff;
    }

    /* Disable text selection across the entire window */
    body,
    .key,
    .close-button {
        user-select: none; /* Prevent text selection */
        -webkit-user-select: none;
        -moz-user-select: none;
        -ms-user-select: none;
    }

    /* Disable outline on focus to prevent visual feedback when buttons are clicked */
    .key,
    .close-button {
        outline: none;
    }

    .device {
        border: 1px solid #ccc;
        border-radius: 6px;
        padding: 12px;
        margin: 10px 0;
        max-width: 400px;
        font-family: sans-serif;
    }

    .device strong {
        display: block;
        font-size: 14px;
        margin-bottom: 8px;
        font-weight: bold;
    }

    .device label {
        display: block;
        margin: 8px 0;
        font-size: 14px;
    }

    .device label input[type='number'],
    .device label input[type='text'] {
        margin-left: 8px;
        width: 60px;
        padding: 2px 4px;
        font-size: 14px;
    }

    .device-field {
        display: flex;
        flex-direction: column;
        margin: 6px 0;
    }

    .device-actions {
        margin-top: 10px;
        display: flex;
        gap: 10px;
    }

    .device-actions button {
        padding: 4px 10px;
        font-size: 14px;
        border-radius: 4px;
        border: none;
        cursor: pointer;
    }

    .device-actions button:hover {
        opacity: 0.9;
    }

    .device-actions button:active {
        transform: scale(0.98);
    }

    .device-actions button:nth-child(1) {
        background-color: #4caf50;
        color: white;
    }

    .device-actions button:nth-child(2) {
        background-color: #f44336;
        color: white;
    }

    input[type='color'] {
        -webkit-appearance: none;
        appearance: none;
        cursor: pointer;
    }

    .device input[type='color'] {
        cursor: pointer;
        width: 40px;
        height: 24px;
        padding: 0;
        border: none;
        background: none;
        z-index: 10;
    }

    .lock-indicator {
        app-region: no-drag;
        position: absolute;
        top: 5px;
        left: 5px;
        background: rgba(0, 0, 0, 0.5);
        border-radius: 4px;
        color: white;
        font-size: 12px;
        padding: 2px 6px;
        z-index: 100;
        display: none;
        cursor: default;
        transition: opacity 0.2s ease;
    }

    .keypad.disabled .lock-indicator {
        display: block;
    }

    .keypad.identify-highlight {
        outline: 3px solid yellow;
        box-shadow: 0 0 30px 10px rgba(255, 255, 0, 0.8);
        transition:
            outline 0.3s ease,
            box-shadow 0.3s ease;
    }

    .context-menu {
        background: #f0f0f0;
        color: #000;
        font-family: sans-serif;
        font-size: 13px;
        border: 1px solid #ccc;
        border-radius: 4px;
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
        z-index: 9999;
        pointer-events: auto;
        user-select: none;
        min-width: 140px; /* Optional: consistent width */
        transition: opacity 0.1s ease;
    }

    .context-menu .menu-item {
        padding: 6px 12px;
        cursor: pointer;
        white-space: nowrap;
    }

    .context-menu .menu-item:hover {
        background: #007aff;
        color: white;
    }

    .context-menu.hidden {
        opacity: 0;
        pointer-events: none;
    }

    #loadingMessage {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        text-align: center;
        opacity: 0.8;
        z-index: 1000;
    }

    #loadingMessage img {
        width: 60px;
        height: auto;
        animation: pulse 1.5s infinite ease-in-out;
    }

    @keyframes pulse {
        0%,
        100% {
            transform: scale(1);
        }
        50% {
            transform: scale(1.1);
        }
    }

    @keyframes fadeInOut {
        0%,
        100% {
            opacity: 0.6;
        }
        50% {
            opacity: 1;
        }
    }

    .keypad {
        transition: opacity 0.3s ease;
    }

    #logoOverlay,
    #keypad {
        transition:
            opacity 0.3s ease,
            transform 0.3s ease;
    }

    #logoOverlay {
        opacity: 0;
        transform: scale(0.95);
    }

    #logoOverlay.show {
        opacity: 1;
        transform: scale(1);
    }

    #keypad {
        opacity: 1;
        pointer-events: auto;
    }

    /* Reduced motion support for accessibility */
    @media (prefers-reduced-motion: reduce) {
        /* Disable all animations */
        .key.animate-in {
            animation: none;
        }

        .key.hidden-init {
            opacity: 1;
            transform: none;
        }

        #loadingMessage img {
            animation: none;
        }

        /* Remove transitions */
        .key,
        .key.encoder,
        .keypad,
        #logoOverlay,
        #keypad,
        .close-button,
        .lock-indicator,
        .context-menu {
            transition: none !important;
        }

        /* Keep encoder rotation visual but instant */
        .key.encoder.rotateLeft,
        .key.encoder.rotateRight {
            transition: none;
        }
    }

    /* Floating Action Button for mobile */
    .fab {
        position: fixed;
        bottom: 20px;
        right: 20px;
        width: 56px;
        height: 56px;
        border-radius: 50%;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border: none;
        color: white;
        font-size: 24px;
        cursor: pointer;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        z-index: 1000;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: transform 0.2s ease, opacity 0.3s ease, box-shadow 0.2s ease;
        touch-action: manipulation;
        -webkit-tap-highlight-color: transparent;
    }

    .fab:hover {
        transform: scale(1.1);
        box-shadow: 0 6px 20px rgba(0, 0, 0, 0.4);
    }

    .fab:active {
        transform: scale(0.95);
    }

    .fab.hidden {
        opacity: 0;
        pointer-events: none;
        transform: scale(0.5);
    }

    /* FAB Menu */
    .fab-menu {
        position: fixed;
        bottom: 90px;
        right: 20px;
        background: rgba(30, 30, 30, 0.95);
        border-radius: 12px;
        padding: 8px 0;
        min-width: 180px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
        z-index: 999;
        opacity: 0;
        transform: translateY(10px) scale(0.95);
        pointer-events: none;
        transition: opacity 0.2s ease, transform 0.2s ease;
    }

    .fab-menu.visible {
        opacity: 1;
        transform: translateY(0) scale(1);
        pointer-events: auto;
    }

    .fab-menu-item {
        padding: 12px 16px;
        color: white;
        font-size: 14px;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 10px;
        transition: background 0.15s ease;
    }

    .fab-menu-item:hover {
        background: rgba(255, 255, 255, 0.1);
    }

    .fab-menu-item:active {
        background: rgba(255, 255, 255, 0.2);
    }

    @media (prefers-reduced-motion: reduce) {
        .fab,
        .fab-menu {
            transition: none !important;
        }
    }

    /* Config mode styles */
    .fab.config-mode {
        background: linear-gradient(135deg, #f5af19 0%, #f12711 100%);
        animation: config-pulse 1.5s ease-in-out infinite;
    }

    @keyframes config-pulse {
        0%, 100% { box-shadow: 0 4px 12px rgba(241, 39, 17, 0.4); }
        50% { box-shadow: 0 4px 20px rgba(241, 39, 17, 0.8); }
    }

    .fab-menu-item.active {
        background: rgba(102, 126, 234, 0.3);
        font-weight: bold;
    }

    .key.config-highlight {
        outline: 3px dashed rgba(245, 175, 25, 0.8) !important;
    }

    /* Config mode banner */
    .config-mode-banner {
        position: fixed;
        top: 10px;
        left: 50%;
        transform: translateX(-50%);
        background: linear-gradient(135deg, #f5af19 0%, #f12711 100%);
        color: white;
        padding: 8px 16px;
        border-radius: 20px;
        font-size: 12px;
        font-weight: bold;
        z-index: 1001;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
        opacity: 0;
        pointer-events: none;
        transition: opacity 0.3s ease;
    }

    .config-mode-banner.visible {
        opacity: 1;
    }
`

const InjectStyles = () => (
    <style>{styles}</style>
)

// Calculate the window size based on the number of columns, rows, and bitmap size
export function calculateViewPortSize(
    columnCount: number,
    rowCount: number,
    bitmapSize: number,
    padding: number = 20,
    gap: number = 10
) {
    const KEY_WIDTH = bitmapSize
    const KEY_HEIGHT = bitmapSize
    const PADDING = padding
    const GAP = gap
    const rows = rowCount
    const width = columnCount * KEY_WIDTH + (columnCount - 1) * GAP + PADDING * 2
    const height = rows * KEY_HEIGHT + (rows - 1) * GAP + PADDING * 2
    return { width, height }
}

// interface KeyData {
//     text?: string
//     textColor?: string
//     color?: string
//     fontSize?: number
//     image?: Uint8Array | ArrayBuffer
//     isEncoder?: boolean
//     stepSize?: number
// }
//
// interface KeyProps {
//     index: number
//     deviceId: string
//     data: KeyData
//     hideIfEmpty?: boolean
//     onPress: (index: number, action: string) => void
//     onContextMenu: (e: React.MouseEvent, index: number) => void
// }
//
// const Key = React.memo(({ index, deviceId, data, hideIfEmpty, onPress, onContextMenu }: KeyProps) => {
//     const canvasRef = React.useRef<HTMLCanvasElement>(null)
//     const [isPressed, setIsPressed] = React.useState(false);
//
//     function _onMouseDown(e: React.MouseEvent) {
//         if (e.button === 2) return // Ignore right click (handled by context menu)
//
//         if (!data.isEncoder) {
//             setIsPressed(true)
//         } else {
//             e.preventDefault();
//             // TODO: Implement encoder functionality
//         }
//
//         onPress(index, 'down')
//     }
//
//     function _onMouseUp(e: React.MouseEvent) {
//         if (e.button === 2) return // Ignore right click (handled by context menu)
//
//         if (!data.isEncoder) {
//             setIsPressed(false)
//         }
//
//         onPress(index, 'up')
//     }
//
//     // Bitmap Rendering Effect
//     React.useEffect(() => {
//         if (!data?.image || !canvasRef.current) return
//
//         function renderBitmap(image: Uint8Array | ArrayBuffer) {
//             console.log('Rendering bitmap for key', index);
//
//             try {
//                 const bytes = new Uint8Array(image)
//
//                 const size = Math.sqrt(bytes.length / 3)
//                 if (!Number.isInteger(size)) {
//                     console.warn('Bitmap data length does not result in a perfect square.')
//                     return
//                 }
//
//                 const canvas = canvasRef.current!
//                 canvas.width = size
//                 canvas.height = size
//
//                 const ctx = canvas.getContext('2d')
//                 if (!ctx) {
//                     console.error('Failed to get 2D context')
//                     return
//                 }
//                 const imageData = ctx.createImageData(size, size)
//
//                 // RGB to RGBA
//                 for (let i = 0, j = 0; i < bytes.length; i += 3, j += 4) {
//                     imageData.data[j] = bytes[i] // Red
//                     imageData.data[j + 1] = bytes[i + 1] // Green
//                     imageData.data[j + 2] = bytes[i + 2] // Blue
//                     imageData.data[j + 3] = 255 // Alpha
//                 }
//
//                 ctx.putImageData(imageData, 0, 0)
//             } catch (error) {
//                 console.error('Failed to render bitmap:', error)
//             }
//         }
//
//         requestAnimationFrame(() => renderBitmap(data.image!));
//     }, [data?.image]);
//
//     let decodedText = ''
//     if (data?.text) {
//         try {
//             decodedText = atob(data.text)
//         } catch {
//             decodedText = data.text
//         }
//     }
//
//     return (
//         <div
//             key={index}
//             className={cn("key", {
//                 "encoder": data.isEncoder,
//                 "rotateLeft": false,
//                 "rotateRight": false
//             })}
//             data-index={index}
//             onContextMenu={(e) => onContextMenu(e, index)}
//             onMouseDown={_onMouseDown}
//             onMouseUp={_onMouseUp}
//             style={{
//                 backgroundColor: data.color || '',
//                 display: hideIfEmpty && !data.image && !data.text && !data.color ? 'none' : 'flex'
//             }}
//         >
//             {/* If we have a bitmap, show canvas */}
//             {data.image && (
//                 <canvas ref={canvasRef} />
//             )}
//             {/* If we have text, show it */}
//             {/* {data.text && (
//                 <span>{decodedText}</span>
//             )} */}
//         </div>
//     )
// });

type _InitOptions = {
    DEVICE_ID: string
    $elements: {
        keypad: React.RefObject<HTMLElement | null>
        logoOverlay: React.RefObject<HTMLElement | null>
        closeButton: React.RefObject<HTMLElement | null>
        lockIndicator: React.RefObject<HTMLElement | null>
        deviceLabel: React.RefObject<HTMLElement | null>
        loadingMessage: React.RefObject<HTMLElement | null>
    }
    $state: {
        Columns: number
        Rows: number
        AutoHideOnLeave: boolean
        HideEmptyKeys: boolean
        OriginalBounds: {
            height: number
            width: number
        } | null
        AutoHideTimeout: ReturnType<typeof setTimeout> | null
    }
    $callbacks: {
        onDeviceConfigReceived: (config: any) => void
    }
    // $actions: {
    //
    // }
}

let _initDone = false;

/**
 * Initialization closure for the keypad window.
 * Handles parsing URL params, setting up global listeners, and managing the keypad lifecycle.
 */
function _init({ $state, $elements, /*$actions,*/ $callbacks, DEVICE_ID }: _InitOptions) {
    if (_initDone) return;
    _initDone = true;

    if (!DEVICE_ID) {
        console.error('No deviceId in query string')
        throw new Error('No deviceId')
    }

    const keyElements: HTMLElement[] = []
    const activeKeys = new Set<number>()

    const keyStates = new Map<
        string,
        Map<
            number,
            {
                keyIndex: string | null
                bitmap: string | null
                text: string | null
                color: string | null
                image: Uint8Array | ArrayBuffer | null
            }
        >
    >() // deviceId -> Map(keyIndex -> { bitmap, text, color, etc. })

    // Render cache for optimized bitmap rendering
    // Stores canvas context, pre-allocated ImageData, and last bitmap hash per key
    type KeyRenderCache = {
        canvas: HTMLCanvasElement
        ctx: CanvasRenderingContext2D
        imageData: ImageData | null
        lastBitmapHash: number // Simple hash for dirty checking
        lastSize: number
    }
    const keyRenderCache = new Map<number, KeyRenderCache>()

    // Track initial draw events for staggered animation
    let expectedKeyCount = 0
    let initialDrawsReceived = new Set<number>()
    let initialAnimationTriggered = false

    // --- Mobile UX Features ---

    // Screen Wake Lock - keeps screen on while keypad is active
    let wakeLock: WakeLockSentinel | null = null

    async function requestWakeLock() {
        if (!('wakeLock' in navigator)) {
            console.log('Wake Lock API not supported')
            return
        }

        try {
            wakeLock = await navigator.wakeLock.request('screen')
            console.log('Wake Lock acquired')

            wakeLock.addEventListener('release', () => {
                console.log('Wake Lock released')
            })
        } catch (err) {
            console.warn('Failed to acquire Wake Lock:', err)
        }
    }

    function releaseWakeLock() {
        if (wakeLock) {
            wakeLock.release()
            wakeLock = null
        }
    }

    // Re-acquire wake lock when page becomes visible again
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible' && !wakeLock) {
            requestWakeLock()
        }
    })

    // Fullscreen Mode toggle
    function toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(err => {
                console.warn('Failed to enter fullscreen:', err)
            })
        } else {
            document.exitFullscreen()
        }
    }

    // Orientation Lock - lock to current or specific orientation
    async function lockOrientation(orientation: 'landscape' | 'portrait' | 'any' = 'landscape') {
        const screenOrientation = screen.orientation as any
        if (!screenOrientation?.lock) {
            console.log('Screen Orientation Lock not supported')
            return false
        }

        try {
            await screenOrientation.lock(orientation)
            console.log(`Orientation locked to ${orientation}`)
            return true
        } catch (err) {
            console.warn('Failed to lock orientation:', err)
            return false
        }
    }

    function unlockOrientation() {
        const screenOrientation = screen.orientation as any
        if (screenOrientation?.unlock) {
            screenOrientation.unlock()
            console.log('Orientation unlocked')
        }
    }

    // Expose controls globally for UI buttons to use (or could be via context menu)
    ; (window as any).__keypadControls = {
        toggleFullscreen,
        lockOrientation,
        unlockOrientation,
        requestWakeLock,
        releaseWakeLock
    }

    // Auto-acquire wake lock on init (for web/mobile only)
    if (!api.is('electron')) {
        requestWakeLock()

        // --- FAB (Floating Action Button) for mobile menu ---
        let fabVisible = true
        let fabMenuOpen = false
        let fabLongPressTimer: ReturnType<typeof setTimeout> | null = null
        let configModeEnabled = false

        // Create FAB element
        const fab = document.createElement('button')
        fab.className = 'fab'
        fab.innerHTML = '⚙️'
        fab.setAttribute('aria-label', 'Settings menu')
        document.body.appendChild(fab)

        // Create config mode banner
        const configBanner = document.createElement('div')
        configBanner.className = 'config-mode-banner'
        configBanner.textContent = '⚙️ CONFIG MODE - Tap keys to toggle encoder/button'
        document.body.appendChild(configBanner)

        // Create FAB menu
        const fabMenu = document.createElement('div')
        fabMenu.className = 'fab-menu'
        fabMenu.innerHTML = `
            <div class="fab-menu-item" data-action="config-mode">🔧 Toggle Config Mode</div>
            <div class="fab-menu-item" data-action="fullscreen">⛶ ${document.fullscreenElement ? 'Exit' : 'Enter'} Fullscreen</div>
            <div class="fab-menu-item" data-action="lock-landscape">🔒 Lock Landscape</div>
            <div class="fab-menu-item" data-action="lock-portrait">🔒 Lock Portrait</div>
            <div class="fab-menu-item" data-action="unlock-orientation">🔓 Unlock Orientation</div>
        `
        document.body.appendChild(fabMenu)

        // Toggle config mode function
        function toggleConfigMode() {
            configModeEnabled = !configModeEnabled
            fab.classList.toggle('config-mode', configModeEnabled)
            configBanner.classList.toggle('visible', configModeEnabled)

            // Update menu item to show active state
            const configMenuItem = fabMenu.querySelector('[data-action="config-mode"]')
            if (configMenuItem) {
                configMenuItem.classList.toggle('active', configModeEnabled)
                configMenuItem.textContent = configModeEnabled ? '✓ Config Mode ON' : '🔧 Toggle Config Mode'
            }

            // Add visual indicator to keys
            keyElements.forEach(key => {
                key.classList.toggle('config-highlight', configModeEnabled)
            })

            triggerHapticFeedback(configModeEnabled ? 30 : 15)
        }

        // Expose config mode state for key handlers
        ; (window as any).__keypadConfigMode = {
            get enabled() { return configModeEnabled },
            toggle: toggleConfigMode
        }

        // Toggle FAB menu on tap (only if not dragged)
        let fabWasDragged = false
        fab.addEventListener('click', () => {
            if (fabWasDragged) {
                fabWasDragged = false
                return // Ignore click after drag
            }
            fabMenuOpen = !fabMenuOpen
            fabMenu.classList.toggle('visible', fabMenuOpen)
            fab.innerHTML = fabMenuOpen ? '✕' : '⚙️'
            updateFabMenuPosition()
        })

        // Update FAB menu position based on FAB position
        function updateFabMenuPosition() {
            const fabRect = fab.getBoundingClientRect()
            const menuRect = fabMenu.getBoundingClientRect()

            // Position menu above or below FAB depending on space
            if (fabRect.top > menuRect.height + 20) {
                fabMenu.style.bottom = 'auto'
                fabMenu.style.top = `${fabRect.top - menuRect.height - 10}px`
            } else {
                fabMenu.style.top = 'auto'
                fabMenu.style.bottom = `${window.innerHeight - fabRect.bottom - menuRect.height - 10}px`
            }

            // Position menu left or right of FAB depending on space
            if (fabRect.right > menuRect.width + 20) {
                fabMenu.style.right = `${window.innerWidth - fabRect.right}px`
                fabMenu.style.left = 'auto'
            } else {
                fabMenu.style.left = `${fabRect.left}px`
                fabMenu.style.right = 'auto'
            }
        }

        // Restore FAB position from localStorage
        const savedFabPos = localStorage.getItem('fabPosition')
        if (savedFabPos) {
            try {
                const { right, bottom } = JSON.parse(savedFabPos)
                fab.style.right = `${right}px`
                fab.style.bottom = `${bottom}px`
            } catch { /* ignore */ }
        }

        // FAB drag handling (combined with long-press detection)
        let fabDragStartX = 0
        let fabDragStartY = 0
        let fabStartRight = 0
        let fabStartBottom = 0
        let fabIsDragging = false

        fab.addEventListener('touchstart', (e: TouchEvent) => {
            const touch = e.touches[0]
            fabDragStartX = touch.clientX
            fabDragStartY = touch.clientY
            fabIsDragging = false
            fabWasDragged = false

            // Get current position
            const rect = fab.getBoundingClientRect()
            fabStartRight = window.innerWidth - rect.right
            fabStartBottom = window.innerHeight - rect.bottom

            // Start long-press timer
            fabLongPressTimer = setTimeout(() => {
                if (!fabIsDragging) {
                    fabVisible = false
                    fab.classList.add('hidden')
                    fabMenu.classList.remove('visible')
                    fabMenuOpen = false
                    triggerHapticFeedback(50)
                }
            }, 800)
        }, { passive: true })

        fab.addEventListener('touchmove', (e: TouchEvent) => {
            const touch = e.touches[0]
            const deltaX = touch.clientX - fabDragStartX
            const deltaY = touch.clientY - fabDragStartY

            // Start drag if moved more than 10px
            if (!fabIsDragging && (Math.abs(deltaX) > 10 || Math.abs(deltaY) > 10)) {
                fabIsDragging = true
                fabWasDragged = true

                // Cancel long-press
                if (fabLongPressTimer) {
                    clearTimeout(fabLongPressTimer)
                    fabLongPressTimer = null
                }

                // Close menu while dragging
                fabMenu.classList.remove('visible')
                fabMenuOpen = false
                fab.innerHTML = '⚙️'
            }

            if (fabIsDragging) {
                // Calculate new position (using right/bottom for edge anchoring)
                let newRight = fabStartRight - deltaX
                let newBottom = fabStartBottom - deltaY

                // Clamp to screen bounds
                const padding = 10
                newRight = Math.max(padding, Math.min(window.innerWidth - 56 - padding, newRight))
                newBottom = Math.max(padding, Math.min(window.innerHeight - 56 - padding, newBottom))

                fab.style.right = `${newRight}px`
                fab.style.bottom = `${newBottom}px`
            }
        }, { passive: true })

        fab.addEventListener('touchend', () => {
            if (fabLongPressTimer) {
                clearTimeout(fabLongPressTimer)
                fabLongPressTimer = null
            }

            if (fabIsDragging) {
                // Save position to localStorage
                const rect = fab.getBoundingClientRect()
                localStorage.setItem('fabPosition', JSON.stringify({
                    right: window.innerWidth - rect.right,
                    bottom: window.innerHeight - rect.bottom
                }))
            }

            fabIsDragging = false
        })

        fab.addEventListener('touchcancel', () => {
            if (fabLongPressTimer) {
                clearTimeout(fabLongPressTimer)
                fabLongPressTimer = null
            }
            fabIsDragging = false
        })

        // FAB menu item actions
        fabMenu.querySelectorAll('.fab-menu-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const action = (e.target as HTMLElement).getAttribute('data-action')

                if (action === 'config-mode') {
                    toggleConfigMode()
                    // Don't close menu for config mode toggle
                    return
                } else if (action === 'fullscreen') {
                    toggleFullscreen()
                } else if (action === 'lock-landscape') {
                    lockOrientation('landscape')
                } else if (action === 'lock-portrait') {
                    lockOrientation('portrait')
                } else if (action === 'unlock-orientation') {
                    unlockOrientation()
                }

                // Close menu after action
                fabMenuOpen = false
                fabMenu.classList.remove('visible')
                fab.innerHTML = configModeEnabled ? '🔧' : '⚙️'
            })
        })

        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (fabMenuOpen && !fab.contains(e.target as Node) && !fabMenu.contains(e.target as Node)) {
                fabMenuOpen = false
                fabMenu.classList.remove('visible')
                fab.innerHTML = '⚙️'
            }
        })

        // Two-finger tap to toggle FAB visibility
        let lastTwoFingerTapTime = 0
        document.addEventListener('touchstart', (e) => {
            if (e.touches.length === 2) {
                const now = Date.now()
                // Debounce to prevent rapid toggles
                if (now - lastTwoFingerTapTime > 500) {
                    lastTwoFingerTapTime = now
                    fabVisible = !fabVisible
                    fab.classList.toggle('hidden', !fabVisible)

                    if (!fabVisible) {
                        fabMenuOpen = false
                        fabMenu.classList.remove('visible')
                    }

                    triggerHapticFeedback(20)
                }
            }
        }, { passive: true })
    }

    // Request config from main process
    // using deviceInit instead of getDeviceConfig to trigger re-add the device to satellite
    api.deviceInit(DEVICE_ID).then((config) => {
        $callbacks.onDeviceConfigReceived(config)

        const { autoHide, hideEmptyKeys, backgroundColor, backgroundOpacity } = config

        $state.AutoHideOnLeave = autoHide || false
        $state.HideEmptyKeys = hideEmptyKeys || false

        const keypad = $elements.keypad.current!
        const logoOverlay = $elements.logoOverlay.current!
        const closeButton = $elements.closeButton.current!

        keypad.style.backgroundColor = hexToRgba(backgroundColor, backgroundOpacity ?? 0.5)

        /**
         * Hides the keypad when the mouse leaves the window (if auto-hide is enabled).
         * Fades out the keypad, shows the logo overlay, and shrinks the window.
         */
        function hideKeypad() {
            if (!$state.AutoHideOnLeave) return

            console.log('Hiding keypad for device:', DEVICE_ID)

            // Fade out keypad
            keypad.style.opacity = '0'
            keypad.style.pointerEvents = 'none'

            // Show and fade in logo
            logoOverlay.style.display = 'flex'
            setTimeout(() => {
                logoOverlay.style.opacity = '1'
                logoOverlay.style.transform = 'scale(1)'
                logoOverlay.style.backgroundColor = keypad.style.backgroundColor
            }, 10)

            // Save current size before shrinking
            api.getKeypadBounds(DEVICE_ID).then((bounds) => {
                $state.OriginalBounds = bounds
                const bitmapSize = bounds.bitmapSize || 72
                api.resizeKeypadWindow({
                    deviceId: DEVICE_ID,
                    width: bitmapSize + 50, // 50px padding
                    height: bitmapSize + 50, // 50px padding
                })
            })
        }

        /**
         * Shows the keypad when the mouse enters the window.
         * Fades in the keypad, hides the logo overlay, and restores the window size.
         */
        function showKeypad() {
            if (!$state.AutoHideOnLeave || !$state.OriginalBounds) return

            console.log('Showing keypad for device:', DEVICE_ID)

            // Hide logo smoothly
            logoOverlay.style.opacity = '0'
            logoOverlay.style.transform = 'scale(0.95)'

            setTimeout(() => {
                logoOverlay.style.display = 'none'
                keypad.style.opacity = '1'
                keypad.style.pointerEvents = 'auto'
            }, 300)

            // Restore original size
            api.resizeKeypadWindow({
                deviceId: DEVICE_ID,
                width: $state.OriginalBounds.width,
                height: $state.OriginalBounds.height,
            })
        }

        window.addEventListener('mouseleave', () => {
            closeButton.style.opacity = '0'
            closeButton.style.pointerEvents = 'none'

            console.log('Mouse left window, hiding keypad for device:', DEVICE_ID)
            if ($state.AutoHideOnLeave) {
                $state.AutoHideTimeout = setTimeout(hideKeypad, 500) // small delay
            }
        })

        window.addEventListener('mouseenter', () => {
            closeButton.style.opacity = '1'
            closeButton.style.pointerEvents = 'auto'

            console.log('Mouse entered window, showing keypad for device:', DEVICE_ID)
            if ($state.AutoHideTimeout) {
                clearTimeout($state.AutoHideTimeout)
                $state.AutoHideTimeout = null
            }
            if ($state.AutoHideOnLeave) {
                showKeypad()
            }
        })

        window.addEventListener('mousemove', (e) => {
            const threshold = 50 // pixels

            if (
                e.clientX < threshold ||
                e.clientY < threshold ||
                e.clientX > window.innerWidth - threshold ||
                e.clientY > window.innerHeight - threshold
            ) {
                showKeypad()
            }
        })

        const columnCount = config.columnCount || 0
        $state.Columns = columnCount
        const rowCount = config.rowCount || 0
        $state.Rows = rowCount

        if (columnCount <= 0 || rowCount <= 0) {
            console.warn(`No keys defined for ${DEVICE_ID}. Hiding UI.`)
            document.body.style.backgroundColor = 'transparent'
            keypad.style.display = 'none'
            closeButton.style.display = 'none'
            return
        }

        buildKeyGrid(columnCount, rowCount)
    })

    // Handle mobile background/foreground state
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
            console.log('Page became visible, refreshing connection...')

            // Show loading message
            const loadingMessage = $elements.loadingMessage.current!
            loadingMessage.style.display = 'block'

            // Re-register device to ensure we get fresh state/connection
            api.deviceInit(DEVICE_ID).then((config) => {
                console.log('Device re-initialized after background state:', config)
                // If grid dimensions changed, rebuild. Otherwise, we assume the server
                // will send 'draw' events for the keys as part of the re-init process.
                if (config.columnCount !== $state.Columns || config.rowCount !== $state.Rows) {
                    $state.Columns = config.columnCount || 0
                    $state.Rows = config.rowCount || 0
                    buildKeyGrid($state.Columns, $state.Rows)
                }

                // Hide loading message once init is done (or short delay to ensure keys are drawn)
                // We rely on subsequent 'draw' events to populate keys, so we might want to keep
                // it briefly or rely on processKey to hide it if we wanted perfect sync,
                // but deviceInit promise usually means config is ready.
                // Let's hide it after a short safety delay or let processKey handle it if it was global.
                // For now, hiding it here is better than stuck.
                setTimeout(() => {
                    loadingMessage.style.display = 'none'
                }, 500)
            }).catch(() => {
                // Hide on error too
                loadingMessage.style.display = 'none'
            })
        }
    })

    /**
     * Builds the grid of key elements based on the device configuration.
     * @param {number} columnCount - Number of columns in the grid.
     * @param {number} rowCount - Number of rows in the grid.
     */
    function buildKeyGrid(columnCount: number, rowCount: number) {
        const keypad = $elements.keypad.current!

        $state.Columns = columnCount
        $state.Rows = rowCount

        keypad.style.gridTemplateColumns = `repeat(${columnCount}, 1fr)`

        // Remove existing keys
        keypad.querySelectorAll('.key').forEach((key) => key.remove())
        keyElements.length = 0
        keyRenderCache.clear()

        const keysTotal = columnCount * rowCount

        // Reset animation tracking for initial draws
        expectedKeyCount = keysTotal
        initialDrawsReceived.clear()
        initialAnimationTriggered = false

        for (let i = 0; i < keysTotal; i++) {
            const keyElement = document.createElement('div')!
            keyElement.className = 'key hidden-init' // Start hidden, animate after all draws
            keyElement.dataset.index = String(i)
            keypad.appendChild(keyElement)
            keyElements.push(keyElement)

            refreshKey(DEVICE_ID, i)
        }
    }

    /**
     * Triggers staggered pop-in animation for all keys.
     */
    function triggerKeyAnimation() {
        if (initialAnimationTriggered) return
        initialAnimationTriggered = true

        const staggerDelay = 30 // ms between each key animation
        const columnCount = $state.Columns

        keyElements.forEach((keyElement, i) => {
            // Calculate diagonal wave delay
            const row = Math.floor(i / columnCount)
            const col = i % columnCount
            const delay = (row + col) * staggerDelay

            setTimeout(() => {
                keyElement.classList.remove('hidden-init')
                keyElement.classList.add('animate-in')

                // Clean up animation class after it completes
                keyElement.addEventListener('animationend', () => {
                    keyElement.classList.remove('animate-in')
                }, { once: true })
            }, delay)
        })
    }

    // function checkKeyStates() {
    //     if (!keyStates || keyStates.size === 0) {
    //         console.log('No key states found for device:', deviceId)
    //         // Show loading message
    //         //document.getElementById('loadingMessage').style.display = 'block'
    //         //find all elements with class 'key' and hide them
    //         document.querySelectorAll('.key').forEach((key) => {
    //             //key.style.visibility = 'hidden'
    //         })
    //     } else {
    //         document.getElementById('loadingMessage').style.display = 'none'
    //         document.getElementById('keypad').style.display = 'grid'
    //         //find all elements with class 'key' and show them
    //         document.querySelectorAll('.key').forEach((key) => {
    //             key.style.visibility = 'visible'
    //         })
    //     }
    // }
    //
    // let currentMaxColumns = 0
    // let currentMaxRows = 0
    //
    // function updateGridLayout() {
    //     const keypad = document.getElementById('keypad')
    //     if (!_opt.state.HideEmptyKeys) {
    //         keypad.style.gridTemplateColumns = `repeat(${$state.Columns}, 1fr)`
    //         currentMaxColumns = $state.Columns
    //         currentMaxRows = $state.Rows
    //         return
    //     }
    //
    //     let maxCols = 0
    //     let maxRow = 0
    //     for (let row = 0; row < $state.Rows; row++) {
    //         let rowHasContent = false
    //         let rowCols = 0
    //         for (let col = 0; col < $state.Columns; col++) {
    //             const index = row * $state.Columns + col
    //             const keyEl = keyElements[index]
    //             if (keyEl && keyEl.style.display !== 'none') {
    //                 rowHasContent = true
    //                 rowCols++
    //             }
    //         }
    //         if (rowHasContent) {
    //             maxRow++
    //             if (rowCols > maxCols) maxCols = rowCols
    //         }
    //     }
    //
    //     currentMaxColumns = maxCols || 1
    //     currentMaxRows = maxRow || 1
    //
    //     keypad.style.gridTemplateColumns = `repeat(${currentMaxColumns}, 1fr)`
    // }

    let activeContextMenu: HTMLElement | null = null

    /**
     * Shows a context menu for a specific key.
     * Allows setting encoder/button mode or assigning hotkeys.
     * @param {MouseEvent} e - The mouse event that triggered the menu.
     * @param {number} keyIndex - The index of the key.
     */
    function showContextMenu(e: MouseEvent, keyIndex: number) {
        e.preventDefault()

        // Remove existing menu if one is already open
        if (activeContextMenu) {
            activeContextMenu.remove()
            activeContextMenu = null
        }

        // Create the menu
        const menu = document.createElement('div')
        menu.classList.add('context-menu')
        menu.style.position = 'fixed'

        // Build menu items - add mobile UX options only for web
        const isWeb = !api.is('electron')
        const mobileUxItems = isWeb ? `
        <div class="menu-item" data-action="fullscreen">${document.fullscreenElement ? '⛶ Exit Fullscreen' : '⛶ Enter Fullscreen'}</div>
        <div class="menu-item" data-action="lock-landscape">🔒 Lock Landscape</div>
        <div class="menu-item" data-action="lock-portrait">🔒 Lock Portrait</div>
        <div class="menu-item" data-action="unlock-orientation">🔓 Unlock Orientation</div>
        ` : ''

        menu.innerHTML = `
        <div class="menu-item" data-action="encoder">Set to Encoder Mode</div>
        <div class="menu-item" data-action="button">Set to Button Mode</div>
        <div class="menu-item" data-action="hotkey">Assign Hotkey...</div>
        ${mobileUxItems}
        `

        document.body.appendChild(menu)
        activeContextMenu = menu

        // Calculate position to keep it on-screen
        const padding = 10 // px from edges
        const menuRect = menu.getBoundingClientRect() // Get default size

        let top = e.clientY
        let left = e.clientX

        // Adjust vertical position if too low
        if (top + menuRect.height > window.innerHeight - padding) {
            top = window.innerHeight - menuRect.height - padding
        }
        if (top < padding) {
            top = padding
        }

        // Adjust horizontal position if too far right
        if (left + menuRect.width > window.innerWidth - padding) {
            left = window.innerWidth - menuRect.width - padding
        }
        if (left < padding) {
            left = padding
        }

        menu.style.top = `${top}px`
        menu.style.left = `${left}px`

        // Handle menu item clicks
        const handleAction = (action) => {
            if (!action) return

            if (action === 'encoder') {
                api.updateKeyConfig({
                    deviceId: DEVICE_ID,
                    keyIndex,
                    config: { isEncoder: true },
                }).then(() => refreshKey(DEVICE_ID, keyIndex))
            } else if (action === 'button') {
                api.updateKeyConfig({
                    deviceId: DEVICE_ID,
                    keyIndex,
                    config: { isEncoder: false },
                }).then(() => refreshKey(DEVICE_ID, keyIndex))
            } else if (action === 'hotkey') {
                let keyConfig = keyStates.get(DEVICE_ID)?.get(keyIndex)
                api.setHotkeyContext({
                    deviceId: DEVICE_ID,
                    keyIndex,
                    image: keyConfig?.image || null,
                })
                api.openHotkeyPrompt()
            } else if (action === 'fullscreen') {
                toggleFullscreen()
            } else if (action === 'lock-landscape') {
                lockOrientation('landscape')
            } else if (action === 'lock-portrait') {
                lockOrientation('portrait')
            } else if (action === 'unlock-orientation') {
                unlockOrientation()
            }

            closeContextMenu()
        }

        menu.addEventListener('mousedown', (evt) => {
            evt.stopPropagation() // Prevent click-through to document
        })

        menu.querySelectorAll('.menu-item').forEach((item) => {
            item.addEventListener('click', (evt) => {
                evt.stopPropagation()
                const el = evt.target as HTMLElement
                const action = el.getAttribute('data-action')
                handleAction(action)
            })
        })

        // Delay closing the menu to avoid accidental loss
        setTimeout(() => {
            document.addEventListener(
                'mousedown',
                function docClickOutside(evt) {
                    if (!menu.contains(evt.target as HTMLElement)) {
                        closeContextMenu()
                        document.removeEventListener('mousedown', docClickOutside)
                    }
                },
                { once: true }
            )
        }, 10)
    }

    /**
     * Refreshes the configuration and state of a single key.
     * Re-binds event listeners and updates visual state.
     * @param {string} deviceId - The device ID.
     * @param {number} keyIndex - The index of the key to refresh.
     */
    function refreshKey(deviceId: string, keyIndex) {
        api.getKeyConfig({ deviceId, keyIndex }).then((keyConfig) => {
            const keyElement = keyElements[keyIndex]
            if (!keyElement) return

            // Update encoder class
            if (keyConfig.isEncoder) {
                keyElement.classList.add('encoder')
            } else {
                keyElement.classList.remove('encoder')
            }

            // Rebind mousedown event
            keyElement.replaceWith(keyElement.cloneNode(true))
            const newKeyElement = document.querySelector(`[data-index="${keyIndex}"]`)!
            keyElements[keyIndex] = newKeyElement as HTMLElement
            bindKeyEvents(newKeyElement, keyIndex, keyConfig)

            // CRITICAL: Clear render cache for this key since we cloned the element
            // The old cache points to the old detached canvas - must create fresh one
            keyRenderCache.delete(keyIndex)

            // Re-apply config mode highlight if enabled
            const configMode = (window as any).__keypadConfigMode
            if (configMode?.enabled) {
                newKeyElement.classList.add('config-highlight')
            }

            const state = keyStates.get(deviceId)?.get(keyIndex)
            if (state) {
                processKey(state)
            }
        })
    }

    /**
     * Triggers haptic feedback on supported devices.
     * Uses the Vibration API if available.
     * @param {number} duration - Duration of vibration in milliseconds.
     */
    function triggerHapticFeedback(duration: number = 10) {
        if ('vibrate' in navigator) {
            navigator.vibrate(duration)
        }
    }

    /**
     * Triggers a visual "tick" feedback for encoder steps.
     * Animates box-shadow and scale to provide tactile, obvious feedback.
     * Use composite: 'add' to ensure we don't overwrite the rotation transform.
     * @param {HTMLElement} key - The key element.
     */
    function triggerEncoderTick(key: HTMLElement) {
        // Respect user's reduced motion preference
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            return // Skip animation entirely
        }

        // Cancel existing tick animations to prevent "composite: add" stacking issues
        // which could cause extreme scaling/glitches during rapid rotation
        key.getAnimations().forEach(anim => {
            if (anim.id === 'encoder-tick') anim.cancel();
        });

        key.animate([
            {
                transform: 'scale(1)',
                boxShadow: 'inset 0 0 5px rgba(255, 165, 0, 0.5)',
                outlineColor: '#ffa500',
                outlineWidth: '2px'
            },
            {
                transform: 'scale(0.9)', // Tactile "shrink" on tick
                boxShadow: 'inset 0 0 20px rgba(255, 255, 255, 0.9), 0 0 15px rgba(255, 165, 0, 0.6)', // Bright flash
                outlineColor: '#ffffff',
                outlineWidth: '4px', // Pulse width
                offset: 0.4
            },
            {
                transform: 'scale(1)',
                boxShadow: 'inset 0 0 5px rgba(255, 165, 0, 0.5)',
                outlineColor: '#ffa500',
                outlineWidth: '2px'
            }
        ], {
            id: 'encoder-tick',
            duration: 200,
            easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)', // Snappy bounce-back
            composite: 'add' // IMPORTANT: Mix with existing rotation transform
        });
    }

    /**
     * Binds mouse and touch events (mousedown, mouseup, touchstart, touchend, contextmenu) to a key element.
     * Handles encoder rotation simulation and standard button presses.
     * @param {HTMLElement} key - The key DOM element.
     * @param {number} i - The key index.
     * @param {object} keyConfig - The configuration object for the key.
     */
    function bindKeyEvents(key, i, keyConfig) {
        const isEncoder = keyConfig.isEncoder
        const stepSize = keyConfig.stepSize || 10

        // --- Mouse Events ---
        key.addEventListener('mousedown', (e) => {
            // console.log('in mouse down for key:', i)
            if (e.button === 2) {
                return
            }

            // Config mode: toggle encoder/button instead of normal action
            const configMode = (window as any).__keypadConfigMode
            if (configMode?.enabled) {
                e.preventDefault()
                e.stopPropagation()

                // Toggle encoder state
                const newIsEncoder = !isEncoder
                api.updateKeyConfig({
                    deviceId: DEVICE_ID,
                    keyIndex: i,
                    config: { isEncoder: newIsEncoder },
                }).then(() => refreshKey(DEVICE_ID, i))

                triggerHapticFeedback(25)
                return
            }

            if (isEncoder) {
                e.preventDefault()

                let accumulatedDeltaX = 0
                let lastX = e.clientX
                let didRotate = false // Track if any rotation occurred
                const startX = e.clientX

                const onMove = (moveEvent) => {
                    const deltaX = moveEvent.clientX - lastX
                    accumulatedDeltaX += deltaX

                    let direction: ('rotateRight' | 'rotateLeft') | null = null
                    while (Math.abs(accumulatedDeltaX) >= stepSize) {
                        didRotate = true
                        direction = accumulatedDeltaX > 0 ? 'rotateRight' : 'rotateLeft'
                        sendKeyPress(i, direction)
                        triggerEncoderTick(key) // Visual feedback for step

                        if (accumulatedDeltaX > 0) {
                            accumulatedDeltaX -= stepSize
                        } else {
                            accumulatedDeltaX += stepSize
                        }
                    }

                    if (direction) {
                        key.classList.add(direction)
                        key.classList.remove(
                            direction === 'rotateRight' ? 'rotateLeft' : 'rotateRight'
                        )
                    }

                    lastX = moveEvent.clientX
                }

                const onUp = (upEvent) => {
                    window.removeEventListener('mousemove', onMove)
                    window.removeEventListener('mouseup', onUp)
                    key.classList.remove('rotateLeft', 'rotateRight')

                    // If no rotation occurred, treat as a click
                    const totalMovement = Math.abs(upEvent.clientX - startX)
                    if (!didRotate && totalMovement < stepSize) {
                        sendKeyPress(i, 'down')
                        sendKeyPress(i, 'up')
                    }
                }

                window.addEventListener('mousemove', onMove)
                window.addEventListener('mouseup', onUp)
            } else {
                activeKeys.add(i)
                sendKeyPress(i, 'down')
            }
        })

        key.addEventListener('mouseup', () => {
            if (!isEncoder) {
                activeKeys.delete(i)
                sendKeyPress(i, 'up')
            }
        })

        // --- Touch Events ---
        key.addEventListener('touchstart', (e: TouchEvent) => {
            e.preventDefault() // Prevent mouse event emulation
            triggerHapticFeedback()
            key.classList.add('pressed') // Visual feedback

            // Config mode: toggle encoder/button instead of normal action
            const configMode = (window as any).__keypadConfigMode
            if (configMode?.enabled) {
                // Toggle encoder state
                const newIsEncoder = !isEncoder
                api.updateKeyConfig({
                    deviceId: DEVICE_ID,
                    keyIndex: i,
                    config: { isEncoder: newIsEncoder },
                }).then(() => refreshKey(DEVICE_ID, i))

                triggerHapticFeedback(25)
                key.classList.remove('pressed')
                return
            }

            if (isEncoder) {
                const touch = e.touches[0]
                let accumulatedDeltaX = 0
                let lastX = touch.clientX
                let didRotate = false // Track if any rotation occurred
                const startX = touch.clientX

                const onTouchMove = (moveEvent: TouchEvent) => {
                    const moveTouch = moveEvent.touches[0]
                    if (!moveTouch) return

                    const deltaX = moveTouch.clientX - lastX
                    accumulatedDeltaX += deltaX

                    let direction: ('rotateRight' | 'rotateLeft') | null = null
                    while (Math.abs(accumulatedDeltaX) >= stepSize) {
                        didRotate = true
                        direction = accumulatedDeltaX > 0 ? 'rotateRight' : 'rotateLeft'
                        sendKeyPress(i, direction)
                        triggerHapticFeedback(5) // Lighter feedback for encoder steps
                        triggerEncoderTick(key) // Visual feedback for step

                        if (accumulatedDeltaX > 0) {
                            accumulatedDeltaX -= stepSize
                        } else {
                            accumulatedDeltaX += stepSize
                        }
                    }

                    if (direction) {
                        key.classList.add(direction)
                        key.classList.remove(
                            direction === 'rotateRight' ? 'rotateLeft' : 'rotateRight'
                        )
                    }

                    lastX = moveTouch.clientX
                }

                const onTouchEnd = (endEvent: TouchEvent) => {
                    window.removeEventListener('touchmove', onTouchMove)
                    window.removeEventListener('touchend', onTouchEnd)
                    window.removeEventListener('touchcancel', onTouchEnd)
                    key.classList.remove('rotateLeft', 'rotateRight', 'pressed')

                    // If no rotation occurred, treat as a tap/click
                    const endTouch = endEvent.changedTouches[0]
                    const totalMovement = endTouch ? Math.abs(endTouch.clientX - startX) : 0
                    if (!didRotate && totalMovement < stepSize) {
                        sendKeyPress(i, 'down')
                        sendKeyPress(i, 'up')
                    }
                }

                window.addEventListener('touchmove', onTouchMove, { passive: false })
                window.addEventListener('touchend', onTouchEnd)
                window.addEventListener('touchcancel', onTouchEnd)
            } else {
                activeKeys.add(i)
                sendKeyPress(i, 'down')
            }
        }, { passive: false })

        key.addEventListener('touchend', (e: TouchEvent) => {
            e.preventDefault()
            key.classList.remove('pressed') // Remove visual feedback
            if (!isEncoder) {
                activeKeys.delete(i)
                sendKeyPress(i, 'up')
            }
        }, { passive: false })

        key.addEventListener('touchcancel', () => {
            key.classList.remove('pressed') // Remove visual feedback
            if (!isEncoder) {
                activeKeys.delete(i)
                sendKeyPress(i, 'up')
            }
        })

        // Add context menu again
        key.addEventListener('contextmenu', (e) => showContextMenu(e, i))
    }

    /**
     * Closes the currently active context menu.
     */
    function closeContextMenu() {
        if (activeContextMenu) {
            activeContextMenu.remove()
            activeContextMenu = null
        }
    }

    // Global listener to close the menu when clicking anywhere else
    document.addEventListener('click', (evt) => {
        if (!(evt.target as HTMLElement).closest('.context-menu')) {
            closeContextMenu()
        }
    })

    /**
     * Sends a key press event to the main process.
     * Converts linear index to x,y coordinates.
     * @param {number} keyIndex - The linear index of the key.
     * @param {string} action - The action (down, up, rotateLeft, rotateRight).
     */
    function sendKeyPress(keyIndex, action) {
        const x = keyIndex % $state.Columns
        const y = Math.floor(keyIndex / $state.Columns)

        sendKeyPressXY(x, y, action)
    }

    /**
     * Sends the formatted key press payload to Electron.
     * @param {number} x - The x coordinate (column).
     * @param {number} y - The y coordinate (row).
     * @param {string} action - The action type.
     */
    function sendKeyPressXY(x, y, action) {
        api.keyPress({
            deviceId: DEVICE_ID,
            x,
            y,
            action,
        })
    }

    api.onShowDeviceLabel((data) => {
        const deviceLabel = $elements.deviceLabel.current!

        deviceLabel.textContent = data.deviceId
        deviceLabel.style.display = data.show ? 'block' : 'none';
    })

    api.onDisablePress((_, disabled) => {
        const keypad = $elements.keypad.current!;
        const lock = $elements.lockIndicator.current!;

        keypad.classList.toggle('disabled', disabled)
        lock.style.display = disabled ? 'block' : 'none'
    })

    api.onAutoHide((_, autoHide) => {
        $state.AutoHideOnLeave = autoHide
    })

    api.onHideEmptyKeys((_, hideEmptyKeys) => {
        $state.HideEmptyKeys = hideEmptyKeys
        //logic to hide empty keys
    })

    api.onIdentify(() => {
        const keypad = $elements.keypad.current!

        // Apply flash - yellow in rgba
        keypad.style.backgroundColor = 'rgba(255, 255, 0, 1)'
        //add transition for smooth effect
        keypad.style.transition = 'background-color 0.5s ease'

        setTimeout(() => {
            api.getDeviceConfig(DEVICE_ID).then((config) => {
                console.log('got config:', config)
                const { backgroundColor, backgroundOpacity } = config

                keypad.style.backgroundColor = hexToRgba(
                    backgroundColor,
                    backgroundOpacity ?? 0.5
                )
            })
        }, 800)
    })

    api.onUpdateBackground((_, data) => {
        console.log('Updating background:', data)

        const keypad = $elements.keypad.current!

        keypad.style.backgroundColor = hexToRgba(data.backgroundColor, data.backgroundOpacity)
    })

    api.onRebuildGrid((_, { columnCount, rowCount }) => {
        $state.Columns = columnCount
        buildKeyGrid(columnCount, rowCount)
    })

    // Handle key events from Companion
    api.onDraw((_event, keyObj) => {
        if (keyObj.deviceId !== DEVICE_ID) return

        if (!keyStates.has(keyObj.deviceId)) {
            keyStates.set(keyObj.deviceId, new Map())
        }

        keyStates.get(keyObj.deviceId)!.set(keyObj.keyIndex, keyObj)
        processKey(keyObj)

        // Track initial draws for animation trigger
        if (!initialAnimationTriggered && expectedKeyCount > 0) {
            initialDrawsReceived.add(keyObj.keyIndex)

            // Once we've received draws for all keys, trigger animation
            if (initialDrawsReceived.size >= expectedKeyCount) {
                triggerKeyAnimation()
            }
        }
    })

    // Handle brightness
    api.onBrightness((_event, brightness) => {
        adjustBrightness(brightness)
    })

    const closeButton = $elements.closeButton.current!;

    // Close button
    closeButton.addEventListener('click', () => {
        api.closeKeypad(DEVICE_ID) // Send deviceId so main process knows which to close
    })

    /**
     * Updates the visual state of a key based on data from Companion.
     * Handles bitmaps, text, colors, and visibility.
     * @param {object} keyObj - The key state object.
     */
    function processKey(keyObj) {
        // console.log('Processing key:', keyObj)

        const keypad = $elements.keypad.current!;
        const loadingMessage = $elements.loadingMessage.current!

        loadingMessage.style.display = 'none'
        keypad.style.display = 'grid'

        const keyIndex = keyObj.keyIndex
        const { color, textColor, text, fontSize } = keyObj

        if (keyIndex < 0 || keyIndex >= keyElements.length) {
            console.warn(
                'Skipping invalid key index:',
                keyIndex,
                'Total keys:',
                keyElements.length
            )
            return
        }

        const keyElement = keyElements[keyIndex]
        if (!keyElement) {
            console.warn('No keyElement found for key:', keyIndex)
            return
        }

        // TODO: ???
        const textSpan = keyElement.querySelector('span')
        // let isEmpty = !bitmap && !color && !text

        if ($state.HideEmptyKeys) {
            if (keyObj.image || keyObj.text || keyObj.color) {
                keyElement.style.display = 'flex'
            } else {
                keyElement.style.display = 'none'
            }
        } else {
            keyElement.style.display = 'flex'
        }

        // If Companion sends a bitmap, render it
        const bitmap = keyObj.image
        if (bitmap) {
            renderBitmap(keyElement, bitmap, keyIndex)
            return
        }

        // Otherwise, update color/text if provided
        if (color) {
            keyElement.style.backgroundColor = color
        } else {
            keyElement.style.backgroundColor = ''
        }

        if (textSpan) {
            if (text) {
                try {
                    textSpan.textContent = atob(text)
                } catch (err) {
                    console.warn('Invalid base64 text, using raw:', text)
                    textSpan.textContent = text
                }
            } else {
                textSpan.textContent = ''
            }

            textSpan.style.color = textColor || ''
            textSpan.style.fontSize = fontSize || ''
        }

        //checkKeyStates()
        //updateGridLayout()
    }

    // Brightness
    /**
     * Adjusts the keypad opacity based on brightness setting.
     * @param {number} brightness - Brightness level (0-100).
     */
    function adjustBrightness(brightness) {
        const keypad = $elements.keypad.current!
        keypad.style.opacity = String(brightness / 100)
    }

    /**
     * Computes a fast hash of bitmap data for dirty checking.
     * Uses a simple rolling hash sampling bytes at intervals for speed.
     * @param {Uint8Array} bytes - The bitmap byte array.
     * @returns {number} A 32-bit hash value.
     */
    function computeBitmapHash(bytes: Uint8Array): number {
        let hash = 0
        const len = bytes.length
        // Sample every 64th byte for speed, plus first/last bytes
        const step = Math.max(1, Math.floor(len / 256))
        for (let i = 0; i < len; i += step) {
            hash = ((hash << 5) - hash + bytes[i]) | 0
        }
        // Include length and last byte for better uniqueness
        hash = ((hash << 5) - hash + len) | 0
        if (len > 0) {
            hash = ((hash << 5) - hash + bytes[len - 1]) | 0
        }
        return hash
    }

    /**
     * Renders a raw RGB bitmap onto a canvas within the key element.
     * Optimized with:
     * - Cached canvas context per key
     * - Pre-allocated ImageData reuse when size matches
     * - Dirty checking to skip unchanged bitmaps
     * @param {HTMLElement} container - The key element container.
     * @param {Uint8Array | ArrayBuffer} bitmap - Raw RGB bitmap data.
     * @param {number} keyIndex - The index of the key.
     */
    function renderBitmap(container: HTMLElement, bitmap: Uint8Array | ArrayBuffer, keyIndex: number) {
        const bytes = new Uint8Array(bitmap)
        const size = Math.sqrt(bytes.length / 3)

        if (!Number.isInteger(size)) {
            console.warn('Bitmap data length does not result in a perfect square.')
            return
        }

        // Compute hash for dirty checking
        const bitmapHash = computeBitmapHash(bytes)

        // Check cache for this key
        let cache = keyRenderCache.get(keyIndex)

        // Skip render if bitmap hasn't changed
        if (cache && cache.lastBitmapHash === bitmapHash && cache.lastSize === size) {
            return // Bitmap unchanged, skip render
        }

        // Get or create cached canvas and context
        if (!cache || cache.lastSize !== size) {
            let canvas = container.querySelector('canvas') as HTMLCanvasElement | null
            if (!canvas) {
                canvas = document.createElement('canvas')
                container.innerHTML = ''
                container.appendChild(canvas)
            }

            // Only update canvas dimensions if size changed
            if (canvas.width !== size || canvas.height !== size) {
                canvas.width = size
                canvas.height = size
            }

            const ctx = canvas.getContext('2d', {
                alpha: false,  // Disable alpha for better performance
                desynchronized: true  // Reduce latency on supported browsers
            })!

            // Pre-allocate ImageData
            const imageData = ctx.createImageData(size, size)

            cache = {
                canvas,
                ctx,
                imageData,
                lastBitmapHash: 0,
                lastSize: size
            }
            keyRenderCache.set(keyIndex, cache)
        }

        // Use pre-allocated ImageData
        const imageData = cache.imageData!
        const data = imageData.data

        // Convert RGB to RGBA using typed array operations
        for (let i = 0, j = 0; i < bytes.length; i += 3, j += 4) {
            data[j] = bytes[i]         // R
            data[j + 1] = bytes[i + 1] // G
            data[j + 2] = bytes[i + 2] // B
            data[j + 3] = 255          // A
        }

        // Render using requestAnimationFrame for optimal timing
        requestAnimationFrame(() => {
            cache!.ctx.putImageData(imageData, 0, 0)
        })

        // Update cache hash
        cache.lastBitmapHash = bitmapHash
    }

    window.addEventListener('mouseup', () => {
        activeKeys.forEach((keyIndex) => {
            sendKeyPress(keyIndex, 'up')
        })
        activeKeys.clear()
    })

    window.addEventListener('blur', () => {
        activeKeys.forEach((keyIndex) => {
            sendKeyPress(keyIndex, 'up')
        })
        activeKeys.clear()
    })
}

function LegacyButtons() {

    const keypadRef = React.useRef<HTMLDivElement>(null);
    const logoOverlayRef = React.useRef<HTMLDivElement>(null);
    const closeButtonRef = React.useRef<HTMLButtonElement>(null)
    const lockIndicatorRef = React.useRef<HTMLDivElement>(null);
    const deviceLabelRef = React.useRef<HTMLDivElement>(null);
    const loadingMessageRef = React.useRef<HTMLDivElement>(null)

    // Viewport size for web mode
    const [viewportSize, setViewportSize] = React.useState<{ width: number; height: number } | null>(null);

    // initialization effect
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search)
        const deviceId = urlParams.get('deviceId')

        if (!deviceId) {
            console.error('No deviceId in query string')
            return
        }

        _init({
            DEVICE_ID: deviceId,
            $elements: {
                keypad: keypadRef,
                logoOverlay: logoOverlayRef,
                closeButton: closeButtonRef,
                lockIndicator: lockIndicatorRef,
                deviceLabel: deviceLabelRef,
                loadingMessage: loadingMessageRef,
            },
            $state: {
                Columns: 0,
                Rows: 0,
                AutoHideOnLeave: false,
                HideEmptyKeys: false,
                OriginalBounds: null,
                AutoHideTimeout: null, // Handle auto hide on mouse leave
            },
            $callbacks: {
                onDeviceConfigReceived: (config: any) => {
                    console.log('Device config received:', config);

                    const vpSize = calculateViewPortSize(
                        config.columnCount || 0,
                        config.rowCount || 0,
                        config.bitmapSize || 72,
                        20,
                        10,
                    )
                    console.log('Calculated viewport size:', vpSize);

                    // Set viewport size for web mode
                    if (!api.is('electron')) {
                        setViewportSize(vpSize);
                    }

                    const columns = config.columnCount || 0
                    const rows = config.rowCount || 0
                    const totalKeys = columns * rows

                    console.log('Total keys:', totalKeys)

                    const keyConfigs = Promise.all(
                        Array.from({ length: totalKeys }, (_, i) => i).map((keyIndex) =>
                            api.getKeyConfig({ deviceId, keyIndex })
                        )
                    )

                    // {isEncoder: false, stepSize: 10}

                    keyConfigs.then((configs) => {
                        console.log('Key configs:', configs)
                    })
                },
            },
            // $actions: {
            //
            // }
        })
    });

    const [draggingIntent, setDraggingIntent] = React.useState(false);
    const draggerOverlay = React.useRef<HTMLDivElement>(null)

    if (api.is('electron')) {
        // an effect to listen for ctrl key down/up to show dragging intent
        useEffect(() => {
            // TODO: improve accessibility

            function onKeyDown(e: KeyboardEvent) {
                console.log('key down:', e.key)
                if (e.key === 'Control') {
                    setDraggingIntent(true)
                }
            }
            function onKeyUp(e: KeyboardEvent) {
                console.log('key up:', e.key)
                if (e.key === 'Control') {
                    setDraggingIntent(false)
                }
            }

            // also handle when mouse enters the window with ctrl already held down
            function onMouseOver(e: MouseEvent) {
                console.log('mouse over:', e.ctrlKey)
                if (e.ctrlKey) {
                    setDraggingIntent(true)
                }
            }
            function onMouseLeave(e: MouseEvent) {
                console.log('mouse leave:', e.ctrlKey)
                setDraggingIntent(false)
            }

            window.addEventListener('keydown', onKeyDown)
            window.addEventListener('keyup', onKeyUp)
            window.addEventListener('mouseover', onMouseOver)
            window.addEventListener('mouseleave', onMouseLeave)

            return () => {
                window.removeEventListener('keydown', onKeyDown)
                window.removeEventListener('keyup', onKeyUp)
                window.removeEventListener('mouseover', onMouseOver)
                window.removeEventListener('mouseleave', onMouseLeave)
            }
        }, [])
    }

    return (
        <div
            className="window-container"
            style={{
                backgroundColor: api.is('electron') ? 'transparent' : 'gray',
                // Web mode: use calculated viewport size and make scrollable
                ...(!api.is('electron') && viewportSize ? {
                    width: viewportSize.width,
                    height: viewportSize.height,
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    overflow: 'auto',
                } : {}),
            }}
        >
            {/* Close and labels */}
            <button
                id="closeButton"
                className="close-button"
                ref={closeButtonRef}
                style={{
                    display: api.is('electron') ? 'block' : 'none',
                }}
            >
                <XIcon className="size-3" />
            </button>
            <div id="lockIndicator" className="lock-indicator" ref={lockIndicatorRef}>
                🔒
            </div>
            <div id="device-label" className="device-label" ref={deviceLabelRef}></div>

            {/* The main content area */}
            <div
                id="keypad"
                className="keypad"
                style={{
                    borderRadius: api.is('electron') ? '16px' : '0px',
                    border: api.is('electron') ? '2px solid red' : 'none',
                }}
                ref={keypadRef}
            >
                <div id="loadingMessage" ref={loadingMessageRef}>
                    <img src={logo} alt="ScreenDeck Logo" />
                </div>
                {/* keys goes here */}
            </div>

            {/* The logo overlay that shows when collapsed */}
            <div
                ref={logoOverlayRef}
                id="logoOverlay"
                style={{
                    display: 'none',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '100%',
                    height: '100%',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    pointerEvents: 'none',
                    backgroundColor: 'transparent',
                }}
            >
                <img
                    src={logo}
                    alt="ScreenDeck Logo"
                    id="logoImage"
                    style={{
                        opacity: 0.7,
                        maxWidth: '100%',
                        maxHeight: '100%',
                    }}
                />
            </div>
            {/* Drag Layer when control is clicked */}
            {api.is('electron') && (
                <div
                    ref={draggerOverlay}
                    className={cn('absolute top-0 left-0 w-full h-full', {
                        'bg-amber-100/25': draggingIntent,
                        'cursor-move': draggingIntent,
                        'pointer-events-none': !draggingIntent,
                        '[app-region:drag]': draggingIntent,
                    })}
                    style={{
                        borderRadius: '16px',
                        border: '2px solid red',
                    }}
                ></div>
            )}
        </div>
    )
}

function Buttons() {
    return (
        <>
            <InjectStyles />
            <LegacyButtons />
        </>
    )
}

export default Buttons
