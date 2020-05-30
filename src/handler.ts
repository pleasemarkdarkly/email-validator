import { createLogger } from "./utils/logger";
import fs, { promises as fsp } from "fs";
import { createDirIfNotExists } from "./utils/createDirIfNotExists";
import { SessionManager } from "./SessionManager";
import ora from "ora";
import path from "path";
import tar from "tar-stream";
import readline from "readline";
import { Queue } from "./Queue";
import validateEmail from "deep-email-validator";
import { default as EmailValidator } from "email-deep-validator";
import zlib from "zlib";
import { removeDupes } from "./removedupes";
import { rejectAfter } from "./utils/rejectAfter";

export const handler = async (argv: any) => {
  const logger = createLogger(argv.verbosity, argv.outputDir);

  const archivePaths = argv.dir
    ? (await fsp.readdir(argv.dir, "utf-8"))
        .filter(filename => filename.endsWith(".tar.gz"))
        .map(archName => path.resolve(argv.dir, archName))
    : fs
        .readFileSync(0, "utf8")
        .split("\n")
        .filter(filename => filename.endsWith(".tar.gz"));

  await createDirIfNotExists(argv.outputDir);
  const sessionManager = await SessionManager.new(argv.outputDir);
  process.on("exit", () => sessionManager.writeToDisk());

  for (const archivePath of archivePaths) {
    let validatedAmount = 0;
    let errorAmount = 0;

    const archiveName = path.basename(archivePath);
    if (sessionManager.isArchiveFinished(archiveName)) {
      logger.info(
        `Skipping archive ${archiveName}, since it's already finished.`
      );
      break;
    }

    logger.info(`Going to validate archive ${archiveName}`);
    const perArchiveOutputDir = path.resolve(
      argv.outputDir,
      `results-${archiveName.split(".")[0]}`
    );
    await createDirIfNotExists(perArchiveOutputDir);

    await new Promise(async archiveResolve => {
      const extractStream = tar.extract();
      let entryResolve = Promise.resolve();

      extractStream.on("entry", async (header, stream, entryCallback) => {
        if (sessionManager.isEntryFinished(archiveName, header.name)) return;
        await entryResolve;
        entryResolve = (async () => {
          const spinner = ora(
            `Validating. Archive: ${archiveName} | Entry: ${path.basename(
              header.name
            )}`
          ).start();
          spinner.text;
          const updateSpinner = () =>
            (spinner.text = `Validating. Archive: ${archiveName} | Entry: ${path.basename(
              header.name
            )} | Validated: ${validatedAmount} | Error: ${errorAmount} | RSS: ${Math.floor(
              (process.memoryUsage().rss / 1024 / 1024) * 100
            ) / 100} MBs`);

          const { concurrency, maxPendingApprox } = argv;
          const readlineInterface = readline.createInterface({
            input: stream,
            crlfDelay: Infinity
          });
          const queue = new Queue(concurrency);
          const validator = new EmailValidator();

          const writeStream = fs.createWriteStream(
            path.resolve(
              perArchiveOutputDir,
              path.basename(header.name).split(".")[0] + ".array.txt"
            ),
            {
              encoding: "utf8"
            }
          );

          let isStreamPaused = false;
          queue.on("promiseResolved", val => {
            if (queue.pending < maxPendingApprox && isStreamPaused) {
              readlineInterface.resume();
              isStreamPaused = false;
            }
          });
          queue.on("promiseRejected", val => {
            if (queue.pending < maxPendingApprox && isStreamPaused) {
              readlineInterface.resume();
              isStreamPaused = false;
            }
          });

          const exp = [] as string[];
          const validate = async (line: string) => {
            const regExpExecArray = /^.*?((?=[:;])|$)/.exec(line);
            if (!regExpExecArray) {
              logger.warn(`Could not find a valid email for line ${line}`);
              return;
            }
            const email = regExpExecArray[0];

            let validationResult: any;

            for (let i = 0; i < 3; i++) {
              try {
                validationResult = await Promise.race([
                  validateEmail({
                    email,
                    validateMx: true,
                    validateSMTP: true,
                    validateDisposable: true,
                    validateRegex: true
                  }),
                  rejectAfter(argv.timeout, `Timeout validating email ${email}`)
                ]);

                await new Promise((res, rej) =>
                  writeStream.write(
                    JSON.stringify({ email, ...validationResult }) + "\n",
                    err => {
                      if (err) rej(err);
                      else res();
                    }
                  )
                );
                validatedAmount++;
              } catch (e) {
                if (i == 2)
                  logger.error(
                    e.message || `Error while validating ${email}, ${e}`
                  );
                validationResult = { errorMessage: e };
                errorAmount++;
              }
              updateSpinner();
            }
          };

          readlineInterface.on("line", line => {
            if (queue.pending >= maxPendingApprox && !isStreamPaused) {
              readlineInterface.pause();
              isStreamPaused = true;
            }
            queue.add(() => validate(line));
          });

          await new Promise(res => {
            readlineInterface.on("close", async () => {
              await sessionManager.setEntryFinished(archiveName, header.name);
              spinner.stop();
              entryCallback();
              res();
            });
          });
        })();
      });

      extractStream.on("finish", async () => {
        logger.info(`Successfully validated ${archiveName}`);
        await sessionManager.setArchiveFinished(archiveName);
        archiveResolve();
      });

      fs.createReadStream(archivePath)
        .pipe(zlib.createGunzip())
        .pipe(extractStream);
    });
  }

  //todo remove dupes
  console.log("Removing duplicates phase.");
  if (argv.removeDupes) await removeDupes(argv.outputDir);
};
