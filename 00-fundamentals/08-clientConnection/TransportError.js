class TransportError extends Error {
    constructor(message, cause) {
        super(message, { cause });
        this.name = 'TransportError'
    }
}

export default TransportError