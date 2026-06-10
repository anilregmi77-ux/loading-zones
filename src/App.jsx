import { BrowserRouter, Route, Routes } from "react-router-dom";
import Home from "./pages/Home.jsx";
import Store from "./pages/Store.jsx";

export default function App() {
  return (
    <BrowserRouter>
      <div className="app-shell">
        <header className="topbar">
          <div>
            <strong>🚚 Invidia Loading Zones</strong>
            <span> .</span>
          </div>
        </header>

        <main className="app-main">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/store/:id" element={<Store />} />
          </Routes>
        </main>

        <footer className="footer">
          © {new Date().getFullYear()} Made by{" "}
          <strong>Anil Regmi</strong>
        </footer>
      </div>
    </BrowserRouter>
  );
}