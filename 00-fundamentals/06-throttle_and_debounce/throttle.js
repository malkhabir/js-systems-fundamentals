const throttle = (fn, wait, options) => {
    // Closure on these states by throttled
    let lastArgs = null
    let lastThis = null
    let lastResult = null
    let timerId = null
    let isIdle = true

    // We've got two states idle and cooling. 
    // idle is when nothing is going on in the throttler.
    // cooling is when throttler is running a timer and cannot execute any function

    const leading = options?.leading ?? true;
    const trailing = options?.trailing ?? false;

    const throttled = async function (...args) {
        const onCallFired = async () => {
            if (isIdle) {

                // To make sure that the gate is closed in case we are dealign with an async fn
                timerId = setTimeout(onCoolingOver, wait)
                isIdle = false
                
                if (leading) {
                    try {
                        lastResult = await fn.apply(this, args)
                    } catch (error) {
                        lastArgs = null
                        lastThis = null
                        lastResult = null
                        timerId = null
                        isIdle = true

                        throw new Error("Error occured when making a leading call: " + error.message)
                    }
                }

                lastArgs = args
                lastThis = this

                return lastResult
            } else {
                lastArgs = args
                lastThis = this
            }
        }
        const onCoolingOver = () => {
            try {
                if (trailing && lastArgs) {
                    lastResult = fn.apply(lastThis, lastArgs)
                }

                return lastResult

            } finally {
                isIdle = true
                lastArgs = null
                lastThis = null
            }


        }
        return onCallFired()
    }

    throttled.cancel = () => {
        lastArgs = null
        lastThis = null
        lastResult = null
        isIdle = true

        clearTimeout(timerId)
        timerId = null
    }
    throttled.flush = () => {
        if (isIdle) {
            return
        }

        if (!lastArgs && !timerId) {
            return
        }

        fn.apply(lastThis, lastArgs)
        clearTimeout(timerId)
        timerId = null

        lastArgs = null
        lastThis = null
        lastResult = null
        isIdle = true
    }

    return throttled;
}

export default throttle;