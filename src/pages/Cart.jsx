
// src/pages/Cart.jsx

import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock3,
  MapPin,
  Minus,
  Package,
  Plus,
  ShieldCheck,
  ShoppingBag,
  Trash2,
  Truck,
  UserRound,
} from "lucide-react";
import "../styles/Cart.css";

const CART_KEY = "ecparts_cart";

const EMPTY_DELIVERY = {
  fullName: "",
  email: "",
  phone: "",
  address: "",
  apartment: "",
  municipality: "",
  postalCode: "",
  deliveryDays: [],
  preferredTime: "",
  alternativeTime: "",
  instructions: "",
};

function readCart() {
  try {
    const saved = JSON.parse(localStorage.getItem(CART_KEY) || "[]");
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
}

function getPrice(product) {
  return Number(product.price ?? product.unitPrice ?? 0) || 0;
}

function getImage(product) {
  return (
    product.image ||
    product.imageUrl ||
    product.images?.[0] ||
    product.coverImage ||
    ""
  );
}

function getTitle(product) {
  return product.title || product.name || product.productName || "Pieza";
}

function getVehicle(product) {
  const vehicle = product.vehicle;

  if (vehicle && typeof vehicle === "object") {
    return [vehicle.year, vehicle.make, vehicle.model]
      .filter(Boolean)
      .join(" ");
  }

  return (
    vehicle ||
    [product.year, product.make, product.model]
      .filter(Boolean)
      .join(" ")
  );
}

function getItemId(product) {
  return String(product.id || product.productId || product.partNumber || "");
}

export default function Cart() {
  const [items, setItems] = useState(readCart);
  const [delivery, setDelivery] = useState(EMPTY_DELIVERY);
  const [showDelivery, setShowDelivery] = useState(false);
  const [notice, setNotice] = useState("");
  const [attempted, setAttempted] = useState(false);

  useEffect(() => {
    const syncCart = () => setItems(readCart());

    window.addEventListener("storage", syncCart);
    window.addEventListener("ecparts-cart-updated", syncCart);

    return () => {
      window.removeEventListener("storage", syncCart);
      window.removeEventListener("ecparts-cart-updated", syncCart);
    };
  }, []);

  function saveCart(nextItems) {
    setItems(nextItems);
    localStorage.setItem(CART_KEY, JSON.stringify(nextItems));
    window.dispatchEvent(new Event("ecparts-cart-updated"));
  }

  function changeQuantity(id, amount) {
    const nextItems = items
      .map((item) => {
        if (getItemId(item) !== id) return item;

        const currentQuantity = Math.max(1, Number(item.quantity) || 1);
        return {
          ...item,
          quantity: Math.max(1, currentQuantity + amount),
        };
      });

    saveCart(nextItems);
  }

  function removeItem(id) {
    saveCart(items.filter((item) => getItemId(item) !== id));
  }

  function updateField(event) {
    const { name, value } = event.target;
    setDelivery((previous) => ({ ...previous, [name]: value }));
  }

  function toggleDay(day) {
    setDelivery((previous) => ({
      ...previous,
      deliveryDays: previous.deliveryDays.includes(day)
        ? previous.deliveryDays.filter((item) => item !== day)
        : [...previous.deliveryDays, day],
    }));
  }

  const subtotal = useMemo(
    () =>
      items.reduce(
        (total, item) =>
          total + getPrice(item) * Math.max(1, Number(item.quantity) || 1),
        0,
      ),
    [items],
  );

  const totalQuantity = items.reduce(
    (total, item) => total + Math.max(1, Number(item.quantity) || 1),
    0,
  );

  const money = (value) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value);

  function continueToDelivery() {
    setNotice("");
    if (!items.length) return;
    setShowDelivery(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function continueToPayment(event) {
    event.preventDefault();
    setAttempted(true);
    setNotice("");

    if (!event.currentTarget.reportValidity()) return;

    if (delivery.deliveryDays.length === 0) {
      setNotice("Selecciona al menos un día disponible para la entrega.");
      return;
    }

    const checkout = {
      items,
      delivery,
      subtotal,
      currency: "USD",
      createdAt: new Date().toISOString(),
    };

    // Guarda el borrador local del proceso de compra.
    // El pedido y el pago deberán confirmarse en el backend.
    localStorage.setItem("ecparts_checkout_draft", JSON.stringify(checkout));

    setNotice(
      "Información de entrega validada. El siguiente paso es conectar el proveedor de pago digital.",
    );
  }

  return (
    <main className="cart-page">
      <div className="cart-container">
        <Link to="/catalogo" className="cart-back-link">
          <ArrowLeft size={17} />
          Seguir explorando piezas
        </Link>

        <header className="cart-page-heading">
          <div>
            <span className="cart-eyebrow">ECparts · PUERTO RICO</span>
            <h1>{showDelivery ? "Entrega y contacto" : "Tu carrito"}</h1>
            <p>
              {showDelivery
                ? "Indícanos dónde y cuándo prefieres recibir tu pedido."
                : "Revisa tus piezas antes de continuar con la compra."}
            </p>
          </div>

          <div className="cart-step-indicator">
            <span className={!showDelivery ? "active" : "completed"}>
              {!showDelivery ? "1" : <CheckCircle2 size={17} />}
            </span>
            <div />
            <span className={showDelivery ? "active" : ""}>2</span>
            <small>Carrito</small>
            <small>Entrega</small>
          </div>
        </header>

        {!items.length ? (
          <section className="cart-empty">
            <div className="cart-empty-icon">
              <ShoppingBag size={34} />
            </div>
            <h2>Tu carrito está vacío</h2>
            <p>
              Las piezas que añadas desde el catálogo aparecerán aquí.
            </p>
            <Link to="/catalogo" className="cart-primary-button">
              Explorar piezas <ArrowRight size={18} />
            </Link>
          </section>
        ) : (
          <div className="cart-layout">
            <section className="cart-main-panel">
              {!showDelivery ? (
                <>
                  <div className="cart-section-title">
                    <div>
                      <h2>Piezas seleccionadas</h2>
                      <p>{totalQuantity} unidad(es) en tu carrito</p>
                    </div>
                    <Package size={22} />
                  </div>

                  <div className="cart-items">
                    {items.map((item, index) => {
                      const id = getItemId(item) || `item-${index}`;
                      const quantity = Math.max(1, Number(item.quantity) || 1);
                      const image = getImage(item);

                      return (
                        <article className="cart-item" key={id}>
                          <div className="cart-item-image">
                            {image ? (
                              <img src={image} alt={getTitle(item)} />
                            ) : (
                              <Package size={30} />
                            )}
                          </div>

                          <div className="cart-item-details">
                            <span className="cart-item-category">
                              {item.category || "Pieza automotriz"}
                            </span>
                            <h3>{getTitle(item)}</h3>
                            {getVehicle(item) && (
                              <p className="cart-item-vehicle">
                                {getVehicle(item)}
                              </p>
                            )}
                            {item.partNumber && (
                              <p className="cart-item-number">
                                Núm. de pieza: {item.partNumber}
                              </p>
                            )}

                            <div className="cart-item-actions">
                              <div className="cart-quantity-control">
                                <button
                                  type="button"
                                  aria-label="Reducir cantidad"
                                  onClick={() => {
                                    if (quantity > 1) changeQuantity(id, -1);
                                  }}
                                  disabled={quantity <= 1}
                                >
                                  <Minus size={14} />
                                </button>
                                <span>{quantity}</span>
                                <button
                                  type="button"
                                  aria-label="Aumentar cantidad"
                                  onClick={() => changeQuantity(id, 1)}
                                >
                                  <Plus size={14} />
                                </button>
                              </div>

                              <button
                                type="button"
                                className="cart-remove-button"
                                onClick={() => removeItem(id)}
                              >
                                <Trash2 size={15} /> Eliminar
                              </button>
                            </div>
                          </div>

                          <strong className="cart-item-price">
                            {money(getPrice(item) * quantity)}
                          </strong>
                        </article>
                      );
                    })}
                  </div>

                  <div className="cart-continue-row">
                    <Link to="/catalogo">
                      <ArrowLeft size={16} /> Añadir más piezas
                    </Link>
                    <button
                      type="button"
                      className="cart-primary-button"
                      onClick={continueToDelivery}
                    >
                      Información de entrega <ArrowRight size={18} />
                    </button>
                  </div>
                </>
              ) : (
                <form
                  id="cart-delivery-form"
                  className="cart-delivery-form"
                  onSubmit={continueToPayment}
                >
                  <div className="cart-section-title">
                    <div>
                      <h2>Información del comprador</h2>
                      <p>Usaremos estos datos para coordinar tu pedido.</p>
                    </div>
                    <UserRound size={22} />
                  </div>

                  <div className="cart-form-grid">
                    <label className="cart-field cart-field-full">
                      Nombre completo *
                      <input
                        name="fullName"
                        autoComplete="name"
                        value={delivery.fullName}
                        onChange={updateField}
                        required
                        placeholder="Nombre y apellidos"
                      />
                    </label>

                    <label className="cart-field">
                      Correo electrónico *
                      <input
                        type="email"
                        name="email"
                        autoComplete="email"
                        value={delivery.email}
                        onChange={updateField}
                        required
                        placeholder="nombre@correo.com"
                      />
                    </label>

                    <label className="cart-field">
                      Teléfono *
                      <input
                        type="tel"
                        name="phone"
                        autoComplete="tel"
                        value={delivery.phone}
                        onChange={updateField}
                        required
                        placeholder="(787) 000-0000"
                      />
                    </label>
                  </div>

                  <div className="cart-form-section-heading">
                    <MapPin size={19} />
                    <div>
                      <h3>Dirección de entrega</h3>
                      <p>Incluye los detalles necesarios para localizarte.</p>
                    </div>
                  </div>

                  <div className="cart-form-grid">
                    <label className="cart-field cart-field-full">
                      Dirección física *
                      <input
                        name="address"
                        autoComplete="street-address"
                        value={delivery.address}
                        onChange={updateField}
                        required
                        placeholder="Calle, número y dirección"
                      />
                    </label>

                    <label className="cart-field cart-field-full">
                      Apartamento, urbanización o barrio
                      <input
                        name="apartment"
                        value={delivery.apartment}
                        onChange={updateField}
                        placeholder="Apartamento, urbanización, barrio..."
                      />
                    </label>

                    <label className="cart-field">
                      Municipio *
                      <input
                        name="municipality"
                        value={delivery.municipality}
                        onChange={updateField}
                        required
                        placeholder="Ej. Bayamón"
                      />
                    </label>

                    <label className="cart-field">
                      Código postal *
                      <input
                        name="postalCode"
                        autoComplete="postal-code"
                        value={delivery.postalCode}
                        onChange={updateField}
                        required
                        inputMode="numeric"
                        placeholder="Ej. 00959"
                      />
                    </label>
                  </div>

                  <div className="cart-form-section-heading">
                    <Clock3 size={19} />
                    <div>
                      <h3>Disponibilidad para recibir</h3>
                      <p>
                        Selecciona tus días y horarios preferidos. El vendedor
                        deberá confirmar la coordinación.
                      </p>
                    </div>
                  </div>

                  <fieldset className="cart-days-fieldset">
                    <legend>Días disponibles *</legend>
                    <div className="cart-days-grid">
                      {[
                        "Lunes",
                        "Martes",
                        "Miércoles",
                        "Jueves",
                        "Viernes",
                        "Sábado",
                        "Domingo",
                      ].map((day) => (
                        <label className="cart-day-option" key={day}>
                          <input
                            type="checkbox"
                            checked={delivery.deliveryDays.includes(day)}
                            onChange={() => toggleDay(day)}
                          />
                          <span>{day}</span>
                        </label>
                      ))}
                    </div>
                    {attempted && delivery.deliveryDays.length === 0 && (
                      <small className="cart-validation-error">
                        Selecciona al menos un día.
                      </small>
                    )}
                  </fieldset>

                  <div className="cart-form-grid">
                    <label className="cart-field">
                      Horario preferido *
                      <select
                        name="preferredTime"
                        value={delivery.preferredTime}
                        onChange={updateField}
                        required
                      >
                        <option value="">Seleccionar horario</option>
                        <option value="8:00 AM – 12:00 PM">
                          Mañana · 8:00 AM–12:00 PM
                        </option>
                        <option value="12:00 PM – 4:00 PM">
                          Tarde · 12:00–4:00 PM
                        </option>
                        <option value="4:00 PM – 7:00 PM">
                          Final de la tarde · 4:00–7:00 PM
                        </option>
                        <option value="Flexible">Horario flexible</option>
                      </select>
                    </label>

                    <label className="cart-field">
                      Horario alternativo
                      <select
                        name="alternativeTime"
                        value={delivery.alternativeTime}
                        onChange={updateField}
                      >
                        <option value="">Sin preferencia alterna</option>
                        <option value="8:00 AM – 12:00 PM">
                          8:00 AM–12:00 PM
                        </option>
                        <option value="12:00 PM – 4:00 PM">
                          12:00–4:00 PM
                        </option>
                        <option value="4:00 PM – 7:00 PM">
                          4:00–7:00 PM
                        </option>
                        <option value="Flexible">Horario flexible</option>
                      </select>
                    </label>

                    <label className="cart-field cart-field-full">
                      Instrucciones adicionales
                      <textarea
                        name="instructions"
                        value={delivery.instructions}
                        onChange={updateField}
                        rows={4}
                        placeholder="Referencias, portón, instrucciones de acceso u otra información..."
                      />
                    </label>
                  </div>

                  <div className="cart-form-actions">
                    <button
                      type="button"
                      className="cart-secondary-button"
                      onClick={() => {
                        setShowDelivery(false);
                        setNotice("");
                      }}
                    >
                      <ArrowLeft size={16} /> Volver al carrito
                    </button>

                    <button
                      type="submit"
                      className="cart-primary-button"
                    >
                      Continuar al pago <ArrowRight size={18} />
                    </button>
                  </div>
                </form>
              )}
            </section>

            <aside className="cart-summary">
              <h2>Resumen del pedido</h2>

              <div className="cart-summary-count">
                <ShoppingBag size={18} />
                <span>{totalQuantity} unidad(es)</span>
              </div>

              <div className="cart-summary-line">
                <span>Subtotal de piezas</span>
                <strong>{money(subtotal)}</strong>
              </div>

              <div className="cart-summary-line">
                <span>Entrega</span>
                <span className="cart-summary-pending">
                  Por confirmar
                </span>
              </div>

              <div className="cart-summary-line">
                <span>Impuestos</span>
                <span className="cart-summary-pending">
                  Se calcularán
                </span>
              </div>

              <div className="cart-summary-total">
                <span>Subtotal actual</span>
                <strong>{money(subtotal)}</strong>
              </div>

              <p className="cart-summary-note">
                El total final puede cambiar según el costo de entrega,
                impuestos aplicables y disponibilidad de las piezas.
              </p>

              <div className="cart-trust-note">
                <Truck size={19} />
                <p>La entrega se coordina con el vendedor.</p>
              </div>

              <div className="cart-trust-note">
                <ShieldCheck size={19} />
                <p>Los pagos se habilitarán al integrar el proveedor digital.</p>
              </div>

              {showDelivery && (
                <button
                  type="submit"
                  form="cart-delivery-form"
                  className="cart-primary-button cart-summary-button"
                >
                  Continuar al pago <ArrowRight size={18} />
                </button>
              )}

              {notice && (
                <div className="cart-notice" role="status">
                  {notice}
                </div>
              )}
            </aside>
          </div>
        )}
      </div>
    </main>
  );
}
