import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../supabaseClient";

export default function Home() {
  // =====================================
  // PERMANENT UTE REGOS (EDIT ANYTIME)
  // =====================================
  const UTE_REGOS = [
    "10S2DO",
    "EAE07D",
    "", // add more regos here
    "", // add more regos here
  ];
  // =====================================

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
    const { data, error } = await supabase
      .from("stores")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) console.error("loadStores:", error);
    setStores(data || []);
    setLoading(false);
  }

  useEffect(() => {
    loadStores();
  }, []);

  async function addStore() {
    const name = storeName.trim();
    const address = storeAddress.trim();
    if (!name) return alert("Enter a store name");

    const { data, error } = await supabase
      .from("stores")
      .insert([{ name, address }])
      .select()
      .single();

    if (error) return alert("Could not save store");

    setStoreName("");
    setStoreAddress("");
    setStores((prev) => [data, ...prev]);
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

  const regosToShow = UTE_REGOS.filter((r) => r && r.trim().length > 0);

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
          {/* LEFT TITLE */}
          <div>
            <h1 style={{ marginTop: 0 }}>
              🚚 Invidia's Driver Loading Zones
            </h1>
            <p className="small" style={{ marginTop: 6 }}>
              Add a store, then open it to manage notes & photos.
            </p>
          </div>

          {/* RIGHT REGO BOX (SAME CARD) */}
          <div
            style={{
              textAlign: "right",
              minWidth: 160,
              padding: "6px 10px",
              borderRadius: 10,
              border: "1px solid var(--border)",
              background: "#0f1626",
            }}
          >
            <div
              className="small"
              style={{ fontWeight: 700, opacity: 0.9 }}
            >
              UTE REGOS
            </div>

            <div
              style={{
                fontSize: 12,
                lineHeight: 1.4,
                marginTop: 4,
                opacity: 0.9,
              }}
            >
              {regosToShow.map((r) => (
                <div key={r}>{r}</div>
              ))}
            </div>

            {/* UTE BOOKING LINK */}
            <a
              href="https://www.mobiledock.com/"
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
              {editingId === s.id ? (
                <>
                  <input
                    className="input"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                  />
                  <input
                    className="input"
                    value={editAddress}
                    onChange={(e) => setEditAddress(e.target.value)}
                  />
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      className="button"
                      onClick={() => saveEdit(s.id)}
                    >
                      Save
                    </button>
                    <button
                      className="button danger"
                      onClick={cancelEdit}
                    >
                      Cancel
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <h3>{s.name}</h3>
                  <p className="small">{s.address}</p>
                  <div style={{ display: "flex", gap: 8 }}>
                    <Link to={`/store/${s.id}`} className="button">
                      Open
                    </Link>
                    <button
                      className="button"
                      onClick={() => startEdit(s)}
                    >
                      Edit
                    </button>
                    <button
                      className="button danger"
                      onClick={() => deleteStore(s)}
                    >
                      Delete
                    </button>
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
