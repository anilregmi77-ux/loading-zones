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
          position: "relative",
          paddingBottom: "70px", // space for sticky footer
        }}
      >
        {/* Main content */}
        <main
          style={{
            flex: "1",
            padding: "20px",
            maxWidth: "900px",
            margin: "0 auto",
            width: "100%",
          }}
        >
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/store/:id" element={<Store />} />
          </Routes>
        </main>

        {/* Sticky footer */}
        <footer
          style={{
            position: "fixed",
            bottom: 0,
            left: 0,
            width: "100%",
            textAlign: "center",
            backgroundColor: "#1e2a44",
            color: "#fff",
            fontSize: "1rem",
            padding: "15px 10px",
            borderTop: "2px solid #4da3ff",
            zIndex: 1000,
            boxShadow: "0 -2px 10px rgba(0,0,0,0.5)",
          }}
        >
          © {new Date().getFullYear()} Made by{" "}
          <strong style={{ color: "#4da3ff" }}>Anil Regmi</strong>
        </footer>
      </div>
    </Router>
  );
}
