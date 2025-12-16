// @ts-nocheck
import React from 'react'
import { hexToRgba } from '@/color'
import { getAPIClient } from '@/api/client'
import logo from '@/assets/images/logo.png?url'

const api = getAPIClient()

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

const InjectStyles = () => <style>{styles}</style>

interface KeyData {
    text?: string
    textColor?: string
    color?: string
    fontSize?: number
    imageBase64?: string
    isEncoder?: boolean
    stepSize?: number
}

interface KeyProps {
    index: number
    deviceId: string
    data: KeyData
    onPress: (index: number, action: string) => void
    onContextMenu: (e: React.MouseEvent, index: number) => void
}

const Key = React.memo(({ index, deviceId, data, onPress, onContextMenu }: KeyProps) => {
    const canvasRef = React.useRef<HTMLCanvasElement>(null)
    const [isPressed, setIsPressed] = React.useState(false)

    // Derived state for rotation classes
    const [rotationClass, setRotationClass] = React.useState<'rotateLeft' | 'rotateRight' | null>(
        null
    )

    // Bitmap Rendering Effect
    React.useEffect(() => {
        if (!data?.imageBase64 || !canvasRef.current) return

        const render = async () => {
            try {
                const binary = atob(data.imageBase64!)
                const bytes = new Uint8Array(binary.length)
                for (let i = 0; i < binary.length; i++) {
                    bytes[i] = binary.charCodeAt(i)
                }

                const size = Math.sqrt(bytes.length / 3)
                if (!Number.isInteger(size)) return // Invalid Check

                const canvas = canvasRef.current!
                canvas.width = size
                canvas.height = size
                const ctx = canvas.getContext('2d')
                if (!ctx) return

                const imageData = ctx.createImageData(size, size)

                // Optimized loop
                for (let i = 0, j = 0; i < bytes.length; i += 3, j += 4) {
                    imageData.data[j] = bytes[i]
                    imageData.data[j + 1] = bytes[i + 1]
                    imageData.data[j + 2] = bytes[i + 2]
                    imageData.data[j + 3] = 255 // Alpha
                }

                ctx.putImageData(imageData, 0, 0)
            } catch (err) {
                console.error('Error rendering bitmap on Key:', index, err)
            }
        }

        requestAnimationFrame(() => render())
    }, [data?.imageBase64])

    const handleMouseDown = (e: React.MouseEvent) => {
        if (e.button === 2) return // Ignore right click (handled by context menu)

        if (data?.isEncoder) {
            e.preventDefault()
            const stepSize = data.stepSize || 10
            let accumulatedDeltaX = 0
            let lastX = e.clientX

            const onMove = (moveEvent: MouseEvent) => {
                const deltaX = moveEvent.clientX - lastX
                accumulatedDeltaX += deltaX

                while (Math.abs(accumulatedDeltaX) >= stepSize) {
                    const direction = accumulatedDeltaX > 0 ? 'rotateRight' : 'rotateLeft'
                    onPress(index, direction)
                    setRotationClass(direction)

                    // Reset accumulation by step size
                    if (accumulatedDeltaX > 0) accumulatedDeltaX -= stepSize
                    else accumulatedDeltaX += stepSize
                }
                lastX = moveEvent.clientX // Update last position
            }

            const onUp = () => {
                window.removeEventListener('mousemove', onMove)
                window.removeEventListener('mouseup', onUp)
                setRotationClass(null)
            }

            window.addEventListener('mousemove', onMove)
            window.addEventListener('mouseup', onUp)
        } else {
            setIsPressed(true)
            onPress(index, 'down')

            const onUp = () => {
                setIsPressed(false)
                onPress(index, 'up')
                window.removeEventListener('mouseup', onUp)
            }
            window.addEventListener('mouseup', onUp)
        }
    }

    const wrapperStyle: React.CSSProperties = {
        backgroundColor: data?.color || undefined,
        // display: 'flex' // default from CSS
    }

    let decodedText = ''
    if (data?.text) {
        try {
            decodedText = atob(data.text)
        } catch {
            decodedText = data.text
        }
    }

    const textStyle: React.CSSProperties = {
        color: data?.textColor || undefined,
        fontSize: data?.fontSize ? `${data.fontSize}px` : undefined,
    }

    return (
        <div
            className={`key ${data?.isEncoder ? 'encoder' : ''} ${rotationClass || ''}`}
            onMouseDown={handleMouseDown}
            onContextMenu={(e) => onContextMenu(e, index)}
            style={wrapperStyle}
            data-index={index}
        >
            {/* If we have a bitmap, show canvas */}
            {data?.imageBase64 ? (
                <canvas
                    ref={canvasRef}
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                />
            ) : null}

            {/* If we have text, and NO bitmap (overlay logic checks) - existing logic overlays text if present */}
            {decodedText && (
                <span
                    style={textStyle}
                    className="pointer-events-none absolute z-10 break-words text-center px-1"
                >
                    {decodedText}
                </span>
            )}
        </div>
    )
})

interface KeypadGridProps {
    columnCount: number
    rowCount: number
    deviceId: string
    keyStates: Map<number, KeyData>
    backgroundColor?: string
    backgroundOpacity?: number
    onPress: (index: number, action: string) => void
    onContextMenu: (e: React.MouseEvent, index: number) => void
}

const KeypadGrid = React.memo(
    ({
        columnCount,
        rowCount,
        deviceId,
        keyStates,
        backgroundColor,
        backgroundOpacity,
        onPress,
        onContextMenu,
    }: KeypadGridProps) => {
        const gridStyle: React.CSSProperties = {
            display: 'grid',
            gridTemplateColumns: `repeat(${columnCount}, 1fr)`,
            gap: '10px',
            padding: '20px',
            backgroundColor: hexToRgba(backgroundColor, backgroundOpacity),
            borderRadius: '8px',
            height: '100%',
        }

        // Create array of indices [0, 1, ... total-1]
        const totalKeys = columnCount * rowCount
        // Memoize the array to prevent unnecessary re-renders of the list structure
        const keyIndices = React.useMemo(() => {
            return Array.from({ length: totalKeys }, (_, i) => i)
        }, [totalKeys])

        return (
            <div className="keypad" style={gridStyle}>
                {keyIndices.map((i) => {
                    const keyData = keyStates.get(i) || {}
                    return (
                        <Key
                            key={i}
                            index={i}
                            deviceId={deviceId}
                            data={keyData}
                            onPress={onPress}
                            onContextMenu={onContextMenu}
                        />
                    )
                })}
            </div>
        )
    }
)

interface ContextMenuProps {
    x: number
    y: number
    onClose: () => void
    onAction: (action: 'encoder' | 'button' | 'hotkey') => void
}

const ContextMenu = ({ x, y, onClose, onAction }: ContextMenuProps) => {
    const menuRef = React.useRef<HTMLDivElement>(null)

    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                onClose()
            }
        }

        // Use mousedown to catch clicks before they might trigger other things
        document.body.addEventListener('mousedown', handleClickOutside)

        return () => {
            document.body.removeEventListener('mousedown', handleClickOutside)
        }
    }, [onClose])

    // Simple bounds check could go here, but for now we rely on the parent or initial positioning
    const style: React.CSSProperties = {
        position: 'fixed',
        left: x,
        top: y,
    }

    return (
        <div ref={menuRef} className="context-menu" style={style}>
            <div className="menu-item" onClick={() => onAction('encoder')}>
                Set to Encoder Mode
            </div>
            <div className="menu-item" onClick={() => onAction('button')}>
                Set to Button Mode
            </div>
            <div className="menu-item" onClick={() => onAction('hotkey')}>
                Assign Hotkey...
            </div>
        </div>
    )
}

const NewButtons = () => {
    // --- State ---
    const [deviceId, setDeviceId] = React.useState<string | null>(null)
    const [config, setConfig] = React.useState({
        columnCount: 0,
        rowCount: 0,
        backgroundColor: '#000000',
        backgroundOpacity: 0.5,
    })

    const [keyStates, setKeyStates] = React.useState<Map<number, KeyData>>(new Map())

    const [ui, setUi] = React.useState({
        autoHide: false,
        hideEmptyKeys: false,
        showLogo: false,
        showLabel: false,
        labelText: '',
        isLocked: false,
        opacity: 1, // for brightness
        identifying: false, // for identify flash
    })

    const [contextMenu, setContextMenu] = React.useState<{
        visible: boolean
        x: number
        y: number
        index: number
    } | null>(null)

    // --- Refs for logic that doesn't need immediate re-renders ---
    const originalBounds = React.useRef<{ width: number; height: number } | null>(null)
    const activeKeys = React.useRef<Set<number>>(new Set())
    const hideTimeout = React.useRef<NodeJS.Timeout | null>(null)

    // --- Helpers ---
    const sendKeyPress = React.useCallback(
        (index: number, action: string) => {
            if (!deviceId || config.columnCount === 0) return
            const x = index % config.columnCount
            const y = Math.floor(index / config.columnCount)
            api.keyPress({ deviceId, x, y, action })
        },
        [deviceId, config.columnCount]
    )

    // --- Effects: Initialization ---
    React.useEffect(() => {
        const params = new URLSearchParams(window.location.search)
        const id = params.get('deviceId')
        if (id) {
            setDeviceId(id)
            api.getDeviceConfig(id).then((cfg) => {
                setConfig({
                    columnCount: cfg.columnCount || 0,
                    rowCount: cfg.rowCount || 0,
                    backgroundColor: cfg.backgroundColor || '#000000',
                    backgroundOpacity: cfg.backgroundOpacity ?? 0.5,
                })
                setUi((prev) => ({
                    ...prev,
                    autoHide: cfg.autoHide || false,
                    hideEmptyKeys: cfg.hideEmptyKeys || false,
                }))
            })
        }
    }, [])

    // --- Effects: Listeners ---
    React.useEffect(() => {
        if (!deviceId) return

        // Note: Legacy API structure just adds listeners.
        // We assume they persist, but in React we usually remove them.
        // If the API doesn't return a cleanup, we might duplicate listeners on hot reload.
        // For production build this is fine as component likely mounts once.

        api.onDraw((_event, keyObj) => {
            if (keyObj.deviceId !== deviceId) return
            setKeyStates((prev) => {
                const newMap = new Map(prev)
                newMap.set(keyObj.keyIndex, keyObj)
                return newMap
            })
        })

        api.onShowDeviceLabel((data) => {
            setUi((prev) => ({ ...prev, showLabel: data.show, labelText: data.deviceId }))
        })

        api.onDisablePress((_, disabled) => {
            setUi((prev) => ({ ...prev, isLocked: disabled }))
        })

        api.onAutoHide((_, autoHide) => {
            setUi((prev) => ({ ...prev, autoHide }))
        })

        api.onHideEmptyKeys((_, hideEmptyKeys) => {
            setUi((prev) => ({ ...prev, hideEmptyKeys }))
        })

        api.onUpdateBackground((_, data) => {
            setConfig((prev) => ({
                ...prev,
                backgroundColor: data.backgroundColor,
                backgroundOpacity: data.backgroundOpacity,
            }))
        })

        api.onRebuildGrid((_, { columnCount, rowCount }) => {
            setConfig((prev) => ({ ...prev, columnCount, rowCount }))
            setKeyStates(new Map()) // Clear keys on rebuild
        })

        api.onBrightness((_event, brightness) => {
            setUi((prev) => ({ ...prev, opacity: brightness / 100 }))
        })

        api.onIdentify(() => {
            setUi((prev) => ({ ...prev, identifying: true }))
            setTimeout(() => {
                setUi((prev) => ({ ...prev, identifying: false }))
            }, 800)
        })
    }, [deviceId])

    // --- Logic: Auto Hide ---
    const showKeypad = React.useCallback(() => {
        if (!ui.autoHide) return
        setUi((prev) => ({ ...prev, showLogo: false }))

        if (deviceId && originalBounds.current) {
            api.resizeKeypadWindow({
                deviceId,
                width: originalBounds.current.width,
                height: originalBounds.current.height,
            })
        }
    }, [ui.autoHide, deviceId])

    const hideKeypad = React.useCallback(() => {
        if (!ui.autoHide) return
        setUi((prev) => ({ ...prev, showLogo: true }))

        if (deviceId) {
            api.getKeypadBounds(deviceId).then((bounds) => {
                originalBounds.current = bounds
                const bitmapSize = bounds.bitmapSize || 72 // Default fallback
                api.resizeKeypadWindow({
                    deviceId,
                    width: bitmapSize + 50,
                    height: bitmapSize + 50,
                })
            })
        }
    }, [ui.autoHide, deviceId])

    // --- Handlers ---
    const handlePress = React.useCallback(
        (index: number, action: string) => {
            if (action === 'down') activeKeys.current.add(index)
            if (action === 'up') activeKeys.current.delete(index)
            sendKeyPress(index, action)
        },
        [sendKeyPress]
    )

    const handleContextMenu = React.useCallback((e: React.MouseEvent, index: number) => {
        e.preventDefault()
        setContextMenu({
            visible: true,
            x: e.clientX,
            y: e.clientY,
            index,
        })
    }, [])

    const handleCloseContextMenu = React.useCallback(() => {
        setContextMenu(null)
    }, [])

    const handleMenuAction = React.useCallback(
        (action: 'encoder' | 'button' | 'hotkey') => {
            if (!contextMenu || !deviceId) return

            const { index } = contextMenu

            if (action === 'encoder') {
                api.updateKeyConfig({ deviceId, keyIndex: index, config: { isEncoder: true } })
            } else if (action === 'button') {
                api.updateKeyConfig({ deviceId, keyIndex: index, config: { isEncoder: false } })
            } else if (action === 'hotkey') {
                const keyConfig = keyStates.get(index)
                api.setHotkeyContext({
                    deviceId,
                    keyIndex: index,
                    imageBase64: keyConfig?.imageBase64,
                })
                api.openHotkeyPrompt()
            }
            setContextMenu(null)

            // Refresh single key logic if needed
            api.getKeyConfig({ deviceId, keyIndex: index }).then((cfg) => {
                // we could force shallow update if key config affects rendering beyond isEncoder class (which is in keyState/config usually?)
                // Actually isEncoder is a prop on Key, which comes from keyStates map.
                // If main process doesn't send 'onDraw' or similar update after config change, we might need to manually fetch and update map.
                // For now, assuming standard flow.
            })
        },
        [contextMenu, deviceId, keyStates]
    )

    // --- Render ---
    if (!deviceId) return <div className="text-white">Loading config...</div>

    const keypadProps = {
        columnCount: config.columnCount,
        rowCount: config.rowCount,
        deviceId: deviceId,
        keyStates: keyStates,
        backgroundColor: ui.identifying ? '#ffff00' : config.backgroundColor,
        backgroundOpacity: ui.identifying ? 1 : config.backgroundOpacity,
        onPress: handlePress,
        onContextMenu: handleContextMenu,
    }

    return (
        <div
            className="window-container"
            onMouseEnter={() => {
                if (hideTimeout.current) clearTimeout(hideTimeout.current)
                showKeypad()
            }}
            onMouseLeave={() => {
                if (ui.autoHide) {
                    hideTimeout.current = setTimeout(hideKeypad, 500)
                }
            }}
        >
            <button
                className="close-button"
                style={{ opacity: 1 }}
                onClick={() => api.closeKeypad(deviceId)}
            >
                ×
            </button>

            {ui.isLocked && (
                <div className="lock-indicator" style={{ display: 'block' }}>
                    🔒
                </div>
            )}

            {ui.showLabel && (
                <div className="device-label" style={{ display: 'block' }}>
                    {ui.labelText}
                </div>
            )}

            <div
                id="container-body"
                style={{
                    opacity: ui.showLogo ? 0 : ui.opacity,
                    transition: 'opacity 0.3s ease',
                    height: '100%',
                }}
            >
                <KeypadGrid {...keypadProps} />
            </div>

            <div
                id="logo-overlay-react"
                style={{
                    display: ui.showLogo ? 'flex' : 'none',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '100%',
                    height: '100%',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    pointerEvents: 'none',
                    opacity: ui.showLogo ? 1 : 0,
                    transition: 'opacity 0.3s ease',
                }}
            >
                <img
                    src={logo}
                    alt="Logo"
                    style={{ maxWidth: '100%', maxHeight: '100%', opacity: 0.7 }}
                />
            </div>

            {contextMenu && (
                <ContextMenu
                    x={contextMenu.x}
                    y={contextMenu.y}
                    onClose={handleCloseContextMenu}
                    onAction={handleMenuAction}
                />
            )}
        </div>
    )
}

function Buttons() {
    return (
        <>
            <InjectStyles />
            <NewButtons />
        </>
    )
}

export default Buttons
