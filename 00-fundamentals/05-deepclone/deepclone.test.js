import { describe, it, expect } from "vitest"
import deepClone from "./deepclone";

describe('DeepClone', () => {
    it('clones nested objects', () => {
        const original = {
            user: { name: 'Alice' },
        };

        const copy = deepClone(original)
        copy.user.name = 'Bob'

        expect(original.user.name).toBe('Alice');

    });
    it('clones nested arrays', () => {
        const original = {
            tags: ['js', 'patterns']
        };

        const copy = deepClone(original)
        copy.tags.push('testing')

        expect(original.tags).toEqual(['js', 'patterns']);

    });
    it('should not clone functions', () => {
        const original = {
            fn: () => {
                console.log("Mo testing")
            }
        }

        const copy = deepClone(original)

        expect(original.fn).toBe(copy.fn);

    });
    it('preserves circular references on objects', () => {
        const original = {
            user: { name: 'Alice' },
        };

        original.og = original

        const copy = deepClone(original)

        expect(original).toEqual(copy.og);

    });
    it('does not preserves mutable references with the original', () => {
        const original = {
            user: { name: 'Alice' },
        };

        const copy = deepClone(original)
        copy.user.name = "Mo"
        expect(original.user.name).toBe("Alice");
        expect(copy.user.name).toBe("Mo");

    });
    it('clones Dates', () => {
        const original = {
            date: new Date(),
        };

        const copy = deepClone(original)
        expect(original.date).toEqual(copy.date);
    });
    it('clones RegExps', () => {
        const original = {
            regex: new RegExp('abc'),
        };

        const copy = deepClone(original)
        expect(original.regex).toEqual(copy.regex);
    });
    it('clones Maps', () => {
        const original = {
            "users": new Map([['mo', { "moneySent": 9999 }]]),
        };

        const copy = deepClone(original)
        expect(copy.users).toBeInstanceOf(Map);
        expect(copy.users).not.toBe(original["users"]);
    });
    it('clones Sets', () => {
        const original = {
            "users": new Set([["NotHere"]]),
        };

        const copy = deepClone(original)
        expect(copy.users).toBeInstanceOf(Set);
        expect(copy.users).not.toBe(original["users"]);
    });
    it('clones typed arrays', () => {
        const original = {
            users: new Int32Array([1, 2, 3]),
        };

        const copy = deepClone(original)
        expect(copy.users).not.toBe(original.users);
        expect(copy.users).toBeInstanceOf(Int32Array);
    });
    it('stops at maxDepth', () => {
        // 3 levels down
        const original = {
            user: { 
                mo: {
                    age: 900 
                }
            },
        };
        const expected = {
            user: { 
                mo: null
            },
        };
        const opts = {
            maxDepth: 2
        }
        const copy = deepClone(original, opts)
        console.log(copy)
        expect(copy).toStrictEqual(expected);
    });
    it('clones NonEnumerables', () => {
        const user = { 
            name: "mo"
        };

        Object.defineProperty(user, "hidden_age", {
            value: 99,
            enumerable: false, 
            writable: true,
            configurable: true
        });

        const expected = { 
            name: "mo",
            "hidden_age": 99
        };
        const opts = {
            cloneNonEnumerable: true
        }
        const copy = deepClone(user, opts)
        console.log("FromTestCopy: " + JSON.stringify(copy))
        console.log(Object.getOwnPropertyNames(copy))
        expect(copy).toStrictEqual(expected);
        expect(Object.getOwnPropertyNames(copy).includes("hidden_age")).toBe(true);
    });
    it('clones Symbols', () => {
        const IDSymbol = Symbol('id')
        const original = {
            [IDSymbol]: 9999,
            "mo": 900 
        }

        const expected = {
            [IDSymbol]: 9999,
            "mo": 900
        };
        const opts = {
            cloneSymbols: true
        }
        const copy = deepClone(original, opts)
        expect(copy).toStrictEqual(expected);
    });
})