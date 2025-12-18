import type { components as openapiComponents } from '../generated/openapi'

export type ApiStatusResponse = openapiComponents['schemas']['StatusResponse']
export type ApiConfigData = openapiComponents['schemas']['ConfigData']
export type ApiConfigDataUpdate = openapiComponents['schemas']['ConfigDataUpdate']
export type ApiSurfaceInfo = openapiComponents['schemas']['SurfaceInfo']
export type ApiSurfacePluginInfo = openapiComponents['schemas']['SurfacePluginInfo']
export type ApiSurfacePluginsEnabled = Record<string, boolean>
