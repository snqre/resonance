import React from "react";

function Page({ children }: { children?: React.ReactNode }): React.ReactNode {
    return <div
    style={{
        width: "100svw",
        height: "100svh",
        background: "#222629",
        padding: "36px"
    }}>
        { children }
    </div>
}

export { Page };