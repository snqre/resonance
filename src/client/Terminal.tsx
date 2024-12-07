import type { ReactNode } from "react";
import type { ComponentPropsWithRef } from "react";
import type { SetStateAction } from "react";
import type { Dispatch } from "react";
import { useState } from "react";
import { useEffect } from "react";

export type TerminalProps = {
    
};
export type Terminal = {
    writeln(string: string): void;
    onSubmit(): void;
};
export function useTerminal() {
    let _history: TerminalHistory = useTerminalHistory([]);
    let _input = useTerminalInput();

    /***/ {
        return { render };
    }

    function render() {
        let container$: ComponentPropsWithRef<"div"> = {
            style: {
                display: "flex",
                flexDirection: "column",
                justifyContent: "start",
                alignItems: "center"
            }
        };

        useEffect(() => {
            _input.onKeyDown(key => {

            });
        }, []);

        return <>
            <div {... container$}>
                <_history.render/>
                <_input.render/>
            </div>
        </>;
    }
}

function useTerminalInput() {
    /***/ return { onKeyDown, render };

    function onKeyDown() {

    }

    function render() {
        let input$: ComponentPropsWithRef<"input"> = {
            style: {
                all: "unset",
                display: "flex",
                flexDirection: "row",
                justifyContent: "start",
                alignItems: "center"
            },
            onKeyDown: (e) => e.key === ""
        };

        return <>
            <input {... input$}/>
        </>;
    }
}


type TerminalHistory = {
    mount(component: ReactNode): (() => void);
    clear(): void;
    render(): ReactNode;
};
function useTerminalHistory(_components: ReadonlyArray<ReactNode>): TerminalHistory {
    let [_mounted, _setMounted]: [Array<ReactNode>, Dispatch<SetStateAction<Array<ReactNode>>>] = useState<ReactNode[]>([]);

    return { mount, clear, render };

    function mount(... [component]: Parameters<TerminalHistory["mount"]>): ReturnType<TerminalHistory["mount"]> {
        _setMounted(v => [... v, component]);
        return () => _setMounted(v => v.filter(p => p !== component));
    }

    function clear(): ReturnType<TerminalHistory["clear"]> {
        _setMounted([]);
        return;
    }

    function render(): ReturnType<TerminalHistory["render"]> {
        let container$: ComponentPropsWithRef<"div"> = {
            style: {
                display: "flex",
                flexDirection: "row",
                justifyContent: "start",
                alignItems: "center",
                width: "100%"
            }
        };

        return <>
            {_mounted.map(v =>
            <div {... container$}>
                {v}
            </div>)}
        </>;
    }
}




type DeviceKeyboardEvent =
    & Omit<KeyboardEvent, "key">
    & {
    key: DeviceKey;
};
type DeviceKeyboardListener = (e: DeviceKeyboardEvent) => void;

type Device = {
    onKeyDown(ls: DeviceKeyboardListener): void;
};
function useDevice(): Device {
    /***/ {
        return {
            onKeyDown
        };
    }

    function onKeyDown(listener: (e: DeviceKeyboardEvent) => void) {

        useEffect(() => {

            function handleKeyDown(e: KeyboardEvent) {
                e.

                switch (e.key) {
                    case "Alt": 
                }
            }
        });
    }


}