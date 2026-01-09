import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../supabaseClient";

export default function Home() {
  // stores
  const [stores, setStores] = useState([]);
  const [storeName, setStoreName] = useState("");
  const [storeAddress, setStoreAddress] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);

  // rego sidebar
  const [rego, setRego] = useState("");
  const [regoLoading, setRegoLoading] = useState(false);

  // load stores
  async function loadStores() {
    setLoading(true);
    const { data, error } = await supabase
      .from("stores")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error) setStores(data || []);
    setLoading(false);
  }

  // load rego
  async function loadRego() {
    setRegoLoading(true);
    const { data } = await supabase
      .from("settings")
      .select("value")
      .eq("id", "vehicle_registration")
      .single();

    if (data) setRego(data.value || "");
    setRegoLoading(false);
  }

  useEffect(() => {
    loadStores();
    loadRego();
  }, []);

  // add store
  async function addStore() {
    if (!storeName.trim()) return alert("Enter store name");

    const { error } = await supabase.from("stores").insert({
      name: storeName.trim(),
      address: storeAddress.trim(),
    });

    if (error) {
      console.error(error);
      return alert("Could not add store");
    }

    setStoreName("");
    setStoreAddress("");
    loadStores();
  }

  // delete store
  async function deleteStore(id) {
    if (!confirm("Delete this store?")) return;

    await supabase.from("stores").delete().eq("id", id);
    loadStores();
  }

  // save rego
  async function saveRego() {
    const value = rego.trim();

    const { error } = await supabase
      .from("settings")
      .upsert({ id: "vehicle_registration", value });

    if (error) {
      console.error(error);
      return alert("Could not save rego");
    }

    alert("Rego saved");
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
          gridTemplateColumns: "1fr 320px",
          gap: 16,
          alignItems: "start",
        }}
      >
        {/* LEFT SIDE */}
        <div style={{ display: "grid", gap: 16 }}>
          {/* Add store */}
          <div className="card">
            <h1>🚚 Invidia Driver’s Loading Zones</h1>
            <p className="small">
              Add a store, then open it to manage notes & photos.
            </p>

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
              style={{ marginTop: 8 }}
            />

            <button className="button" onClick={addStore} style={{ marginTop: 10 }}>
              Add Store
            </button>
          </div>

          {/* Store list */}
          <div className="card">
            <h2>All Stores</h2>

            <input
              className="input"
              placeholder="Search by name or address"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ marginBottom: 12 }}
            />

            {loading && <p className="small">Loading…</p>}

            {filtered.map((s) => (
              <div key={s.id} className="card" style={{ marginBottom: 10 }}>
                <h3 style={{ margin: "0 0 4px 0" }}>{s.name}</h3>
                <p className="small">{s.address}</p>

                <div style={{ display: "flex", gap: 8 }}>
                  <Link
                    to={`/store/${s.id}`}
                    className="button"
                    style={{ flex: 1 }}
                  >
                    Open
                  </Link>
                  <button
                    className="button danger"
                    style={{ flex: 1 }}
                    onClick={() => deleteStore(s.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT SIDE – REGO */}
        <aside style={{ position: "sticky", top: 16 }}>
          <div className="card">
            <h2>Rego</h2>
            <p className="small">Vehicle registration</p>

            <input
              className="input"
              placeholder="e.g. ABC-123"
              value={rego}
              onChange={(e) => setRego(e.target.value)}
            />

            <button
              className="button"
              onClick={saveRego}
              disabled={regoLoading}
              style={{ marginTop: 10, width: "100%" }}
            >
              Save
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}
