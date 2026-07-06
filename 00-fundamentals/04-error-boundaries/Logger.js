class Logger {
    constructor(type) {
        this.type = type
    }

    log(msg) {
        console.log("type: " + msg)
    }
}

export { Logger }