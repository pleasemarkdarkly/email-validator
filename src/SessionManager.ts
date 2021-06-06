import { promises as fsp } from "fs";
import path from "path";
export class SessionManager {
  private sessionData!: {
    archivesFinished: string[];
    perArchiveEntriesFinished: { [archiveName: string]: string[] };
  };
  outputDirPath!: string;

  private constructor() {}
  static async new(outputDir: string) {
    const manager = new SessionManager();
    manager.outputDirPath = path.resolve(outputDir, "sessionData.json");
    try {
      manager.sessionData = JSON.parse(
        await fsp.readFile(manager.outputDirPath, {
          encoding: "utf-8"
        })
      );
    } catch (e) {
      manager.sessionData = {
        archivesFinished: [],
        perArchiveEntriesFinished: {}
      };
    }
    await manager.writeToDisk();
    return manager;
  }

  async setArchiveFinished(archiveName: string) {
    this.sessionData.archivesFinished.push(archiveName);
    await this.writeToDisk();
  }

  isArchiveFinished(archiveName: string) {
    return this.sessionData.archivesFinished.includes(archiveName);
  }

  isEntryFinished(archiveName: string, entry: string) {
    return (
      this.sessionData.perArchiveEntriesFinished[archiveName] &&
      this.sessionData.perArchiveEntriesFinished[archiveName].includes(entry)
    );
  }

  async setEntryFinished(archiveName: string, entry: string) {
    if (!this.sessionData.perArchiveEntriesFinished[archiveName])
      this.sessionData.perArchiveEntriesFinished[archiveName] = [];
    this.sessionData.perArchiveEntriesFinished[archiveName].push(entry);
    await this.writeToDisk();
  }

  async writeToDisk() {
    return await fsp.writeFile(
      this.outputDirPath,
      JSON.stringify(this.sessionData, null, 2)
    );
  }
}
