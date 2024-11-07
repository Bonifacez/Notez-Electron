import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.js";
import { NextUIProvider } from "@nextui-org/react";
import './index.css'

import "./demos/ipc";
// If you want use Node.js, the`nodeIntegration` needs to be enabled in the Main process.
// import './demos/node'

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
    <React.StrictMode>
        <NextUIProvider>
            <App />
        </NextUIProvider>
    </React.StrictMode>
);

postMessage({ payload: "removeLoading" }, "*");