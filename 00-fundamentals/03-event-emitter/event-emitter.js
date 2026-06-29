class EventEmitter {
    constructor() {
        this.events = new Map()
    }

    on(event, listener) {
        if (!event) {
            throw new Error("No event was provided")    
        }

        if (!listener) {
            throw new Error("No listener was provided")    
        }

        let events = this.events;
        let listeners = null;

        if (!events.has(event)) {
            listeners = []
        } else {
            listeners = events.get(event)
        }
        
        if (this.maxListeners && listeners.length == this.maxListeners) {
            console.warn("Max listeners warning: To prevent memory leaks")
        }

        // listeners.add(listener)
        listeners.push(listener)
        events.set(event, listeners)

        const unsubscriber = () => {
            // Delete listeners
            let listeners = events.get(event);
            // listeners.delete(listener);
            const newListeners = listeners.filter(l => l !== listener)
            events.set(event, newListeners)
        }

        return unsubscriber;
    }

    once(event, listener) {
        const onceListener = (...args) => {
            listener(...args);
            let listeners = this.events.get(event);
            let newListeners = listeners.filter(l => l !== onceListener);
            this.events.set(event, newListeners)
        }

        return this.on(event, onceListener)
    }

    off(event, listener) {
        let events = this.events;

        if (!events.has(event)) {
            throw new Error(`Could not delete the event. The event: ${event} does not exist on the emitter or has already been deleted`)
        }

        let listeners = events.get(event)

        let newListeners = listeners.filter(l => l !== listener);
        events.set(event, newListeners)
    }

    emit(event, ...param) {
        let events = this.events;
        let errors = new Map();

        if (event == "error" && !events.has(event)) {
            const errorParam = param[0] instanceof Error ? 
                param[0] : new Error("Unhandled error occured")
            throw errorParam
        }
        
        if (!events.has(event)) {
            throw new Error(`The event "${event}" is not registered`)
        }

        let listeners = events.get(event);

        listeners.forEach(listener => {
            try {
                listener(...param);
            } catch (error) {
                errors.set(listener, error)
            }
        })

        if (errors.size > 0) {
            errors.forEach(error => console.log(error))
        }
    }

    removeAllListeners(event) {
        let events = this.events;

        if (!events.has(event)) {
            throw new Error(`Could not delete the event. The event: ${event} does not exist on the emitter or has already been deleted`)
        }

        events.delete(event);
    }

    listenerCount(event) {
        if (typeof event !== "string") {
            throw new Error(`Could not return the listener count. The value "${event}" is not a string`)
        }
     
        let listeners = this.events.get(event);
        return listeners ? listeners.length : 0
    }

    eventNames() {
        let events = this.events;
        return [...events.keys()]
    }

    setMaxListeners(max) {
        if (typeof max !== "number") {
            throw new Error(`Could not set the max listener. The value provided for ${max}is not a number`)
        }

        if (max <= 0) {
            throw new Error("max listeners cannot be <= 0")    
        }

        this.maxListeners = max
    }

    prependListener(event, listener) {
        // Making me realize that we might want to use a queue for the event listeners. Not a set.
        // Naturally chose a Set for the event listeners for O(1) find. Now we might need to move to arrays for 
        // its queue like impl with shift/unshift
        
        // Need to guard this.
        let events = this.events;
        let listeners = null;

        if (!events.has(event)) {
            return this.on(event, listener)
        } 

        events.get(event).unshift(listener)

        const unsubscriber = () => {
            // Delete listeners
            let listeners = events.get(event);
            // listeners.delete(listener);
            const newListeners = listeners.filter(l => l !== listener)
            events.set(event, newListeners)
        }

        return unsubscriber
    }
}

export default EventEmitter;