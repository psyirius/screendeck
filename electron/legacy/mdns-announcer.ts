import { Bonjour, Service } from '@julusian/bonjour-service'
import debounceFn from 'debounce-fn'
import * as os from 'node:os'
import { globalContext } from './global'

const instance = new Bonjour()

instance.find({ type: 'companion-satellite' }, function (service) {
    console.log('Found an companion-satellite server:', service)
})

export class MdnsAnnouncer {
    readonly #bonjour = new Bonjour()
    #bonjourService: Service | null = null

    // restart when port changes
    public readonly restart = debounceFn(
        () => {
            this.stop()
            this.start()
        },
        {
            wait: 50,
            before: false,
            after: true,
        }
    )

    constructor() {}

    public start() {
        try {
            const restServer = globalContext.webServer.server;
            const restEnabled = restServer.listening;
            // @ts-ignore
            const restPort = restServer.address()?.port || 0;
            if (!restEnabled || !restPort) {
                console.log('mDNS announcer: REST server not enabled, skipping mDNS advertisement.')
                return
            }
            const installationName = 'ScreenDeck ' + os.hostname()

            this.#bonjourService = this.#bonjour.publish(
                {
                    name: installationName,
                    type: 'companion-satellite',
                    protocol: 'tcp',
                    port: restPort,
                    txt: {
                        restEnabled: restEnabled,
                    },
                    ttl: 150,
                },
                {
                    announceOnInterval: 60 * 1000,
                }
            )

            console.log(`mDNS announcer: Advertising as "${installationName}" on port ${restPort}`)
        } catch (e) {
            console.error('Failed to setup mdns publisher', e)
        }
    }

    public stop(): void {
        if (this.#bonjourService) {
            this.#bonjourService.stop?.()
            this.#bonjourService = null
        }
    }
}
