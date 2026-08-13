const debounce = (fn, wait, options) => {
    // options = { leading, trailing, maxWait }
    let idle = true;
    let timerId = null;
    let lastArg = null;
    let lastThis = null;
    let burstStartTime = null;

    let leading = options?.leading ?? false
    let trailing = options?.trailing ?? true
    let maxWait = options?.maxWait ?? Infinity

    if (maxWait && maxWait < wait) {
        throw new Error("maxWait cannot be smaller than wait")
    }
    const debounced = function (...args) {
        const onCallFired = async () => {
            // Begining of the burst we flip the switch and fire any leading call lined up
            // Subsequent calls between each burst cycle do not pass trhough this branch
            // We would just move on clearing the timer
            if (idle) {
                idle = false;
                lastThis = this;
                burstStartTime = Date.now()
                if (leading) {
                    await fn.apply(lastThis, args)
                }
            }

            // A bit confusing but debouncer resets its timer on each call fired 
            resetTimer()
        }
        const resetTimer = function () {
            lastArg = args

            if (Date.now() - burstStartTime >= maxWait) {
                return onMaxWaitReached()
            }

            clearTimeout(timerId)
            timerId = setTimeout(onCoolingOver, wait);
        }
        const onCoolingOver = () => {
            if (trailing) {
                fn.apply(lastThis, lastArg)
            }

            lastArg = null
            burstStartTime = null
            idle = true
        }
        const onMaxWaitReached = () => {
            clearTimeout(timerId)

            if (trailing) {
                fn.apply(lastThis, lastArg)
            }

            lastArg = null
            lastThis = null;
            burstStartTime = null;
            idle = true
        }

        return onCallFired()
    }

    debounced.cancel = () => {
        clearTimeout(timerId)
    }
    debounced.flush = () => {
        if (idle) {
            return
        }

        if (!lastArg && !timerId) {
            return
        }

        if (trailing) {
            fn.apply(lastThis, lastArg)
            lastArg = null
        }

        clearTimeout(timerId)
        burstStartTime = null;
        lastArg = null;
        lastThis = null;
        timerId = null;
        idle = true
    }

    return debounced
}

export default debounce;