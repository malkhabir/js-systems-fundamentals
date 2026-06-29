class Retryer {
    constructor(opt) {
        if (!this.isValid(opt))
            throw Error("The provided options obj is not valid")
        this.options = opt;
    }

    isValid(options) {
        return typeof options == "object" &&
            options !== null &&
            !Array.isArray(options);
    }

    isValidFn(f) {
        return typeof f == "function";
    }

    emptyFn(error, attempts) {
        return true;
    }

    // setup
    createTimer(ms) {
        const controller = new AbortController();
        const { signal } = controller;

        return {
            timer: new Promise((_, reject) => {
                if (signal.aborted) {
                    reject(new Error('Request returned before createTimer could start'));
                    return;
                }

                const id = setTimeout(() => {
                    reject(new Error("Request timed out"))
                }, ms);

                signal.addEventListener('abort', () => {
                    clearTimeout(id);
                }, { once: true });
            }),
            controller: controller
        }
    }

    async callback(func, maxAttempts, timeoutMs, retryIf, onRetry) {
        let _isInitialDelay = true;
        let _delayMs = Math.max(this.options?.initialDelay ?? 1000, 1);
        let _maxDelayMs = this.options?.maxDelay ?? 30000;
        let _backoffFactor = Math.max(this.options?.backoffFactor ?? 2, 1);

        let lastError = null;

        let timeoutTimer = null;
        let timeoutController = null;

        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            const promises = []

            if (timeoutMs != null && timeoutMs > 0) {
                const timeout = this.createTimer(timeoutMs)
                timeoutTimer = timeout.timer;
                timeoutController = timeout.controller;
                promises.push(timeoutTimer)
            }

            try {
                const result = typeof func === 'function' ?
                    func() : Promise.resolve(func);

                promises.push(result);

                const res = await Promise.race(promises)
                timeoutController?.abort()
                return res;

            } catch (error) {
                console.log(`Transient failure from callback with: "${error}"`)
                timeoutController?.abort()

                lastError = error;
                try {
                    if (!retryIf(error)) {
                        throw error;
                    }
                } catch (error) {
                    throw error;
                }

                if (attempt === maxAttempts) {
                    throw error;
                }

                onRetry(error, attempt)

                // If not the init delay, then update with backoffFactor
                if (!_isInitialDelay) {
                    const updatedDelay = _backoffFactor * _delayMs
                    _delayMs = Math.min(updatedDelay, _maxDelayMs)
                }
                
                // Jittered delay
                const jitDelay = _delayMs * (0.5 + Math.random() * 0.5)
                
                // Wait for delay
                await new Promise((resolve) => {
                    setTimeout(() => {
                        resolve()
                    }, jitDelay);
                })
            }
            _isInitialDelay = false;
        }
        throw lastError;
    }

    async start(fn) {
        if (!this.isValidFn(fn))
            throw new Error("The function fed to the retryer is invalid. Please pass in a valid function.")

        const _timeoutMs = this.options.timeout;
        const _maxAttempts = Math.max(this.options.maxAttempts ?? 3, 1);

        const _retryIf = this.options?.retryIf || this.emptyFn;
        const _onRetry = this.options?.onRetry || this.emptyFn;

        const callbackPromise = this.callback(
            fn, _maxAttempts, _timeoutMs, _retryIf, _onRetry)

        return await callbackPromise;
    }
}

const retry = async (fn, opts = {}) => {
    if (typeof fn !== 'function')
        throw new TypeError('First argument must be a function');

    if (typeof opts !== 'object')
        throw new TypeError('Second argument must be an object');

    const instance = new Retryer(opts);
    return await instance.start(fn);
};

export { retry };