import * as React from "react";

export type Device = "laptop" | "tablet" | "mobile";

export function useDevice(): Device {
    const [device, setDevice] = React.useState<Device>("laptop");

    React.useEffect(() => {
        function resize(): void {
            if (window.innerWidth >= 1024) setDevice("laptop");
            else if (window.innerWidth >= 768) setDevice("tablet");
            else if (window.innerWidth >= 320) setDevice("mobile");
            else return;
        }

        resize();
        window.addEventListener("resize", resize);
        return () => window.removeEventListener("resize", resize);
    }, []);

    return device;
}