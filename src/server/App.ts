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

type MathIshE =
    | Err<"ERR_DIV_BY_ZER0">;


type PriceVectorDataR = 
    | PriceVectorDataT
    | PriceVectorDataE;
type PriceVectorDataT = Ok<PriceVectorData>;
type PriceVectorDataE = 
    | Err<"ERR_TIMESTAMP_NOT_INTEGER">
    | Err<"ERR_TIMESTAMP_BELOW_ZERO">
    | Err<"ERR_TIMESTAMP_ABOVE_MSI">
    | Err<"ERR_PRICE_BELOW_ZERO">
    | Err<"ERR_PRICE_ABOVE_MSI">;
type PriceVectorData = {
    timestamp: number;
    price: number;
};
function PriceVectorData(_$: PriceVectorData): PriceVectorDataR {
    /***/ {
        if (!Number.isInteger(_$.timestamp)) return Err("ERR_TIMESTAMP_NOT_INTEGER");
        if (_$.timestamp < 0) return Err("ERR_TIMESTAMP_BELOW_ZERO");
        if (_$.timestamp > Number.MAX_SAFE_INTEGER) return Err("ERR_TIMESTAMP_ABOVE_MSI");
        if (_$.price < 0) return Err("ERR_PRICE_BELOW_ZERO");
        if (_$.price > Number.MAX_SAFE_INTEGER) return Err("ERR_PRICE_ABOVE_MSI");
        return Ok(_$);
    }
}

type PriceVectorR = 
    | PriceVectorT 
    | PriceVectorE;
type PriceVectorT = Ok<PriceVector>;
type PriceVectorE = 
    | Err<"ERR_TIMESTAMP_BELOW_ZERO">
    | Err<"ERR_PRICE_BELOW_ZERO">
    | Err<"ERR_PRICE_ABOVE_MSI">;
type PriceVector = {
    timestamp(): bigint;
    price(): number;
};
function PriceVector(_timestamp: bigint, _price: number): PriceVectorR {
    /***/ {
        if (_timestamp < 0n) return Err("ERR_TIMESTAMP_BELOW_ZERO");
        if (_price < 0) return Err("ERR_PRICE_BELOW_ZERO");
        if (_price > Number.MAX_SAFE_INTEGER) return Err("ERR_PRICE_ABOVE_MSI");
        return Ok({ timestamp, price });
    }
    
    function timestamp(): bigint {
        return _timestamp;
    }

    function price(): number {
        return _price;
    }
}


type PriceVectorSet = {
    has(vector: PriceVector): boolean;
    length(): bigint;
    latest(): Option<Readonly<PriceVector>>;
    oldest(): Option<Readonly<PriceVector>>;

    get(timestamp: bigint, lookupThreshold: bigint):
        | Ok<Option<Readonly<PriceVector>>>
        | Err<"ERR_TIMESTAMP_BELOW_ZERO">
        | Err<"ERR_LOOKUP_THRESHOLD_BELOW_ZERO">

    getRange(range: [bigint, bigint], lookupThreshold: bigint):
        | Ok<ReadonlyArray<PriceVector>>
        | Err<"ERR_RANGE_LOW_BELOW_ZERO">
        | Err<"ERR_RANGE_HIGH_BELOW_ZERO">
        | Err<"ERR_RANGE_HIGH_BELOW_OR_EQUAL_TO_RANGE_LOW">
        | Err<"ERR_LOOKUP_THRESHOLD_BELOW_ZERO">;

    insert(vector: PriceVector): boolean;
    remove(timestamp: bigint): boolean;
};
function PriceVectorSet(_set: Array<PriceVector>): PriceVectorSet {
    /***/ {
        _removeDuplicate();
        _sort();
        return { has, length, latest, oldest, get, getRange, insert, remove };
    }

    function has(vector: PriceVector): boolean {
        let match:
            | PriceVector
            | void
            = _set.find(x => x.timestamp() === vector.timestamp());
        if (match) return true;
        return false;
    }

    function length(): bigint {
        return BigInt(_set.length);
    }

    function latest(): ReturnType<PriceVectorSet["latest"]> {
        let vector:
            | PriceVector
            | void
            = _set.at(-1);
        if (vector) return Some(vector);
        return None;
    }

    function oldest(): ReturnType<PriceVectorSet["oldest"]> {
        let vector: 
            | PriceVector 
            | void 
            = _set.at(0);
        if (vector) return Some(vector);
        return None;
    }

    function get(... [timestamp, lookupThreshold]: Parameters<PriceVectorSet["get"]>): ReturnType<PriceVectorSet["get"]> {
        if (timestamp < 0n) return Err("ERR_TIMESTAMP_BELOW_ZERO");
        if (lookupThreshold < 0n) return Err("ERR_LOOKUP_THRESHOLD_BELOW_ZERO");
        let match:
            | PriceVector
            | void 
            = _set.find(p => p.timestamp() === timestamp);
        if (match) return Ok(Some(match));
        let currentTimestamp: bigint = timestamp - 1n;
        let i: bigint = 0n;
        while (currentTimestamp >= 0n && i < lookupThreshold) {
            let match:
                | PriceVector
                | void 
                = _set.find(p => p.price() !== 0);
            if (match) return Ok(Some(match));
            currentTimestamp--;
            i++;
        }
        return Ok(None);
    }

    function getRange(... [range, lookupThreshold]: Parameters<PriceVectorSet["getRange"]>): ReturnType<PriceVectorSet["getRange"]> {
        if (range[0] < 0n) return Err("ERR_RANGE_LOW_BELOW_ZERO");
        if (range[1] < 0n) return Err("ERR_RANGE_HIGH_BELOW_ZERO");
        if (range[1] <= range[0]) return Err("ERR_RANGE_HIGH_BELOW_OR_EQUAL_TO_RANGE_LOW");
        if (lookupThreshold < 0n) return Err("ERR_LOOKUP_THRESHOLD_BELOW_ZERO");
        let result: Array<PriceVector> = [];
        let i: bigint = 0n;
        while (i < range[1]) {
            get(i, lookupThreshold).map(v => v.map(v => result.push(v)));
            i++;
        }
        return Ok(result);
    }

    function insert(... [vector]: Parameters<PriceVectorSet["insert"]>): ReturnType<PriceVectorSet["insert"]> {
        if (has(vector)) return false;
        _set.push(vector);
        _sort();
        return true;
    }

    function remove(... [timestamp]: Parameters<PriceVectorSet["remove"]>): ReturnType<PriceVectorSet["remove"]> {
        if (timestamp < 0n) return false;
        if (!has(PriceVector(timestamp, 0).unwrap())) return false;
        let match = _set.findIndex(p => p.timestamp() === timestamp);
        if (match === -1) return false;
        _set.splice(match, 1);
        return true;
    }

    function _sort(): void {
        _set.sort((x, y) => (x.timestamp < y.timestamp ? -1 : 1));
        return;
    }

    function _removeDuplicate(): void {
        let result: Array<PriceVector> = [];
        let match: Array<bigint> = [];
        let i: bigint = 0n;
        while (i < _set.length) {
            let vector: PriceVector = _set[Number(i)];
            let timestamp: bigint = vector.timestamp();
            let duplicate: boolean = match.includes(timestamp);
            if (duplicate) {}
            else {
                result.push(vector);
                match.push(timestamp);
            }
            i++;
        }
        _set = result;
        return;
    }
}


type PasswordR = PasswordT | PasswordE;
type PasswordT = Ok<Password>;
type PasswordE = Err<"ERR_INVALID_PASSWORD">;
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


type AssetDataR = AssetDataT | AssetDataE;
type AssetDataT = Ok<AssetData>;
type AssetDataE =
    | Err<"ERR_SYMBOL_REQUIRED">
    | Err<"ERR_AMOUNT_BELOW_ZERO">
    | Err<"ERR_AMOUNT_ABOVE_MSI">
    | Err<"ERR_QUOTE_BELOW_ZERO">
    | Err<"ERR_QUOTE_ABOVE_MSI">
    | Err<"ERR_VALUE_BELOW_ZERO">
    | Err<"ERR_VALUE_ABOVE_MSI">;
type AssetData = {
    symbol: string;
    amount: number;
    quote: number;
    value: number;
};
function AssetData(_$: AssetData): AssetDataR {
    /***/ {
        if (_$.symbol.length === 0) return Err("ERR_SYMBOL_REQUIRED");
        if (_$.amount < 0) return Err("ERR_AMOUNT_BELOW_ZERO");
        if (_$.amount > Number.MAX_SAFE_INTEGER) return Err("ERR_AMOUNT_ABOVE_MSI");
        if (_$.quote < 0) return Err("ERR_QUOTE_BELOW_ZERO");
        if (_$.quote > Number.MAX_SAFE_INTEGER) return Err("ERR_QUOTE_ABOVE_MSI");
        if (_$.value < 0) return Err("ERR_VALUE_BELOW_ZERO");
        if (_$.value > Number.MAX_SAFE_INTEGER) return Err("ERR_VALUE_ABOVE_MSI");
        return Ok(_$);
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
    zip(): Promise<AssetDataR>;
};
function Asset(_symbol: string, _amount: number): AssetR {
    /***/ {
        if (_symbol.length === 0) return Err("ERR_INVALID_SYMBOL");
        if (_amount < 0) return Err("ERR_INVALID_AMOUNT");
        if (_amount > Number.MAX_SAFE_INTEGER) return Err("ERR_INVALID_AMOUNT");
        return Ok({ symbol, amount, quote, value, zip });
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

    async function zip(): ReturnType<Asset["zip"]> {
        return AssetData({
            symbol: symbol(),
            amount: amount(),
            quote: (await quote()).unwrapOr(0),
            value: (await value()).unwrapOr(0)
        });
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
        let value$: Awaited<ReturnType<Treasury["value"]>> = await value();
        if (value$.err) return value$;
        return Ok(value$.unwrap() / supply());
    }
}


type Api = [
    "/",
    "/supply",
    "/assets",
    "/assets-by-key",
    "/assets-by-symbol",
    "/insert",
    "/remove",
    "/remove-by-key",
    "/remove-by-symbol",
    "/mint",
    "/burn",
    "/value",
    "/value-per-share",
    "/cache"
];

type App = {
    run(): ReturnType<ReturnType<typeof express>["listen"]>;
};
function App(): App {
    let _webDirectory: string;
    let _port: bigint;
    let _password: Password;
    let _treasury: Treasury;
    let _set: PriceVectorSet;

    /***/ {
        _webDirectory = join(__dirname, "web");
        _port = 8080n;
        _password = Password(process.env?.["PASSWORD"] ?? "").expect("ERR_PASSWORD_REQUIRED");
        _treasury = Treasury(0, []).unwrap();
        _set = PriceVectorSet([]);
        return { run };
    }

    function run(): ReturnType<App["run"]> {
        return express()
            .use(express.static(_webDirectory))
            .use(express.json())

            .get<Api[number]>("/", async (_, rs) => rs.sendFile(join(_webDirectory, "App.html")))

            .get("/vectors", (_, rs) => {
                rs.send([]);
                return;
            })

            .post<Api[number]>("/supply", async (rq, rs) => {
                if (!_hasValidPassword(rq)) rs.send("ERR_INVALID_PASSWORD");
                else rs.send(_treasury.supply());
                return;
            })

            /// NOTE If any `AssetData` is broken, it will be omitted in the response.
            .post<Api[number]>("/assets", async (rq, rs) => {
                if (!_hasValidPassword(rq)) rs.send("ERR_INVALID_PASSWORD");
                else 
                    rs.send(((await Promise
                        .all(_treasury
                        .assets()
                        .map(async asset => (await asset.zip()))))
                        .filter(asset => asset.ok)
                        .map(asset => asset.unwrap())));
                return;
            })
            
            .post<Api[number]>("/assets-by-key", async (rq, rs) => {
                if (!_hasValidPassword(rq)) { rs.send("ERR_INVALID_PASSWORD"); return; }
                let { _, key } = rq.body.request;
                if (typeof key === undefined) { rs.send("ERR_KEY_REQUIRED"); return; }
                if (typeof key !== "number") { rs.send("ERR_INVALID_KEY"); return; }
                let asset: ReturnType<Treasury["assetsByKey"]> = _treasury.assetsByKey(BigInt(key));
                if (asset.none) { rs.send("ERR_ASSET_NOT_FOUND"); return; }
                rs.send(asset.unwrap());
                return;
            })
            
            .post<Api[number]>("/assets-by-symbol", async (rq, rs) => {
                if (!_hasValidPassword(rq)) {
                    rs.send("ERR_INVALID_PASSWORD");
                    return;
                }
                let { _, symbol } = rq.body.request;
                if (typeof symbol !== "string") {
                    rs.send("ERR_");
                    return;
                }

            })

            .post<Api[number]>("/insert", async (rq, rs) => {
                if (!_hasValidPassword(rq)) { rs.send("ERR_INVALID_PASSWORD"); return }
                let { _, asset: assetD } = rq.body.request;
                if (typeof assetD === undefined) { rs.send("ERR_ASSET_REQUIRED"); return; }
                let match: boolean =
                    "symbol" in assetD
                    && "amount" in assetD
                    && typeof assetD.symbol === "string"
                    && typeof assetD.amount === "number";
                if (!match) { rs.send("ERR_INVALID_ASSET"); return; }
                let asset: AssetR = Asset(assetD.symbol, assetD.amount);
                if (asset.err) { rs.send(asset.toString()); return; }
                _treasury.insert(asset.unwrap());
                return;
            })

            .post<Api[number]>("/remove", async (rq, rs) => {
                if (!_hasValidPassword(rq)) {
                    rs.send("ERR_INVALID_PASSWORD");
                    return;
                }
                _treasury.remove();
                return;
            })

            .post<Api[number]>("/remove-by-key", async (rq, rs) => {
                if (!_hasValidPassword(rq)) {
                    rs.send("ERR_INVALID_PASSWORD");
                    return;
                }
                let { _, key } = rq.body.request;
                if (typeof key === "undefined") {
                    rs.send("ERR_KEY_REQUIRED");
                    return;
                }
                if (typeof key !== "number") {
                    rs.send("TYPE_ERR");
                    return;
                }
                _treasury.removeByKey(BigInt(key));
            })

            .post<Api[number]>("/mint", async (rq, rs) => {
                if (!_hasValidPassword(rq)) {
                    rs.send("ERR_INVALID_PASSWORD");
                    return;
                }
                let { _, amount } = rq.body.request;
                if (typeof amount === "undefined") {
                    rs.send("ERR_AMOUNT_REQUIRED");
                    return;
                }
                if (typeof amount !== "number") {
                    rs.send("TYPE_ERR");
                    return;
                }
                _treasury.mint(amount);
                return;
            })

            .post<Api[number]>("/burn", async (rq, rs) => {
                if (!_hasValidPassword(rq)) {
                    rs.send("ERR_INVALID_PASSWORD");
                    return;
                }
                let { _, amount } = rq.body.request;
                if (typeof amount === "undefined") {
                    rs.send("ERR_AMOUNT_REQUIRED");
                    return;
                }

            })

            .post("/value", async (rq, rs) => {
                if (!_hasValidPassword(rq)) {
                    rs.send("ERR_INVALID_PASSWORD");
                    return;
                }
                let value_: Awaited<ReturnType<Treasury["value"]>> = await _treasury.value();
                if (value_.err) {
                    rs.send(value_.toString());
                    return;
                };
                rs.send(value_.unwrap());
                return;
            })

            .get("/value-per-share", async (_, rs) => {
                let response: Awaited<ReturnType<Treasury["valuePerShare"]>> = await _treasury.valuePerShare();
                if (response.err) return;
                rs.send(response.unwrap());
                return;
            })

            .listen(Number(_port));
    }

    function _hasValidPassword(rq: Request): boolean {
        let match: boolean =
            "password" in rq.body
            && typeof rq.body.password
            && _password.isValid(rq.body.password);
        if (match) return true;
        return false;
    }
}

App().run();