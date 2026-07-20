// Cloner that support: 
// - Primitives: number, string, boolean, bigint, null, undefined, symbol
// - Plain objects
// - Arrays
// - Date
// - RegExp
// - Map
// - Set
// - typed arrays

// Rules:
// nested objects must be deeply copied
// nested arrays must be deeply copied
// circular references must be preserved correctly
// cloned objects must not share mutable references with the original
// functions should not be cloned; preserve the same function reference
const isPrimitive = (el) => {
    return !Array.isArray(el) && typeof el !== "object"
}

const isFunction = (el) => {
    return typeof el == "function"
}

const deepClone = (input, opts) => {
    //     opts: 
    //          maxDepth: Infinity,
    //          preservePrototype: true,
    //          cloneNonEnumerable: false,
    //          cloneSymbols: true
    
    
    // WeakMap so keys are deleted when the obj is garbage collected. Apparently, this is best practice. 
    // It does make sense
    let seen = new WeakMap()

    // Move this to a function ?
    const maxDepth = opts && (Math.max(opts.maxDepth, 1) || Infinity)
    // preserveProto is not yet implemented. Doing Object.create(obj.getProto()) might be all that is needed here
    const preserveProto = opts?.preservePrototype ?? true
    const cloneNonEnumerable = opts?.cloneNonEnumerable ?? false
    const cloneSymbols = opts?.cloneSymbols ?? false

    const sanitizedOpts = {
        maxDepth: maxDepth,
        preserveProto: preserveProto,
        cloneNonEnumerable: cloneNonEnumerable,
        cloneSymbols: cloneSymbols
    }

    let depth = 0;

    return traverseObj(input, seen, depth, sanitizedOpts)
}

const traverseObj = (obj, seen, depth, options) => {
    // Tracks depth so we can stop at maxDepth
    depth++

    if (options && options.maxDepth && depth > options.maxDepth) {
        return null
    }

    if (obj == null) {
        return null
    }

    if (seen.has(obj)) {
        return seen.get(obj);
    }

    if (isFunction(obj)) {
        return obj
    }

    // If obj is primitive, then return it
    if (isPrimitive(obj)) return obj;

    // Catch special objs first
    // If we are dealing with an array. Lets do a arr.map() on it and copy the primitives
    if (Array.isArray(obj)) {
        // Every el of the array can potentially be another array/obj
        let clone = []
        seen.set(obj, clone)
        for (const element of obj) {
            clone.push(traverseObj(element, seen, depth, options))
        }
        return clone
    }

    if (obj instanceof Date) {
        let clone = new Date(obj)
        seen.set(obj, clone)
        return clone;
    }
    if (obj instanceof RegExp) {
        let clone = new RegExp(obj)
        seen.set(obj, clone)
        return clone
    }
    if (obj instanceof Map) {
        let clone = new Map(obj)
        seen.set(obj, clone)
        return clone
    }
    if (obj instanceof Set) {
        let clone = new Set(obj)
        seen.set(obj, clone)
        return clone
    }
    // Only capture typed arrays
    if (ArrayBuffer.isView(obj) && !(obj instanceof DataView)) {
        const clone = new obj.constructor(obj)
        seen.set(obj, clone)
        return clone
    }


    // If we are dealing with an obj, drill down.
    if (typeof obj == "object") {
        let clone = {};
        // clone is passed by ref, this means clone will be available when we return to parent
        // Each element needing the clone will get it. This is some sort of registration that avoids circular references
        seen.set(obj, clone)

        // NonEnumerable
        // Does not keep it as a NonEnumerable
        let objNonEnumerableCollection = options && options.cloneNonEnumerable ? 
            Object.getOwnPropertyNames(obj) : 
            []
        
        // console.log("NonEnumerable: " + objNonEnumerableCollection)
        // Symbols
        let objSymbolsCollection = options && options.cloneSymbols ? 
            Object.getOwnPropertySymbols(obj) : 
            []
        let objCollectionRegular = Object.entries(obj)

        // Branch is getting to heavy
        // Do not like doing this here. Will move it out of here and clean it up a bit
        // ALSO, does not look pretty :/
        let objCollection = [
            ...objCollectionRegular, 
            ...objNonEnumerableCollection
                .filter(e => !Object.keys(obj)
                .includes(e)).map(e => ([e, obj[e]])), 
            ...objSymbolsCollection.map(e => ([e, obj[e]]))]
        
            // console.log("NonEnum: " + JSON.stringify(objNonEnumerableCollection
            //     .filter(e => !Object.keys(obj)
            //     .includes(e)).map((e) => ([e, obj[e]]))))
       
                for (const [key, value] of objCollection) {
            if (key !== null && key !== undefined) {
                // console.log("KEY: " + key)
                clone[key] = traverseObj(value, seen, depth, options);
            }
        }
        return clone;
    }

}

export default deepClone