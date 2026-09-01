import ConnectionState from './ConnectionState.js'
import transportFactory from './transportFactory.js'

// Some rough edges here and there. Mostly doing this for learning to model statemachines in js
// sort of manager. should maybe just move retries and all a level above
const createConnection = (factory, options) => {
    const maxRetries = options?.maxRetries ?? 10
    const initialDelay = options?.initialDelay ?? 100
    const maxDelay = options?.maxDelay ?? 10000

    const connectionTimeout = 100
    let connectionTimerId = null

    let state = ConnectionState.DISCONNECTED;

    let delay = null;
    let reconnectTimerId = null;
    let reconnectCount = 0;


    let transport = null;
    let lastTransportId = null;
    let lastTransportError = null;

    let udlisteners = new WeakMap();
    let sysListeners = new WeakMap();

    const connection = () => {
        switch (state) {
            case ConnectionState.DISCONNECTED:

                break;
            case ConnectionState.CONNECTING:

                break;
            case ConnectionState.CONNECTED:

                break;
            case ConnectionState.RECONNECTING:

                break;
            case ConnectionState.CLOSED:

                break;

            default:
                break;
        }
    }

    const waitForRetry = async () => {
        await new Promise((resolve) => {
            if (reconnectCount == 1) {
                delay = initialDelay
            } else {
                delay = Math.max(delay * 2, maxDelay)
            }

            reconnectTimerId = setTimeout(async () => {
                resolve()
            }, delay)
        })
    }

    const waitForConnection = async () => {
        await new Promise((resolve) => {
            connectionTimerId = setTimeout(() => {
                resolve()
            }, connectionTimeout)
        })
    }

    const reconnect = async () => {
        state = ConnectionState.RECONNECTING

        for (let retry = 0; retry < maxRetries; retry++) {
            reconnectCount += 1

            if (lastTransportError) throw new Error(lastTransportError)
            await waitForRetry()
            
            if (lastTransportError) throw new Error(lastTransportError)
            connection.connect()

            if (lastTransportError) throw new Error(lastTransportError)
            await waitForConnection()


            if (state == ConnectionState.CONNECTED) {
                return
            }

            state = ConnectionState.RECONNECTING
        }

        throw new Error("Max retries reached while reconnecting")
    }

    // Getting called twice so need to be careful causeing bug in here now
    const disconnect = (reason, cause) => {
        clearReconnect()
        
        transport = null
        lastTransportId = null
        lastTransportError = null
        
        state = ConnectionState.DISCONNECTED

        if (cause) {
            throw new Error(reason || "The connection disconnected for an unknown reason.", { cause })
        }
    }

    const clearReconnect = () => {
        if (reconnectTimerId) {
            clearTimeout(reconnectTimerId)
            reconnectTimerId = null
        }

        if (connectionTimerId) {
            clearTimeout(connectionTimerId)
            connectionTimerId = null
        }

        delay = null;
        reconnectCount = 0
    }

    // Wrap this in a transport obj dedicated to this ? 
    // This is just for learning so it should be fine like this for now
    const onOpenCB = async (id) => {
        if (id !== lastTransportId) return

        state = ConnectionState.CONNECTED
        clearReconnect()
        
        return new Promise((resolve) => {
            resolve(transport)
        })
    }
    const onCloseCB = async (id) => {
        if (state == ConnectionState.CONNECTING) return
        if (state == ConnectionState.DISCONNECTED) return
        if (id !== lastTransportId) return

        if (state == ConnectionState.CONNECTED) {
            try {
                await reconnect()
            } catch (error) {
                if (lastTransportError) {
                    lastTransportError = null
                } else {
                    disconnect(error.message, error)
                }
            }
        }
    }
    const onErrorCB = (error) => {
        if (state == ConnectionState.DISCONNECTED || 
            state == ConnectionState.CONNECTING ||
            state == ConnectionState.RECONNECTING
        ) {
            return
        }
        lastTransportError = error
        disconnect("An error occured in the transport", error)
    }
    const onMessageCB = () => {

    }
    const newTransport = () => {
        // instantiate transporter
        const tr = factory()
        // Register listeners
        tr.onOpen(onOpenCB)
        tr.onClose(onCloseCB)
        tr.onError(onErrorCB)
        tr.onMessage(onMessageCB)

        return tr
    }

    connection.connect = () => {
        if (state == ConnectionState.CONNECTING
            || state == ConnectionState.CONNECTED) {
            return
        }

        try {
            transport = newTransport()
            lastTransportId = transport.id
            state = ConnectionState.CONNECTING
        } catch (error) {
            state = ConnectionState.DISCONNECTED
            throw error;
        }

        return transport;
    }
    connection.send = (data) => {
        if (state !== ConnectionState.CONNECTED) {
            throw new Error("Cannot send message. Current state is: " + state)
        }

        transport.send(data)
    }
    connection.close = () => {
        clearTimeout(reconnectTimerId)
        reconnectTimerId = null
        reconnectCount = 0

        transport.close()
        transport = null
        lastTransportId = null
        lastTransportError = null

        state = ConnectionState.CLOSED
    }
    connection.getState = () => {
        return state;
    }
    connection.on = (event, callback) => {
        // Drop -> state = ConnectionState.RECONNECTING
        // Drop -> state = ConnectionState.RECONNECTING
        if (event == null || callback == null) {
            throw new Error("Event or Callback cannot be null.")
        }
        udlisteners.set(event, callback)
    }
    connection.getLastTransport = () => {
        return transport;
    }

    return connection
}

export default createConnection;