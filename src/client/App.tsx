import { Unsafe, type Api } from "@common";
import { default as Axios } from "axios";
import { Result } from "ts-results";
import { Option } from "ts-results";
import { Err } from "ts-results";
import { Ok } from "ts-results";
import { PriceVectorData } from "@common";
import { createRoot as Root } from "react-dom/client";
import { useDevice } from "./hook/Device";
import * as React from "react";
import * as ColorPalette from "./constant/ColorPalette";
import * as Recharts from "recharts";

function App(): React.ReactNode {
    let device = useDevice();

    let page$: React.CSSProperties = {
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        width: "100vw",
        height: "100vh",
        background: ColorPalette.EEIRE_BLACK
    };
    let innerPage$: React.CSSProperties = {
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        width:
            device === "laptop" ? 1024 :
            device === "tablet" ? 768 :
            device === "mobile" ? 320 :
            undefined,
        height: "100%"
    };

    return <>
        <div style={page$}>
            <div style={innerPage$}>
                <_Chart/>
            </div>
        </div>
    </>;
}

function _Chart(): React.ReactNode {
    let [vectors, setVectors] = React.useState<Array<PriceVectorData>>([]);
    let container$: Omit<Recharts.ResponsiveContainerProps, "children"> = {
        width: "100%",
        height: 300
    };
    let lineChart$ = {
        data: vectors
    } as const;
    let xAxis$: Recharts.XAxisProps = {
        fill: ColorPalette.TIMPERWOLD,
        axisLine: false,
        tickLine: false,
        dataKey: "timestamp",
        tickFormatter: timestamp => new Date(timestamp).toLocaleDateString(),
        tick: {
            fill: ColorPalette.TIMPERWOLD,
            fontSize: "0.75em",
            fontWeight: "normal",
            fontFamily: "suisse-intl-regular"
        }
    };
    let yAxis$: Recharts.YAxisProps = {
        scale: "auto",
        padding: {
            bottom: 20
        },
        axisLine: false,
        tickLine: false,
        tickFormatter: tick => `${tick}`,
        tick: {
            fill: ColorPalette.TIMPERWOLD,
            fontSize: "0.75em",
            fontWeight: "normal",
            fontFamily: "suisse-intl-regular"
        }
    };
    let line$: Recharts.LineProps = {
        type: "monotone",
        dataKey: "price",
        stroke: ColorPalette.TIMPERWOLD,
        dot: false,
        height: 5,
        strokeWidth: 2.5,
        strokeLinecap: "square"
    };
    let tooltip$: React.CSSProperties = {
        backgroundColor: ColorPalette.EEIRE_BLACK, 
        color: ColorPalette.TIMPERWOLD, 
        fontSize: "0.75em", 
        fontWeight: "normal", 
        fontFamily: "suisse-intl-regular"
    };

    async function range(fromTimestamp: bigint, toTimestamp: bigint): Promise<
        | Ok<Array<PriceVectorData>>
        | Err<"ERR_INVALID_DATA">
        | Err<Unsafe>> {
        let route: Api[number] = "/chart/vector/range";
        let fromTimestampFloat: number = Number(fromTimestamp);
        let toTimestampFloat: number = Number(toTimestamp);
        let response: Result<Axios.AxiosResponse, unknown> = await Result.wrapAsync(async () => await Axios.post(route, [fromTimestampFloat, toTimestampFloat]));
        if (response.err) return Err(Unsafe(response));
        let data: unknown = response.unwrap().data;
        let match: boolean =
            data !== undefined
            && data !== null
            && Array.isArray(data);
        if (!match) return Err("ERR_INVALID_DATA");
        let i: bigint = 0n;
        while (i < (data as any).length) {
            let item: unknown = (data as any)[Number(i)];
            let match: boolean = 
                item !== undefined
                && item !== null
                && typeof item === "object"
                && "timestamp" in item
                && "price" in item
                && typeof item.timestamp === "number"
                && typeof item.price === "number";
            if (!match) return Err("ERR_INVALID_DATA");
            i++;
        }
        return Ok((data as Array<PriceVectorData>));
    }

    React.useEffect(() => {
        (async () => {
            let now: bigint = BigInt(Date.now());
            let oneHour: bigint = 3600n * 1000n;
            let oneHourAgo: bigint = now - oneHour;
            (await range(oneHourAgo, now))
                .map(v => setVectors(v))
                .mapErr(e => console.error(e));
            return;
        })();
        return;
    }, []);

    return <>
        <Recharts.ResponsiveContainer {... container$}>
            <Recharts.LineChart {... lineChart$}>
                <Recharts.XAxis {... (xAxis$ as any)}/>
                <Recharts.YAxis {... (yAxis$ as any)}/>
                <Recharts.Tooltip contentStyle={tooltip$} labelFormatter={timestamp => new Date(timestamp).toLocaleDateString()}/>
                <Recharts.Line {... (line$ as any)}/>
            </Recharts.LineChart>
        </Recharts.ResponsiveContainer>
    </>;
}

Root(document.getElementById("root")!).render(<App/>);