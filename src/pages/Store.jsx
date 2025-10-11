import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { supabase } from "../supabaseClient";

export default function Store() {
  const { id } = useParams();

  // Store data
  const [store, setStore] = useState(null);
  const [notes, setNotes] = useState("");

  // Edit mode for header (name/address)
  const [isEditingHeader, setIsEditingHeader] = useState(false);
  const [editName, setEditName] = useState("");
  const [editAddress, setEditAddress] = useState("");

  // Photos
  const [photos, setPhotos] = useState([]);
  const [uploading, setUploading] = useState(false);

  // ----- Loaders -----
  async function loadStore() {
    const { data, error } = await supabase
      .from("stores")
      .select("*")
      .eq("id", id)
      .single();
    if (error) {
      console.error(error);
      alert("Could not load store");
      return;
    }
    setStore(data);
    setNotes(data.notes || "");
    setEditName(data.name || "");
    setEditAddress(data.address || "");
  }

  async function loadPhotos() {
    const { data, error } = await supabase
      .from("photos")
      .select("*")
      .eq("store_id", id)
      .order("created_at", { ascending: false });
    if (error) {
      console.error(error);
      alert("Could not load photos");
      return;
    }
    setPhotos(data || []);
  }

  useEffect(() => {
    loadStore();
    loadPhotos();
  }, [id]);

  // ----- Header edit -----
  function startHeaderEdit() {
    setEditName(store?.name || "");
    setEditAddress(store?.address || "");
    setIsEditingHeader(true);
  }

  function cancelHeaderEdit() {
    setIsEditingHeader(false);
    setEditName(store?.name || "");
    setEditAddress(store?.address || "");
  }

  async function saveHeaderEdit() {
    const name = editName.trim();
    const address = editAddress.trim();
    if (!name) return alert("Store name cannot be empty");
    try {
      const { error } = await supabase
        .from("stores")
        .update({ name, address })
        .eq("id", id);
      if (error) throw error;

      // reflect in UI
      setStore((prev) => (prev ? { ...prev, name, address } : prev));
      setIsEditingHeader(false);
      alert("Store updated");
    } catch (e) {
      console.error(e);
      alert("Update failed");
    }
  }

  // ----- Notes -----
  async function saveNotes() {
    const { error } = await supabase.from("stores").update({ notes }).eq("id", id);
    if (error) {
      console.error(error);
      alert("Could not save notes");
      return;
    }
    alert("Notes saved!");
  }

  // ----- Upload helpers -----
  async function handleFile(file) {
    if (!file) return;
    setUploading(true);
    try {
      const fileName = `${Date.now()}_${file.name}`;
      const path = `${id}/${fileName}`;

      // Upload file to the bucket
      const { error: uploadError } = await supabase.storage
        .from("store-photos")
        .upload(path, file, { cacheControl: "3600", upsert: false });
      if (uploadError) throw uploadError;

      // Get public URL
      const { data: publicUrlData } = supabase.storage
        .from("store-photos")
        .getPublicUrl(path);
      const url = publicUrlData.publicUrl;

      // Insert DB row
      const { error: insertError } = await supabase.from("photos").insert({
        store_id: id,
        url,
        storage_path: path,
      });
      if (insertError) throw insertError;

      await loadPhotos();
    } catch (err) {
      console.error(err);
      alert("Upload failed");
    } finally {
      setUploading(false);
    }
  }

  function onFileInput(e) {
    const f = e.target.files?.[0];
    if (f) handleFile(f);
    e.target.value = ""; // allow same file re-select
  }

  // ----- Delete photo -----
  async function removePhoto(photo) {
    if (!confirm("Delete this photo?")) return;
    try {
      const { error: storageErr } = await supabase
        .storage
        .from("store-photos")
        .remove([photo.storage_path]);
      if (storageErr) throw storageErr;

      const { error: dbErr } = await supabase
        .from("photos")
        .delete()
        .eq("id", photo.id);
      if (dbErr) throw dbErr;

      setPhotos((prev) => prev.filter((p) => p.id !== photo.id));
    } catch (e) {
      console.error(e);
      alert("Delete failed");
    }
  }

  // ----- Delete store -----
  async function deleteThisStore() {
    if (!confirm(`Delete "${store.name}" and all its photos?`)) return;
    try {
      // Remove files in this store's folder
      const { data: files } = await supabase
        .storage
        .from("store-photos")
        .list(id, { limit: 1000 });
      if (files?.length) {
        const paths = files.map((f) => `${id}/${f.name}`);
        await supabase.storage.from("store-photos").remove(paths);
      }

      // Delete the store row (photos rows cascade if FK has ON DELETE CASCADE)
      const { error } = await supabase.from("stores").delete().eq("id", id);
      if (error) throw error;

      // Back home
      window.location.href = "/";
    } catch (e) {
      console.error(e);
      alert("Delete store failed");
    }
  }

  if (!store) {
    return (
      <div className="container">
        <div className="card"><p>Loading…</p></div>
      </div>
    );
  }

  return (
    <div className="container">
      {/* Header card: view/edit + delete */}
      <div className="card" style={{ display: "grid", gap: 8 }}>
        <Link to="/" className="small">← Back</Link>

        {!isEditingHeader ? (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
            <div>
              <h1 style={{ margin: "6px 0 4px" }}>{store.name}</h1>
              <div className="small">{store.address}</div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="button" onClick={startHeaderEdit}>Edit</button>
              <button className="button danger" onClick={deleteThisStore}>Delete store</button>
            </div>
          </div>
        ) : (
          <div style={{ display: "grid", gap: 8 }}>
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
            <div style={{ display: "flex", gap: 8 }}>
              <button className="button" onClick={saveHeaderEdit}>Save</button>
              <button className="button danger" onClick={cancelHeaderEdit}>Cancel</button>
            </div>
          </div>
        )}
      </div>

      {/* Map card */}
      <div className="card" style={{ marginTop: 16 }}>
        <div className="small" style={{ marginBottom: 8 }}>Map</div>
        <div style={{ border: "1px solid var(--border)", borderRadius: 12, overflow: "hidden" }}>
          <iframe
            title="map"
            width="100%"
            height="260"
            style={{ border: 0 }}
            loading="lazy"
            allowFullScreen
            src={`https://www.google.com/maps?q=${encodeURIComponent(store.address || store.name)}&output=embed`}
          />
        </div>
      </div>

      {/* Notes card */}
      <div className="card" style={{ marginTop: 16 }}>
        <h2>Notes</h2>
        <textarea
          className="input"
          rows={6}
          placeholder="Write loading zone instructions here…"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          style={{ width: "100%", marginTop: 8 }}
        />
        <button className="button" onClick={saveNotes} style={{ marginTop: 10 }}>
          Save notes
        </button>
      </div>

      {/* Photos card */}
      <div className="card" style={{ marginTop: 16 }}>
        <h2>Photos</h2>

        {/* Drag & drop area + file input */}
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const f = e.dataTransfer.files?.[0];
            if (f) handleFile(f);
          }}
          style={{
            border: "2px dashed var(--border)",
            borderRadius: 12,
            padding: 16,
            textAlign: "center",
            background: "#0f1626",
            marginTop: 8,
          }}
        >
          <div className="small">Drag & drop a photo here</div>
          <div style={{ marginTop: 8 }}>
            <input
              type="file"
              accept="image/*"
              capture="environment"   // opens phone camera
              onChange={onFileInput}
              disabled={uploading}
              className="input"
              style={{ width: "100%" }}
            />
          </div>
          {uploading && <p className="small" style={{ marginTop: 8 }}>Uploading… please wait</p>}
        </div>

        {/* Photo grid */}
        <div className="grid" style={{ marginTop: 12 }}>
          {photos.map((p) => (
            <div key={p.id} className="card" style={{ padding: 8 }}>
              <img src={p.url} alt="Store" className="img" />
              <button
                onClick={() => removePhoto(p)}
                className="button danger"
                style={{ marginTop: 8, width: "100%" }}
              >
                Delete
              </button>
            </div>
          ))}
          {photos.length === 0 && <p className="small">No photos yet — add one above.</p>}
        </div>
      </div>
    </div>
  );
}
