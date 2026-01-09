import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import axios from "axios";

// ✅ Persist login after refresh
const token = localStorage.getItem("token");
if (token) {
  axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
  