// Not my code. This is AI generated
function transportFactory() {
    let lastTransport = null

    const factory = () => {
        const listeners = { open: [], close: [], error: [], message: [] }
        const id = Math.random(0,1) * 1000
        const err = new Error("My lovely error")
        const transport = {
            id: id,
            send: (data) => { /* record it, or no-op */ },
            close: () => { /* trigger its own onClose, or just mark closed */ },
            onOpen: (cb) => listeners.open.push(cb),
            onClose: (cb) => listeners.close.push(cb),
            onError: (cb) => listeners.error.push(cb),
            onMessage: (cb) => listeners.message.push(cb),
            // test-only hooks, not part of the real transport interface:
            _simulateOpen: () => listeners.open.map(cb => cb(id)),
            _simulateClose: () => listeners.close.map(cb => cb(id)),
            _simulateError: () => listeners.error.map(cb => cb(err, id))
        }
        lastTransport = transport
        return transport
    }

    factory.getLastTransport = () => lastTransport
    return factory
}

export default transportFactory;