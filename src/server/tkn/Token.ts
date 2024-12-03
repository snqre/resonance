import type { Maybe } from "robus";
import { Result } from "robus";
import { Ok } from "robus";
import { Err } from "robus";

export function Token() {
    let _supply: bigint;
    let _balances: {[username: string]: bigint} = {};

    function balanceOf(username: string): bigint {
        return _balances[username] ?? 0n;
    }

    function mint(username: string, amount: bigint) {

    }
}


type FixedPointMath = {
    mul(x: bigint, y: bigint, precision: bigint): bigint;
    div(x: bigint, y: bigint, precision: bigint): bigint;
};
function FixedPointMath(): FixedPointMath {
    /***/ {
        return { mul, div };
    }

    function mul(x: bigint, y: bigint, precision: bigint): bigint {
        return (x * y) / _unit(precision);
    }

    function div(x: bigint, y: bigint, precision: bigint): bigint {
        return (x * _unit(precision)) / y;
    }

    function _unit(precision: bigint): bigint {
        return 10n ** precision;
    }
}

type Market = {
    symbol(): string;
    quote(): bigint;
};
function Market(): Market {
    let _symbol: string;
    let _reserve0: bigint;
    let _reserve1: bigint;

    /***/ {
        return { symbol, quote };
    }

    function symbol(): string {
        return _symbol;
    }

    function quote(): bigint {
        return FixedPointMath().div(_reserve1, _reserve0, 2n);
    }

    function buy(amount: bigint):
        | Ok<bigint>
        | Err<"ERR_INSUFFICIENT_LIQUIDITY"> {
        let fpm: FixedPointMath = FixedPointMath();
        let k: bigint = fpm.mul(_reserve0, _reserve1, 2n);
        let updatedReserve0: bigint = _reserve0 - amount;
        let updatedReserve1: bigint = fpm.div(k, _reserve0, 2n);
        let cost: bigint = updatedReserve1 - _reserve1;
        _reserve0 = updatedReserve0;
        _reserve1 = updatedReserve1;
        return Ok(cost);
    }

    function sell(amount: bigint) {
        
    }
}
