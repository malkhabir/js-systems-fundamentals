import { expect, it, describe } from 'vitest'
import circuitBreaker from './CircuitBreaker'
import CircuitOpenError from './CircuitError'
import CircuitState from './CircuitState';

describe('CircuitBreaker', () => {
    it('Circuit opens after consecutive failures', async () => {
        const failingFnMsg = "System down"
        const failingFn = () => Promise.reject(new Error(failingFnMsg))
        const breaker = circuitBreaker(failingFn, {
            failureThreshold: 3,
            resetTimeout: 100
        })
        await expect(breaker()).rejects.toThrow(Error('System down'))
        await expect(breaker()).rejects.toThrow(Error('System down'))
        await expect(breaker()).rejects.toThrow("Circuit reached max failure. The last error is: " + failingFnMsg)
        await expect(breaker.getState()).toBe(CircuitState.OPEN)

    })
    it('Circuit opened throws on call', async () => {
        const failingFnMsg = "System down"
        const failingFn = () => Promise.reject(new Error(failingFnMsg))        
        const breaker = circuitBreaker(failingFn, {
            failureThreshold: 2,
            resetTimeout: 100
        })
        await expect(breaker()).rejects.toThrow(Error('System down'))
        // Circuit is now open
        await expect(breaker()).rejects.toThrow("Circuit reached max failure. The last error is: " + failingFnMsg)
        
        await expect(breaker.getState()).toBe(CircuitState.OPEN)

        // Check that it is indeed opened
        await expect(breaker()).rejects.toThrow("A circuit open error occured. The circuit is currently opened")
    })
    it('Probe success closes the circuit', async () => {
        const failingFnMsg = "System down"
        let counter = 0
        const failingFn = () => {
            // Rejects twice then resolves on the third call.
            if (counter < 2) {
                counter++
                return Promise.reject(new Error(failingFnMsg))
            } else {
                return Promise.resolve("Ouhh Ouhh")
            }
        }        
        const breaker = circuitBreaker(failingFn, {
            failureThreshold: 2,
            resetTimeout: 100
        })
        await expect(breaker()).rejects.toThrow(Error('System down'))
        await expect(breaker()).rejects.toThrow("Circuit reached max failure. The last error is: " + failingFnMsg)
        
        // Circuit is now open
        await expect(breaker.getState()).toBe(CircuitState.OPEN)

        // Wait for transition into HalfOpen. Transition should happen in resetTimeout
        await new Promise (resolve => {
            setTimeout(() => {
                resolve()
            }, 200)
        })

        // Making sure that transition into halfopen works
        await expect(breaker.getState()).toBe(CircuitState.HALFOPEN)
        
        // Probing
        await expect(breaker()).resolves.toBe("Ouhh Ouhh")

        // Probing succeeds then circuit is closed
        await expect(breaker.getState()).toBe(CircuitState.CLOSED)
    })
    it('Probe failure reopens the circuit', async () => {
        const failingFnMsg = "System down"
        let counter = 0
        const failingFn = () => {
            // Rejects twice then resolves on the third call.
            if (counter < 3) {
                counter++
                return Promise.reject(new Error(failingFnMsg))
            } else {
                return Promise.resolve("Ouhh Ouhh")
            }
        }        
        const breaker = circuitBreaker(failingFn, {
            failureThreshold: 2,
            resetTimeout: 100
        })
        await expect(breaker()).rejects.toThrow(Error('System down'))
        await expect(breaker()).rejects.toThrow("Circuit reached max failure. The last error is: " + failingFnMsg)
        
        // Circuit is now open
        await expect(breaker.getState()).toBe(CircuitState.OPEN)

        // Wait for transition into HalfOpen. Transition should happen in resetTimeout
        await new Promise (resolve => {
            setTimeout(() => {
                resolve()
            }, 200)
        })

        // Making sure that transition into halfopen works
        await expect(breaker.getState()).toBe(CircuitState.HALFOPEN)
        
        // Probing
        await expect(breaker()).rejects.toThrow(failingFnMsg)

        // Probing succeeds then circuit is closed
        await expect(breaker.getState()).toBe(CircuitState.OPEN)
    })
    it('Only one call during probing', async () => {
        const failingFnMsg = "System down"
        let counter = 0
        const failingFn = () => {
            // Rejects twice then resolves on the third call.
            if (counter < 3) {
                counter++
                return Promise.reject(new Error(failingFnMsg))
            } else {
                return Promise.resolve("Ouhh Ouhh")
            }
        }        
        const breaker = circuitBreaker(failingFn, {
            failureThreshold: 2,
            resetTimeout: 100
        })
        await expect(breaker()).rejects.toThrow(Error('System down'))
        await expect(breaker()).rejects.toThrow("Circuit reached max failure. The last error is: " + failingFnMsg)
        
        // Circuit is now open
        await expect(breaker.getState()).toBe(CircuitState.OPEN)

        // Wait for transition into HalfOpen. Transition should happen in resetTimeout
        await new Promise (resolve => {
            setTimeout(() => {
                resolve()
            }, 200)
        })

        // Making sure that transition into halfopen works
        await expect(breaker.getState()).toBe(CircuitState.HALFOPEN)
        
        // Probing
        Promise.all([
            expect(breaker()).rejects.toThrow(failingFnMsg),
            expect(breaker()).rejects.toThrow("A probe is in flight wait for its result")
        ])

        await new Promise((resolve) => {
            setTimeout(() => {
                resolve()
            }, 300)
        })

        // Probing succeeds then circuit is closed
        await expect(breaker.getState()).toBe(CircuitState.HALFOPEN)
    })
    it('State transitions are observable', async () => {
        const failingFnMsg = "System down"
        let transitions = []
        let counter = 0
        const failingFn = () => {
            // Rejects twice then resolves on the third call.
            if (counter < 2) {
                counter++
                return Promise.reject(new Error(failingFnMsg))
            } else {
                return Promise.resolve("Ouhh Ouhh")
            }
        }        
        const breaker = circuitBreaker(failingFn, {
            failureThreshold: 2,
            resetTimeout: 100
        })
        breaker.onStateChange((from, to) => transitions.push(`${from}→${to}`))
        await expect(breaker()).rejects.toThrow(Error('System down'))
        await expect(breaker()).rejects.toThrow("Circuit reached max failure. The last error is: " + failingFnMsg)
        
        // Circuit is now open
        expect(transitions).toContain("CLOSED→OPEN")
        await expect(breaker.getState()).toBe(CircuitState.OPEN)
        
        // Wait for transition into HalfOpen. Transition should happen in resetTimeout
        await new Promise (resolve => {
            setTimeout(() => {
                resolve()
            }, 200)
        })
        
        // Making sure that transition into halfopen works
        expect(transitions).toContain("OPEN→HALFOPEN")
        await expect(breaker.getState()).toBe(CircuitState.HALFOPEN)
        
        await expect(breaker()).resolves.toBe("Ouhh Ouhh")

        console.log(transitions)
        // Probing succeeds then circuit is closed
        expect(transitions).toContain("HALFOPEN→CLOSED")
        await expect(breaker.getState()).toBe(CircuitState.CLOSED)
    })
})