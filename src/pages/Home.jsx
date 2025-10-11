import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../supabaseClient";

export default function Home() {
  const [stores, setStores] = useState([]);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({ name: "", address: "" });
  const [saving, setSaving] = useState(false);

  async function loadStores() {
    const { data, error } = await supabase
      .from("stores")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      console.error(error);
      alert("Could not load stores");
      return;
    }
    setStores(data || []);
  }

  useEffect(() => {
    loadStores();
  }, []);

  const filtered = useMemo(() => {
    const s = search.toLowerCase();
    return stores.filter(
      (x) =>
        (x.name || "").toLowerCase().includes(s) ||
        (x.address || "").toLowerCase().includes(s)
    );
  }, [stores, search]);

  async function addStore(e) {
    e.preventDefault();
    const name = form.name.trim();
    const address = form.address.trim();
    if (!name) return alert("Please enter a store name");
    setSaving(true);
    const { error } = await supabase
      .from("stores")
      .insert({ name, address, notes: "" });
    setSaving(false);
    if (error) {
      console.error(error);
      alert("Could not save store");
      return;
    }
    setForm({ name: "", address: "" });
    await loadStores();
    alert("Store added!");
  }

  return (
    <div style={{ maxWidth: 800, margin: "20px auto", padding: 12 }}>
      <h1>Loading Zone Instructions</h1>

      <input
        placeholder="Search by name or address"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{ width: "100%", padding: 12, margin: "12px 0" }}
      />

      <h2>Add a store</h2>
      <form onSubmit={addStore} style={{ display: "grid", gap: 8 }}>
        <input
          placeholder="Store name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          style={{ padding: 10 }}
        />
        <input
          placeholder="Store address"
          value={form.address}
          onChange={(e) => setForm({ ...form, address: e.target.value })}
          style={{ padding: 10 }}
        />
        <button disabled={saving} style={{ padding: 10 }}>
          {saving ? "Saving…" : "Save store"}
        </button>
      </form>

      <h2 style={{ marginTop: 24 }}>All stores</h2>
      {filtered.length === 0 && <p>No stores yet. Add one above!</p>}
      <ul style={{ listStyle: "none", padding: 0 }}>
        {filtered.map((s) => (
          <li
            key={s.id}
            style={{
              border: "1px solid #ddd",
              borderRadius: 8,
              padding: 12,
              margin: "8px 0",
            }}
          >
            <div style={{ fontWeight: "bold" }}>{s.name || "(no name)"}</div>
            <div style={{ color: "#555" }}>{s.address}</div>
            <Link to={`/store/${s.id}`}>Open instructions →</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
