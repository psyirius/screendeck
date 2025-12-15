// @ts-nocheck
import './styles/legacy.css'
import React, { useEffect, useState } from 'react'

function injectCSS() {
    if (injectCSS.injected) return

    const styles = `
    body {
        font-family: sans-serif;
        margin: 20px;
        padding: 10px;
    }

    .device {
        border: 1px solid #ccc;
        padding: 10px;
        margin-bottom: 20px;
        border-radius: 6px;
        background: #f9f9f9;
    }

    .device label {
        font-weight: bold;
        margin-bottom: 2px;
    }

    .device input {
        width: 60px;
        margin-right: 10px;
    }

    .device-actions {
        margin-top: 10px;
    }

    button {
        padding: 5px 10px;
        margin-right: 5px;
    }

    #addDevice {
        margin-bottom: 20px;
        background-color: #4caf50;
        color: white;
        border: none;
        border-radius: 4px;
    }`
    const styleSheet = document.createElement('style')
    styleSheet.innerText = styles
    document.head.appendChild(styleSheet)

    injectCSS.injected = true
}

function WindowContainer() {
    const [initialized, setInitialized] = useState(false)

    const [devices, setDevices] = useState([])
    const [companionIP, setCompanionIP] = useState('127.0.0.1')
    const [companionPort, setCompanionPort] = useState(16622)

    async function loadCompanionSettings() {
        const settings = await window.electronAPI.invoke('getSettings')

        setCompanionIP(settings.companionIP || '127.0.0.1')
        setCompanionPort(settings.companionPort || 16622)
    }

    async function loadDevices() {
        const devices = await window.electronAPI.invoke('getAllDevices')
        console.log('Loaded devices:', devices)

        setDevices(devices);
    }

    useEffect(() => {
        if (!initialized) {
            injectCSS()
            loadCompanionSettings()
            loadDevices()

            setInitialized(true)
        }
    })

    const deviceListRef = React.useRef(null);
    const addDeviceButtonRef = React.useRef(null);

    const [showSaveConfirmation, setShowSaveConfirmation] = useState(false);

    function showSavedNotification() {
        setShowSaveConfirmation(true);
        setTimeout(() => {
            setShowSaveConfirmation(false);
        }, 2000);
    }

    return (
        <div className="window-container">
            <h1>ScreenDeck Settings</h1>
            <h2>Companion Connection</h2>
            <label htmlFor="companionIP">IP Address:</label>
            <input
                type="text"
                id="companionIP"
                placeholder="127.0.0.1"
                value={companionIP}
                onChange={(e) => setCompanionIP(e.target.value)}
                style={{ width: 120 }}
            />
            <label htmlFor="companionPort">Port:</label>
            <input
                type="number"
                id="companionPort"
                placeholder={16622}
                value={companionPort}
                onChange={(e) => setCompanionPort(parseInt(e.target.value))}
                style={{ width: 60 }}
            />
            <button
                id="saveCompanion"
                style={{ width: 80 }}
                onClick={async () => {
                    await window.electronAPI.invoke('saveSettings', {
                        companionIP,
                        companionPort,
                    })

                    // Show status message
                    const status = document.getElementById('saveStatus')
                    status.textContent = '✅ Settings Saved!'

                    await loadCompanionSettings()

                    // Optionally clear the message after a few seconds
                    setTimeout(() => {
                        status.textContent = ''
                    }, 1000)
                }}
            >
                Save
            </button>
            <span id="saveStatus" style={{ marginLeft: 10, fontSize: '0.9em', color: 'green' }} />

            <hr />

            <button
                id="addDevice"
                ref={deviceListRef}
                onClick={async () => {
                    await window.electronAPI.invoke('createNewDevice')
                    await loadDevices()
                }}
            >
                + Add New ScreenDeck
            </button>

            <div id="deviceList" ref={addDeviceButtonRef}>
                {...devices.map((device) => (
                    <div key={device.deviceId} className="device">
                        <strong>{device.deviceId}</strong>
                        <hr />
                        <div
                            className="device-fields"
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'flex-start',
                            }}
                        >
                            <div
                                className="left-fields"
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '4px',
                                    marginRight: 20,
                                }}
                            >
                                {/* Columns */}
                                <label htmlFor="columns-count">
                                    Columns:
                                    <input
                                        id="columns-count"
                                        type="number"
                                        defaultValue={device.columnCount}
                                    />
                                </label>
                                {/* Rows */}
                                <label htmlFor="rows-count">
                                    Rows:
                                    <input
                                        id="rows-count"
                                        type="number"
                                        defaultValue={device.rowCount}
                                    />
                                </label>
                                {/* Bitmap */}
                                <label htmlFor="bitmap-size">
                                    Bitmap Size:
                                    <input
                                        id="bitmap-size"
                                        type="number"
                                        defaultValue={device.bitmapSize}
                                    />
                                </label>
                                <label htmlFor="background-color">
                                    Background Color:
                                    <input
                                        id="background-color"
                                        type="color"
                                        defaultValue={device.backgroundColor || '#000000'}
                                    />
                                </label>
                                <label htmlFor="background-opacity">
                                    Background Opacity:
                                    <input
                                        id="background-opacity"
                                        type="range"
                                        min={0}
                                        max={1}
                                        step={0.01}
                                        defaultValue={device.backgroundOpacity || 0.5}
                                        onInput={(e) => {
                                            const val = parseFloat(e.target.value)
                                            window.electronAPI.invoke('updateDeviceConfig', {
                                                deviceId: device.deviceId,
                                                config: {
                                                    backgroundOpacity: val,
                                                },
                                            })
                                        }}
                                    />
                                </label>
                            </div>
                            <div
                                className="right-fields"
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '4px',
                                    marginRight: 20,
                                }}
                            >
                                <label
                                    htmlFor="always-on-top"
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '4px',
                                    }}
                                >
                                    <input
                                        id="always-on-top"
                                        type="checkbox"
                                        defaultChecked={device.alwaysOnTop}
                                    />
                                    <span>Always On Top</span>
                                </label>
                                <label
                                    htmlFor="movable"
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '4px',
                                    }}
                                >
                                    <input
                                        id="movable"
                                        type="checkbox"
                                        defaultChecked={device.movable}
                                    />
                                    <span>Movable</span>
                                </label>
                                <label
                                    htmlFor="disable-press"
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '4px',
                                    }}
                                >
                                    <input
                                        id="disable-press"
                                        type="checkbox"
                                        defaultChecked={device.disablePress}
                                    />
                                    <span>Disable Button Presses</span>
                                </label>
                            </div>
                        </div>
                        <hr />
                        <div className="device-actions">
                            <button
                                style={{ marginRight: 5 }}
                                onClick={async () => {
                                    const config = {
                                        columnCount: parseInt(
                                            document.getElementById('columns-count').value,
                                            10
                                        ),
                                        rowCount: parseInt(
                                            document.getElementById('rows-count').value,
                                            10
                                        ),
                                        bitmapSize: parseInt(
                                            document.getElementById('bitmap-size').value,
                                            10
                                        ),
                                        alwaysOnTop:
                                            document.getElementById('always-on-top').checked,
                                        movable: document.getElementById('movable').checked,
                                        disablePress:
                                            document.getElementById('disable-press').checked,
                                        backgroundColor:
                                            document.getElementById('background-color').value,
                                        backgroundOpacity: parseFloat(
                                            document.getElementById('background-opacity').value
                                        ),
                                    }
                                    await window.electronAPI.invoke('updateDeviceConfig', {
                                        deviceId: device.deviceId,
                                        config,
                                    })

                                    showSavedNotification()
                                }}
                            >
                                Save
                            </button>
                            <button
                                style={{
                                    backgroundColor: '#f44336',
                                    color: 'white',
                                }}
                                onClick={async () => {
                                    if (confirm(`Delete device ${device.deviceId}?`)) {
                                        await window.electronAPI.invoke(
                                            'deleteDevice',
                                            device.deviceId
                                        )
                                        await loadDevices()
                                    }
                                }}
                            >
                                Delete
                            </button>
                            {showSaveConfirmation && (
                                <span
                                    className="save-confirmation"
                                    style={{
                                        marginLeft: 10,
                                        fontSize: '12px',
                                        color: '#4CAF50',
                                        opacity: 1,
                                        transition: 'opacity 0.3s ease',
                                    }}
                                >
                                    Settings saved!
                                </span>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

function Settings() {
    return (
        <>
            <WindowContainer />
        </>
    )
}

export default Settings
