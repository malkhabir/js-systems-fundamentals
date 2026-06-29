import { describe, it, expect } from "vitest";
import { retry } from './retry.js'

describe('Retry', () => {
    it('returns success', async () => {
        const fn = () => Promise.resolve('success')
        expect(await retry(fn)).toEqual('success')
    })

    it('fails then succeeds', async () => {
        let attempts = 0;

        const fn = () => {
            attempts++
            if (attempts < 3) throw new Error('Not yet');
            return Promise.resolve('finally!')
        }
        let res = await retry(fn, { maxAttempts: 5 })
        expect(res).toEqual('finally!')
        expect(attempts).toBe(3)
    })

    it('all fails', async () => {
        const fn = () => {
            return Promise.reject(new Error('Always fails'));
        }

        await expect(retry(fn, { maxAttempts: 3 })).rejects.toThrow('Always fails')
    })

    it('only retries on fatal errors', async () => {
        const fn = () => {
            return Promise.reject(new Error('FATAL'));
        }

        await expect(retry(fn, { retryIf: (err) => !err.message.includes('FATAL') })).rejects.toThrow(new Error('FATAL'))
    })

    it('timeout wins', async () => {
        const fn = () => {
            return new Promise((resolve) => {
                setTimeout(() => {
                    resolve('Too late')
                }, 10000)
            })
        }

        await expect(retry(fn, { timeout: 100 })).rejects.toThrow('Request timed out')
    })
})
