import {Queue} from "../Queue";
import {sleep} from "../utils/sleep";

describe('Queue', function () {
    it('should execute queued promises correctly', async function () {
        const q = new Queue(20);
        for (let i = 0; i <50; i++) {
            q.add(async () => {
                return i;
            });
        }
        let amountOfPromisesReturned = 0;
        q.on("promiseResolved", val =>{
            amountOfPromisesReturned++;
            console.log(val);
        })
        process.nextTick(() => {
            q.add(async () => {
                return 20;
            });
        })
        await sleep(1000);
        expect(amountOfPromisesReturned).toBe(51);
    }, 6000);
});