import { Root } from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { createBrowserRouter } from "react-router-dom";
import { createRoot } from "react-dom/client";
import { useEffect } from "react";
import { useState } from "react";
import Axios from "axios";
import React from "react";

(async function() {
    let rootElement: HTMLElement | null = document.getElementById("root");
    if (!rootElement) {
        console.error("root element not found");
        return;
    }
    let root: Root = createRoot(rootElement);
    root.render(<RouterProvider router={ createBrowserRouter([{
        "path": "/",
        "element": (
            <div
            style={{
                width: "100vw",
                "height": "100vh",
                "overflow": "hidden",
                "background": "#171717",
                "display": "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center"
            }}>
                <Price/>
            </div>
        )
    }]) }/>);
})();

function Price() {
    let [price, setPrice] = useState<string>("0");

    useEffect(function() {
        Axios.get("/data").then(response => {
            let data: unknown = response.data;
            setPrice(parseFloat((data as any)?.price).toFixed(2));
        });
    }, []);

    return (
        <div
        style={{
            color: "GrayText",
            fontSize: "5em"
        }}>
            ${ price }
        </div>
    );
}