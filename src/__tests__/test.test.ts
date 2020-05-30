import {handler} from "../handler";

jest.mock('email-deep-validator', () => {
    let i = 0;
 return function Stuff(this: any) {
     this.verify = async email => await new Promise(res => {
         const interval = Math.random() / 2;
         setTimeout(() => res({validMailbox:true}), interval);
     })
 }
})

describe('test', function () {
    it('should ', async function () {
        setInterval(() => {
            console.log(process.memoryUsage()
            );
        }, 500);
        await handler({
            dir: "archives",
            outputDir: "outDir",
            removeDupes: false,
            verbosity: "verbose",
            concurrency: 300,
            maxPendingApprox: 300,
            logFile:"."
        });

    }, 6000000);
});