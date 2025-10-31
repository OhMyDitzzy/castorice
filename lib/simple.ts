import makeWASockets, { toBuffer, type UserFacingSocketConfig } from "baileys"
import chalk from "chalk";
import { format } from "util";
import fs from "fs";
import path from "path";
import { fileTypeFromBuffer } from "file-type";

export function _makeWASockets(config: UserFacingSocketConfig, options: any = {}) {
    let conn = makeWASockets(config);

    let sock = Object.defineProperties(conn, {
        chats: {
            value: { ...(options.chats || {}) },
            writable: true
        },

        decodeJid: {
            value(jid: string) {
                if (!jid || typeof jid !== "string")
                    return (!nullish(jid) && jid) || null;
                return jid;
            }
        },

        logger: {
            get() {
                return {
                    info(...args) {
                        console.log(
                            chalk.bold.bgRgb(51, 204, 51)("INFO "),
                            `[${chalk.rgb(255, 255, 255)(new Date().toUTCString())}]:`,
                            chalk.cyan(format(...args))
                        );
                    },
                    error(...args) {
                        console.log(
                            chalk.bold.bgRgb(247, 38, 33)("ERROR "),
                            `[${chalk.rgb(255, 255, 255)(new Date().toUTCString())}]:`,
                            chalk.rgb(255, 38, 0)(format(...args))
                        );
                    },
                    warn(...args) {
                        console.log(
                            chalk.bold.bgRgb(255, 153, 0)("WARNING "),
                            `[${chalk.rgb(255, 255, 255)(new Date().toUTCString())}]:`,
                            chalk.redBright(format(...args))
                        );
                    },
                    trace(...args) {
                        console.log(
                            chalk.grey("TRACE "),
                            `[${chalk.rgb(255, 255, 255)(new Date().toUTCString())}]:`,
                            chalk.white(format(...args))
                        );
                    },
                    debug(...args) {
                        console.log(
                            chalk.bold.bgRgb(66, 167, 245)("DEBUG "),
                            `[${chalk.rgb(255, 255, 255)(new Date().toUTCString())}]:`,
                            chalk.white(format(...args))
                        );
                    },
                };
            },
            enumerable: true,
        },

        getFile: {
            async value(PATH: any, saveToFile = false) {
                let res, filename;
                const data = Buffer.isBuffer(PATH)
                    ? PATH
                    : PATH instanceof ArrayBuffer
                        ? Buffer.from(PATH)
                        : /^data:.*?\/.*?;base64,/i.test(PATH)
                            ? Buffer.from(PATH.split`,`[1], "base64")
                            : /^https?:\/\//.test(PATH)
                                ? await (res = await fetch(PATH)).arrayBuffer()
                                : fs.existsSync(PATH)
                                    ? ((filename = PATH), fs.readFileSync(PATH))
                                    : typeof PATH === "string"
                                        ? PATH
                                        : Buffer.alloc(0);
                if (!Buffer.isBuffer(data))
                    throw new TypeError("Result is not a buffer");
                const type = (await fileTypeFromBuffer(data)) || {
                    mime: "application/octet-stream",
                    ext: ".bin",
                };
                if (data && saveToFile && !filename)
                    (filename = path.join(
                        __dirname,
                        "../tmp/" + <any>new Date() * 1 + "." + type.ext
                    )),
                        await fs.promises.writeFile(filename, data);
                return {
                    res,
                    filename,
                    ...type,
                    data,
                    deleteFile() {
                        return filename && fs.promises.unlink(filename);
                    },
                };
            },
            enumerable: true,
        },
    });

    return sock;
}

function nullish(args: any) {
    return !(args !== null && args !== undefined);
}