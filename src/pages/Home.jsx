import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { Link } from "react-router-dom";

export default function Home() {
  const [stores, setStores] = useState([]);
  const [storeName, setStoreName] = useState("");
  const [storeAddress, setStoreAddress] = useState("");

  // Load stores from Supabase
  async function loadStores() {
    const { data, error } = await supabase
      .from("stores")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) console.error(error);
    else setStores(data || []);
  }

  useEffect(() => {
    loadStores();
  }, []);

  // Add store
  async function addStore() {
    if (!storeName.trim()) return alert("Please enter a store name");
    try {
      const { error } = await supabase
        .from("stores")
        .insert([{ name: storeName, address: storeAddress }]);
      if (error) throw error;
      setStoreName("");
      setStoreAddress("");
      loadStores();
    } catch (err) {
      console.error(err);
      alert("Could not save store");
    }
  }

  // Delete store
  async function deleteStore(store) {
    if (!confirm(`Delete store "${store.name}"? This will remove all its photos.`)) return;
    try {
      // Remove all photos from storage
      const { data: files } = await supabase.storage
        .from("store-photos")
        .list(store.id);
      if (files?.length) {
        const paths = files.map((f) => `${store.id}/${f.name}`);
        await supabase.storage.from("store-photos").remove(paths);
      }

      // Delete store row
      const { error } = await supabase.from("stores").delete().eq("id", store.id);
      if (error) throw error;

      alert("Store deleted");
      loadStores();
    } catch (err) {
      console.error(err);
      alert("Delete failed");
    }
  }

  return (
    <div className="container">
      <div className="card">
        <h1>🚚 Loading Zone Instructions</h1>
        <p className="small">Add new store locations and view their notes & photos.</p>

        <div style={{ display: "grid", gap: "10px", maxWidth: "500px", marginTop: "16px" }}>
          <input
            className="input"
            placeholder="Store name"
            value={storeName}
            onChange={(e) => setStoreName(e.target.value)}
          />
          <input
            className="input"
            placeholder="Address"
            value={storeAddress}
            onChange={(e) => setStoreAddress(e.target.value)}
          />
          <button className="button" onClick={addStore}>Add Store</button>
        </div>
      </div>

      <div className="card" style={{ marginTop: "24px" }}>
        <h2>All Stores</h2>
        {stores.length === 0 && <p className="small">No stores yet. Add one above!</p>}

        <ul className="list">
          {stores.map((s) => (
            <li key={s.id}>
              <h3 style={{ margin: "0 0 4px 0" }}>{s.name}</h3>
              <p className="small">{s.address}</p>
              <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
                <Link to={`/store/${s.id}`} className="button" style={{ flex: 1 }}>
                  Open
                </Link>
                <button
                  onClick={() => deleteStore(s)}
                  className="button danger"
                  style={{ flex: 1 }}
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
