// @ts-nocheck
import React, { useEffect, useState } from 'react'

function injectCSS() {
    if (injectCSS.injected) return

    const styles = `
body {
    font-family: sans-serif;
    margin: 20px;
}
#keyPreview {
    width: 72px;
    height: 72px;
    background: #222;
    margin-bottom: 10px;
}
.modifiers button {
    margin: 5px;
}
.hotkey-preview {
    margin: 10px 0;
    font-weight: bold;
}
table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 20px;
}
th,
td {
    border: 1px solid #ccc;
    padding: 4px;
    text-align: left;
}
.reserved-keys {
    font-size: 0.9em;
    color: gray;
    margin-top: 20px;
}

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
    `
    const styleSheet = document.createElement('style')
    styleSheet.innerText = styles
    document.head.appendChild(styleSheet)

    injectCSS.injected = true
}

function renderBitmap(container, bitmapBase64) {
    requestAnimationFrame(() => {
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

            // Make the canvas scale to fill the container
            canvas.style.width = '100%'
            canvas.style.height = '100%'
            canvas.style.objectFit = 'contain' // Optional for padding behavior

            const ctx = canvas.getContext('2d')
            const imageData = ctx.createImageData(size, size)

            for (let i = 0, j = 0; i < bytes.length; i += 3, j += 4) {
                imageData.data[j] = bytes[i]
                imageData.data[j + 1] = bytes[i + 1]
                imageData.data[j + 2] = bytes[i + 2]
                imageData.data[j + 3] = 255
            }

            ctx.putImageData(imageData, 0, 0)
        } catch (err) {
            console.error('Error decoding bitmap:', err)
        }
    })
}

const _init = () => {
    injectCSS();

    let modifiers = new Set()
    let primaryKey = ''
    let deviceId = ''
    let keyIndex = ''

    // Get initial data
    window.electronAPI.invoke('getHotkeyContext').then((data) => {
        deviceId = data.deviceId
        keyIndex = data.keyIndex

        document.getElementById('deviceId').textContent = deviceId
        document.getElementById('keyIndex').textContent = keyIndex

        // If there's a bitmap, show it
        const keyPreview = document.getElementById('keyPreview')
        keyPreview.innerHTML = '' // Clear previous content
        if (data.imageBase64) {
            renderBitmap(keyPreview, data.imageBase64)
        }

        // Load current hotkeys
        updateHotkeyList(data.currentHotkeys)
    })

    // Modifier button clicks
    document.querySelectorAll('.modifiers button').forEach((btn) => {
        btn.addEventListener('click', () => {
            const mod = btn.getAttribute('data-mod')
            if (modifiers.has(mod)) {
                modifiers.delete(mod)
                btn.classList.remove('active')
            } else {
                modifiers.add(mod)
                btn.classList.add('active')
            }
            updatePreview()
        })
    })

    // Primary key input
    document.getElementById('primaryKey').addEventListener('input', (e) => {
        primaryKey = e.target.value.toUpperCase()
        updatePreview()
    })

    function updatePreview() {
        const modStr = Array.from(modifiers).join('+')

        document.getElementById('hotkeyPreview').textContent = modStr
            ? `${modStr}+${primaryKey}`
            : primaryKey
    }

    function updateHotkeyList(hotkeys) {
        const tbody = document.getElementById('hotkeyList')
        tbody.innerHTML = ''

        hotkeys.forEach((h) => {
            const tr = document.createElement('tr')

            // Create a cell for the bitmap canvas
            const tdCanvas = document.createElement('td')
            const container = document.createElement('div')
            container.style.width = '32px'
            container.style.height = '32px'
            container.style.display = 'inline-block'
            container.style.verticalAlign = 'middle'
            tdCanvas.appendChild(container)

            if (h.imageBase64) {
                renderBitmap(container, h.imageBase64)
            }

            tr.appendChild(tdCanvas)

            // Add other data cells
            const tdHotkey = document.createElement('td')
            tdHotkey.textContent = h.hotkey
            tr.appendChild(tdHotkey)

            const tdDeviceId = document.createElement('td')
            tdDeviceId.textContent = h.deviceId
            tr.appendChild(tdDeviceId)

            const tdKeyIndex = document.createElement('td')
            tdKeyIndex.textContent = h.keyIndex
            tr.appendChild(tdKeyIndex)

            // Add Clear button
            const tdButton = document.createElement('td')
            const btn = document.createElement('button')
            btn.textContent = 'Clear'
            btn.addEventListener('click', () => {
                window.electronAPI
                    .invoke('clearHotkey', {
                        deviceId: h.deviceId,
                        keyIndex: h.keyIndex,
                        hotkey: h.hotkey,
                    })
                    .then(() => window.location.reload())
            })
            tdButton.appendChild(btn)
            tr.appendChild(tdButton)

            tbody.appendChild(tr)
        })
    }

    document.getElementById('assignHotkey').addEventListener('click', () => {
        if (!primaryKey) {
            alert('Please enter a key')
            return
        }

        if (modifiers.size === 0) {
            alert('Please include at least one modifier key (Ctrl, Alt, Cmd, Shift)')
            return
        }

        const hotkeyStr = Array.from(modifiers).join('+') + `+${primaryKey}`

        window.electronAPI
            .invoke('assignHotkey', {
                deviceId,
                keyIndex,
                hotkey: hotkeyStr,
            })
            .then(() => {
                window.close()
            })
    })

    document.getElementById('cancel').addEventListener('click', () => {
        window.electronAPI.invoke('closeHotkeyPrompt')
    })

    document.getElementById('closeButton').addEventListener('click', () => {
        window.electronAPI.invoke('closeHotkeyPrompt')
    })
}

function HotkeyPrompt() {
    const [initialized, setInitialized] = useState(false)

    useEffect(() => {
        console.log('WindowContainer mounted')

        if (!initialized) {
            _init()
            setInitialized(true)
        }
    })

    return (
        <>
            <button id="closeButton" className="close-button-settings">
                ×
            </button>
            <h2>Assign Hotkey</h2>
            <div id="keyPreview" />
            <div>
                <strong>Device:</strong> <span id="deviceId" />
            </div>
            <div>
                <strong>Key:</strong> <span id="keyIndex" />
            </div>
            <div className="modifiers">
                <button data-mod="Ctrl">Ctrl</button>
                <button data-mod="Alt">Alt</button>
                <button data-mod="Shift">Shift</button>
                <button data-mod="Cmd">Cmd</button>
            </div>
            <input type="text" id="primaryKey" placeholder="Enter key (e.g., A, 1)" />
            <div className="hotkey-preview" id="hotkeyPreview" />
            <button id="assignHotkey">Assign Hotkey</button>
            <button id="cancel">Cancel</button>
            <h3>Currently Assigned Hotkeys</h3>
            <table>
                <thead>
                    <tr>
                        <th>&nbsp;</th>
                        <th>Hotkey</th>
                        <th>Device</th>
                        <th>Key</th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody id="hotkeyList" />
            </table>
            <div className="reserved-keys">
                <h4>Common OS-Reserved Hotkeys</h4>
                <ul>
                    <li>Cmd+Q (Quit App)</li>
                    <li>Cmd+W (Close Window)</li>
                    <li>Alt+Tab (App Switcher)</li>
                    <li>Cmd+Tab (App Switcher on Mac)</li>
                    {/* add more */}
                </ul>
            </div>
        </>
    )
}

export default HotkeyPrompt
