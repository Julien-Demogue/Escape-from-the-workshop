import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import RouterProvider from "./providers/RouterProvider";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <RouterProvider>
      <App />
    </RouterProvider>
  </React.StrictMode>
);
