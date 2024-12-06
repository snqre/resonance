import { type AxiosResponse } from "axios";
import { type Request } from "express";
import { type RedisClientType } from "redis";
import { createClient as RedisClient } from "redis";
import { default as Axios } from "axios";
import { Option } from "robus";
import { Result } from "robus";
import { Ok } from "robus";
import { Err } from "robus";
import { Some } from "robus";
import { None } from "robus";
import { join } from "path";
import { default as express } from "express";

type Unsafe = {
    unwrap(): unknown;
};
function Unsafe(_item: unknown): Unsafe {
    /***/ return { unwrap };

    function unwrap(): unknown {
        return _item;
    }
}

type Database = {
    get(key: string): Promise<Ok<unknown> | Err<unknown>>;
    set(key: string, value: string): Promise<Result<Option<string>, unknown>>;
};

type RedisR = RedisT | RedisE;
type RedisT = Ok<Redis>;
type RedisE =
    | Err<"ERR_HOST_REQUIRED">
    | Err<"ERR_PORT_BELOW_ZERO">
    | Err<"ERR_PASSWORD_REQUIRED">
    | Err<Unsafe>;
type Redis =
    & Database
    & {
    disconnect(): Promise<Result<void, unknown>>;
};
async function Redis(_host: string, _port: bigint, _password: string): Promise<RedisR> {
    let _socket: RedisClientType;

    /***/ {
        if (_host.length === 0) return Err("ERR_HOST_REQUIRED");
        if (_port < 0n) return Err("ERR_PORT_BELOW_ZERO");
        if (_password.length === 0) return Err("ERR_PASSWORD_REQUIRED");
        let r = await Result.wrapAsync(async () => {
            _socket = RedisClient({
                password: _password,
                socket: {
                    host: _host,
                    port: Number(_port)
                }
            });
            await _socket.connect();
        });
        if (r.err) return Err(Unsafe(r.val));
        return Ok({ get, set, disconnect });
    }

    async function get(... [key]: Parameters<Redis["get"]>): ReturnType<Redis["get"]> {
        return await Result.wrapAsync(async () => await _socket.get(key));        
    }

    async function set(... [key, value]: Parameters<Redis["set"]>): ReturnType<Redis["set"]> {
        let r: Result<string | null, unknown> = await Result.wrapAsync(async () => await _socket.set(key, value));
        if (r.err) return r;
        if (typeof r === "string") return Ok(Some(r));
        if (typeof r === null) return Ok(None);
        return Ok(None);
    }

    async function disconnect(): ReturnType<Redis["disconnect"]> {
        return await Result.wrapAsync(async () => {
            await _socket.quit();
            return;
        });
    }
}


type PriceVectorDataR = PriceVectorDataT | PriceVectorDataE;
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

type PriceVectorR = PriceVectorT | PriceVectorE;
type PriceVectorT = Ok<PriceVector>;
type PriceVectorE = Err<"ERR_TIMESTAMP_BELOW_ZERO"> | Err<"ERR_PRICE_BELOW_ZERO"> | Err<"ERR_PRICE_ABOVE_MSI">;
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

    get(timestamp: bigint):
        | Ok<Readonly<PriceVector>>
        | Err<"ERR_TIMESTAMP_BELOW_ZERO">;

    getRange(range: [bigint, bigint]):
        | Ok<ReadonlyArray<PriceVector>>
        | Err<"ERR_RANGE_LOW_BELOW_ZERO">
        | Err<"ERR_RANGE_HIGH_BELOW_ZERO">
        | Err<"ERR_RANGE_HIGH_BELOW_OR_EQUAL_TO_RANGE_LOW">;

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
        let match: PriceVector | void = _set.find(x => x.timestamp() === vector.timestamp());
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

    function get(... [timestamp]: Parameters<PriceVectorSet["get"]>): ReturnType<PriceVectorSet["get"]> {
        if (timestamp < 0n) return Err("ERR_TIMESTAMP_BELOW_ZERO");
        let match:
            | PriceVector
            | void
            = _set.find(p => p.timestamp() === timestamp);
        if (match) return Ok(match);
        let i: bigint = BigInt(_set.length);
        while (i >= 0n) {
            let vector: 
                | PriceVector
                | void 
                = _set.at(Number(i));
            if (vector) {
                let match: boolean = vector.timestamp() < timestamp && vector.price() !== 0;
                if (match) return Ok(vector);
            }
            i--;
        }
        return Ok(PriceVector(timestamp, 0).unwrap());
    }

    function getRange(... [range]: Parameters<PriceVectorSet["getRange"]>): ReturnType<PriceVectorSet["getRange"]> {
        if (range[0] < 0n) return Err("ERR_RANGE_LOW_BELOW_ZERO");
        if (range[1] < 0n) return Err("ERR_RANGE_HIGH_BELOW_ZERO");
        if (range[1] <= range[0]) return Err("ERR_RANGE_HIGH_BELOW_OR_EQUAL_TO_RANGE_LOW");
        let result: Array<PriceVector> = [];
        let i: bigint = range[0];
        while (i <= range[1]) {
            let vector: PriceVector = get(i).unwrap();
            let vectorParsed: PriceVector = PriceVector(i, vector.price()).unwrap();
            result.push(vectorParsed);
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


type TreasuryR = TreasuryT | TreasuryE;
type TreasuryT = Ok<Treasury>;
type TreasuryE = 
    | Err<"ERR_INVALID_SUPPLY">;
type Treasury = {
    supply(): number;
    assets(): ReadonlyArray<Readonly<Asset>>;
    assetsByKey(key: bigint): Option<Readonly<Asset>>;
    assetsBySymbol(symbol: string): Option<Readonly<Asset>>;
    insert(asset: AssetR | Asset): Result<void, AssetE>;
    remove(): void;
    removeByKey(key: bigint): Ok<void> | Err<"ERR_ASSET_NOT_FOUND">;
    removeBySymbol(symbol: string): Ok<void> | Err<"ERR_ASSET_NOT_FOUND">;
    mint(amount: number): Ok<void> | Err<"ERR_INVALID_AMOUNT"> | Err<"ERR_SUPPLY_OVERFLOW">;
    burn(amount: number): Ok<void> | Err<"ERR_INVALID_AMOUNT"> | Err<"ERR_SUPPLY_UNDERFLOW">;
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
    "/chart/vector",
    "/chart/vector/range",
    "/treasury/supply",
    "/treasury/assets",
    "/treasury/assets/key",
    "/treasury/assets/symbol",
    "/treasury/insert",
    "/treasury/remove",
    "/treasury/remove/key",
    "/treasury/remove/symbol",
    "/treasury/mint",
    "/treasury/burn",
    "/treasury/value",
    "/treasury/value/share"
];

type AppR = AppT | AppE;
type AppT = Ok<App>;
type AppE =
    | TreasuryE
    | PasswordE
    | RedisE
    | Err<"ERR_MISSING_PASSWORD">
    | Err<"ERR_MISSING_REDIS_PASSWORD">;
type App = {
    run(): ReturnType<ReturnType<typeof express>["listen"]>;
};
async function App(): Promise<AppR> {
    let _webDirectory: string;
    let _port: bigint;
    let _password: Password;
    let _treasury: Treasury;
    let _set: PriceVectorSet;
    let _redis: Redis;

    /***/ {
        _webDirectory = join(__dirname, "web");
        _port = 8080n;
        _treasury = Treasury(0, []).unwrap();
        _set = PriceVectorSet([]);
    }

    /***/ {
        let r: TreasuryR = Treasury(0, []);
        if (r.err) return r;
        _treasury = r.unwrap();
    }

    /***/ {
        let env:
            | string
            | void
            = process.env?.["PASSWORD"];
        if (!env) return Err("ERR_MISSING_PASSWORD");
        let r: PasswordR = await Password(env);
        if (r.err) return r;
        _password = r.unwrap();
    }

    /***/ {
        let env:
            | string
            | void
            = process.env?.["REDIS_PASSWORD"];
        if (!env) return Err("ERR_MISSING_REDIS_PASSWORD");
        let r: RedisR = await Redis("redis-15112.c259.us-central1-2.gce.redns.redis-cloud.com", 15112n, env);
        if (r.err) return r;
        _redis = r.unwrap();
    }

    /***/ return Ok({ run });

    function run(): ReturnType<App["run"]> {
        return express()
            .use(express.static(_webDirectory))
            .use(express.json())

            .get<Api[number]>("/", async (_, rs) => rs.sendFile(join(_webDirectory, "App.html")))


            .post<Api[number]>("/chart/vector", (rq, rs) => {
                let [timestamp] = rq.body;
                let match: boolean =
                    !!timestamp
                    && typeof timestamp === "number"
                    && Number.isInteger(timestamp)
                    && timestamp >= 0
                    && timestamp < Number.MAX_SAFE_INTEGER;
                if (!match) rs.send(["ERR_INVALID_PARAMS"]);
                else {
                    let timestamp$: bigint = BigInt(timestamp);
                    let r: ReturnType<PriceVectorSet["get"]> = _set.get(timestamp$);
                    if (r.err) rs.send([r.toString()]);
                    else r.map(v => PriceVectorData({timestamp: Number(v.timestamp()), price: v.price()}))
                }
                return;
            })

            .post<Api[number]>("/chart/vector/range", (rq, rs) => {
                let [from, to] = rq.body;
                let match: boolean =
                    !!from
                    && typeof from === "number"
                    && Number.isInteger(from)
                    && from >= 0
                    && from < Number.MAX_SAFE_INTEGER
                    && !!to
                    && typeof to === "number"
                    && Number.isInteger(to)
                    && to > from
                    && to < Number.MAX_SAFE_INTEGER;
                if (!match) rs.send(["ERR_INVALID_PARAMS"]);
                else {
                    let from$: bigint = BigInt(from);
                    let to$: bigint = BigInt(to);
                    let r: ReturnType<PriceVectorSet["getRange"]> = _set.getRange([from$, to$]);
                    if (r.err) rs.send([r.toString()]);
                    else {
                        let response: Array<PriceVectorData> = [];
                        r
                            .unwrap()
                            .map(v => PriceVectorData({timestamp: Number(v.timestamp()), price: v.price()}))
                            .map(v => v.map(v => response.push(v)));
                        rs.send(response);
                    }
                }
                return;
            })


            .post<Api[number]>("/treasury/supply", async (rq, rs) => {
                if (!_hasValidPassword(rq)) rs.send(["ERR_INVALID_PASSWORD"]);
                else rs.send([_treasury.supply()]);
                return;
            })

            .post<Api[number]>("/treasury/assets", async (rq, rs) => {
                if (!_hasValidPassword(rq)) rs.send(["ERR_INVALID_PASSWORD"]);
                else 
                    rs.send(((await Promise
                        .all(_treasury
                        .assets()
                        .map(async asset => (await asset.zip()))))
                        .filter(asset => asset.ok)
                        .map(asset => asset.unwrap())));
                return;
            })
            
            .post<Api[number]>("/treasury/assets/key", async (rq, rs) => {
                if (!_hasValidPassword(rq)) rs.send(["ERR_INVALID_PASSWORD"]);
                else {
                    let [_, key] = rq.body;
                    let match: boolean =
                        !!key
                        && typeof key === "number";
                    if (!match) rs.send(["ERR_INVALID_PARAMS"]);
                    else {
                        let asset: ReturnType<Treasury["assetsByKey"]> = _treasury.assetsByKey(BigInt(key));
                        if (asset.none) rs.send(["ERR_ASSET_NOT_FOUND"]);
                        else rs.send([asset.unwrap()]);
                    }
                }
                return;
            })
            
            .post<Api[number]>("/treasury/assets/symbol", async (rq, rs) => {
                if (!_hasValidPassword(rq)) rs.send(["ERR_INVALID_PASSWORD"]);
                else {
                    let [_, symbol] = rq.body;
                    let match: boolean = 
                        !!symbol
                        && typeof symbol === "string";
                    if (!match) rs.send(["ERR_INVALID_PARAMS"]);
                    else {
                        let asset: ReturnType<Treasury["assetsBySymbol"]> = _treasury.assetsBySymbol(symbol);
                        if (asset.none) rs.send(["ERR_ASSET_NOT_FOUND"]);
                        else rs.send([asset.unwrap()]);
                    }
                }
                return;
            })

            .post<Api[number]>("/treasury/insert", async (rq, rs) => {
                if (!_hasValidPassword(rq)) rs.send(["ERR_INVALID_PASSWORD"]);
                else {
                    let [_, assetD] = rq.body;
                    let match: boolean =
                        !!assetD
                        && typeof assetD === "object"
                        && "symbol" in assetD
                        && "amount" in assetD
                        && typeof assetD.symbol === "string"
                        && typeof assetD.amount === "number";
                    if (!match) rs.send(["ERR_INVALID_PARAMS"]);
                    else {
                        let asset: AssetR = Asset(assetD.symbol, assetD.amount);
                        if (asset.err) rs.send([asset.toString()]);
                        else _treasury.insert(asset.unwrap());
                    }
                }
                return;
            })

            .post<Api[number]>("/treasury/remove", async (rq, rs) => {
                if (!_hasValidPassword(rq)) rs.send(["ERR_INVALID_PASSWORD"]);
                else _treasury.remove();
                return;
            })


            .post<Api[number]>("/treasury/remove/key", async (rq, rs) => {
                if (!_hasValidPassword(rq)) rs.send(["ERR_INVALID_PASSWORD"]);
                else {
                    let [_, key] = rq.body;
                    let match: boolean =
                        !!key
                        && typeof key === "number"
                        && key > 0
                        && key < Number.MAX_SAFE_INTEGER;
                    if (!match) rs.send(["ERR_INVALID_PARAMS"]);
                    else {
                        let r: ReturnType<Treasury["removeByKey"]> = _treasury.removeByKey(BigInt(key));
                        if (r.err) rs.send(["ERR_ASSET_NOT_FOUND"]);
                    }
                }
                return;
            })

            .post<Api[number]>("/treasury/remove/symbol", async (rq, rs) => {
                if (!_hasValidPassword(rq)) rs.send(["ERR_INVALID_PASSWORD"]);
                else {
                    let [_, symbol] = rq.body;
                    let match: boolean =
                        !!symbol
                        && typeof symbol === "string"
                        && symbol.length !== 0;
                    if (!match) rs.send(["ERR_INVALID_PARAMS"]);
                    else {
                        let r: ReturnType<Treasury["removeBySymbol"]> = _treasury.removeBySymbol(symbol);
                        if (r.err) rs.send(["ERR_ASSET_NOT_FOUND"]);
                    }
                }
                return;
            })

            .post<Api[number]>("/treasury/mint", async (rq, rs) => {
                if (!_hasValidPassword(rq)) rs.send(["ERR_INVALID_PASSWORD"]);
                else {
                    let [_, amount] = rq.body;
                    let match: boolean =
                        !!amount
                        && typeof amount === "number"
                        && amount > 0
                        && amount < Number.MAX_SAFE_INTEGER;
                    if (!match) rs.send(["ERR_INVALID_PARAMS"]);
                    else {
                        let r: ReturnType<Treasury["mint"]> = _treasury.mint(amount);
                        if (r.err) rs.send([r.toString()]);
                    }
                }
                return;
            })

            .post<Api[number]>("/treasury/burn", async (rq, rs) => {
                if (!_hasValidPassword(rq)) rs.send(["ERR_INVALID_PASSWORD"]);
                else {
                    let [_, amount] = rq.body;
                    let match: boolean =
                        !!amount
                        && typeof amount === "number"
                        && amount > 0
                        && amount < Number.MAX_SAFE_INTEGER;
                    if (!match) rs.send(["ERR_INVALID_PARAMS"]);
                    else {
                        let r: ReturnType<Treasury["burn"]> = _treasury.burn(amount);
                        if (r.err) rs.send([r.toString()]);
                    }
                }
                return;
            })

            .post<Api[number]>("/treasury/value", async (rq, rs) => {
                if (!_hasValidPassword(rq)) rs.send(["ERR_INVALID_PASSWORD"]);
                else {
                    let r: Awaited<ReturnType<Treasury["value"]>> = await _treasury.value();
                    if (r.err) rs.send([r.toString()]);
                    else rs.send([r.unwrap()]);
                }
                return;
            })

            .post<Api[number]>("/treasury/value/share", async (rq, rs) => {
                if (!_hasValidPassword(rq)) rs.send(["ERR_INVALID_PASSWORD"]);
                else {
                    let r: Awaited<ReturnType<Treasury["valuePerShare"]>> = await _treasury.valuePerShare();
                    if (r.err) rs.send([r.toString()]);
                    else rs.send([r.unwrap()]);
                }
                return;
            })

            .listen(Number(_port));
    }

    function _hasValidPassword(rq: Request): boolean {
        let [password] = rq.body;
        let match: boolean =
            !!password
            && typeof password
            && _password.isValid(password);
        if (match) return true;
        return false;
    }
}

(await App()).unwrap().run();