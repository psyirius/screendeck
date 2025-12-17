import Fastify from 'fastify'
import socketioServer from 'fastify-socket.io'
import fastifyStatic from '@fastify/static'
import { globalContext } from './global'
import { showDeviceLabels, } from './device'
import { getNextProfileName } from './utils'
import { is } from '@electron-toolkit/utils'
import * as path from 'path'
import {
    createDevice,
    deleteDevice,
    deviceInit,
    emitKeyAction,
    getAllDevices,
    getDeviceConfig,
    getKeyConfig,
    getSettings,
    saveConnectionSettings,
    toggleKeyIsEncoder,
    updateDeviceConfig,
    updateKeyConfig,
} from './device-actions'

const webDevices = new Map<string, any>();

function getDevices(deviceId: string) {
    return webDevices.values().filter((device: any) => device.deviceId === deviceId);
}

export const webDeviceActions = {
    setDisablePress(deviceId: string, newState: boolean) {
        getDevices(deviceId).forEach((device: any) => {
            device.socket.emit('disablePress', newState)
        })
    },
    clearDeck(deviceId: string) {
        getDevices(deviceId).forEach((device: any) => {
            device.socket.emit('clearDeck')
        })
    },
    setBrightness(deviceId: string, percentage: number) {
        getDevices(deviceId).forEach((device: any) => {
            device.socket.emit('brightness', percentage)
        })
    },
    setLockedState(deviceId: string, data: any) {
        getDevices(deviceId).forEach((device: any) => {
            device.socket.emit('lockedState', data)
        })
    },
    identify(deviceId: string) {
        getDevices(deviceId).forEach((device: any) => {
            device.socket.emit('identify')
        })
    },
    draw(deviceId: string, data: any) {
        getDevices(deviceId).forEach((device: any) => {
            device.socket.emit('draw', data)
        })
    },
}

export async function initializeWebApi() {
    const fastify = Fastify({
        logger: is.dev
    })

    await fastify.register(socketioServer, {
        cors: {
            origin: '*',
            methods: ['GET', 'POST'],
        },
    })

    await fastify.register(fastifyStatic, {
        root: path.join(__dirname, '../renderer'),
        prefix: '/',
    })

    // REST API endpoints
    {
        fastify.get('/api/host', function (_request, reply) {
            reply.send(getSettings()['companionIP'])
        })

        fastify.post('/api/host', function (_request, reply) {
            // TODO:
            reply.send({})
        })

        fastify.get('/api/port', function (_request, reply) {
            reply.send(getSettings()['companionPort'])
        })

        fastify.post('/api/port', function (_request, reply) {
            // TODO:
            reply.send({})
        })

        fastify.get('/api/connected', function (_request, reply) {
            reply.send(globalContext.satelliteClient?.connected || false)
        })

        fastify.get('/api/config', function (_request, reply) {
            // TODO:
            reply.send({})
        })

        fastify.post('/api/config', function (_request, reply) {
            // TODO:
            reply.send({})
        })

        fastify.get('/api/status', function (_request, reply) {
            // TODO:
            reply.send({})
        })

        fastify.get('/api/surfaces', function (_request, reply) {
            // TODO:
            reply.send({})
        })

        fastify.post('/api/surfaces/rescan', function (_request, reply) {
            // TODO:
            reply.send({})
        })

        fastify.get('/api/surfaces/plugins/installed', function (_request, reply) {
            // TODO:
            reply.send({})
        })

        fastify.get('/api/surfaces/plugins/enabled', function (_request, reply) {
            // TODO:
            reply.send({})
        })

        fastify.post('/api/surfaces/plugins/enabled', function (_request, reply) {
            // TODO:
            reply.send({})
        })
    }

    const SOCKET_PORT = 3001

    fastify.ready((err) => {
        if (err) throw err

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const io = (fastify as any).io
        globalContext.webSocketServer = io

        console.log(`Socket.IO server ready on port ${SOCKET_PORT}`)

        io.on('connection', (socket) => {
            console.log('New Socket.IO connection:', socket.id);

            webDevices.set(socket.id, {
                socket,
            })

            socket.on('disconnect', () => {
                console.log('Socket.IO disconnected:', socket.id);
                webDevices.delete(socket.id);
            });

            // Helper to mimic ipcMain.handle (request-response)
            const handle = (eventName: string, handler: (data: any) => any) => {
                socket.on(eventName, async (data, callback) => {
                    try {
                        const result = await handler(data)
                        if (callback) callback({ success: true, data: result })
                    } catch (error: any) {
                        console.error(`Error in ${eventName} handler:`, error)
                        if (callback) callback({ success: false, error: error.message })
                    }
                })
            }

            // Helper to mimic ipcMain.on (one-way)
            const on = (eventName: string, handler: (data: any) => void) => {
                socket.on(eventName, (data) => {
                    try {
                        handler(data)
                    } catch (error) {
                        console.error(`Error in ${eventName} listener:`, error)
                    }
                })
            }

            // --- Implementation of Handlers matching ipcHandlers.ts ---

            handle('getDeviceConfig', (deviceId) => {
                webDevices.get(socket.id).deviceId = deviceId;
                return getDeviceConfig(deviceId)
            })

            handle('deviceInit', (deviceId) => {
                webDevices.get(socket.id).deviceId = deviceId;
                return deviceInit(deviceId)
            })

            handle('getKeypadBounds', (/*deviceId*/) => {
                // TODO: implement if needed
                return null
            })

            handle('resizeKeypadWindow', (/*{ deviceId, width, height }*/) => {
                // TODO: implement if needed
            })

            handle('closeKeypad', (/*deviceId*/) => {
                // TODO: implement if needed
            })

            // Handle keyPress events (one-way)
            on('keyPress', ({ deviceId, x, y, action }) => {
                return emitKeyAction(deviceId, x, y, action)
            })

            handle('getKeyConfig', ({ deviceId, keyIndex }) => {
                return getKeyConfig(deviceId, keyIndex)
            })

            handle('updateKeyConfig', ({ deviceId, keyIndex, config }) => {
                return updateKeyConfig(deviceId, keyIndex, config)
            })

            handle('toggleEncoder', ({ deviceId, keyIndex }) => {
                return toggleKeyIsEncoder(deviceId, keyIndex)
            })

            handle('setBrightness', (/*brightness*/) => {
                // TODO: implement if needed
            })

            // HOTKEYS
            handle('setHotkeyContext', (/*{ deviceId, keyIndex, image }*/) => {
                // TODO: implement if needed
            })

            handle('getHotkeyContext', () => {
                // TODO: implement if needed
            })

            handle('openHotkeyPrompt', () => {
                // TODO: implement if needed
            })

            handle('closeHotkeyPrompt', () => {
                // TODO: implement if needed
            })

            handle(
                'assignHotkey',
                (
                    {
                        /* deviceId, keyIndex, hotkey */
                    }
                ) => {
                    // TODO: implement if needed
                }
            )

            handle(
                'clearHotkey',
                (
                    {
                        /*deviceId, keyIndex, hotkey*/
                    }
                ) => {
                    // TODO: implement if needed
                }
            )

            // TODO: applicable?
            handle('showDeviceLabels', (show) => {
                showDeviceLabels(show)
            })

            // SETTINGS
            handle('createNewDevice', () => {
                return createDevice()
            })

            handle('getAllDevices', () => {
                return getAllDevices()
            })

            handle('updateDeviceConfig', ({ deviceId, config }) => {
                updateDeviceConfig(deviceId, config)
                // TODO: anything else to do here?
            })

            handle('deleteDevice', (deviceId) => {
                deleteDevice(deviceId)

                console.log(`Device ${deviceId} deleted via Socket.IO.`)
            })

            handle('getSettings', () => {
                return getSettings()
            })

            handle('saveSettings', (newSettings) => {
                saveConnectionSettings(newSettings)
            })

            handle('closeSettingsWindow', () => {
                // TODO: implement if needed
            })

            // TODO: applicable?
            handle('getNextProfileName', () => {
                return getNextProfileName()
            })
        })
    })

    try {
        // Serve on all interfaces to allow external connections
        await fastify.listen({ port: SOCKET_PORT, host: '0.0.0.0' })
        console.log(`Fastify server listening on port ${SOCKET_PORT}`)
    } catch (err) {
        fastify.log.error(err)
    }

    return fastify
}
