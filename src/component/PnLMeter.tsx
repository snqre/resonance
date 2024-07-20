import React from "react";
import { Bus } from "../class/Bus.ts";
import * as FbEmitter from "fbemitter";

class PnlMeter {
    public static Component({ id }: { id: string; }): React.ReactNode {
        let [value, setValue] = React.useState<number>(0);
        React.useEffect(() => {
            let subscription: FbEmitter.EventSubscription = Bus.subscribe("set-pnl-meter-" + id, (item?: unknown): void => {
                if (!item) {
                    return;
                }
                if (typeof item !== "number") {
                    return;
                }
                setValue(item);
                return;
            });
            return () => subscription.remove();
        }, []);
        return <div
        style={{
            color: "#474B4F",
            fontWeight: "bold",
            fontFamily: "monospace",
            fontSize: "1.25em"
        }}>
            { id }: { value.toFixed(2) }%
        </div>
    }
}

export { PnlMeter };