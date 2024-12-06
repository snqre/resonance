import {Result} from "robus";
import {BuildActionStandardConfig} from "robus/ts";
import {CopyFileActionConfig} from "robus/fs";
import {build} from "robus/ts";
import {copyFile} from "robus/fs";
import {copyDirectory} from "robus/fs";

let app0: string = "src/client/App.tsx";
let app1: string = "src/client/App.html";

(await Result.wrapAsync(async () => {
    await Bun.build({
        entrypoints: [app0],
        outdir: "dist/client",
        format: "esm",
        target: "browser",
        sourcemap: "inline",
        minify: true
    });
})).unwrap();

(await copyFile(CopyFileActionConfig({
    from: app1,
    to: "dist/client/App.html",
    encoding: "utf8",
    overwrite: true
}))).unwrap();

(await copyDirectory("src/client/public", "dist/client/public")).unwrap();

(await build(BuildActionStandardConfig({
    entry: [
        "src/server/App.ts"
    ],
    format: ["cjs", "esm"],
    dts: true,
    tsconfig: "tsconfig.json",
    minify: true,
    outDir: "dist"
    
}))).unwrap();

