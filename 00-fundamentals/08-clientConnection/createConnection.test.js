import { expect, it, describe } from 'vitest'
import ConnectionState from './ConnectionState.js'
import transportFactory from './transportFactory.js'
import createConnection from './createConnection.js'

describe('ConnectionClient', () => {
    it('connects', async () => {
        const factory = transportFactory()
        const conn = createConnection(factory, {
            maxRetries: 10,
            initialDelay: 100,
            maxDelay: 10000
        })

        const transport = conn.connect()
        transport._simulateOpen()
        expect(conn.getState()).toBe(ConnectionState.CONNECTED)
    })
    it('closes', async () => {
        const factory = transportFactory()
        const conn = createConnection(factory, {
            maxRetries: 10,
            initialDelay: 100,
            maxDelay: 10000
        })

        const transport = conn.connect()
        transport._simulateOpen()
        expect(conn.getState()).toBe(ConnectionState.CONNECTED)

        conn.close()
        expect(conn.getState()).toBe(ConnectionState.CLOSED)
    })
    it('connecting', async () => {
        const factory = transportFactory()
        const conn = createConnection(factory, {
            maxRetries: 10,
            initialDelay: 100,
            maxDelay: 10000
        })

        const transport = conn.connect()
        expect(conn.getState()).toBe(ConnectionState.CONNECTING)

        conn.close()
        expect(conn.getState()).toBe(ConnectionState.CLOSED)
    })
    it('reconnecting', async () => {
        const factory = transportFactory()
        const conn = createConnection(factory, {
            maxRetries: 2,
            initialDelay: 1000,
            maxDelay: 500
        })

        const transport = conn.connect()
        transport._simulateOpen()
        expect(conn.getState()).toBe(ConnectionState.CONNECTED)

        const closePromise = transport._simulateClose()
        expect(conn.getState()).toBe(ConnectionState.RECONNECTING)
    })
    it('fails after 2 retries', async () => {
        const factory = transportFactory()
        const conn = createConnection(factory, {
            maxRetries: 2,
            initialDelay: 100,
            maxDelay: 500
        })

        const transport = conn.connect()
        transport._simulateOpen()
        expect(conn.getState()).toBe(ConnectionState.CONNECTED)

        const closePromise = transport._simulateClose()
        await new Promise((resolve) => {
            setTimeout(() => {
                resolve()
            }, 500)
        })

        await expect(closePromise[0]).rejects.toThrow(Error("Max retries reached while reconnecting"))

    })
    it('reconnects after 1 failure', async () => {
        const factory = transportFactory()
        const conn = createConnection(factory, {
            maxRetries: 2,
            initialDelay: 100,
            maxDelay: 500
        })

        const transport = conn.connect()
        transport._simulateOpen()
        expect(conn.getState()).toBe(ConnectionState.CONNECTED)

        // Simulate a drop
        const closePromise = transport._simulateClose()

        // Move to wait period
        await new Promise((resolve) => {
            setTimeout(() => {
                resolve()
            }, 50)
        })

        // Make sure we are reconnecting
        expect(conn.getState()).toBe(ConnectionState.RECONNECTING)

        // Simulate a transport connection
        const openPromise = transport._simulateOpen()


        await new Promise((resolve) => {
            setTimeout(() => {
                resolve()
            }, 10)
        })

        await expect(openPromise[0]).resolves.toBe(transport)

    })
    it('ignores phantom transport onClose after successfulReconnect', async () => {
        const factory = transportFactory()
        const conn = createConnection(factory, {
            maxRetries: 2,
            initialDelay: 100,
            maxDelay: 500
        })

        const transport = conn.connect()
        transport._simulateOpen()
        expect(conn.getState()).toBe(ConnectionState.CONNECTED)

        // Simulate a drop
        transport._simulateClose()
        // Move to wait period
        await new Promise((resolve) => {
            setTimeout(() => {
                resolve()
            }, 100)
        })


        // Make sure we are reconnecting
        expect(conn.getState()).toBe(ConnectionState.CONNECTING)

        await new Promise((resolve) => {
            setTimeout(() => {
                resolve()
            }, 100)
        })

        const newTransport = conn.getLastTransport()
        expect(transport).not.toEqual(newTransport)
        await newTransport._simulateOpen()
        // Simulate a transport connection
        await transport._simulateClose()
        expect(conn.getState()).toBe(ConnectionState.CONNECTED)

    })
})