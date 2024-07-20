import React from "react";

function Dashboard({ children }: { children?: React.ReactNode }): React.ReactNode {
    return <div
    style={{
        width: "100%",
        height: "auto",
        padding: "36px",
        display: "flex",
        flexDirection: "row",
        justifyContent: "center",
        alignContent: "center",
        gap: "36px"
    }}>
        { children }
    </div>
}

export { Dashboard };