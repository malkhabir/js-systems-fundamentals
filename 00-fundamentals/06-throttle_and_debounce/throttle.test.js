import throttle from "./throttle";
import { describe, it, expect } from "vitest"

describe("Throttle", () => {
    it('throttle with leading', async () => {
        let calls = 0;
        const fn = () => ++calls;
        const throttled = throttle(fn, 100);

        // increments calls then start cooling
        throttled();
        expect(calls).toBe(1);

        // this won't have any effects as it lands on cooling period
        throttled();
        expect(calls).toBe(1);


        // Wait 1 sec
        await new Promise((resolve) => {
            setTimeout(() => {
                // console.log("Test: HMMM waiting a sec")
                resolve()
            }, 1000)
        })

        // Calls is still 1 after waiting a sec
        expect(calls).toBe(1);
    });
    it('throttle with trailing', async () => {
        let calls = 0;
        const fn = () => ++calls;
        const options = {
            trailing: true,
            leading: false
        }
        const throttled = throttle(fn, 100, options);

        // console.log("Throttled type is: " + typeof throttled)
        // This won't run right away. It will be delayed by wait
        // console.log("TEST - throttling...")
        throttled();
        throttled();

        // calls does not increment right away
        // we are in the cooling phase
        expect(calls).toBe(0)

        // Wait 0.2 sec
        await new Promise((resolve) => {
            setTimeout(() => {
                // console.log("TEST: waiting for test to finish")
                resolve()
            }, 200)
        })

        // By now, the function must have been called
        expect(calls).toBe(1);
    });
    it('throttle with trailing - lastArg is used', async () => {
        let calls = 0;
        const fn = (num) => calls = num;
        const options = {
            trailing: true,
            leading: false
        }
        const throttled = throttle(fn, 100, options);

        // console.log("Throttled type is: " + typeof throttled)
        // This won't run right away. It will be delayed by wait
        // console.log("TEST - throttling...")
        throttled();
        throttled(10);

        // calls does not increment right away
        expect(calls).toBe(0)

        // Wait 2 sec
        await new Promise((resolve) => {
            setTimeout(() => {
                // console.log("TEST: waiting for test to finish")
                resolve()
            }, 200)
        })

        // By now, the function must have been called with lastArg
        expect(calls).toBe(10);
    });
    it('throttle with trailing - two burst calls with no timeout between', async () => {
        let calls = 0;
        const fn = () => ++calls;
        const options = {
            trailing: true,
            leading: false
        }
        const throttled = throttle(fn, 100, options);

        // console.log("Throttled type is: " + typeof throttled)
        // This won't run right away. It will be delayed by wait
        // console.log("TEST - throttling...")
        throttled();

        // This would run right away during cooloff. 
        // Should not affect the the first throttled()
        // console.log("TEST - throttling...")
        throttled();


        // Wait 2 sec
        await new Promise((resolve) => {
            setTimeout(() => {
                // console.log("TEST: waiting for throttled to return")
                resolve()
            }, 200)
        })

        // calls should be 1 because the second call lands right on the cooling period
        expect(calls).toBe(1);
    });
    it('throttle with trailing - two burst calls with a timeout between', async () => {
        let calls = 0;
        const fn = () => ++calls;
        const options = {
            trailing: true,
            leading: false
        }
        const throttled = throttle(fn, 100, options);

        // console.log("Throttled type is: " + typeof throttled)
        // This won't run right away. It will be delayed by wait
        // console.log("TEST - throttling...")
        throttled();

        // Wait 2 sec
        await new Promise((resolve) => {
            setTimeout(() => {
                // console.log("TEST: waiting for throttled to return")
                resolve()
            }, 200)
        })

        // This would run right away during cooloff. 
        // Should not affect the the first throttled()
        // console.log("TEST - throttling...")
        throttled();


        // Wait 2 sec
        await new Promise((resolve) => {
            setTimeout(() => {
                // console.log("TEST: waiting for throttled to return")
                resolve()
            }, 200)
        })

        // calls should be 1 because the second call lands right on the cooling period
        expect(calls).toBe(2);
    });
    it('throttle with trailing - cancel', async () => {
        let calls = 0;
        const fn = () => ++calls;
        const options = {
            trailing: true,
            leading: false
        }
        const throttled = throttle(fn, 100, options);

        // console.log("Throttled type is: " + typeof throttled)
        // This won't run right away. It will be delayed by wait
        // console.log("TEST - throttling...")
        throttled();

        // Wait 2 sec
        await new Promise((resolve) => {
            setTimeout(() => {
                // console.log("TEST: waiting for throttled to return")
                resolve()
            }, 200)
        })

        // This would run right away during cooloff. 
        // Should not affect the the first throttled()
        // console.log("TEST - throttling...")
        throttled();
        throttled.cancel()

        // Wait 2 sec
        await new Promise((resolve) => {
            setTimeout(() => {
                // console.log("TEST: waiting for throttled to return")
                resolve()
            }, 200)
        })

        // calls should be 1 because the second is followed with a cancel
        expect(calls).toBe(1);
    });
    it('throttle with trailing - flush', async () => {
        let calls = 0;
        const fn = () => ++calls;
        const options = {
            trailing: true,
            leading: false
        }
        const throttled = throttle(fn, 100, options);

        // console.log("Throttled type is: " + typeof throttled)
        // This won't run right away. It will be delayed by wait
        // console.log("TEST - throttling...")
        throttled();

        // Wait 2 sec
        await new Promise((resolve) => {
            setTimeout(() => {
                // console.log("TEST: waiting for throttled to return")
                resolve()
            }, 200)
        })

        // This would run right away during cooloff. 
        // Should not affect the the first throttled()
        // console.log("TEST - throttling...")
        throttled();
        expect(calls).toBe(1);
        throttled.flush()
        expect(calls).toBe(2);
    });
    it('throttle with leading & trailing', async () => {
        const wait = 100;
        let status = [];
        const fn = (x) => status.push(x);
        const options = {
            trailing: true,
            leading: true
        }
        const throttled = throttle(fn, wait, options);

        throttled("Mo");
        expect(status.length).toBe(1)

        // Wait for Mo the trail call to resolce
        await new Promise((resolve) => {
            setTimeout(() => {
                resolve()
            }, 200);
        })
        expect(status.length).toBe(2)
    });
    it('zero wait throttle with leading & trailing', async () => {
        let status = [];
        const fn = (x) => status.push(x);
        const options = {
            trailing: true,
            leading: true,
        }
        const wait = 0;
        const throttled = throttle(fn, wait, options);

        throttled("a");
        expect(status).toContain("a")

        // Wait for the trail call to resolve
        await new Promise((resolve) => {
            setTimeout(() => {
                resolve()
            }, 0);
        })
        expect(status.length).toBe(2)
    });
    it('leading async function increases the wait window', async () => {
        let status = [];
        const fn = async (x) => {
            await new Promise((resolve) => {
                setTimeout(() => {
                    resolve()
                }, 500);
            })
            status.push(x);
        }
        const options = {
            leading: true
        }
        const wait = 100;
        const throttled = throttle(fn, wait, options);

        throttled("a");
        expect(status).not.toContain("a")

        throttled("b");
        expect(status).not.toContain("b")

        throttled("c");
        expect(status).not.toContain("c")

        // Wait for Mo the trail call to resolce
        await new Promise((resolve) => {
            setTimeout(() => {
                resolve()
            }, 700);
        })
        expect(status.length).toBe(1)
        expect(status).toContain("a")
    });
});

