import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../supabaseClient";

export default function Home() {
  // ===============================
  // PERMANENT UTE REGOS
  // ===============================
  const UTE_REGOS = [
    "10S2DO (IZUZU)",
    "EAE07D (HILUX)",
    "XW42QY (6 pallet)", // add more later
    "DC00JB (3 pallet)",
  ];
  // ===============================

  const [stores, setStores] = useState([]);
  const [storeName, setStoreName] = useState("");
  const [storeAddress, setStoreAddress] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);

  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");
  const [editAddress, setEditAddress] = useState("");

  async function loadStores() {
    setLoading(true);
    const { data } = await supabase
      .from("stores")
      .select("*")
      .order("created_at", { ascending: false });
    setStores(data || []);
    setLoading(false);
  }

  useEffect(() => {
    loadStores();
  }, []);

  async function addStore() {
    if (!storeName.trim()) return alert("Enter store name");

    const { data, error } = await supabase
      .from("stores")
      .insert([{ name: storeName.trim(), address: storeAddress.trim() }])
      .select()
      .single();

    if (error) return alert("Could not save store");

    setStores((prev) => [data, ...prev]);
    setStoreName("");
    setStoreAddress("");
  }

  function startEdit(s) {
    setEditingId(s.id);
    setEditName(s.name || "");
    setEditAddress(s.address || "");
  }

  function cancelEdit() {
    setEditingId(null);
  }

  async function saveEdit(id) {
    const { error } = await supabase
      .from("stores")
      .update({ name: editName, address: editAddress })
      .eq("id", id);

    if (error) return alert("Update failed");

    setStores((prev) =>
      prev.map((s) =>
        s.id === id ? { ...s, name: editName, address: editAddress } : s
      )
    );
    cancelEdit();
  }

  async function deleteStore(s) {
    if (!confirm(`Delete "${s.name}"?`)) return;
    await supabase.from("stores").delete().eq("id", s.id);
    setStores((prev) => prev.filter((x) => x.id !== s.id));
  }

  const filtered = stores.filter((s) => {
    const t = searchTerm.toLowerCase();
    return (
      s.name?.toLowerCase().includes(t) ||
      (s.address || "").toLowerCase().includes(t)
    );
  });

  const regosToShow = UTE_REGOS.filter((r) => r && r.trim());

  return (
    <div className="container">
      {/* TOP CARD */}
      <div className="card">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 12,
            alignItems: "flex-start",
            flexWrap: "wrap",
          }}
        >
          {/* TITLE */}
          <div>
            <h1 style={{ marginTop: 0 }}>
              🚚 Invidia&apos;s Driver Loading Zones
            </h1>
            <p className="small" style={{ marginTop: 6 }}>
              Add a store, then open it to manage notes & photos.
            </p>
          </div>

          {/* ANIMATED REGO BOX */}
          <div
            style={{
              minWidth: 160,
              padding: "8px 12px",
              borderRadius: 12,
              border: "1px solid var(--border)",
              background: "#0f1626",
              animation:
                "slideIn 600ms ease-out, pulseGlow 3s ease-in-out infinite",
            }}
          >
            <div
              className="small"
              style={{ fontWeight: 700, marginBottom: 4 }}
            >
              UTE REGOS
            </div>

            <div style={{ fontSize: 12, lineHeight: 1.4 }}>
              {regosToShow.map((r) => (
                <div key={r}>{r}</div>
              ))}
            </div>

            <a
              href="https://my.mobiledock.com/?redirect=/bookings"
              target="_blank"
              rel="noreferrer"
              style={{
                display: "block",
                marginTop: 6,
                fontSize: 11,
                color: "#4da3ff",
                textDecoration: "none",
              }}
            >
              UTE booking →
            </a>
          </div>
        </div>

        {/* ADD STORE */}
        <div style={{ display: "grid", gap: 10, maxWidth: 520, marginTop: 12 }}>
          <input
            className="input"
            placeholder="Store name"
            value={storeName}
            onChange={(e) => setStoreName(e.target.value)}
          />
          <input
            className="input"
            placeholder="Address (optional)"
            value={storeAddress}
            onChange={(e) => setStoreAddress(e.target.value)}
          />
          <button className="button" onClick={addStore}>
            Add Store
          </button>
        </div>
      </div>

      {/* STORE LIST */}
      <div className="card" style={{ marginTop: 20 }}>
        <h2>All Stores</h2>

        <input
          className="input"
          placeholder="Search by name or address…"
          style={{ marginTop: 8, marginBottom: 12, maxWidth: 520 }}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        {loading && <p className="small">Loading…</p>}

        <ul className="list">
          {filtered.map((s) => (
            <li key={s.id}>
              <h3>{s.name}</h3>
              <p className="small">{s.address}</p>
              <div style={{ display: "flex", gap: 8 }}>
                <Link to={`/store/${s.id}`} className="button">
                  Open
                </Link>
                <button
                  className="button danger"
                  onClick={() => deleteStore(s)}
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* KEYFRAME STYLES */}
      <style>
        {`
          @keyframes slideIn {
            from {
              opacity: 0;
              transform: translateY(-8px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          @keyframes pulseGlow {
            0%, 100% {
              box-shadow: 0 0 0 rgba(77,163,255,0);
            }
            50% {
              box-shadow: 0 0 12px rgba(77,163,255,0.25);
            }
          }
        `}
      </style>
    </div>
  );
}
