import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { supabase } from "../supabaseClient";

export default function Store() {
  const { id } = useParams();

  const [store, setStore] = useState(null);
  const [notes, setNotes] = useState("");
  const [isEditingHeader, setIsEditingHeader] = useState(false);
  const [editName, setEditName] = useState("");
  const [editAddress, setEditAddress] = useState("");

  const [photos, setPhotos] = useState([]);
  const [uploading, setUploading] = useState(false);

  const cameraInputRef = useRef(null);
  const galleryInputRef = useRef(null);

  // Full-screen viewer state
  const [fullScreenPhoto, setFullScreenPhoto] = useState(null);

  function placeQuery() {
    return encodeURIComponent((store?.address || store?.name || "").trim());
  }
  const urlGoogleMaps = `https://www.google.com/maps/search/?api=1&query=${placeQuery()}`;
  const urlAppleMaps = `https://maps.apple.com/?q=${placeQuery()}`;
  const urlWaze = `https://waze.com/ul?q=${placeQuery()}&navigate=yes`;

  async function loadStore() {
    const { data, error } = await supabase.from("stores").select("*").eq("id", id).single();
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
      const { error } = await supabase.from("stores").update({ name, address }).eq("id", id);
      if (error) throw error;

      setStore((prev) => (prev ? { ...prev, name, address } : prev));
      setIsEditingHeader(false);
      alert("Store updated");
    } catch (e) {
      console.error(e);
      alert("Update failed");
    }
  }

  async function saveNotes() {
    const { error } = await supabase.from("stores").update({ notes }).eq("id", id);
    if (error) {
      console.error(error);
      alert("Could not save notes");
      return;
    }
    alert("Notes saved!");
  }

  async function handleFiles(fileList) {
    if (!fileList || fileList.length === 0) return;
    setUploading(true);
    try {
      for (const file of fileList) {
        const fileName = `${Date.now()}_${file.name}`;
        const path = `${id}/${fileName}`;
        const { error: uploadError } = await supabase.storage
          .from("store-photos")
          .upload(path, file, { cacheControl: "3600", upsert: false });
        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage.from("store-photos").getPublicUrl(path);
        const url = publicUrlData.publicUrl;

        const { error: insertError } = await supabase
          .from("photos")
          .insert({ store_id: id, url, storage_path: path });
        if (insertError) throw insertError;
      }
      await loadPhotos();
    } catch (err) {
      console.error(err);
      alert("Upload failed");
    } finally {
      setUploading(false);
      if (cameraInputRef.current) cameraInputRef.current.value = "";
      if (galleryInputRef.current) galleryInputRef.current.value = "";
    }
  }

  function onCameraChange(e) {
    handleFiles(e.target.files);
  }

  function onGalleryChange(e) {
    handleFiles(e.target.files);
  }

  async function removePhoto(photo) {
    if (!confirm("Delete this photo?")) return;
    try {
      const { error: storageErr } = await supabase.storage
        .from("store-photos")
        .remove([photo.storage_path]);
      if (storageErr) throw storageErr;

      const { error: dbErr } = await supabase.from("photos").delete().eq("id", photo.id);
      if (dbErr) throw dbErr;

      setPhotos((prev) => prev.filter((p) => p.id !== photo.id));
    } catch (e) {
      console.error(e);
      alert("Delete failed");
    }
  }

  async function deleteThisStore() {
    if (!confirm(`Delete "${store.name}" and all its photos?`)) return;
    try {
      const { data: files } = await supabase.storage.from("store-photos").list(id, { limit: 1000 });
      if (files?.length) {
        const paths = files.map((f) => `${id}/${f.name}`);
        await supabase.storage.from("store-photos").remove(paths);
      }
      const { error } = await supabase.from("stores").delete().eq("id", id);
      if (error) throw error;
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
      {/* Header */}
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
            <input className="input" placeholder="Store name" value={editName} onChange={(e) => setEditName(e.target.value)} />
            <input className="input" placeholder="Address" value={editAddress} onChange={(e) => setEditAddress(e.target.value)} />
            <div style={{ display: "flex", gap: 8 }}>
              <button className="button" onClick={saveHeaderEdit}>Save</button>
              <button className="button danger" onClick={cancelHeaderEdit}>Cancel</button>
            </div>
          </div>
        )}
      </div>

      {/* Map */}
      <div className="card" style={{ marginTop: 16 }}>
        <div className="small" style={{ marginBottom: 8 }}>Map</div>
        <iframe
          title="map"
          width="100%"
          height="260"
          style={{ border: 0 }}
          loading="lazy"
          allowFullScreen
          src={`https://www.google.com/maps?q=${encodeURIComponent(store.address || store.name)}&output=embed`}
        />
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
          <a className="button" href={urlGoogleMaps} target="_blank" rel="noopener noreferrer" style={{ flex: 1, textAlign: "center" }}>Open in Google Maps</a>
          <a className="button" href={urlAppleMaps} target="_blank" rel="noopener noreferrer" style={{ flex: 1, textAlign: "center" }}>Open in Apple Maps</a>
          <a className="button" href={urlWaze} target="_blank" rel="noopener noreferrer" style={{ flex: 1, textAlign: "center" }}>Open in Waze</a>
        </div>
      </div>

      {/* Notes */}
      <div className="card" style={{ marginTop: 16 }}>
        <h2>Notes</h2>
        <textarea className="input" rows={6} placeholder="Write loading zone instructions here…" value={notes} onChange={(e) => setNotes(e.target.value)} style={{ width: "100%", marginTop: 8 }} />
        <button className="button" onClick={saveNotes} style={{ marginTop: 10 }}>Save notes</button>
      </div>

      {/* Photos */}
      <div className="card" style={{ marginTop: 16 }}>
        <h2>Photos</h2>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
          <button className="button" onClick={() => cameraInputRef.current?.click()} style={{ flex: 1 }}>📷 Take Photo</button>
          <button className="button" onClick={() => galleryInputRef.current?.click()} style={{ flex: 1 }}>🖼️ Choose from Gallery</button>
        </div>

        <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" onChange={onCameraChange} disabled={uploading} style={{ display: "none" }} />
        <input ref={galleryInputRef} type="file" accept="image/*" multiple onChange={onGalleryChange} disabled={uploading} style={{ display: "none" }} />

        {uploading && <p className="small" style={{ marginTop: 8 }}>Uploading… please wait</p>}

        <div className="grid" style={{ marginTop: 12 }}>
          {photos.map((p) => (
            <div key={p.id} className="card" style={{ padding: 8 }}>
              <img
                src={p.url}
                alt="Store"
                className="img"
                style={{ cursor: "pointer", borderRadius: "8px" }}
                onClick={() => setFullScreenPhoto(p.url)}
              />
              <button onClick={() => removePhoto(p)} className="button danger" style={{ marginTop: 8, width: "100%" }}>
                Delete
              </button>
            </div>
          ))}
          {photos.length === 0 && <p className="small">No photos yet — add one above.</p>}
        </div>
      </div>

      {/* Full-screen photo viewer */}
      {fullScreenPhoto && (
        <div
          onClick={() => setFullScreenPhoto(null)}
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.95)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 2000,
          }}
        >
          <img
            src={fullScreenPhoto}
            alt="Fullscreen"
            style={{
              maxWidth: "90%",
              maxHeight: "90%",
              objectFit: "contain",
              borderRadius: "12px",
            }}
          />
        </div>
      )}
    </div>
  );
}
