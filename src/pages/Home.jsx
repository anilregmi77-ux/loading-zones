import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../supabaseClient";

export default function Home() {
  const UTE_REGOS = ["10S2DO", "XW42QY", "DC00JB"];
  const UTE_BOOKING_URL = "https://www.mobiledock.com/";

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

    if (error) {
      console.error("loadStores:", error);
      alert("Could not load stores");
    }

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

    if (error) {
      console.error("addStore:", error);
      return alert("Could not save store");
    }

    setStores((prev) => [data, ...prev]);
    setStoreName("");
    setStoreAddress("");
  }

  function startEdit(store) {
    setEditingId(store.id);
    setEditName(store.name || "");
    setEditAddress(store.address || "");
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

    const { error } = await supabase
      .from("stores")
      .update({ name, address })
      .eq("id", id);

    if (error) {
      console.error("saveEdit:", error);
      return alert("Update failed");
    }

    setStores((prev) =>
      prev.map((s) => (s.id === id ? { ...s, name, address } : s))
    );

    cancelEdit();
  }

  async function deleteStore(store) {
    if (!confirm(`Delete "${store.name}" and its photos?`)) return;

    try {
      const { data: files } = await supabase.storage
        .from("store-photos")
        .list(store.id, { limit: 1000 });

      if (files?.length) {
        const paths = files.map((file) => `${store.id}/${file.name}`);
        await supabase.storage.from("store-photos").remove(paths);
      }

      const { error } = await supabase
        .from("stores")
        .delete()
        .eq("id", store.id);

      if (error) throw error;

      setStores((prev) => prev.filter((s) => s.id !== store.id));
    } catch (err) {
      console.error("deleteStore:", err);
      alert("Delete failed");
    }
  }

  const filteredStores = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    if (!term) return stores;

    return stores.filter((store) => {
      return (
        store.name?.toLowerCase().includes(term) ||
        store.address?.toLowerCase().includes(term)
      );
    });
  }, [stores, searchTerm]);

  const visibleRegos = UTE_REGOS.filter((rego) => rego.trim());

  return (
    <div className="container">
      <section className="hero-card">
        <div className="hero-main">
          <div className="eyebrow">Driver dashboard</div>
          <h1>🚚 Invidia&apos;s Driver Loading Zones</h1>
          <p>
            Save loading instructions, photos, maps and driver notes in one
            fast mobile-friendly app.
          </p>
        </div>

        <div className="rego-box">
          <div className="rego-title">UTE REGOS</div>

          <div className="rego-list">
            {visibleRegos.map((rego) => (
              <span key={rego}>{rego}</span>
            ))}
          </div>

          <a
            href={UTE_BOOKING_URL}
            target="_blank"
            rel="noreferrer"
            className="rego-link"
          >
            UTE booking →
          </a>
        </div>
      </section>

      <section className="stats-grid one-stat">
        <div className="stat-card">
          <span>Total Stores</span>
          <strong>{stores.length}</strong>
        </div>
      </section>

      <section className="card">
        <h2>Add Store</h2>

        <div className="form-grid">
          <input
            className="input"
            placeholder="Store name"
            value={storeName}
            onChange={(e) => setStoreName(e.target.value)}
          />

          <input
            className="input"
            placeholder="Address optional"
            value={storeAddress}
            onChange={(e) => setStoreAddress(e.target.value)}
          />

          <button className="button" onClick={addStore}>
            Add Store
          </button>
        </div>
      </section>

      <section className="card">
        <div className="section-header">
          <div>
            <h2>All Stores</h2>
            <p className="muted">Search, open, edit or delete loading zones.</p>
          </div>
        </div>

        <input
          className="input search-input"
          placeholder="Search by name or address..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        {loading && <TruckLoader text="Loading stores..." />}

        {!loading && filteredStores.length === 0 && (
          <div className="empty-box">No stores found.</div>
        )}

        <div className="store-grid">
          {filteredStores.map((store) => (
            <article className="store-card" key={store.id}>
              {editingId === store.id ? (
                <div className="form-stack">
                  <input
                    className="input"
                    placeholder="Store name"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                  />

                  <input
                    className="input"
                    placeholder="Address"
                    value={editAddress}
                    onChange={(e) => setEditAddress(e.target.value)}
                  />

                  <div className="button-row">
                    <button className="button" onClick={() => saveEdit(store.id)}>
                      Save
                    </button>

                    <button className="button danger" onClick={cancelEdit}>
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <h3>{store.name}</h3>
                  <p className="muted">{store.address || "No address added"}</p>

                  <div className="button-row">
                    <Link className="button" to={`/store/${store.id}`}>
                      Open
                    </Link>

                    <button
                      className="button secondary"
                      onClick={() => startEdit(store)}
                    >
                      Edit
                    </button>

                    <button
                      className="button danger"
                      onClick={() => deleteStore(store)}
                    >
                      Delete
                    </button>
                  </div>
                </>
              )}
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

function TruckLoader({ text }) {
  return (
    <div className="truck-loader-wrap">
      <div className="truck-road">
        <div className="truck">🚚</div>
      </div>
      <p>{text}</p>
    </div>
  );
}