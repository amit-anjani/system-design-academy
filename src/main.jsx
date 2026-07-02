import React from "react";
import ReactDOM from "react-dom/client";
import { storage } from "./storage.js";
import App from "./App.jsx";

// App.jsx was built for Claude's artifact environment and calls window.storage
// directly. Installing this shim before render lets it run unmodified here.
window.storage = storage;

ReactDOM.createRoot(document.getElementById("root")).render(
  <App />
);
