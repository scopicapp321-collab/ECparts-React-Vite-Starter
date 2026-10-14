
import "./PartDetails.css";

import { useEffect, useMemo, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";

import { doc, getDoc } from "firebase/firestore";

import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ImageOff,
  Minus,
  Package,
  Plus,
  ShieldCheck,
  ShoppingCart,
  Truck,
  AlertCircle,
  LoaderCircle,
  Store,
  Hash,
} from "lucide-react";

import { db } from "../firebase";

const CART_STORAGE_KEY = "ecparts_cart";

/* =========================================
   FUNCIONES AUXILIARES
   ========================================= */

function formatPrice(value) {
  return Number(value || 0).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });
}

function getVehicle(product) {
  const vehicle = product?.vehicle;

  if (vehicle && typeof vehicle === "object") {
    return {
      make: vehicle.make || product.make || "",
      model: vehicle.model || product.model || "",
      year: vehicle.year || product.year || "",
    };
  }

  if (typeof vehicle === "string") {
    return {
      make: product.make || "",
      model: product.model || vehicle,
      year: product.year || "",
    };
  }

  return {
    make: product?.make || "",
    model: product?.model || "",
    year: product?.year || "",
  };
}

function getImages(product) {
  const images = Array.isArray(product?.images)
    ? product.images
    : [];

  return [
    ...images,
    product?.image,
    product?.imageUrl,
  ].filter(
    (image, index, array) =>
      typeof image === "string" &&
      image.trim() !== "" &&
      array.indexOf(image) === index
  );
}

function readCart() {
  try {
    const saved = localStorage.getItem(CART_STORAGE_KEY);
    const parsed = saved ? JSON.parse(saved) : [];

    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function addToCart(product, quantity) {
  const cart = readCart();

  const availableQuantity = Math.max(
    0,
    Number(product.quantity ?? 0)
  );

  if (availableQuantity < 1) {
    throw new Error("Esta pieza ya no tiene inventario disponible.");
  }

  const existingIndex = cart.findIndex(
    (item) => item.id === product.id
  );

  if (existingIndex >= 0) {
    const existingQuantity = Number(
      cart[existingIndex].cartQuantity || 0
    );

    const nextQuantity = Math.min(
      availableQuantity,
      existingQuantity + quantity
    );

    cart[existingIndex] = {
      ...cart[existingIndex],
      cartQuantity: nextQuantity,
    };
  } else {
    cart.push({
      id: product.id,
      title: product.title || "Pieza sin título",
      price: Number(product.price || 0),
      image: getImages(product)[0] || "",
      category: product.category || "",
      condition: product.condition || "",
      partNumber: product.partNumber || "",
      vehicle: getVehicle(product),
      sellerId: product.sellerId || "",
      sellerName: product.sellerName || "Vendedor ECparts",
      cartQuantity: Math.min(availableQuantity, quantity),
    });
  }

  localStorage.setItem(
    CART_STORAGE_KEY,
    JSON.stringify(cart)
  );
}

/* =========================================
   PÁGINA DE DETALLES
   ========================================= */

export default function PartDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [addedToCart, setAddedToCart] = useState(false);

  /* Cargar producto desde Firestore */

  useEffect(() => {
    let active = true;

    async function loadProduct() {
      setLoading(true);
      setError("");
      setProduct(null);
      setSelectedImage(0);
      setQuantity(1);
      setAddedToCart(false);

      try {
        if (!id) {
          throw new Error("No se proporcionó el ID de la pieza.");
        }

        const productRef = doc(db, "products", id);
        const snapshot = await getDoc(productRef);

        if (!snapshot.exists()) {
          throw new Error("No encontramos esta pieza.");
        }

        const data = {
          id: snapshot.id,
          ...snapshot.data(),
        };

        if (data.status && data.status !== "published") {
          throw new Error(
            "Esta pieza ya no está disponible en el catálogo."
          );
        }

        if (active) {
          setProduct(data);
        }
      } catch (err) {
        console.error("Error al cargar pieza:", err);

        if (active) {
          setError(
            err.message ||
              "No pudimos cargar esta pieza. Inténtalo nuevamente."
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadProduct();

    return () => {
      active = false;
    };
  }, [id]);

  /* Datos derivados */

  const images = useMemo(
    () => (product ? getImages(product) : []),
    [product]
  );

  const vehicle = useMemo(
    () => getVehicle(product),
    [product]
  );

  const availableQuantity = Math.max(
    0,
    Number(product?.quantity ?? 0)
  );

  const isAvailable =
    product?.status === "published" &&
    availableQuantity > 0;

  /* Galería */

  function changeImage(direction) {
    if (images.length <= 1) return;

    setSelectedImage((current) =>
      (current + direction + images.length) % images.length
    );
  }

  /* Añadir al carrito */

  function handleAddToCart() {
    if (!product || !isAvailable) return;

    try {
      addToCart(product, quantity);
      setAddedToCart(true);
      setError("");
    } catch (err) {
      console.error("Error al añadir al carrito:", err);

      setError(
        err.message ||
          "No pudimos guardar la pieza en el carrito."
      );
    }
  }

  /* Estado de carga */

  if (loading) {
    return (
      <main className="part-details-page">
        <div className="ec-state">
          <LoaderCircle
            size={42}
            className="ec-state-icon ec-spin"
          />

          <h1>Cargando detalles de la pieza...</h1>

          <p>Consultando el catálogo de ECparts.</p>
        </div>
      </main>
    );
  }

  /* Estado de error */

  if (error && !product) {
    return (
      <main className="part-details-page">
        <div className="ec-state">
          <AlertCircle
            size={44}
            className="ec-state-icon"
          />

          <h1>No pudimos mostrar la pieza</h1>

          <p>{error}</p>

          <div className="ec-error-actions">
            <button
              type="button"
              className="ec-button ec-button-secondary"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft size={17} />
              Volver
            </button>

            <Link
              to="/catalogo"
              className="ec-button ec-button-primary"
            >
              Ir al catálogo
            </Link>
          </div>
        </div>
      </main>
    );
  }

  if (!product) return null;

  /* Interfaz principal */

  return (
    <main className="part-details-page">
      {/* Navegación */}

      <nav className="ec-breadcrumbs" aria-label="Ruta de navegación">
        <Link to="/">Inicio</Link>
        <span>/</span>
        <Link to="/catalogo">Catálogo</Link>
        <span>/</span>
        <span className="ec-breadcrumb-current">
          {product.title || "Detalles de pieza"}
        </span>
      </nav>

      <div className="ec-container">
        <Link to="/catalogo" className="ec-back">
          <ArrowLeft size={17} />
          Volver al catálogo
        </Link>

        <div className="ec-product-layout">
          {/* =================================
              GALERÍA DE FOTOGRAFÍAS
              ================================= */}

          <section className="ec-gallery">
            <div className="ec-gallery-main">
              {images.length > 0 ? (
                <img
                  src={images[selectedImage]}
                  alt={product.title || "Fotografía de la pieza"}
                />
              ) : (
                <div className="ec-no-image">
                  <ImageOff size={52} />
                  <p>No hay fotografías disponibles</p>
                </div>
              )}

              <span className="ec-condition">
                {product.condition || "Pieza"}
              </span>

              {images.length > 1 && (
                <>
                  <button
                    type="button"
                    className="ec-gallery-arrow ec-prev"
                    onClick={() => changeImage(-1)}
                    aria-label="Fotografía anterior"
                  >
                    <ChevronLeft size={23} />
                  </button>

                  <button
                    type="button"
                    className="ec-gallery-arrow ec-next"
                    onClick={() => changeImage(1)}
                    aria-label="Fotografía siguiente"
                  >
                    <ChevronRight size={23} />
                  </button>

                  <span className="ec-gallery-count">
                    {selectedImage + 1} / {images.length}
                  </span>
                </>
              )}
            </div>

            {images.length > 1 && (
              <div className="ec-thumbnails">
                {images.map((image, index) => (
                  <button
                    key={`${image}-${index}`}
                    type="button"
                    className={`ec-thumbnail ${
                      selectedImage === index ? "active" : ""
                    }`}
                    onClick={() => setSelectedImage(index)}
                    aria-label={`Ver fotografía ${index + 1}`}
                  >
                    <img
                      src={image}
                      alt=""
                      loading="lazy"
                    />
                  </button>
                ))}
              </div>
            )}
          </section>

          {/* =================================
              INFORMACIÓN Y COMPRA
              ================================= */}

          <section className="ec-product-information">
            <div className="ec-info-card">
              <span className="ec-category">
                {product.category || "Otras piezas"}
              </span>

              <h1 className="ec-product-title">
                {product.title || "Pieza sin título"}
              </h1>

              <div className="ec-product-tags">
                {product.partNumber && (
                  <span className="ec-tag">
                    <Hash size={15} />
                    {product.partNumber}
                  </span>
                )}

                <span
                  className={`ec-tag ${
                    isAvailable ? "available" : "unavailable"
                  }`}
                >
                  <CheckCircle2 size={16} />
                  {isAvailable ? "Disponible" : "No disponible"}
                </span>
              </div>

              {/* Precio */}

              <div className="ec-price-area">
                <p className="ec-price-label">Precio de venta</p>

                <p className="ec-price">
                  {formatPrice(product.price)}
                </p>

                <p className="ec-price-note">
                  El costo del envío se confirmará durante el proceso
                  de compra.
                </p>
              </div>

              {/* Compatibilidad */}

              <div className="ec-section">
                <h2 className="ec-section-title">
                  <Package size={19} />
                  Compatibilidad del vehículo
                </h2>

                {vehicle.make || vehicle.model || vehicle.year ? (
                  <div className="ec-vehicle-tags">
                    {[vehicle.make, vehicle.model, vehicle.year]
                      .filter(Boolean)
                      .map((value, index) => (
                        <span
                          className="ec-vehicle-tag"
                          key={`${value}-${index}`}
                        >
                          {value}
                        </span>
                      ))}
                  </div>
                ) : (
                  <p className="ec-price-note">
                    Confirma la compatibilidad con el vendedor.
                  </p>
                )}
              </div>

              {/* Cantidad */}

              {isAvailable && (
                <div className="ec-section">
                  <label className="ec-quantity-label">
                    Cantidad
                  </label>

                  <div className="ec-quantity-row">
                    <div className="ec-quantity-control">
                      <button
                        type="button"
                        onClick={() =>
                          setQuantity((value) =>
                            Math.max(1, value - 1)
                          )
                        }
                        disabled={quantity <= 1}
                        aria-label="Reducir cantidad"
                      >
                        <Minus size={17} />
                      </button>

                      <span className="ec-quantity-value">
                        {quantity}
                      </span>

                      <button
                        type="button"
                        onClick={() =>
                          setQuantity((value) =>
                            Math.min(
                              availableQuantity,
                              value + 1
                            )
                          )
                        }
                        disabled={quantity >= availableQuantity}
                        aria-label="Aumentar cantidad"
                      >
                        <Plus size={17} />
                      </button>
                    </div>

                    <span className="ec-stock-note">
                      {availableQuantity} disponible(s)
                    </span>
                  </div>
                </div>
              )}

              {/* Botón principal naranja */}

              <div className="ec-actions">
                <button
                  type="button"
                  className="ec-button ec-button-primary"
                  onClick={handleAddToCart}
                  disabled={!isAvailable}
                >
                  <ShoppingCart size={20} />

                  {isAvailable
                    ? "Añadir al carrito"
                    : "No disponible"}
                </button>
              </div>

              {/* Confirmación del carrito */}

              {addedToCart && (
                <div className="ec-cart-success" role="status">
                  <p className="ec-cart-success-title">
                    <CheckCircle2 size={19} />
                    Pieza añadida al carrito
                  </p>

                  <p className="ec-cart-success-text">
                    Cantidad: {quantity} · Subtotal:{" "}
                    {formatPrice(
                      Number(product.price || 0) * quantity
                    )}
                  </p>

                  <button
                    type="button"
                    className="ec-cart-link"
                    onClick={() => navigate("/carrito")}
                  >
                    Ir al carrito
                    <ArrowRight size={16} />
                  </button>
                </div>
              )}

              {/* Envío y protección */}

              <div className="ec-benefits">
                <div className="ec-benefit">
                  <Truck
                    className="ec-benefit-icon"
                    size={22}
                  />

                  <div>
                    <p className="ec-benefit-title">
                      Envío al comprador
                    </p>

                    <p className="ec-benefit-text">
                      Disponibilidad y costo por confirmar.
                    </p>
                  </div>
                </div>

                <div className="ec-benefit">
                  <ShieldCheck
                    className="ec-benefit-icon"
                    size={22}
                  />

                  <div>
                    <p className="ec-benefit-title">
                      Compra informada
                    </p>

                    <p className="ec-benefit-text">
                      Comprueba la compatibilidad antes de comprar.
                    </p>
                  </div>
                </div>
              </div>
            </div>

{/* =================================
    VENDEDOR OFICIAL
    ================================= */}

<div className="ec-seller-card">
  <h2 className="ec-section-title">
    <Store size={19} />
    Vendedor oficial
  </h2>

  <p className="ec-seller-name">
    ECpartZ
  </p>

  <p className="ec-seller-role">
    Marketplace oficial de piezas automotrices
  </p>
</div>
</section>
</div>

        {/* =================================
            DESCRIPCIÓN DE LA PIEZA
            ================================= */}

        <section className="ec-description-card">
          <h2 className="ec-description-title">
            Descripción de la pieza
          </h2>

          <p className="ec-description-text">
            {product.description ||
              "El vendedor no ha añadido una descripción para esta pieza."}
          </p>
        </section>

        {/* Error de operación del carrito */}

        {error && (
          <div className="ec-error" role="alert">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}
      </div>
    </main>
  );
}
