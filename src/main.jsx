import React, { useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import Admin from "./Admin.jsx";

function Root() {
  const [hash, setHash] = useState(window.location.hash);
  useEffect(() => {
    const on = () => setHash(window.location.hash);
    window.addEventListener("hashchange", on);
    return () => window.removeEventListener("hashchange", on);
  }, []);
  return hash === "#admin" ? <Admin /> : <App />;
}

createRoot(document.getElementById("root")).render(<Root />);
