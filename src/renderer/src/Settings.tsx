import { useEffect, useState, useCallback } from 'react'

// --- Components ---
const CompanionSettings = ({ ip, port, onSave }) => {
    const [localIp, setLocalIp] = useState(ip)
    const [localPort, setLocalPort] = useState(port)
    const [status, setStatus] = useState('')

    useEffect(() => {
        setLocalIp(ip)
        setLocalPort(port)
    }, [ip, port])

    const handleSave = async () => {
        await onSave(localIp, localPort)
        setStatus('Saved!')
        setTimeout(() => setStatus(''), 2000)
    }

    return (
        <div className="mb-8 bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">Companion Connection</h2>
            <div className="flex flex-wrap gap-6 items-end">
                <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-gray-700">IP Address</label>
                    <input
                        type="text"
                        className="p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-700"
                        value={localIp}
                        onChange={(e) => setLocalIp(e.target.value)}
                        placeholder="127.0.0.1"
                    />
                </div>
                <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-gray-700">Port</label>
                    <input
                        type="number"
                        className="p-2 w-24 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-700"
                        value={localPort}
                        onChange={(e) => setLocalPort(parseInt(e.target.value) || 0)}
                        placeholder="16622"
                    />
                </div>
                <div className="flex items-center gap-4">
                    <button
                        className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded transition-colors font-medium shadow-sm"
                        onClick={handleSave}
                    >
                        Save Connection
                    </button>
                    {status && (
                        <span className="text-sm text-green-600 font-medium animate-fade-in">
                            {status}
                        </span>
                    )}
                </div>
            </div>
        </div>
    )
}

const DeviceItem = ({ device, onUpdate, onDelete }) => {
    const [config, setConfig] = useState({ ...device })
    const [status, setStatus] = useState('')

    useEffect(() => {
        setConfig((prev: any) => ({ ...prev, ...device }))
    }, [device])

    const handleChange = (field: string, value: string | number | boolean) => {
        setConfig((prev: any) => ({ ...prev, [field]: value }))
    }

    const handleSave = async () => {
        await onUpdate(device.deviceId, config)
        setStatus('Saved!')
        setTimeout(() => setStatus(''), 2000)
    }

    return (
        <div className="border border-gray-200 p-5 mb-4 rounded-lg bg-gray-50 flex flex-col gap-4 shadow-sm">
            <div className="flex justify-between items-center border-b border-gray-200 pb-3">
                <span className="font-bold text-gray-700">
                    ID: <span className="font-mono text-gray-600 text-sm">{device.deviceId}</span>
                </span>
                <button
                    className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white text-xs font-semibold rounded transition-colors"
                    onClick={() => onDelete(device.deviceId)}
                >
                    Remove
                </button>
            </div>

            <div className="flex flex-wrap gap-6">
                <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-gray-600 uppercase">Columns</label>
                    <input
                        type="number"
                        className="p-2 w-20 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                        value={config.columnCount}
                        onChange={(e) => handleChange('columnCount', parseInt(e.target.value) || 0)}
                    />
                </div>
                <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-gray-600 uppercase">Rows</label>
                    <input
                        type="number"
                        className="p-2 w-20 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                        value={config.rowCount}
                        onChange={(e) => handleChange('rowCount', parseInt(e.target.value) || 0)}
                    />
                </div>
                <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-gray-600 uppercase">
                        Bitmap Size
                    </label>
                    <input
                        type="number"
                        className="p-2 w-24 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                        value={config.bitmapSize}
                        onChange={(e) => handleChange('bitmapSize', parseInt(e.target.value) || 0)}
                    />
                </div>
                <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-gray-600 uppercase">
                        Bg Color
                    </label>
                    <div className="flex items-center gap-2">
                        <input
                            type="color"
                            className="h-9 w-12 p-0 border-0 rounded cursor-pointer"
                            value={config.backgroundColor || '#000000'}
                            onChange={(e) => handleChange('backgroundColor', e.target.value)}
                        />
                        <span className="text-xs text-gray-500 font-mono">
                            {config.backgroundColor}
                        </span>
                    </div>
                </div>
                <div className="flex flex-col gap-1 flex-1 min-w-50">
                    <label className="text-xs font-semibold text-gray-600 uppercase flex justify-between">
                        <span>Bg Opacity</span>
                        <span>{Math.round((config.backgroundOpacity ?? 0.5) * 100)}%</span>
                    </label>
                    <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500 mt-2"
                        value={config.backgroundOpacity ?? 0.5}
                        onChange={(e) =>
                            handleChange('backgroundOpacity', parseFloat(e.target.value))
                        }
                    />
                </div>
            </div>

            <div className="flex flex-wrap gap-x-6 gap-y-3 mt-2 p-3 bg-white rounded border border-gray-100">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                        type="checkbox"
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                        checked={config.alwaysOnTop}
                        onChange={(e) => handleChange('alwaysOnTop', e.target.checked)}
                    />
                    <span className="text-sm text-gray-700">Always On Top</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                        type="checkbox"
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                        checked={config.movable}
                        onChange={(e) => handleChange('movable', e.target.checked)}
                    />
                    <span className="text-sm text-gray-700">Movable</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                        type="checkbox"
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                        checked={config.disablePress}
                        onChange={(e) => handleChange('disablePress', e.target.checked)}
                    />
                    <span className="text-sm text-gray-700">Disable Presses</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                        type="checkbox"
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                        checked={config.autoHide}
                        onChange={(e) => handleChange('autoHide', e.target.checked)}
                    />
                    <span className="text-sm text-gray-700">Auto-Hide</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                        type="checkbox"
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                        checked={config.hideEmptyKeys}
                        onChange={(e) => handleChange('hideEmptyKeys', e.target.checked)}
                    />
                    <span className="text-sm text-gray-700">Hide Empty Keys</span>
                </label>
            </div>

            <div className="mt-2 flex justify-end items-center gap-4">
                {status && (
                    <span className="text-sm text-green-600 font-medium animate-fade-in">
                        {status}
                    </span>
                )}
                <button
                    className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded shadow-sm transition-colors font-medium"
                    onClick={handleSave}
                >
                    Save Device Settings
                </button>
            </div>
        </div>
    )
}

type Device = {
    deviceId: string
    columnCount: number
    rowCount: number
    bitmapSize: number
    backgroundColor?: string
    backgroundOpacity?: number
    alwaysOnTop: boolean
    movable: boolean
    disablePress: boolean
    autoHide: boolean
    hideEmptyKeys: boolean
}

const Settings = () => {
    const [devices, setDevices] = useState<Device[]>([])
    const [companionSettings, setCompanionSettings] = useState({ ip: '127.0.0.1', port: 16622 })
    const [loading, setLoading] = useState(true)

    const refreshData = useCallback(async () => {
        setLoading(true)
        try {
            const [allDevices, settings] = await Promise.all([
                window.electronAPI.invoke('getAllDevices'),
                window.electronAPI.invoke('getSettings'),
            ])

            setDevices(allDevices || [])
            setCompanionSettings({
                ip: settings.companionIP || '127.0.0.1',
                port: settings.companionPort || 16622,
            })
        } catch (err) {
            console.error('Failed to load settings', err)
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        refreshData()
    }, [refreshData])

    const handleSaveCompanion = async (ip, port) => {
        await window.electronAPI.invoke('saveSettings', { companionIP: ip, companionPort: port })
        refreshData()
    }

    const handleUpdateDevice = async (deviceId, config) => {
        await window.electronAPI.invoke('updateDeviceConfig', { deviceId, config })
        refreshData()
    }

    const handleDeleteDevice = async (deviceId) => {
        if (confirm(`Are you sure you want to remove device ${deviceId}?`)) {
            await window.electronAPI.invoke('deleteDevice', deviceId)
            refreshData()
        }
    }

    const handleAddDevice = async () => {
        await window.electronAPI.invoke('createNewDevice')
        refreshData()
    }

    return (
        <div className="p-6 max-w-4xl mx-auto font-sans text-gray-800">
            <h1 className="text-2xl font-bold mb-6 text-gray-900 border-b pb-2 border-gray-200">
                ScreenDeck Configuration
            </h1>

            <CompanionSettings
                ip={companionSettings.ip}
                port={companionSettings.port}
                onSave={handleSaveCompanion}
            />

            <div className="mb-10">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-semibold text-gray-800">Devices</h2>
                    <button
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md shadow transition-colors font-medium flex items-center gap-2"
                        onClick={handleAddDevice}
                    >
                        <span className="text-lg leading-none">+</span> Add Device
                    </button>
                </div>

                {loading ? (
                    <div className="text-center p-8 text-gray-500 animate-pulse">
                        Loading settings...
                    </div>
                ) : devices.length === 0 ? (
                    <div className="text-center p-12 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 text-gray-500">
                        <p className="mb-2 text-lg">No devices configured.</p>
                        <p className="text-sm">Click "Add Device" to create your first deck.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {devices.map((dev) => (
                            <DeviceItem
                                key={dev.deviceId}
                                device={dev}
                                onUpdate={handleUpdateDevice}
                                onDelete={handleDeleteDevice}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

export default Settings
