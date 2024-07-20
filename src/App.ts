import { execSync } from "child_process";
import { join } from "path";
import Express from "express";
import Axios from "axios";

(async function(): Promise<void> {
    let data: { price: number } = { price: await price() };
    setInterval(async () => {
        try {
            data.price = await price();
        }
        catch {}
    }, 3600 * 1000);
    let pathA: string = join(__dirname, "App.tsx");
    let pathB: string = join(__dirname);
    execSync(`bun build ${pathA} --outdir ${pathB}`);
    Express()
        .use(Express.static(__dirname))
        .get("/", async (request, response) => {
            response
                .status(200)
                .sendFile(join(__dirname, "App.html"));
        })
        .get("/data", async (request, response) => response.status(200).send(data))
        .listen(3000n);
    return;
})();

async function price(): Promise<number> {
    let envSymbols: string[] = process.env?.["SYMBOLS"]!.split("::");
    let envAmounts: string[] = process.env?.["AMOUNTS"]!.split("::");
    let netAssetValue: number = 0;
    for (let i = 0; i < envSymbols.length; i += 1) {
        let symbol: string = envSymbols[i];
        let amount: string = envAmounts[i];
        let url: string = `https://min-api.cryptocompare.com/data/price?fsym=${symbol}&tsyms=USD&api_key=${process.env?.["API_KEY"]}`;
        let response: unknown = await Axios.get(url);
        let price = parseFloat((response as any)?.data?.USD);
        let cumulativeValue: number = parseFloat(amount) * price;
        netAssetValue += cumulativeValue;
    }
    let totalSupply: number = parseFloat(process?.env?.["SUPPLY"]!);
    return netAssetValue / totalSupply;
}