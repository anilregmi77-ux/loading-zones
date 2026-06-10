import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { supabase } from "../supabaseClient";

export default function Store() {
  const { id } = useParams();

  const [store, setStore] = useState(null);
  const [notes, setNotes] = useState("");
  const [photos, setPhotos] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [savingNotes, setSavingNotes] = useState(false);

  const [editingHeader, setEditingHeader] = useState(false);
  const [editName, setEditName] = useState("");
  const [editAddress, setEditAddress] = useState("");

  const [viewerOpen, setViewerOpen] = useState(false);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [touchStartX, setTouchStartX] = useState(null);

  const cameraInputRef = useRef(null);
  const galleryInputRef = useRef(null);

  const placeQuery = encodeURIComponent(
    (store?.address || store?.name || "").trim()
  );

  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${placeQuery}`;
  const appleMapsUrl = `https://maps.apple.com/?q=${placeQuery}`;
  const wazeUrl = `https://waze.com/ul?q=${placeQuery}&navigate=yes`;

  async function loadStore() {
    const { data, error } = await supabase
      .from("stores")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error("loadStore:", error);
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
      console.error("loadPhotos:", error);
      alert("Could not load photos");
      return;
    }

    setPhotos(data || []);
  }

  useEffect(() => {
    loadStore();
    loadPhotos();
  }, [id]);

  useEffect(() => {
    function handleKey(e) {
      if (!viewerOpen) return;

      if (e.key === "ArrowRight") nextPhoto();
      if (e.key === "ArrowLeft") prevPhoto();
      if (e.key === "Escape") setViewerOpen(false);
    }

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [viewerOpen, currentPhotoIndex, photos]);

  function openViewer(index) {
    setCurrentPhotoIndex(index);
    setViewerOpen(true);
  }

  function nextPhoto() {
    setCurrentPhotoIndex((prev) =>
      photos.length ? (prev + 1) % photos.length : 0
    );
  }

  function prevPhoto() {
    setCurrentPhotoIndex((prev) =>
      photos.length ? (prev - 1 + photos.length) % photos.length : 0
    );
  }

  function handleTouchEnd(e) {
    if (touchStartX === null) return;

    const diff = touchStartX - e.changedTouches[0].clientX;

    if (diff > 50) nextPhoto();
    if (diff < -50) prevPhoto();

    setTouchStartX(null);
  }

  async function saveHeaderEdit() {
    const name = editName.trim();
    const address = editAddress.trim();

    if (!name) return alert("Store name cannot be empty");

    const { error } = await supabase
      .from("stores")
      .update({ name, address })
      .eq("id", id);

    if (error) {
      console.error("saveHeaderEdit:", error);
      return alert("Update failed");
    }

    setStore((prev) => ({ ...prev, name, address }));
    setEditingHeader(false);
  }

  async function saveNotes() {
    setSavingNotes(true);

    const { error } = await supabase
      .from("stores")
      .update({ notes })
      .eq("id", id);

    setSavingNotes(false);

    if (error) {
      console.error("saveNotes:", error);
      return alert("Could not save notes");
    }

    alert("Notes saved");
  }

  async function handleFiles(fileList) {
    if (!fileList?.length) return;

    setUploading(true);

    try {
      for (const file of fileList) {
        const fileName = `${Date.now()}_${file.name}`;
        const path = `${id}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("store-photos")
          .upload(path, file, {
            cacheControl: "3600",
            upsert: false,
          });

        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage
          .from("store-photos")
          .getPublicUrl(path);

        const { error: insertError } = await supabase.from("photos").insert({
          store_id: id,
          url: publicUrlData.publicUrl,
          storage_path: path,
        });

        if (insertError) throw insertError;
      }

      await loadPhotos();
    } catch (err) {
      console.error("handleFiles:", err);
      alert("Upload failed");
    } finally {
      setUploading(false);

      if (cameraInputRef.current) cameraInputRef.current.value = "";
      if (galleryInputRef.current) galleryInputRef.current.value = "";
    }
  }

  async function removePhoto(photo) {
    if (!confirm("Delete this photo?")) return;

    try {
      const { error: storageError } = await supabase.storage
        .from("store-photos")
        .remove([photo.storage_path]);

      if (storageError) throw storageError;

      const { error: dbError } = await supabase
        .from("photos")
        .delete()
        .eq("id", photo.id);

      if (dbError) throw dbError;

      setPhotos((prev) => prev.filter((p) => p.id !== photo.id));
    } catch (err) {
      console.error("removePhoto:", err);
      alert("Delete failed");
    }
  }

  async function deleteThisStore() {
    if (!confirm(`Delete "${store.name}" and all its photos?`)) return;

    try {
      const { data: files } = await supabase.storage
        .from("store-photos")
        .list(id, { limit: 1000 });

      if (files?.length) {
        const paths = files.map((file) => `${id}/${file.name}`);
        await supabase.storage.from("store-photos").remove(paths);
      }

      const { error } = await supabase.from("stores").delete().eq("id", id);
      if (error) throw error;

      window.location.href = "/";
    } catch (err) {
      console.error("deleteThisStore:", err);
      alert("Delete store failed");
    }
  }

  if (!store) {
    return (
      <div className="container">
        <TruckLoader text="Loading store..." />
      </div>
    );
  }

  const currentPhoto = photos[currentPhotoIndex];

  return (
    <div className="container">
      <Link to="/" className="back-link">
        ← Back to stores
      </Link>

      <section className="hero-card store-hero">
        {!editingHeader ? (
          <>
            <div>
              <div className="eyebrow">Store details</div>
              <h1>{store.name}</h1>
              <p>{store.address || "No address added"}</p>
            </div>

            <div className="button-row">
              <button
                className="button secondary"
                onClick={() => setEditingHeader(true)}
              >
                Edit
              </button>

              <button className="button danger" onClick={deleteThisStore}>
                Delete
              </button>
            </div>
          </>
        ) : (
          <div className="form-stack full-width">
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

            <div className="button-row">
              <button className="button" onClick={saveHeaderEdit}>
                Save
              </button>

              <button
                className="button danger"
                onClick={() => setEditingHeader(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </section>

      <section className="card">
        <h2>Map</h2>

        <iframe
          title="map"
          className="map-frame"
          loading="lazy"
          allowFullScreen
          src={`https://www.google.com/maps?q=${encodeURIComponent(
            store.address || store.name
          )}&output=embed`}
        />

        <div className="button-row wrap">
          <a className="button" href={googleMapsUrl} target="_blank" rel="noreferrer">
            Google Maps
          </a>

          <a className="button" href={appleMapsUrl} target="_blank" rel="noreferrer">
            Apple Maps
          </a>

          <a className="button" href={wazeUrl} target="_blank" rel="noreferrer">
            Waze
          </a>
        </div>
      </section>

      <section className="card">
        <h2>Loading Notes</h2>

        <textarea
          className="input textarea"
          placeholder="Write loading zone instructions here..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />

        <button className="button" onClick={saveNotes} disabled={savingNotes}>
          {savingNotes ? "Saving..." : "Save Notes"}
        </button>
      </section>

      <section className="card">
        <h2>Photos</h2>

        <div className="button-row wrap">
          <button className="button" onClick={() => cameraInputRef.current?.click()}>
            📷 Take Photo
          </button>

          <button
            className="button secondary"
            onClick={() => galleryInputRef.current?.click()}
          >
            🖼️ Choose Gallery
          </button>
        </div>

        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={(e) => handleFiles(e.target.files)}
          disabled={uploading}
          hidden
        />

        <input
          ref={galleryInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => handleFiles(e.target.files)}
          disabled={uploading}
          hidden
        />

        {uploading && <TruckLoader text="Uploading photos..." />}

        {photos.length === 0 ? (
          <div className="empty-box">No photos yet.</div>
        ) : (
          <div className="photo-grid">
            {photos.map((photo, index) => (
              <div className="photo-card" key={photo.id}>
                <img
                  src={photo.url}
                  alt="Store"
                  onClick={() => openViewer(index)}
                />

                <button
                  className="button danger small-button"
                  onClick={() => removePhoto(photo)}
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {viewerOpen && currentPhoto && (
        <div
          className="photo-modal"
          onTouchStart={(e) => setTouchStartX(e.touches[0].clientX)}
          onTouchEnd={handleTouchEnd}
        >
          <button className="modal-close" onClick={() => setViewerOpen(false)}>
            ×
          </button>

          <button className="modal-arrow left" onClick={prevPhoto}>
            ‹
          </button>

          <img src={currentPhoto.url} alt="Fullscreen" />

          <button className="modal-arrow right" onClick={nextPhoto}>
            ›
          </button>

          <div className="modal-count">
            {currentPhotoIndex + 1} / {photos.length}
          </div>
        </div>
      )}
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