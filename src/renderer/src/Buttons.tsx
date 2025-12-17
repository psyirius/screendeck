import React, { useEffect } from 'react'
import { hexToRgba } from './color';
import { getAPIClient } from '@/api/client';
import logo from '@/assets/images/logo.png?url';
// import { cn } from './lib/utils';

const api = getAPIClient();

// --- Styles ---
const styles = `
    /* Allow the main body area to be draggable */
    body {
        -webkit-app-region: drag;
        margin: 0;
        padding: 0;
        display: flex;
        justify-content: flex-end;
        align-items: center;
        height: 100vh;
        background: transparent;
    }

    /* Draggable area that encapsulates the keypad */
    .draggable-area {
        width: 100%;
        height: 100%;
        display: flex;
        justify-content: flex-end;
        align-items: center;
        -webkit-app-region: drag;
    }

    /* Keypad styles */
    .keypad {
        /* display: grid; */ /* we set it later */
        gap: 10px;
        padding: 20px;
        background: rgba(0, 0, 0, 0.5);
        border-radius: 8px;
        /*backdrop-filter: blur(10px);*/
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
        -webkit-app-region: no-drag;
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
    }

    .key:hover {
        background-color: #555;
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
        -webkit-app-region: no-drag;
        position: absolute;
        top: 5px;
        right: 5px;
        background: rgba(0, 0, 0, 0.5);
        border: none;
        color: white;
        font-size: 12px;
        padding: 2px 6px;
        cursor: pointer;
        z-index: 100;
        border-radius: 4px;
        opacity: 0; /* Hide by default */
        transition: opacity 0.2s ease;
    }

    /*#closeButton {
        opacity: 0;
        pointer-events: none;
        transition: opacity 0.3s ease;
    }*/

    .close-button-settings {
        -webkit-app-region: no-drag;
        position: absolute;
        top: 5px;
        right: 5px;
        background: rgba(0, 0, 0, 0.5);
        border: none;
        color: white;
        font-size: 16px;
        padding: 2px 6px;
        cursor: pointer;
        z-index: 100;
        border-radius: 4px;
        opacity: 1;
        transition: opacity 0.2s ease;
    }

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
        -webkit-app-region: no-drag;
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
`

const InjectStyles = () => (
    <style>{styles}</style>
)

// interface KeyData {
//     text?: string
//     textColor?: string
//     color?: string
//     fontSize?: number
//     imageBase64?: string
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
//         if (!data?.imageBase64 || !canvasRef.current) return
//
//         function renderBitmap(imageBase64: string) {
//             console.log('Rendering bitmap for key', index);
//
//             try {
//                 const binary = atob(imageBase64)
//                 const bytes = new Uint8Array(binary.length)
//
//                 for (let i = 0; i < binary.length; i++) {
//                     bytes[i] = binary.charCodeAt(i)
//                 }
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
//         requestAnimationFrame(() => renderBitmap(data.imageBase64!));
//     }, [data?.imageBase64]);
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
//                 display: hideIfEmpty && !data.imageBase64 && !data.text && !data.color ? 'none' : 'flex'
//             }}
//         >
//             {/* If we have a bitmap, show canvas */}
//             {data.imageBase64 && (
//                 <canvas ref={canvasRef} />
//             )}
//             {/* If we have text, show it */}
//             {/* {data.text && (
//                 <span>{decodedText}</span>
//             )} */}
//         </div>
//     )
// });

function LegacyButtons() {
    type _InitOptions = {
        DEVICE_ID: string
        $elements: {
            keypad: React.RefObject<HTMLElement | null>
            logoOverlay: React.RefObject<HTMLElement | null>
            closeButton: React.RefObject<HTMLElement | null>
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
        },
        $callbacks: {
            onDeviceConfigReceived: (config: any) => void
        },
        // $actions: {
        //
        // }
    }

    const keypadRef = React.useRef<HTMLDivElement>(null);
    const logoOverlayRef = React.useRef<HTMLDivElement>(null);
    const closeButtonRef = React.useRef<HTMLButtonElement>(null);

    /**
     * Initialization closure for the keypad window.
     * Handles parsing URL params, setting up global listeners, and managing the keypad lifecycle.
     */
    function _init({ $state, $elements, /*$actions,*/ $callbacks, DEVICE_ID }: _InitOptions) {
        if ((_init as any).done) return

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
                    imageBase64: string | null
                }
            >
        >() // deviceId -> Map(keyIndex -> { bitmap, text, color, etc. })

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

            const keysTotal = columnCount * rowCount

            for (let i = 0; i < keysTotal; i++) {
                const keyElement = document.createElement('div')!
                keyElement.className = 'key'
                keyElement.dataset.index = String(i)
                //keyElement.style.display = 'flex'
                keypad.appendChild(keyElement)
                keyElements.push(keyElement)

                refreshKey(DEVICE_ID, i)
            }

            //checkKeyStates()

            //updateGridLayout() // Initial layout calc after grid build
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
            menu.innerHTML = `
        <div class="menu-item" data-action="encoder">Set to Encoder Mode</div>
        <div class="menu-item" data-action="button">Set to Button Mode</div>
        <div class="menu-item" data-action="hotkey">Assign Hotkey...</div>
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
                    let imageBase64 = keyConfig?.imageBase64 || null
                    api.setHotkeyContext({
                        deviceId: DEVICE_ID,
                        keyIndex,
                        imageBase64,
                    })
                    api.openHotkeyPrompt()
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

                const state = keyStates.get(deviceId)?.get(keyIndex)
                if (state) {
                    processKey(state)
                }
            })
        }

        /**
         * Binds mouse events (mousedown, mouseup, contextmenu) to a key element.
         * Handles encoder rotation simulation and standard button presses.
         * @param {HTMLElement} key - The key DOM element.
         * @param {number} i - The key index.
         * @param {object} keyConfig - The configuration object for the key.
         */
        function bindKeyEvents(key, i, keyConfig) {
            key.addEventListener('mousedown', (e) => {
                console.log('in mouse down for key:', i)
                if (e.button === 2) {
                    return
                }

                const isEncoder = keyConfig.isEncoder
                const stepSize = keyConfig.stepSize || 10

                console.log('isEncoder:', isEncoder, 'stepSize:', stepSize)

                if (isEncoder) {
                    e.preventDefault()

                    let accumulatedDeltaX = 0
                    let lastX = e.clientX

                    const onMove = (moveEvent) => {
                        const deltaX = moveEvent.clientX - lastX
                        accumulatedDeltaX += deltaX

                        let direction: ('rotateRight' | 'rotateLeft') | null = null
                        while (Math.abs(accumulatedDeltaX) >= stepSize) {
                            direction = accumulatedDeltaX > 0 ? 'rotateRight' : 'rotateLeft'
                            sendKeyPress(i, direction)

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

                    const onUp = () => {
                        window.removeEventListener('mousemove', onMove)
                        window.removeEventListener('mouseup', onUp)
                        key.classList.remove('rotateLeft', 'rotateRight')
                    }

                    window.addEventListener('mousemove', onMove)
                    window.addEventListener('mouseup', onUp)
                } else {
                    activeKeys.add(i)
                    sendKeyPress(i, 'down')
                }
            })

            key.addEventListener('mouseup', () => {
                activeKeys.delete(i)
                sendKeyPress(i, 'up')
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
            const label = document.getElementById('device-label')
            if (label) {
                label.textContent = data.deviceId
                label.style.display = data.show ? 'block' : 'none'
            }
        })

        api.onDisablePress((_, disabled) => {
            const keypad = document.getElementById('keypad')
            const lock = document.getElementById('lockIndicator')

            if (keypad && lock) {
                keypad.classList.toggle('disabled', disabled)
                lock.style.display = disabled ? 'block' : 'none'
            }
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
            const keypad = document.getElementById('keypad')!
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
        })

        // Handle brightness
        api.onBrightness((_event, brightness) => {
            adjustBrightness(brightness)
        })

        // Close button
        document.getElementById('closeButton')!.addEventListener('click', () => {
            api.closeKeypad(DEVICE_ID) // Send deviceId so main process knows which to close
        })

        /**
         * Updates the visual state of a key based on data from Companion.
         * Handles bitmaps, text, colors, and visibility.
         * @param {object} keyObj - The key state object.
         */
        function processKey(keyObj) {
            console.log('Processing key:', keyObj)

            document.getElementById('loadingMessage')!.style.display = 'none'
            document.getElementById('keypad')!.style.display = 'grid'

            const keyIndex = keyObj.keyIndex
            const bitmap = keyObj.imageBase64
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

            const textSpan = keyElement.querySelector('span')
            // let isEmpty = !bitmap && !color && !text

            if ($state.HideEmptyKeys) {
                if (keyObj.imageBase64 || keyObj.text || keyObj.color) {
                    keyElement.style.display = 'flex'
                } else {
                    keyElement.style.display = 'none'
                }
            } else {
                keyElement.style.display = 'flex'
            }

            // If Companion sends a bitmap, render it
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
            const keypad = document.getElementById('keypad')!
            keypad.style.opacity = String(brightness / 100)
        }

        // Bitmap Rendering: Accepts base64-encoded raw RGB bitmap
        /**
         * Renders a raw RGB bitmap onto a canvas within the key element.
         * @param {HTMLElement} container - The key element container.
         * @param {string} bitmapBase64 - Base64 encoded raw RGB bitmap data.
         */
        function renderBitmap(container, bitmapBase64, keyIndex) {
            requestAnimationFrame(() => {
                console.log('Rendering bitmap for key', keyIndex)
                try {
                    const binary = atob(bitmapBase64)
                    const bytes = new Uint8Array(binary.length)
                    for (let i = 0; i < binary.length; i++) {
                        bytes[i] = binary.charCodeAt(i)
                    }

                    const size = Math.sqrt(bytes.length / 3)
                    if (!Number.isInteger(size)) {
                        console.warn('Bitmap data length does not result in a perfect square.')
                        return
                    }

                    let canvas = container.querySelector('canvas')
                    if (!canvas) {
                        canvas = document.createElement('canvas')
                        container.innerHTML = ''
                        container.appendChild(canvas)
                    }

                    canvas.width = size
                    canvas.height = size
                    const ctx = canvas.getContext('2d')
                    const imageData = ctx.createImageData(size, size)

                    for (let i = 0, j = 0; i < bytes.length; i += 3, j += 4) {
                        imageData.data[j] = bytes[i]
                        imageData.data[j + 1] = bytes[i + 1]
                        imageData.data[j + 2] = bytes[i + 2]
                        imageData.data[j + 3] = 255
                    }

                    ctx.putImageData(imageData, 0, 0)

                    // Optional: Convert the canvas into a PNG base64 (for other uses)
                    // const dataUrl = canvas.toDataURL('image/png')
                } catch (err) {
                    console.error('Error decoding bitmap:', err)
                }
            })
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
        ;(_init as any).done = true
    }

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
                    console.log('Device config received:', config)

                    const columns = config.columnCount || 0;
                    const rows = config.rowCount || 0;
                    const totalKeys = columns * rows;

                    console.log('Total keys:', totalKeys);

                    const keyConfigs = Promise.all(
                        Array.from({ length: totalKeys }, (_, i) => i)
                            .map(keyIndex => api.getKeyConfig({ deviceId, keyIndex }))
                    );

                    // {isEncoder: false, stepSize: 10}

                    keyConfigs.then((configs) => {
                        console.log('Key configs:', configs);
                    });
                },
            },
            // $actions: {
            //
            // }
        })
    });

    return (
        <div className="window-container">
            {/* Close and labels */}
            <button id="closeButton" className="close-button" ref={closeButtonRef}>
                ×
            </button>
            <div id="lockIndicator" className="lock-indicator">
                🔒
            </div>
            <div id="device-label" className="device-label"></div>

            {/* The main content area */}
            <div id="keypad" className="keypad" ref={keypadRef}>
                <div id="loadingMessage">
                    <img src={logo} alt="ScreenDeck Logo" />
                </div>
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
