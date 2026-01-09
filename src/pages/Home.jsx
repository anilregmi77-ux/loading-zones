import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../supabaseClient";

export default function Home() {
  const [stores, setStores] = useState([]);
  const [storeName, setStoreName] = useState("");
  const [storeAddress, setStoreAddress] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);

  // inline edit state
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
      .single(); // returns row (including id)
    if (error) {
      console.error("addStore:", error);
      return alert("Could not save store");
    }
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
    setEditName("");
    setEditAddress("");
  }
  async function saveEdit(id) {
    const name = editName.trim();
    const address = editAddress.trim();
    if (!name) return alert("Store name cannot be empty");
    const { error } = await supabase.from("stores").update({ name, address }).eq("id", id);
    if (error) {
      console.error("saveEdit:", error);
      return alert("Update failed");
    }
    setStores((prev) => prev.map((s) => (s.id === id ? { ...s, name, address } : s)));
    cancelEdit();
  }

  async function deleteStore(s) {
    if (!confirm(`Delete "${s.name}" and its photos?`)) return;
    try {
      const { data: files } = await supabase.storage.from("store-photos").list(s.id, { limit: 1000 });
      if (files?.length) {
        const paths = files.map((f) => `${s.id}/${f.name}`);
        await supabase.storage.from("store-photos").remove(paths);
      }
      const { error } = await supabase.from("stores").delete().eq("id", s.id);
      if (error) throw error;
      setStores((prev) => prev.filter((x) => x.id !== s.id));
    } catch (e) {
      console.error("deleteStore:", e);
      alert("Delete failed");
    }
  }

  const filtered = stores.filter((s) => {
    const t = searchTerm.toLowerCase();
    return s.name?.toLowerCase().includes(t) || (s.address || "").toLowerCase().includes(t);
  });

  return (
    <div className="container">
      {/* Add store */}
      <div className="card">
        <h1>🚚 Anil made Invidia Driver's Loading Zones </h1>
        <p className="small">Add a store, then open it to manage notes & photos.</p>
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
          <button className="button" onClick={addStore}>Add Store</button>
        </div>
      </div>

      {/* List */}
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
        {filtered.length === 0 && !loading && <p className="small">No stores found.</p>}

        <ul className="list">
          {filtered.map((s) => (
            <li key={s.id}>
              {editingId === s.id ? (
                <>
                  <input
                    className="input"
                    placeholder="Store name"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    style={{ marginBottom: 8 }}
                  />
                  <input
                    className="input"
                    placeholder="Address"
                    value={editAddress}
                    onChange={(e) => setEditAddress(e.target.value)}
                    style={{ marginBottom: 8 }}
                  />
                  <div style={{ display: "flex", gap: 8 }}>
                    <button className="button" onClick={() => saveEdit(s.id)} style={{ flex: 1 }}>Save</button>
                    <button className="button danger" onClick={cancelEdit} style={{ flex: 1 }}>Cancel</button>
                  </div>
                </>
              ) : (
                <>
                  <h3 style={{ margin: "0 0 4px 0" }}>{s.name}</h3>
                  <p className="small" style={{ marginBottom: 8 }}>{s.address}</p>
                  <div style={{ display: "flex", gap: 8 }}>
                    <Link to={`/store/${s.id}`} className="button" style={{ flex: 1, textAlign: "center" }}>Open</Link>
                    <button className="button" onClick={() => startEdit(s)} style={{ flex: 1 }}>Edit</button>
                    <button className="button danger" onClick={() => deleteStore(s)} style={{ flex: 1 }}>Delete</button>
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
