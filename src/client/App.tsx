import {default as Axios} from "axios";
import {Result} from "ts-results";
import {Option} from "ts-results";
import {Some} from "ts-results";
import {None} from "ts-results";
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
            undefined,
        height: "100%"
    };


    // #region Line Chart

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
                <Recharts.ResponsiveContainer width="100%" height={300}>
                    <Recharts.LineChart data={[... dataset[0].unwrapOr([])]}>
                        <Recharts.XAxis {... (xAxis$ as any)}/>
                        <Recharts.YAxis {... (yAxis$ as any)}/>
                        <Recharts.Tooltip contentStyle={tooltip$} labelFormatter={timestamp => new Date(timestamp).toLocaleDateString()}/>
                        <Recharts.Line {... (line$ as any)}/>
                    </Recharts.LineChart>
                </Recharts.ResponsiveContainer>
            </div>
        </div>
    </>;
}

createRoot(document.getElementById("root")!).render(<App/>);