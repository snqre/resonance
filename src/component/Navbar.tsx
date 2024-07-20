import React from "react";

function Navbar({ children }: { children?: React.ReactNode }): React.ReactNode {
    return <div
    style={{
        width: "100%",
        height: "10%",
        display: "flex",
        flexDirection: "row",
        justifyContent: "start",
        alignItems: "center"
    }}>
        { children }
    </div>
}

export { Navbar };