import { describe, it, expect, vi } from "vitest";
import EventEmitter from "./event-emitter";

describe('EventEmitter', () => {
    it('registers a new event listener', () => {
        const emitter = new EventEmitter()

        // Define event and listener
        const event = "userLogin";
        const eventListener = (user) => {
            console.log(`${user.name} logged in`);
        }

        // Subscribe
        emitter.on(event, eventListener);

        // Emit
        expect(emitter.events.get(event)).toContain(eventListener)
    })

    it('register event returns the unsubscriber', () => {
        const emitter = new EventEmitter()

        // Define event, a listener and the unsubs
        const event = "userLogin";
        const eventListener = (user) => {
            console.log(`${user.name} logged in`);
        }

        // Subscribe to get the unsubscriber
        const unsubs = emitter.on(event, eventListener);

        // Make sure event is registered and that the unsubs type
        expect(emitter.events.get(event)).toContain(eventListener)
        expect(typeof unsubs).toBe("function")

        // Unsubscribe
        expect(emitter.events.has(event)).toBe(true) // Check that events exist first
        unsubs()

        // Check that unsuscribe works
        expect(emitter.events.get(event).length).toEqual(0)
    })

    it('emits an event for one listener', () => {
        const emitter = new EventEmitter();
        const fn = vi.fn();

        emitter.on('userLogin', fn);
        emitter.emit('userLogin', "Moo")

        expect(fn).toHaveBeenCalledTimes(1)
        expect(fn).toHaveBeenCalledWith("Moo")
    })

    it('emits an event for two listeners', () => {
        const emitter = new EventEmitter();

        const fn1 = vi.fn();
        const fn2 = vi.fn();

        emitter.on('userLogin', fn1);
        emitter.on('userLogin', fn2);

        emitter.emit("userLogin", "Moooo")

        expect(fn1).toHaveBeenCalledTimes(1)
        expect(fn1).toHaveBeenCalledWith('Moooo');

        expect(fn2).toHaveBeenCalledTimes(1)
        expect(fn2).toHaveBeenCalledWith('Moooo');
    })

    it('removes all listeners on an event', () => {
        const emitter = new EventEmitter();
        const event = "logoff"
        const eventListener = (computer) => {
            console.log("Mo just logged off machine: " + computer)
        }

        emitter.on(event, eventListener);
        expect(emitter.listenerCount(event)).toEqual(1)

        emitter.removeAllListeners(event)
        expect(emitter.listenerCount(event)).toEqual(0)
    })

    it('removes a listener from an event', () => {
        const emitter = new EventEmitter();
        const event = "logoff"
        const eventListener = (computer) => {
            console.log("Mo just logged off machine: " + computer)
        }

        emitter.on(event, eventListener);
        expect(emitter.listenerCount(event)).toEqual(1)

        emitter.off(event, eventListener)
        expect(emitter.events.has(event)).toBe(true)

    })

    it('register an event that fires only once', () => {
        const emitter = new EventEmitter()

        const event = 'MessageReceived'
        const eventListener = (message) => {
            console.log("Received the message: " + message)
        }

        emitter.once(event, eventListener);
        emitter.emit("MessageReceived", "This is Mo talking here.")

        // Making sure the event is deleted
        expect(emitter.events.get(event).length).toBe(0)
    })

    it('returns eventNames', () => {
        const emitter = new EventEmitter()

        const event1 = 'MoEntered'
        const event2 = 'MoLeftChat'

        const eventListener1 = () => {
            console.log("Event1 fired")
        }

        const eventListener2 = () => {
            console.log("Event2 fired")
        }

        emitter.on(event1, eventListener1)
        emitter.on(event2, eventListener2)

        expect(emitter.eventNames()).toContain(event1)
        expect(emitter.eventNames()).toContain(event2)

    })

    it('returns listenerCount per event', () => {
        const emitter = new EventEmitter()

        const event1 = "MoHere"

        const listener1 = () => {
            console.log("Event1 Fired")
        }

        const listener2 = () => {
            console.log("Event2 Fired")
        }

        emitter.on(event1, listener1)
        emitter.on(event1, listener2)

        // emitter.emit(event1, "This is Mo talking here.")
        expect(emitter.listenerCount(event1)).toEqual(2)

    })
})
 
