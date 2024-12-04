import { type AxiosResponse } from "axios";
import { type Request } from "express";
import { default as Axios } from "axios";
import { Option } from "robus";
import { Result } from "robus";
import { Ok } from "robus";
import { Err } from "robus";
import { Some } from "robus";
import { None } from "robus";
import { join } from "path";
import { default as express } from "express";

type PasswordR = Result<PasswordT, PasswordE>;
type PasswordT = Password;
type PasswordE = 
    | "ERR_INVALID_PASSWORD";
type Password = {
    isValid(password: string): boolean;
};
function Password(_password: string): PasswordR {
    /***/ {
        if (_password.length === 0) return Err("ERR_INVALID_PASSWORD");
        return Ok({ isValid });
    }

    function isValid(... [password]: Parameters<Password["isValid"]>): ReturnType<Password["isValid"]> {
        if (password === _password) return true;
        return false;
    }
}


type AssetR = Result<AssetT, AssetE>;
type AssetT = Asset;
type AssetE = 
    | "ERR_INVALID_SYMBOL"
    | "ERR_INVALID_AMOUNT";
type Asset = {
    symbol(): string;
    amount(): number;
    quote(): Promise<Result<number, unknown>>;
    value(): Promise<Result<number, unknown>>;
};
function Asset(_symbol: string, _amount: number): AssetR {
    /***/ {
        if (_symbol.length === 0) return Err("ERR_INVALID_SYMBOL");
        if (_amount < 0) return Err("ERR_INVALID_AMOUNT");
        if (_amount > Number.MAX_SAFE_INTEGER) return Err("ERR_INVALID_AMOUNT");
        return Ok({ symbol, amount, quote, value });
    }

    function symbol(): ReturnType<Asset["symbol"]> {
        return _symbol;
    }

    function amount(): ReturnType<Asset["amount"]> {
        return _amount;
    }

    async function quote(): ReturnType<Asset["quote"]> {
        let url: string = `https://api.kraken.com/0/public/Trades?pair=${symbol().toLowerCase()}usd`;
        let response: Result<AxiosResponse, unknown> = await Result.wrapAsync(async () => await Axios.get(url));
        if (response.err) return response;
        let content: unknown = response.unwrap().data;
        /// WARNING I'm too lazy to check this so we are just going to assume this is ok.
        let last: unknown = (content as any).result?.[`${symbol().toUpperCase()}USD`].at(-1);
        return Ok((last as any)[0]);
    }

    async function value(): ReturnType<Asset["value"]> {
        let quote_: Awaited<ReturnType<typeof quote>> = await quote();
        if (quote_.err) return quote_;
        return Ok(amount() * quote_.unwrap());
    }
}


type TreasuryR = Result<TreasuryT, TreasuryE>;
type TreasuryT = Treasury;
type TreasuryE = 
    | "ERR_INVALID_SUPPLY";
type Treasury = {
    supply(): number;
    assets(): ReadonlyArray<Readonly<Asset>>;
    assetsByKey(key: bigint): Option<Readonly<Asset>>;
    assetsBySymbol(symbol: string): Option<Readonly<Asset>>;
    insert(asset: AssetR | Asset): Result<void, AssetE>;
    remove(): void;
    removeByKey(key: bigint):
        | Ok<void>
        | Err<"ERR_ASSET_NOT_FOUND">;
    removeBySymbol(symbol: string):
        | Ok<void>
        | Err<"ERR_ASSET_NOT_FOUND">;
    mint(amount: number): 
        | Ok<void>
        | Err<"ERR_INVALID_AMOUNT">
        | Err<"ERR_SUPPLY_OVERFLOW">;
    burn(amount: number):
        | Ok<void>
        | Err<"ERR_INVALID_AMOUNT">
        | Err<"ERR_SUPPLY_UNDERFLOW">;
    value(): Promise<Result<number, unknown>>;
    valuePerShare(): Promise<Result<number, unknown>>;
};
function Treasury(_supply: number, _assets: Array<Readonly<Asset>>): TreasuryR {
    /***/ {
        if (_supply < 0) return Err("ERR_INVALID_SUPPLY");
        if (_supply > Number.MAX_SAFE_INTEGER) return Err("ERR_INVALID_SUPPLY");
        return Ok({
            supply,
            assets,
            assetsByKey,
            assetsBySymbol,
            insert,
            remove,
            removeByKey,
            removeBySymbol,
            mint,
            burn,
            value,
            valuePerShare
        });
    }

    function supply(): ReturnType<Treasury["supply"]> {
        return _supply;
    }

    function assets(): ReturnType<Treasury["assets"]> {
        return _assets;
    }

    function assetsByKey(... [key]: Parameters<Treasury["assetsByKey"]>): ReturnType<Treasury["assetsByKey"]> {
        let asset:
            | Readonly<Asset>
            | void
            = assets()[Number(key)];
        if (asset) return Some(asset);
        return None;
    }

    function assetsBySymbol(... [symbol]: Parameters<Treasury["assetsBySymbol"]>): ReturnType<Treasury["assetsBySymbol"]> {
        let asset:
            | Readonly<Asset>
            | void 
            = assets().find(asset => asset.symbol() === symbol);
        if (asset) return Some(asset);
        return None;
    }
   
    function insert(... [asset]: Parameters<Treasury["insert"]>): ReturnType<Treasury["insert"]> {
        if (Result.isResult(asset)) {
            if (asset.err) return asset;
            _assets.push(asset.unwrap());
            return Ok(undefined);
        }
        _assets.push(asset);
        return Ok(undefined);
    }

    function remove(): ReturnType<Treasury["remove"]> {
        _assets = [];
        return;
    }

    function removeByKey(... [key]: Parameters<Treasury["removeByKey"]>): ReturnType<Treasury["removeByKey"]> {
        if (key > assets().length - 1) return Err("ERR_ASSET_NOT_FOUND");
        _assets = assets().slice().splice(Number(key), 1);
        return Ok(undefined);
    }

    function removeBySymbol(... [symbol]: Parameters<Treasury["removeBySymbol"]>): ReturnType<Treasury["removeBySymbol"]> {
        let i: bigint = 0n;
        while (i < assets().length) {
            let asset: ReturnType<Treasury["assetsByKey"]> = assetsByKey(i);
            if (asset.unwrap().symbol() === symbol) {
                _assets = 
                    assets()
                        .slice()
                        .splice(Number(i), 1);
                return Ok(undefined);
            }
        }
        return Err("ERR_ASSET_NOT_FOUND");
    }

    function mint(... [amount]: Parameters<Treasury["mint"]>): ReturnType<Treasury["mint"]> {
        if (amount <= 0) return Err("ERR_INVALID_AMOUNT");
        if (amount > Number.MAX_SAFE_INTEGER) return Err("ERR_INVALID_AMOUNT");
        if (supply() + amount > Number.MAX_SAFE_INTEGER) return Err("ERR_SUPPLY_OVERFLOW");
        _supply += amount;
        return Ok(undefined);
    }

    function burn(... [amount]: Parameters<Treasury["burn"]>): ReturnType<Treasury["burn"]> {
        if (amount <= 0) return Err("ERR_INVALID_AMOUNT");
        if (amount > Number.MAX_SAFE_INTEGER) return Err("ERR_INVALID_AMOUNT");
        if (supply() - amount < 0) return Err("ERR_SUPPLY_UNDERFLOW");
        _supply -= amount;
        return Ok(undefined);
    }

    async function value(): ReturnType<Treasury["value"]> {
        let result: number = 0;
        let i: bigint = 0n;
        while (i < assets().length) {
            let asset: ReturnType<Treasury["assetsByKey"]> = assetsByKey(i);
            let value: Awaited<ReturnType<Asset["value"]>> = await asset.unwrap().value();
            if (value.err) return value;
            result += value.unwrap();
            i++;
        }
        return Ok(result);
    }

    async function valuePerShare(): ReturnType<Treasury["valuePerShare"]> {
        let value_: Awaited<ReturnType<Treasury["value"]>> = await value();
        if (value_.err) return value_;
        return Ok(value_.unwrap() / supply());
    }
}


type App = {
    run(): ReturnType<ReturnType<typeof express>["listen"]>;
};
function App(): App {
    let _webDirectory: string;
    let _port: bigint;
    let _password: Password;
    let _treasury: Treasury;

    /***/ {
        _webDirectory = join(__dirname, "web");
        _port = 8080n;
        _password = Password(process.env?.["PASSWORD"] ?? "").expect("ERR_PASSWORD_REQUIRED");
        _treasury = Treasury(0, []).unwrap();
        return { run };
    }

    function run(): ReturnType<App["run"]> {
        return express()
            .use(express.static(_webDirectory))
            .use(express.json())
            .get("/", async (_, rs) => rs.sendFile(join(_webDirectory, "App.html")))
            .post("/treasury/supply", async (rq, rs) => {
                if (!_isFromAdmin(rq)) return;
                rs.send(_treasury.supply());
                return;
            })
            .post("/treasury/assets", async (rq, rs) => {
                if (!_isFromAdmin(rq)) return;
                let promisedResponse: Array<Promise<{
                    symbol: string;
                    amount: number;
                    quote: number;
                    value: number;
                }>> = 
                    _treasury
                        .assets()
                        .map(async asset => ({
                            symbol: asset.symbol(),
                            amount: asset.amount(),
                            quote: (await asset.quote()).unwrapOr(0),
                            value: (await asset.value()).unwrapOr(0)
                        }));
                let response: Array<{
                    symbol: string;
                    amount: number;
                    quote: number;
                    value: number;
                }> = await Promise.all(promisedResponse);
                rs.send(response);
                return;
            })
            .listen(Number(_port));
    }

    function _isFromAdmin(rq: Request): boolean {
        let match: boolean =
            "password" in rq.body
            && typeof rq.body.password
            && _password.isValid(rq.body.password);
        if (match) return true;
        return false;
    }
}

App().run();











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