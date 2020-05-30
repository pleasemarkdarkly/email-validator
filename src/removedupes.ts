import readline from "readline";
import fs, { promises as fsp } from "fs";
import path from "path";

export const removeDupes = async (filepath: string) => {
  if ((await fsp.stat(filepath)).isDirectory()) {
    const files = await fsp.readdir(filepath);
    for (const file of files) {
      if (
        (await fsp.stat(path.resolve(filepath, file))).isDirectory() ||
        file.endsWith(".array.txt")
      )
        await removeDupes(path.resolve(filepath, file));
    }
  } else {
    const set = new Set<string>();
    await new Promise(resolve => {
      console.log(`Starting to remove duplicates from ${filepath}`);
      const memReportIntervalId = setInterval(() => {
        console.log(
          `Memory usage:\n${Object.entries(process.memoryUsage())
            .map(([k, v]) => {
              return `\t\t${k}: ${Math.round((v / 1024 / 1024) * 100) /
                100} MBs`;
            })
            .join("\n")}`
        );
      }, 2500);
      const readlineInterface = readline.createInterface({
        input: fs.createReadStream(filepath, { encoding: "utf-8" }),
        crlfDelay: Infinity
      });
      readlineInterface.on("line", line => set.add(line));
      readlineInterface.on("close", async () => {
        clearInterval(memReportIntervalId);
        resolve();
      });
    });

    await fsp.writeFile(filepath, [...set.keys()].join("\n"));
    console.log(`Removed duplicates from ${filepath}`);
  }
};
