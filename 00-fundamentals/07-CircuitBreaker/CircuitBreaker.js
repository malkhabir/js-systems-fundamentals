import CircuitOpenError from './CircuitError'
import CircuitState from './CircuitState';

const circuitBreaker = function (fn, options) {
    // Closed; Open; Half_Open
    let state = CircuitState.CLOSED; // HALFOPEN; OPEN;
    let func = fn;
    let _arg = null;
    let _this = null;
    let resetTimer = null;
    let failures = 0;
    let listeners = []
    let trueFunc = () => true

    const maxFailures = options?.failureThreshold ?? 1; 
    const resetTimeout = options?.resetTimeout ?? Infinity; 
    const isTransientFailure = options?.isFailure ?? trueFunc; 

    const breaker = async function (arg) {
        _arg = arg
        _this = this;

        const onCall = async () => {
            try {
                const result = await fn.apply(_this, _arg);
                scheduleClose()
                return result;
            } catch (error) {
                failures += 1;

                if (failures >= maxFailures) {
                    scheduleOpen()
                    throw new CircuitOpenError("Circuit reached max failure. The last error is: " + error.message, error)
                }

                if (isTransientFailure(error) 
                    && state == CircuitState.HALFOPEN) {
                    scheduleOpen()
                    throw new CircuitOpenError("Failed probe with the latest error: " + error.message, error)
                }

                if (isTransientFailure(error) 
                    && state == CircuitState.PROBING) {
                    scheduleOpen()
                    throw new CircuitOpenError("Failed probe with the latest error: " + error.message, error)
                }

                throw error
            }
        }
        const scheduleClose = () => {
            if (state !== CircuitState.CLOSED) {
                const previousState = state
                state = CircuitState.CLOSED
                notifyStateChange(previousState, state)
                failures = 0;
            }
        }
        const scheduleOpen = () => {
            const previousState = state
            state = CircuitState.OPEN;            
            notifyStateChange(previousState, state)
            scheduleHALFOPEN();
        }
        const scheduleHALFOPEN = () => {
            if (resetTimer) { return }
            resetTimer = setTimeout(() => {
                const previousState = state
                state = CircuitState.HALFOPEN
                failures = 0;
                resetTimer = null
                notifyStateChange(previousState, state)

            }, resetTimeout); 
        }
        const notifyStateChange = (from, to) => {
            if (!listeners || listeners.length == 0) return
            if (from == to) return 
            const sanitizedFrom = from == CircuitState.PROBING ? CircuitState.HALFOPEN : from
            const sanitizedTo = to == CircuitState.PROBING ? CircuitState.HALFOPEN : to
            
            listeners.forEach(fun => {
                fun(sanitizedFrom, sanitizedTo)
            })
        }

        switch (state) {
            case CircuitState.OPEN:
                // should each call that lands here push the wait ?
                scheduleHALFOPEN()
                throw new CircuitOpenError("A circuit open error occured. The circuit is currently opened")
                break;
            case CircuitState.PROBING:
                throw new CircuitOpenError("A probe is in flight wait for its result")
            case CircuitState.HALFOPEN:
                // not sure how to only allow one call to probe
                state = CircuitState.PROBING
                return onCall()
                break;
            case CircuitState.CLOSED:
                return onCall()
                break;
        
            default:
                throw new Error("Circuit in unknown state: " + state)
        }
    }

    breaker.getState = () => {
        return state == "PROBING" ? "HALFOPEN" : state 
    }

    breaker.onStateChange = (fn) => {
        listeners.push(fn)
    }

    breaker.reset = () => {
        state = CircuitState.CLOSED;
        clearTimeout(resetTimer)
        resetTimer = null;
        failures = 0;
    }

    return breaker
}

export default circuitBreaker;