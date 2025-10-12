import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Store from "./pages/Store";
import "./App.css";

export default function App() {
  return (
    <Router>
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          backgroundColor: "#0b1220",
          color: "#fff",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <main style={{ flex: "1", padding: "16px", maxWidth: "800px", margin: "0 auto" }}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/store/:id" element={<Store />} />
          </Routes>
        </main>

        {/* Footer credit */}
        <footer
          style={{
            textAlign: "center",
            color: "#999",
            fontSize: "0.9rem",
            padding: "20px",
            borderTop: "1px solid #222",
            backgroundColor: "#0b1220",
          }}
        >
          © {new Date().getFullYear()} Made by <strong>Anil Regmi</strong>
        </footer>
      </div>
    </Router>
  );
}
