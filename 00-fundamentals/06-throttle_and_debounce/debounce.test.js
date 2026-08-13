import debounce from "./debounce";
import { describe, it, expect } from "vitest"


describe("Debounce", () => {
    it("debounce with wait", async () => {
        const wait = 100;
        let saved = 0;
        const fn = () => { ++saved }
        const debounced = debounce(fn, wait)
        debounced()
        debounced()
        debounced()
        await new Promise((resolve) => {
            setTimeout(() => {
                resolve()
            }, 1000);
        })
        expect(saved).toBe(1)
    })
    it("debounce timer resets on each call", async () => {
        const wait = 200;
        const results = [];
        const fn = (value) => { results.push(value) }
        const debounced = debounce(fn, wait, {
            leading: false,
            trailing: true
        })

        debounced('a')
        expect(results).not.toContain("a")
        await new Promise((resolve) => {
            setTimeout(() => {
                resolve()
            }, 150);
        })
        // This lands on the cooling period hence ignored
        debounced('b')
        await new Promise((resolve) => {
            setTimeout(() => {
                resolve()
            }, 150);
        })
        expect(results).not.toContain("a")
        expect(results).not.toContain("b")
        await new Promise((resolve) => {
            setTimeout(() => {
                resolve()
            }, 10);
        })
        expect(results).not.toContain("a")

        await new Promise((resolve) => {
            setTimeout(() => {
                resolve()
            }, 100);
        })
        expect(results).toContain("b")
    })
    it("cancel pending", async () => {
        const wait = 100;
        let saved = 0;
        const fn = () => { ++saved }
        const debounced = debounce(fn, wait)

        debounced()
        debounced()

        await new Promise((resolve) => {
            setTimeout(() => {
                resolve()
            }, 500);
        })

        debounced()
        debounced.cancel()

        await new Promise((resolve) => {
            setTimeout(() => {
                resolve()
            }, 500);
        });

        expect(saved).toBe(1)
    })
    it("flush pending", async () => {
        const wait = 100;
        let saved = 0;
        const fn = () => { ++saved }
        const debounced = debounce(fn, wait)

        debounced()
        debounced()

        await new Promise((resolve) => {
            setTimeout(() => {
                resolve()
            }, 500);
        })

        debounced()
        expect(saved).toBe(1) // This won't fire as we need to wait 
        debounced.flush()
        expect(saved).toBe(2)

        // Making sure there is no other hanging action that we missed
        await new Promise((resolve) => {
            setTimeout(() => {
                resolve()
            }, 500);
        });

        expect(saved).toBe(2)
    })
    it("preserves latest args", async () => {
        const wait = 100;
        const results = [];
        const fn = (value) => { results.push(value) }
        const debounced = debounce(fn, wait)

        debounced('a')
        debounced('b')

        await new Promise((resolve) => {
            setTimeout(() => {
                resolve()
            }, 500);
        })
        expect(results).toContain("b")

        debounced('c')

        await new Promise((resolve) => {
            setTimeout(() => {
                resolve()
            }, 500);
        });

        expect(results).toContain('c')
    })
    it("debounces with leading", async () => {
        const wait = 300;
        const results = [];
        const fn = (value) => { results.push(value) }
        const debounced = debounce(fn, wait, {
            leading: true,
            trailing: false
        })

        debounced('a')
        expect(results).toContain("a")

        // THis lands on the cooling period hence ignored
        debounced('b')
        expect(results).not.toContain("b")


        await new Promise((resolve) => {
            setTimeout(() => {
                resolve()
            }, 500);
        })
        expect(results).not.toContain("b")

        debounced('c')

        await new Promise((resolve) => {
            setTimeout(() => {
                resolve()
            }, 500);
        });

        expect(results).toContain('c')
    })
    it("debounces with trailing", async () => {
        const wait = 300;
        const results = [];
        const fn = (value) => { results.push(value) }
        const debounced = debounce(fn, wait, {
            leading: false,
            trailing: true
        })

        debounced('a')
        expect(results).not.toContain("a")

        // This lands on the cooling period hence ignored
        debounced('b')
        expect(results).not.toContain("b")


        await new Promise((resolve) => {
            setTimeout(() => {
                resolve()
            }, 500);
        })
        expect(results).toContain("b")

        debounced('c')

        await new Promise((resolve) => {
            setTimeout(() => {
                resolve()
            }, 500);
        });

        expect(results).toContain('c')
    })
    it("zero wait debounces with leading & trailing", async () => {
        const wait = 0;
        const results = [];
        const fn = (value) => { results.push(value) }
        const debounced = debounce(fn, wait, {
            leading: true,
            trailing: true
        })

        debounced('a')
        expect(results).toContain("a")

        // A small macro task delay to
        // allow trailing to run before we assert
        await new Promise((resolve) => {
            setTimeout(() => {
                resolve()
            }, 10)
        })
        expect(results.length).toBe(2)

    })
    it("debounces with leading & trailing", async () => {
        const wait = 200;
        const results = [];
        const fn = (value) => { results.push(value) }
        const debounced = debounce(fn, wait, {
            leading: true,
            trailing: true
        })

        debounced('a')
        expect(results).toContain("a")

        // A small macro task delay to
        // allow trailing to run before we assert
        await new Promise((resolve) => {
            setTimeout(() => {
                resolve()
            }, 400)
        })
        expect(results.length).toBe(2)

    })
    it("debounces with maxWait", async () => {
        const wait = 200;
        const results = [];
        const fn = (value) => { results.push(value) }
        const debounced = debounce(fn, wait, {
            leading: false,
            trailing: true,
            maxWait: 200
        })

        debounced('a')
        expect(results).not.toContain("a")
        await new Promise((resolve) => {
            setTimeout(() => {
                resolve()
            }, 40);
        });

        debounced('b')
        expect(results).not.toContain("b")
        await new Promise((resolve) => {
            setTimeout(() => {
                resolve()
            }, 40);
        });

        debounced('c')
        expect(results).not.toContain("c")
        await new Promise((resolve) => {
            setTimeout(() => {
                resolve()
            }, 40);
        });

        debounced('d')
        expect(results).not.toContain("d")
        await new Promise((resolve) => {
            setTimeout(() => {
                resolve()
            }, 40);
        });

        debounced('e')
        expect(results).not.toContain("e")
        await new Promise((resolve) => {
            setTimeout(() => {
                resolve()
            }, 40);
        });

        // This call will cause a flush 
        debounced('f')
        expect(results).toContain("f")

        debounced('g')
        expect(results).not.toContain("g")


        await new Promise((resolve) => {
            setTimeout(() => {
                resolve()
            }, 500);
        });

        expect(results).toContain('g')
    })
    it("leading async function increases pushes further cooling", async () => {
        const wait = 200;
        const results = [];
        const fn = async (value) => {
            await new Promise((resolve) => {
                setTimeout(() => {
                    resolve()
                }, 500);
            })
            results.push(value)
        }
        const debounced = debounce(fn, wait, {
            leading: true
        })

        debounced('a')
        expect(results).not.toContain("a")
        await new Promise((resolve) => {
            setTimeout(() => {
                resolve()
            }, 500);
        });

        expect(results).toContain("a")

        // What happens when we receive other calls while the async function is still pending
        // debounced('b')
        // expect(results).not.toContain("b")
        // await new Promise((resolve) => {
        //     setTimeout(() => {
        //         resolve()
        //     }, 700);
        // });

        // expect(results.length).toBe(1)
        // expect(results).toContain('a')
    })
});