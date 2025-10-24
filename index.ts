import path from "path";
import readline from "readline";
import cluster from "cluster";
import chalk from "chalk";
import { unwatchFile, watchFile } from "fs";
import yargs from "yargs";

let isRunning: boolean = false;
const rl: readline.Interface = readline.createInterface(process.stdin, process.stdout);

function startFile(nameOfFile: string) {
    if (isRunning) return;
    isRunning = true;
    let args = [path.join(import.meta.dirname, nameOfFile), ...process.argv.slice(2)]

    cluster.setupPrimary({
        exec: args[0],
        args: args.slice(1),
    });

    let p = cluster.fork();

    p.on("message", data => {
        console.log(chalk.bgBlack(chalk.yellowBright("RECEIVED: ")), data);
        switch (data) {
            case "reset":
                p.process.kill();
                isRunning = false;
                // avoid 
                startFile.apply(this as any, arguments as any);
                break;
            case "uptime":
                p.send(process.uptime())
                break;
        }
    });

    p.on("exit", (code: number, _) => {
        isRunning = false;
        console.error("PROGRAM EXITED WITH CODE: ", code);
        if (code === 0) return;
        watchFile(args[0] as any, () => {
            unwatchFile(args[0] as any);
            startFile(nameOfFile);
        });
    });

    let opts = new Object(yargs(process.argv.slice(2)).exitProcess(false).parse());
    if (!opts["test"]) 
        if (!rl.listenerCount) rl.on("line", line => {
            p.emit("message", line.trim());
        });
    // console.log(p)
}

startFile("main.js");