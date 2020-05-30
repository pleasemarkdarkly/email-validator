import winston, { format } from "winston";
import path from "path";

export const createLogger = (verbosity: string, logPath: string) =>
  winston.createLogger({
    level: verbosity,
    transports: [
      new winston.transports.Console({
        handleExceptions: true,
        format: format.combine(
          format.prettyPrint(),
          format.colorize({ all: true }),
          format.printf(info => {
            const { level, message, ...rest } = info;
            const now = new Date();
            const hours = ("0" + now.getHours()).slice(-2);
            const minutes = ("0" + now.getMinutes()).slice(-2);
            const seconds = ("0" + now.getSeconds()).slice(-2);
            return `[${level}][${hours}:${minutes}:${seconds}] ${message} ${
              Object.keys(rest).length
                ? "\n" + JSON.stringify(rest, null, 2)
                : ""
            }`;
          })
        )
      }),
      new winston.transports.File({
        filename: path.resolve(logPath, "log.log"),
        format: format.combine(format.timestamp(), format.prettyPrint()),
        handleExceptions: true
      })
    ]
  });
