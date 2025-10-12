import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../supabaseClient";

export default function Home() {
  const [stores, setStores] = useState([]);
  const [storeName, setStoreName] = useState("");
  const [storeAddress, setStoreAddress] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  // inline edit
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");
  const [editAddress, setEditAddress] = useState("");

  async function loadStores() {
    const { data, error } = await supabase
      .from("stores")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) console.error(error);
    setStores(data || []);
  }

  useEffect(() => {
    loadStores();
  }, []);

  async function addStore() {
    const name = storeName.trim();
    const address = storeAddress.trim();
    if (!name) return alert("Please enter a store name");
    try {
      const { error } = await supabase
        .from("stores")
        .insert([{ name, address }]);
      if (error) throw error;
      setStoreName("");
      setStoreAddress("");
      loadStores();
    } catch (e) {
      console.error(e);
      alert("Could not save store");
    }
  }

  async function deleteStore(store) {
    if (!confirm(`Delete "${store.name}" and its photos?`)) return;
    try {
      // remove files in bucket folder <store.id>/*
      const { data: files } = await supabase
        .storage
        .from("store-photos")
        .list(store.id, { limit: 1000 });
      if (files?.length) {
        const paths = files.map((f) => `${store.id}/${f.name}`);
        await supabase.storage.from("store-photos").remove(paths);
      }
      const { error } = await supabase.from("stores").delete().eq("id", store.id);
      if (error) throw error;
      loadStores();
    } catch (e) {
      console.error(e);
      alert("Delete failed");
    }
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
    try {
      const { error } = await supabase
        .from("stores")
        .update({ name, address })
        .eq("id", id);
      if (error) throw error;
      setEditingId(null);
      setEditName("");
      setEditAddress("");
      loadStores();
    } catch (e) {
      console.error(e);
      alert("Update failed");
    }
  }

  const filteredStores = stores.filter((s) => {
    const t = searchTerm.toLowerCase();
    return (
      s.name?.toLowerCase().includes(t) ||
      (s.address || "").toLowerCase().includes(t)
    );
  });

  return (
    <div className="container">
      <div className="card">
        <h1>🚚 Driver Loading Zones</h1>
        <p className="small">Add stores, then open a store to manage notes and photos.</p>

        <div style={{ display: "grid", gap: 10, maxWidth: 520, marginTop: 16 }}>
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

      <div className="card" style={{ marginTop: 24 }}>
        <h2>All Stores</h2>
        <input
          className="input"
          style={{ marginTop: 8, marginBottom: 12, maxWidth: 520 }}
          placeholder="🔍 Search by name or address…"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        {filteredStores.length === 0 && <p className="small">No stores found.</p>}

        <ul className="list">
          {filteredStores.map((s) => (
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
                    <button className="button" onClick={() => saveEdit(s.id)} style={{ flex: 1 }}>
                      Save
                    </button>
                    <button className="button danger" onClick={cancelEdit} style={{ flex: 1 }}>
                      Cancel
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <h3 style={{ margin: "0 0 4px 0" }}>{s.name}</h3>
                  <p className="small" style={{ marginBottom: 8 }}>{s.address}</p>
                  <div style={{ display: "flex", gap: 8 }}>
                    <Link to={`/store/${s.id}`} className="button" style={{ flex: 1, textAlign: "center" }}>
                      Open
                    </Link>
                    <button className="button" onClick={() => startEdit(s)} style={{ flex: 1 }}>
                      Edit
                    </button>
                    <button className="button danger" onClick={() => deleteStore(s)} style={{ flex: 1 }}>
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
