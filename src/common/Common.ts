import { Err } from "robus";
import { Ok } from "robus";

export type Api = [
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

export type Unsafe = {
    unwrap(): unknown;
};
export function Unsafe(_item: unknown): Unsafe {
    /***/ return { unwrap };

    function unwrap(): unknown {
        return _item;
    }
}

export type PriceVectorDataR = PriceVectorDataT | PriceVectorDataE;
export type PriceVectorDataT = Ok<PriceVectorData>;
export type PriceVectorDataE = 
    | Err<"ERR_TIMESTAMP_NOT_INTEGER">
    | Err<"ERR_TIMESTAMP_BELOW_ZERO">
    | Err<"ERR_TIMESTAMP_ABOVE_MSI">
    | Err<"ERR_PRICE_BELOW_ZERO">
    | Err<"ERR_PRICE_ABOVE_MSI">;
export type PriceVectorData = {
    timestamp: number;
    price: number;
};
export function PriceVectorData(_$: PriceVectorData): PriceVectorDataR {
    /***/ {
        if (!Number.isInteger(_$.timestamp)) return Err("ERR_TIMESTAMP_NOT_INTEGER");
        if (_$.timestamp < 0) return Err("ERR_TIMESTAMP_BELOW_ZERO");
        if (_$.timestamp > Number.MAX_SAFE_INTEGER) return Err("ERR_TIMESTAMP_ABOVE_MSI");
        if (_$.price < 0) return Err("ERR_PRICE_BELOW_ZERO");
        if (_$.price > Number.MAX_SAFE_INTEGER) return Err("ERR_PRICE_ABOVE_MSI");
        return Ok(_$);
    }
}

export type AssetDataR = AssetDataT | AssetDataE;
export type AssetDataT = Ok<AssetData>;
export type AssetDataE =
    | Err<"ERR_SYMBOL_REQUIRED">
    | Err<"ERR_AMOUNT_BELOW_ZERO">
    | Err<"ERR_AMOUNT_ABOVE_MSI">
    | Err<"ERR_QUOTE_BELOW_ZERO">
    | Err<"ERR_QUOTE_ABOVE_MSI">
    | Err<"ERR_VALUE_BELOW_ZERO">
    | Err<"ERR_VALUE_ABOVE_MSI">;
export type AssetData = {
    symbol: string;
    amount: number;
    quote: number;
    value: number;
};
export function AssetData(_$: AssetData): AssetDataR {
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