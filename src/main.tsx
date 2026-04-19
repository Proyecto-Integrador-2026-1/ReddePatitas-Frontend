import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
// Dev seed: populate localStorage with test data (only in dev)
if (import.meta.env.DEV) {
  try {
    // dynamic import so production bundles don't include seed file
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    import("./dev/seedLocalData").then((m) => m.seedLocalData && m.seedLocalData());
  } catch (e) {
    // ignore
  }
}

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
