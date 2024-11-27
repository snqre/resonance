import {default as Axios} from "axios";
import {Result} from "ts-results";
import {Ok} from "ts-results";

export type Market = {
    quote(symbol: string): Promise<Result<number, unknown>>;
};
export function Market(): Market {
    /***/ {
        return {quote};
    }

    async function quote(symbol: string): Promise<Result<number, unknown>> {
        let url: string = `https://api.kraken.com/0/public/Trades?pair=${symbol.toLowerCase()}usd`;
        let response = await Result.wrapAsync(async () => await Axios.get(url));
        if (response.err) return response;
        let data = response.unwrap().data;
        let last = data.result?.[`${symbol.toUpperCase()}USD`].at(-1);
        return Ok(last[0]);
    }
}