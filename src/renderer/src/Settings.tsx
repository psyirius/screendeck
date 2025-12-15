// @ts-nocheck
import { useEffect, useState, useCallback } from 'react'
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card'
import { Button, buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogMedia,
} from "@/components/ui/alert-dialog"
import { IconTrash, IconDotsVertical, IconCopy, IconEye, IconEyeOff, IconAlertCircle } from '@tabler/icons-react'
import { Device } from '@/types'

const CompanionSettings = ({ ip, port, onSave }) => {
    const [localIp, setLocalIp] = useState(ip)
    const [localPort, setLocalPort] = useState(port)
    const [status, setStatus] = useState('')

    const [isDirty, setIsDirty] = useState(false)

    useEffect(() => {
        setLocalIp(ip)
        setLocalPort(port)
        setIsDirty(false)
    }, [ip, port])

    useEffect(() => {
        setIsDirty(localIp !== ip || localPort !== port)
    }, [localIp, localPort, ip, port])

    const handleSave = async () => {
        await onSave(localIp, localPort)
        setStatus('Saved!')
        setTimeout(() => setStatus(''), 2000)
    }

    const handleDiscard = () => {
        setLocalIp(ip)
        setLocalPort(port)
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Companion Connection</CardTitle>
                <CardDescription>Configure the connection to your Bitfocus Companion instance.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex flex-col gap-2">
                    <Label>IP Address</Label>
                    <Input
                        type="text"
                        value={localIp}
                        onChange={(e) => setLocalIp(e.target.value)}
                        placeholder="127.0.0.1"
                    />
                </div>
                <div className="flex flex-col gap-2">
                    <Label>Port</Label>
                    <Input
                        type="number"
                        value={localPort}
                        onChange={(e) => setLocalPort(parseInt(e.target.value) || 0)}
                        placeholder="16622"
                    />
                </div>
            </CardContent>
            <CardFooter className="flex justify-end border-t pt-4">
                {status && (
                    <span className="mr-4 text-sm text-green-600 font-medium animate-fade-in">
                        {status}
                    </span>
                )}
                <Button variant="ghost" onClick={handleDiscard} disabled={!isDirty} className="mr-2">
                    Discard
                </Button>
                <Button onClick={handleSave} disabled={!isDirty}>
                    Save
                </Button>
            </CardFooter>
        </Card>
    )
}

const DeviceAccordionItem = ({ device, onUpdate, onDelete, onDuplicate }) => {
    const [config, setConfig] = useState(device)
    const [status, setStatus] = useState('')
    const [isDirty, setIsDirty] = useState(false)
    const [showDeleteDialog, setShowDeleteDialog] = useState(false)

    useEffect(() => {
        setConfig(device)
        setIsDirty(false)
    }, [device])

    useEffect(() => {
        // Simple shallow comparison for dirty check or JSON check for deep
        setIsDirty(JSON.stringify(config) !== JSON.stringify(device))
    }, [config, device])

    const handleChange = (field: string, value: string | number | boolean) => {
        const newConfig = { ...config, [field]: value };
        setConfig(newConfig);
        // Auto-save enable toggle if changed via menu (optional, but good UX)
        if (field === 'enabled') {
            onUpdate(device.deviceId, newConfig);
        }
    }

    const handleSave = async () => {
        await onUpdate(device.deviceId, config)
        setStatus('Saved!')
        setTimeout(() => setStatus(''), 2000)
    }

    const handleDiscard = () => {
        setConfig(device)
    }

    return (
        <AccordionItem value={device.deviceId} className="bg-card border rounded-lg overflow-hidden has-data-[state=open]:shadow-sm transition-all duration-200">
            <div className="flex items-center w-full px-4 [&>*:first-child]:flex-1">
                <AccordionTrigger className="hover:no-underline py-4 items-center">
                    <div className="flex w-full items-center justify-between pr-2">
                        <div className="flex flex-col items-start gap-1 text-left">
                            <span className="font-semibold text-lg">
                                {config.name || "Stream Deck Device"}
                            </span>
                            <span className="font-mono text-xs text-muted-foreground">
                                ID: {device.deviceId}
                            </span>
                        </div>

                        <div onClick={(e) => e.stopPropagation()}>
                            <DropdownMenu>
                                <DropdownMenuTrigger className={buttonVariants({ variant: "ghost", size: "icon" }) + " h-8 w-8 text-muted-foreground hover:text-foreground"}>
                                    <IconDotsVertical size={18} />
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => handleChange('enabled', !config.enabled)}>
                                        {config.enabled ? <IconEyeOff size={16} className="mr-2" /> : <IconEye size={16} className="mr-2" />}
                                        {config.enabled ? 'Disable' : 'Enable'}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => onDuplicate(device.deviceId)}>
                                        <IconCopy size={16} className="mr-2" />
                                        Duplicate
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                        className="text-destructive focus:text-destructive"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setShowDeleteDialog(true);
                                        }}
                                    >
                                        <IconTrash size={16} className="mr-2" />
                                        Delete
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>

                            {/* TODO: make it destructive */}
                            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogMedia>
                                            <IconTrash />
                                        </AlertDialogMedia>
                                        <AlertDialogTitle>Delete Device?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            Are you sure you want to delete <strong>{device.name || 'this device'}</strong>?
                                            This action cannot be undone.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction
                                            onClick={() => onDelete(device.deviceId)}
                                        >
                                            Delete
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>
                    </div>
                </AccordionTrigger>
            </div>

            <AccordionContent className="p-0 border-t">
                <div className="p-4 space-y-6">
                    <div className="flex flex-col gap-2">
                        <Label>Device Name</Label>
                        <Input
                            type="text"
                            value={config.name || ''}
                            onChange={(e) => handleChange('name', e.target.value)}
                            placeholder="My Stream Deck"
                        />
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="flex flex-col gap-2">
                            <Label>Columns</Label>
                            <Input
                                type="number"
                                value={config.columnCount}
                                onChange={(e) => handleChange('columnCount', parseInt(e.target.value) || 0)}
                            />
                        </div>
                        <div className="flex flex-col gap-2">
                            <Label>Rows</Label>
                            <Input
                                type="number"
                                value={config.rowCount}
                                onChange={(e) => handleChange('rowCount', parseInt(e.target.value) || 0)}
                            />
                        </div>
                        <div className="flex flex-col gap-2">
                            <Label>Bitmap Size</Label>
                            <Input
                                type="number"
                                value={config.bitmapSize}
                                onChange={(e) => handleChange('bitmapSize', parseInt(e.target.value) || 0)}
                            />
                        </div>
                        <div className="flex flex-col gap-2">
                            <Label>Bg Color</Label>
                            <div className="flex items-center gap-2">
                                <Input
                                    type="color"
                                    className="h-9 w-12 p-0 border-0 rounded cursor-pointer"
                                    value={config.backgroundColor || '#000000'}
                                    onChange={(e) => handleChange('backgroundColor', e.target.value)}
                                />
                                <span className="text-xs text-muted-foreground font-mono">
                                    {config.backgroundColor}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col gap-2">
                        <div className="flex justify-between">
                            <Label>Background Opacity</Label>
                            <span className="text-sm text-muted-foreground">{Math.round((config.backgroundOpacity ?? 0.5) * 100)}%</span>
                        </div>
                        <Slider
                            value={[config.backgroundOpacity ?? 0.5]}
                            min={0}
                            max={1}
                            step={0.05}
                            onValueChange={(val) => handleChange('backgroundOpacity', val)}
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div className="flex items-center space-x-2">
                            {/* Functionality moved to menu, but keeping visible switch for clarity if desired, or removing? 
                                 User said "move... to that menu" for delete, but for show/hide they said "add... in that menu". 
                                 I'll keep the switch for visibility but the menu also toggles it. 
                             */}
                            <Switch id={`enabled-${device.deviceId}`} checked={config.enabled ?? true} onCheckedChange={(c) => handleChange('enabled', c)} />
                            <Label htmlFor={`enabled-${device.deviceId}`}>Enabled</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Switch id={`top-${device.deviceId}`} checked={config.alwaysOnTop} onCheckedChange={(c) => handleChange('alwaysOnTop', c)} />
                            <Label htmlFor={`top-${device.deviceId}`}>Always On Top</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Switch id={`move-${device.deviceId}`} checked={config.movable} onCheckedChange={(c) => handleChange('movable', c)} />
                            <Label htmlFor={`move-${device.deviceId}`}>Movable</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Switch id={`press-${device.deviceId}`} checked={config.disablePress} onCheckedChange={(c) => handleChange('disablePress', c)} />
                            <Label htmlFor={`press-${device.deviceId}`}>Disable Presses</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Switch id={`auto-${device.deviceId}`} checked={config.autoHide} onCheckedChange={(c) => handleChange('autoHide', c)} />
                            <Label htmlFor={`auto-${device.deviceId}`}>Auto-Hide</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Switch id={`empty-${device.deviceId}`} checked={config.hideEmptyKeys} onCheckedChange={(c) => handleChange('hideEmptyKeys', c)} />
                            <Label htmlFor={`empty-${device.deviceId}`}>Hide Empty Keys</Label>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end items-center border-t bg-muted/20 p-4">
                    {status && (
                        <span className="mr-4 text-sm text-green-600 font-medium animate-fade-in">
                            {status}
                        </span>
                    )}
                    <Button variant="ghost" onClick={handleDiscard} disabled={!isDirty} className="mr-2">
                        Discard
                    </Button>
                    <Button onClick={handleSave} disabled={!isDirty}>
                        Save
                    </Button>
                </div>
            </AccordionContent>
        </AccordionItem>
    )
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

    const handleSaveCompanion = async (ip: any, port: any) => {
        await window.electronAPI.invoke('saveSettings', { companionIP: ip, companionPort: port })
        await refreshData()
    }

    const handleUpdateDevice = async (deviceId: any, config: any) => {
        await window.electronAPI.invoke('updateDeviceConfig', { deviceId, config })
        await refreshData()
    }

    const handleDeleteDevice = async (deviceId: any) => {
        await window.electronAPI.invoke('deleteDevice', deviceId)
        await refreshData()
    }

    const handleAddDevice = async () => {
        await window.electronAPI.invoke('createNewDevice')
        await refreshData()
    }

    const handleDuplicateDevice = async (deviceId: string) => {
        const deviceToCopy = devices.find(d => d.deviceId === deviceId);
        if (!deviceToCopy) return;

        // Create new device to get a new ID
        await window.electronAPI.invoke('createNewDevice');

        // Fetch list to find the new device
        const allDevices = await window.electronAPI.invoke('getAllDevices');
        // Assuming the new device is the one that wasn't there before, or the last one.
        // A safer way is to find the one that is NOT in the current 'devices' list.
        const currentIds = new Set(devices.map(d => d.deviceId));
        const newDevice = allDevices.find((d: Device) => !currentIds.has(d.deviceId));

        if (newDevice) {
            // Copy config but keep new ID and maybe append "Copy" to name
            const newConfig = {
                ...deviceToCopy,
                deviceId: newDevice.deviceId,
                name: `${deviceToCopy.name || 'Device'} (Copy)`
            };
            await window.electronAPI.invoke('updateDeviceConfig', { deviceId: newDevice.deviceId, config: newConfig });
            await refreshData();
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12 text-muted-foreground animate-pulse h-screen">
                Loading settings...
            </div>
        )
    }

    return (
        <div className="p-8 max-w-5xl mx-auto font-sans text-foreground">
            <div className="flex justify-between items-center mb-8 border-b pb-4 border-border">
                <h1 className="text-3xl font-bold">
                    ScreenDeck Configuration
                </h1>
            </div>

            <Tabs defaultValue="devices" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-8">
                    <TabsTrigger value="devices">Devices</TabsTrigger>
                    <TabsTrigger value="connection">Connection</TabsTrigger>
                </TabsList>

                <TabsContent value="connection">
                    <CompanionSettings
                        ip={companionSettings.ip}
                        port={companionSettings.port}
                        onSave={handleSaveCompanion}
                    />
                </TabsContent>

                <TabsContent value="devices">
                    <div className="mb-6 p-6 rounded-lg border bg-card text-card-foreground shadow-sm flex flex-col items-center justify-center gap-4">
                        <div className="text-center">
                            <h3 className="text-lg font-semibold">Manage Devices</h3>
                            <p className="text-sm text-muted-foreground">Configure your virtual stream decks below.</p>
                        </div>
                        <Button onClick={handleAddDevice} size="lg" className="w-full sm:w-auto">
                            <span className="text-lg leading-none mr-2">+</span> Add New Device
                        </Button>
                    </div>

                    {devices.length === 0 ? (
                        <div className="text-center p-16 border-2 border-dashed border-muted rounded-xl bg-muted/20 text-muted-foreground mt-8">
                            <p className="mb-2 text-xl font-medium">No devices configured.</p>
                            <p className="text-sm">Click "Add New Device" above to get started.</p>
                        </div>
                    ) : (
                        <Accordion type="single" className="w-full flex flex-col gap-4">
                            {devices.map((dev) => (
                                <DeviceAccordionItem
                                    key={dev.deviceId}
                                    device={dev}
                                    onUpdate={handleUpdateDevice}
                                    onDelete={handleDeleteDevice}
                                    onDuplicate={handleDuplicateDevice}
                                />
                            ))}
                        </Accordion>
                    )}
                </TabsContent>
            </Tabs>
        </div >
    )
}

export default Settings
