const CircuitState = Object.freeze({
    OPEN: "OPEN",
    HALFOPEN: "HALFOPEN",
    PROBING: "PROBING",
    CLOSED: "CLOSED"
})

export default CircuitState;

// Honestly would not be necessary in TS