class CircuitOpenError extends Error {
    constructor(message, cause) {
        super(message, { cause });
        this.name = 'CircuitOpenError'
        this.code = 'CIRCUITOPENERROR'
    }
}

export default CircuitOpenError