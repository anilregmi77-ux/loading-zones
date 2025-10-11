import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { supabase } from "../supabaseClient";

export default function Store() {
  const { id } = useParams();
  const [store, setStore] = useState(null);
  const [notes, setNotes] = useState("");
  const [photos, setPhotos] = useState([]);
  const [uploading, setUploading] = useState(false);

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

  async function saveNotes() {
    const { error } = await supabase
      .from("stores")
      .update({ notes })
      .eq("id", id);
    if (error) {
      console.error(error);
      alert("Could not save notes");
      return;
    }
    alert("Notes saved!");
  }

  async function onUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fileName = `${Date.now()}_${file.name}`;
      const path = `${id}/${fileName}`;
      const { error: uploadError } = await supabase.storage
        .from("store-photos")
        .upload(path, file, { cacheControl: "3600", upsert: false });
      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from("store-photos")
        .getPublicUrl(path);
      const url = publicUrlData.publicUrl;

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
      e.target.value = "";
    }
  }

  async function removePhoto(photo) {
    if (!confirm("Delete this photo?")) return;
    try {
      const { error: storageErr } = await supabase.storage
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

  if (!store)
    return (
      <div style={{ maxWidth: 900, margin: "20px auto", padding: 12 }}>
        <p>Loading…</p>
      </div>
    );

  return (
    <div style={{ maxWidth: 900, margin: "20px auto", padding: 12 }}>
      <Link to="/">← Back</Link>
      <h1>{store.name}</h1>
      <div style={{ color: "#555" }}>{store.address}</div>

      <h2 style={{ marginTop: 24 }}>Notes</h2>
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Write loading zone instructions here…"
        rows={6}
        style={{ width: "100%", padding: 10 }}
      />
      <div style={{ marginTop: 8 }}>
        <button onClick={saveNotes} style={{ padding: 10 }}>
          Save notes
        </button>
      </div>

      <h2 style={{ marginTop: 24 }}>Photos</h2>
      <input
        type="file"
        accept="image/*"
        capture="environment"
        onChange={onUpload}
        disabled={uploading}
      />
      {uploading && <p>Uploading… please wait</p>}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
          gap: 12,
          marginTop: 12,
        }}
      >
        {photos.map((p) => (
          <div
            key={p.id}
            style={{ border: "1px solid #ddd", borderRadius: 8, padding: 8 }}
          >
            <img
              src={p.url}
              alt="Store"
              style={{
                width: "100%",
                height: 140,
                objectFit: "cover",
                borderRadius: 6,
              }}
            />
            <button
              onClick={() => removePhoto(p)}
              style={{ marginTop: 8, width: "100%" }}
            >
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

supabase.storage.from('store-photos')  // must match bucket name
