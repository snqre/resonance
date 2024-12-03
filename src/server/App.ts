import {default as Express} from "express";
import {None, Result} from "ts-results";
import {Market} from "./adaptor/Market";
import * as Path from "path";
import * as ChildProcess from "child_process";

(async () => {
    let web = Result.wrap(() => Path.join(__dirname, "client"));
    let tsx = Result.wrap(() => Path.join(web.unwrap(), "App.tsx"))
    let html = Result.wrap(() => Path.join(web.unwrap(), "App.html"));
    (await Result.wrapAsync(async () => await new Promise(resolve => ChildProcess.exec(`bun build ${tsx.unwrap()} --outdir ${web.unwrap()}`, e => resolve(e))))).unwrap();
    let symbols = process.env?.["SYMBOLS"]?.split(",");
    let amounts = process.env?.["AMOUNTS"]?.split(",").map(amount => Number(amount));
    let supply = Number(process.env?.["SUPPLY"]);
    let market: Market = Market();
    let assets = symbols?.map(async (symbol, key) => {
        let price = await market.quote(symbol);
        let amount: number;
        if (amounts) amount = amounts[key];
        else amount = 0;
        return amount * price.unwrapOr(0);
    });
    let sum: number = 0;
    await new Promise(resolve => assets?.forEach(async (asset, key) => {
        sum += (await asset);
        if (key === assets.length - 1) resolve(None);
        return;
    }));
    let nav = sum / supply;
    let dataset: Array<{
        timestamp: number;
        price: number;
    }> = [];
    setInterval(() => {
        dataset.push({
            timestamp: Date.now(),
            price: nav
        });
        return;
    }, 1000);
    let port: number = 8080;
    let app = Express()
        .use(Express.static(web.unwrap()))
        .use(Express.json())
        .get("/", (rq, rs) => rs.sendFile(html.unwrap()))
        .get("/dataset", (rq, rs) => {
            rs.send(dataset);
        })
        .listen(port);
})();