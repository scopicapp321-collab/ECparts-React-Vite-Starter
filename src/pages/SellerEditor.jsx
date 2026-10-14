
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  addDoc,
  collection,
  serverTimestamp,
} from "firebase/firestore";
import {
  getDownloadURL,
  ref,
  uploadBytes,
} from "firebase/storage";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  ImagePlus,
  LoaderCircle,
  PackagePlus,
  Upload,
} from "lucide-react";

import Header from "../components/Header";
import { useAuth } from "../context/AuthContext";
import { db, storage } from "../firebase";

const categories = [
  "Motores",
  "Transmisiones",
  "Piezas eléctricas",
  "Carrocería",
  "Suspensión y dirección",
  "Frenos",
  "Interior",
  "Enfriamiento",
  "Accesorios",
  "Otros",
];

const initialForm = {
  title: "",
  category: "Motores",
  description: "",
  condition: "Usada",
  make: "",
  model: "",
  year: "",
  price: "",
  quantity: "1",
  partNumber: "",
};

export default function SellerEditor() {
  const { user, profile, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState(initialForm);
  const [photos, setPhotos] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const role = profile?.role;
  const canSell = ["junkyard", "private_seller"].includes(role);

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  function handlePhotos(event) {
    const selected = Array.from(event.target.files || []);
    setError("");

    if (selected.length > 5) {
      setError("Puedes subir un máximo de 5 fotografías.");
      event.target.value = "";
      return;
    }

    const invalid = selected.find(
      (file) =>
        !file.type.startsWith("image/") ||
        file.size > 5 * 1024 * 1024
    );

    if (invalid) {
      setError(
        "Selecciona imágenes válidas de hasta 5 MB cada una."
      );
      event.target.value = "";
      return;
    }

    setPhotos(selected);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!user) {
      setError("Debes iniciar sesión para publicar.");
      return;
    }

    if (!canSell) {
      setError(
        "Tu cuenta necesita el rol de vendedor particular o junkyard."
      );
      return;
    }

    if (photos.length === 0) {
      setError("Añade al menos una fotografía de la pieza.");
      return;
    }

    const price = Number(form.price);
    const quantity = Number(form.quantity);
    const year = form.year ? Number(form.year) : null;

    if (!Number.isFinite(price) || price < 0) {
      setError("Introduce un precio válido.");
      return;
    }

    if (!Number.isInteger(quantity) || quantity < 1) {
      setError("La cantidad debe ser un número entero mayor que cero.");
      return;
    }

    if (
      year !== null &&
      (!Number.isInteger(year) || year < 1900 || year > 2100)
    ) {
      setError("Introduce un año de vehículo válido.");
      return;
    }

    setSaving(true);

    try {
      const imageUrls = [];

      for (const photo of photos) {
        const safeName = photo.name.replace(/[^a-zA-Z0-9._-]/g, "_");
        const imageRef = ref(
          storage,
          `products/${user.uid}/${crypto.randomUUID()}-${safeName}`
        );

        await uploadBytes(imageRef, photo, {
          contentType: photo.type,
        });

        imageUrls.push(await getDownloadURL(imageRef));
      }

      const product = {
        title: form.title.trim(),
        category: form.category,
        description: form.description.trim(),
        condition: form.condition,
        vehicle: {
          make: form.make.trim(),
          model: form.model.trim(),
          year,
        },
        price,
        quantity,
        partNumber: form.partNumber.trim(),
        images: imageUrls,
        sellerId: user.uid,
        sellerName:
          profile?.name || user.displayName || "Vendedor ECparts",
        sellerRole: role,
        status: "published",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const productRef = await addDoc(
        collection(db, "products"),
        product
      );

      setSuccess(`Pieza publicada. Código: ${productRef.id}`);
      setForm(initialForm);
      setPhotos([]);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      console.error("Error al publicar la pieza:", err);

      if (err.code === "permission-denied") {
        setError(
          "Firebase denegó el acceso. Revisa las reglas de Firestore y Storage y el rol de tu cuenta."
        );
      } else if (
        err.code === "storage/unauthorized" ||
        err.code === "storage/unknown"
      ) {
        setError(
          "No se pudieron subir las fotos. Revisa la configuración y las reglas de Firebase Storage."
        );
      } else {
        setError(
          `${err.code || "Error"}: ${err.message || "No se pudo publicar la pieza."}`
        );
      }
    } finally {
      setSaving(false);
    }
  }

  if (authLoading) {
    return (
      <>
        <Header />
        <main className="seller-editor-page">
          <p>Verificando tu cuenta...</p>
        </main>
      </>
    );
  }

  if (!user) {
    return (
      <>
        <Header />
        <main className="seller-editor-page">
          <section className="seller-editor-card">
            <h1>Inicia sesión para vender</h1>
            <p>Necesitas una cuenta ECparts para publicar tu inventario.</p>
            <Link className="cta-button" to="/cuenta">
              Iniciar sesión
            </Link>
          </section>
        </main>
      </>
    );
  }

  if (!canSell) {
    return (
      <>
        <Header />
        <main className="seller-editor-page">
          <section className="seller-editor-card">
            <AlertCircle size={32} />
            <h1>Activa tu cuenta de vendedor</h1>
            <p>
              Tu perfil actual no tiene el rol necesario para publicar
              piezas. Necesitas una cuenta de vendedor particular o junkyard.
            </p>
            <p>
              Rol actual: <strong>{role || "Sin definir"}</strong>
            </p>
            <Link className="cta-button" to="/cuenta">
              Ir a mi cuenta
            </Link>
          </section>
        </main>
      </>
    );
  }

  return (
    <>
      <Header />

      <main className="seller-editor-page">
        <div className="seller-editor-wrap">
          <Link className="seller-back-link" to="/">
            <ArrowLeft size={17} /> Volver al marketplace
          </Link>

          <div className="seller-editor-heading">
            <span className="section-kicker">INVENTARIO DEL VENDEDOR</span>
            <h1>Publicar una pieza</h1>
            <p>
              Registra tu producto para que los compradores puedan
              encontrarlo en ECparts.
            </p>
          </div>

          {success && (
            <div className="seller-alert success" role="status">
              <CheckCircle2 size={20} />
              <div>
                <strong>Publicación guardada</strong>
                <p>{success}</p>
              </div>
              <button
                type="button"
                onClick={() => navigate("/catalogo")}
              >
                Ver catálogo
              </button>
            </div>
          )}

          {error && (
            <div className="seller-alert error" role="alert">
              <AlertCircle size={20} />
              <span>{error}</span>
            </div>
          )}

          <form className="seller-editor-card" onSubmit={handleSubmit}>
            <div className="editor-section-title">
              <PackagePlus size={21} />
              <div>
                <h2>Información de la pieza</h2>
                <p>Describe claramente el artículo que estás vendiendo.</p>
              </div>
            </div>

            <div className="seller-form-grid">
              <label className="seller-field full">
                Nombre de la pieza *
                <input
                  name="title"
                  value={form.title}
                  onChange={updateField}
                  placeholder="Ej. Alternador Toyota Corolla"
                  required
                  maxLength={120}
                />
              </label>

              <label className="seller-field">
                Categoría *
                <select
                  name="category"
                  value={form.category}
                  onChange={updateField}
                  required
                >
                  {categories.map((category) => (
                    <option key={category}>{category}</option>
                  ))}
                </select>
              </label>

              <label className="seller-field">
                Condición *
                <select
                  name="condition"
                  value={form.condition}
                  onChange={updateField}
                >
                  <option>Usada</option>
                  <option>Nueva</option>
                  <option>Reacondicionada</option>
                </select>
              </label>

              <label className="seller-field full">
                Descripción *
                <textarea
                  name="description"
                  value={form.description}
                  onChange={updateField}
                  placeholder="Estado, detalles, defectos conocidos y otra información útil..."
                  rows={4}
                  required
                  maxLength={3000}
                />
              </label>
            </div>

            <div className="editor-section-title">
              <Upload size={21} />
              <div>
                <h2>Compatibilidad del vehículo</h2>
                <p>Identifica para qué vehículo sirve la pieza.</p>
              </div>
            </div>

            <div className="seller-form-grid">
              <label className="seller-field">
                Marca
                <input
                  name="make"
                  value={form.make}
                  onChange={updateField}
                  placeholder="Toyota"
                />
              </label>

              <label className="seller-field">
                Modelo
                <input
                  name="model"
                  value={form.model}
                  onChange={updateField}
                  placeholder="Corolla"
                />
              </label>

              <label className="seller-field">
                Año
                <input
                  name="year"
                  type="number"
                  min="1900"
                  max="2100"
                  value={form.year}
                  onChange={updateField}
                  placeholder="2018"
                />
              </label>

              <label className="seller-field">
                Número de pieza
                <input
                  name="partNumber"
                  value={form.partNumber}
                  onChange={updateField}
                  placeholder="OEM o referencia"
                />
              </label>
            </div>

            <div className="editor-section-title">
              <ImagePlus size={21} />
              <div>
                <h2>Fotografías</h2>
                <p>Sube de 1 a 5 fotos reales, máximo 5 MB por imagen.</p>
              </div>
            </div>

            <label className="seller-photo-picker">
              <ImagePlus size={30} />
              <strong>Seleccionar fotografías</strong>
              <span>JPG, PNG, WebP y otros formatos de imagen admitidos</span>
              <input
                type="file"
                accept="image/*"
                multiple
                required
                onChange={handlePhotos}
              />
            </label>

            {photos.length > 0 && (
              <ul className="seller-photo-list">
                {photos.map((photo) => (
                  <li key={`${photo.name}-${photo.size}`}>
                    <CheckCircle2 size={16} />
                    {photo.name}
                  </li>
                ))}
              </ul>
            )}

            <div className="editor-section-title">
              <PackagePlus size={21} />
              <div>
                <h2>Precio e inventario</h2>
                <p>Indica el precio por unidad y las unidades disponibles.</p>
              </div>
            </div>

            <div className="seller-form-grid">
              <label className="seller-field">
                Precio por unidad (USD) *
                <input
                  name="price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.price}
                  onChange={updateField}
                  placeholder="85.00"
                  required
                />
              </label>

              <label className="seller-field">
                Cantidad disponible *
                <input
                  name="quantity"
                  type="number"
                  min="1"
                  step="1"
                  value={form.quantity}
                  onChange={updateField}
                  required
                />
              </label>
            </div>

            <div className="seller-submit-row">
              <span>
                Publicas como <strong>{profile?.name || user.email}</strong>
              </span>
              <button
                className="cta-button"
                type="submit"
                disabled={saving}
              >
                {saving ? (
                  <>
                    <LoaderCircle size={18} />
                    Guardando...
                  </>
                ) : (
                  <>
                    Publicar pieza
                    <PackagePlus size={18} />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </main>
    </>
  );
}
