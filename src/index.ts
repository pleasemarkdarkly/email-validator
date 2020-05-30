import yargs from "yargs";
import { removeDupes } from "./removedupes";
import { writeHeapSnapshot } from "v8";
import { handler } from "./handler";

let multiplier = 1;
setInterval(() => {
  const rss = process.memoryUsage().rss;
  if (rss > 124 * 1024 * 1024 * multiplier) {
    console.log(
      `Saving a heap snapshot, since RSS just went above ${(
        rss /
        1024 /
        1024
      ).toFixed(2)} MB`
    );
    writeHeapSnapshot();
    multiplier++;
  }
}, 5000);

yargs
  .command(
    "validate",
    "Validate emails contained within .tar.gz files.",
    yargs =>
      yargs
        .option("dir", {
          describe:
            "If provided, the program will validate all .tar.gz contained in this directory.",
          type: "string"
        })
        .option("concurrency", {
          describe: "The max amount of parallel requests.",
          type: "number",
          default: 50
        })
        .option("maxPendingApprox", {
          describe:
            "The highly approximate maximum amount of promises pending.",
          type: "number",
          default: 500
        })
        .option("outputDir", {
          describe: "The output directory.",
          type: "string",
          default: "."
        })
        .option("removeDupes", {
          describe:
            "Sets whether to remove duplicates from the output. Restarting the program may often validate some emails twice. (Memory expensive operation.)",
          type: "boolean",
          default: false
        })
        .option("verbosity", {
          describe: "Sets the verbosity of the logger",
          default: "verbose",
          choices: [
            "error",
            "warn",
            "info",
            "http",
            "verbose",
            "debug",
            "silly"
          ]
        })
        .option("logFile", {
          describe: "The path to the logfile.",
          type: "string",
          default: "."
        })
        .option("timeout", {
          describe: "The timeout in milliseconds per one email.",
          type: "number",
          default: 6000
        }),
    handler
  )
  .command(
    "removedupes",
    "Removes duplicate emails in all .array.txt files under a directory. Restarting the program may often validate some emails twice. (Memory expensive operation.)",
    yargs =>
      yargs.option("dir", {
        describe:
          "The root dir to start at. Usually the same as outputDir for the validate command.",
        demandOption: true,
        type: "string"
      }),
    async argv => await removeDupes(argv.dir)
  )
  .command({
    command: "$0",
    describe: "--help for help, <command> --help for command-specific help",
    handler: () => yargs.showHelp()
  })
  .help().argv;
