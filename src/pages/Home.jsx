import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../supabaseClient";

export default function Home() {
  // ===============================
  // PERMANENT UTE REGOS
  // ===============================
  const UTE_REGOS = [
    "10S2DO",
    "EAE07D",
    "", // add more here
    "", // add more here
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

  return (
    <div className="container">
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 120px", // 👈 MUCH CLOSER
          gap: 8,
          alignItems: "start",
        }}
      >
        {/* LEFT – MAIN CONTENT */}
        <div>
          <div className="card">
            <h1>🚚 Invidia's Driver Loading Zones</h1>
            <p className="small">
              Add a store, then open it to manage notes & photos.
            </p>

            <div style={{ display: "grid", gap: 10, maxWidth: 520 }}>
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
                        <button className="button" onClick={() => saveEdit(s.id)}>
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

        {/* RIGHT – COMPACT REGOS */}
        <aside style={{ position: "sticky", top: 16 }}>
          <div
            className="card"
            style={{ padding: "8px", fontSize: "11px" }}
          >
            <div className="small" style={{ fontWeight: 600 }}>
              UTE
            </div>

            {UTE_REGOS.map(
              (r, i) =>
                r && (
                  <div key={i} style={{ opacity: 0.85 }}>
                    {r}
                  </div>
                )
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
