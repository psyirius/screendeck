import { contextBridge, ipcRenderer } from 'electron'

console.log('[Preload:withArgs]:', process.argv)

// Custom APIs for renderer
const api = {
    // Wrapper for invoking IPC methods
    invoke: (channel: string, data?: any) =>
        ipcRenderer.invoke(channel, data),
    send: (channel: string, data?: any) =>
        ipcRenderer.send(channel, data),
    on: (channel: string, callback: any) =>
        ipcRenderer.on(channel, (event, data) => callback(event, data)),
}

// TODO: gen it with random with vite define
const ELECTRON_API_KEY = 'SCREENDECK_ELECTRON_API'; // sync with the renderer usage

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld(ELECTRON_API_KEY, api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window[ELECTRON_API_KEY] = api
}
