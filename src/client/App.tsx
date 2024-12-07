import { Unsafe, type Api } from "@common";
import { default as Axios } from "axios";
import { Result } from "robus";
import { Option } from "robus";
import { Err } from "robus";
import { Ok } from "robus";
import { PriceVectorData } from "@common";

import {createRoot, createRoot as Root} from "react-dom/client";
import {useDevice} from "./hook/Device";
import * as React from "react";
import * as ColorPalette from "./constant/ColorPalette";
import * as Recharts from "recharts";

function App(): React.ReactNode {
    let dataset = React.useState<Option<ReadonlyArray<{timestamp: number; price: number}>>>(None);
    let device = useDevice();


    // #region Page

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
            undefined
        height: "100%"
    };


    // #region Line Chart




    React.useEffect(() => {
        Result.wrapAsync(() => Axios.get("/dataset")).then(result => result.map(response => {
            let data = response.data;
            if (!Array.isArray(data)) return;
            for (let i = 0; i < data.length; i++) {
                let item = data[i];
                if (typeof item !== "object") return;
                if (!("timestamp" in item)) return;
                if (!("price" in item)) return;
            }
            dataset[1](Some((data as any)));
            return;
        }));
    }, []);

    return <>
        <div style={page$}>
            <div style={innerPage$}>

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
        | Err<Unsafe>
        | Err<"ERR_INVALID_DATA">> {
        let route: Api[number] = "/chart/vector/range";
        let fromTimestampFloat: number = Number(fromTimestamp);
        let toTimestampFloat: number = Number(toTimestamp);
        let response: Result<Axios.AxiosResponse, unknown> = await Result.wrapAsync(async () => await Axios.post(route, [fromTimestampFloat, toTimestampFloat]));
        if (response.err) return Err(Unsafe(response));
        let data: unknown = response.unwrap().data;
        
        return Ok((data as Array<PriceVectorData>));
    }

    React.useEffect(() => {
        

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

createRoot(document.getElementById("root")!).render(<App/>);