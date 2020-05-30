import { promises as fsp } from "fs";

export const createDirIfNotExists = async (path:string) => {
  try {
    await fsp.access(path);
    return false;
  } catch (e) {
    if (e.code === "EEXIST" || e.code === "ENOENT") {
        await fsp.mkdir(path, {recursive: true});
        return true;
    }
    else throw e;

  }
};
