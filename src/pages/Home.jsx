
import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  CheckCircle2,
  Search,
  ShieldCheck,
  MapPin,
  Truck,
  Wrench,
  CircleDollarSign,
  RotateCcw,
  PackageSearch,
} from "lucide-react";

import Header from "../components/Header";
import PartCard from "../components/PartCard";
import FirebaseProductCard from "../components/FirebaseProductCard";
import usePublishedProducts from "../hooks/usePublishedProducts";
import { categories, parts } from "../data/parts";

const currentYear = new Date().getFullYear();

function normalize(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function getVehicle(product) {
  const vehicleData =
    product.vehicle && typeof product.vehicle === "object"
      ? product.vehicle
      : {};

  return {
    make: vehicleData.make || product.make || "",
    model: vehicleData.model || product.model || "",
    year: vehicleData.year || product.year || "",
  };
}

export default function Home() {
  const navigate = useNavigate();

  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("Todas");

  const {
    products: firebaseProducts = [],
    loading: productsLoading,
    error: productsError,
  } = usePublishedProducts();

  // Los productos reales de Firebase son la fuente principal.
  // Las piezas de demostración se usan únicamente si no hay anuncios.
  const inventorySource = useMemo(() => {
    if (firebaseProducts.length > 0) {
      return firebaseProducts.map((product) => {
        const vehicleData = getVehicle(product);

        return {
          ...product,
          vehicle: [
            vehicleData.make,
            vehicleData.model,
            vehicleData.year,
          ]
            .filter(Boolean)
            .join(" "),
          make: vehicleData.make,
          model: vehicleData.model,
          year: String(vehicleData.year || ""),
          seller:
            product.sellerName ||
            product.seller ||
            "Vendedor ECparts",
          image:
            product.image ||
            product.images?.[0] ||
            "",
        };
      });
    }

    return parts;
  }, [firebaseProducts]);

  const filteredParts = useMemo(() => {
    return inventorySource.filter((part) => {
      const vehicleData = getVehicle(part);

      const vehicle = [
        vehicleData.make,
        vehicleData.model,
        vehicleData.year,
      ]
        .filter(Boolean)
        .join(" ");

      const searchableText = normalize(
        [
          part.title,
          vehicle,
          part.seller,
          part.sellerName,
          part.category,
          part.description,
          part.partNumber,
          part.condition,
          vehicleData.make,
          vehicleData.model,
          vehicleData.year,
        ]
          .filter(Boolean)
          .join(" ")
      );

      const matchesQuery =
        !query || searchableText.includes(normalize(query));

      const matchesCategory =
        activeCategory === "Todas" ||
        normalize(part.category) === normalize(activeCategory);

      const matchesMake =
        !make ||
        normalize(vehicleData.make).includes(normalize(make));

      const matchesModel =
        !model ||
        normalize(vehicleData.model).includes(normalize(model));

      const matchesYear =
        !year || String(vehicleData.year) === String(year);

      return (
        matchesQuery &&
        matchesCategory &&
        matchesMake &&
        matchesModel &&
        matchesYear
      );
    });
  }, [
    inventorySource,
    query,
    activeCategory,
    make,
    model,
    year,
  ]);

  const realProductIds = useMemo(
    () => new Set(firebaseProducts.map((product) => product.id)),
    [firebaseProducts]
  );

  const hasRealProducts = firebaseProducts.length > 0;
  const hasFilters = Boolean(
    make || model || year || query || activeCategory !== "Todas"
  );

  function submitSearch(event) {
    event.preventDefault();

    // Lleva al usuario a los resultados encontrados.
    document
      .getElementById("inventory")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function clearFilters() {
    setMake("");
    setModel("");
    setYear("");
    setQuery("");
    setActiveCategory("Todas");
  }

  function openCatalog(category = "Todas") {
    const params = new URLSearchParams();

    if (category !== "Todas") {
      params.set("categoria", category);
    }

    if (make.trim()) params.set("marca", make.trim());
    if (model.trim()) params.set("modelo", model.trim());
    if (year) params.set("año", year);
    if (query.trim()) params.set("q", query.trim());

    navigate(
      `/catalogo${params.toString() ? `?${params.toString()}` : ""}`
    );
  }

  return (
    <>
      <Header />

      <main>
        {/* HERO */}
        <section className="hero">
          <div className="hero-glow" />

          <div className="hero-content">
            <div className="eyebrow">
              <span />
              EL MARKETPLACE DE PIEZAS DE PUERTO RICO
            </div>

            <h1>
              La pieza que buscas.
              <br />
              <span>Al mejor alcance.</span>
            </h1>

            <p className="hero-copy">
              Encuentra piezas de autos nuevas y usadas de
              vendedores de Puerto Rico. Compara opciones y
              dale más vida a tu carro.
            </p>

            <div className="hero-points">
              <span>
                <CheckCircle2 size={16} />
                Vendedores locales
              </span>

              <span>
                <CheckCircle2 size={16} />
                Inventario publicado
              </span>
            </div>

            {/* BUSCADOR */}
            <form className="vehicle-search" onSubmit={submitSearch}>
              <div className="search-heading">
                <Wrench size={17} />
                <strong>Encuentra piezas para tu vehículo</strong>
              </div>

              <div className="vehicle-fields">
                <label>
                  Marca
                  <input
                    value={make}
                    onChange={(event) => setMake(event.target.value)}
                    placeholder="Ej. Toyota"
                    autoComplete="off"
                  />
                </label>

                <label>
                  Modelo
                  <input
                    value={model}
                    onChange={(event) => setModel(event.target.value)}
                    placeholder="Ej. Corolla"
                    autoComplete="off"
                  />
                </label>

                <label>
                  Año
                  <select
                    value={year}
                    onChange={(event) => setYear(event.target.value)}
                  >
                    <option value="">Cualquier año</option>

                    {Array.from(
                      { length: currentYear - 1980 + 1 },
                      (_, index) => currentYear - index
                    ).map((vehicleYear) => (
                      <option key={vehicleYear} value={vehicleYear}>
                        {vehicleYear}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="keyword-row">
                <Search size={18} />

                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Pieza, número de pieza o palabra clave..."
                  aria-label="Buscar piezas"
                />

                <button type="submit">
                  Buscar piezas
                  <ArrowRight size={17} />
                </button>
              </div>

              <p className="search-note">
                La compatibilidad exacta debe confirmarse antes
                de realizar la compra.
              </p>
            </form>
          </div>

          <div className="hero-side">
            <div
              className="hero-photo"
              role="img"
              aria-label="Taller automotriz"
            />

            <div className="floating-note">
              <span className="note-icon">
                <MapPin size={18} />
              </span>

              <span>
                <strong>De aquí, para tu carro</strong>
                <small>Vendedores en Puerto Rico</small>
              </span>
            </div>

            <div className="hero-stamp">
              <span>EC</span>
              <small>
                PARTS
                <br />
                MARKETPLACE
              </small>
            </div>
          </div>
        </section>

        {/* BENEFICIOS */}
        <section className="trust-strip">
          <div>
            <ShieldCheck />
            <span>
              <strong>Vendedores identificados</strong>
              <small>Consulta los datos disponibles</small>
            </span>
          </div>

          <div>
            <CircleDollarSign />
            <span>
              <strong>Compara precios</strong>
              <small>Encuentra opciones para tu bolsillo</small>
            </span>
          </div>

          <div>
            <Truck />
            <span>
              <strong>Opciones de envío</strong>
              <small>Según las condiciones de la compra</small>
            </span>
          </div>

          <div>
            <Wrench />
            <span>
              <strong>Todo para tu auto</strong>
              <small>Piezas en un solo marketplace</small>
            </span>
          </div>
        </section>

        {/* CATEGORÍAS */}
        <section className="section categories-section">
          <div className="section-heading">
            <div>
              <span className="section-kicker">
                EXPLORA EL INVENTARIO
              </span>

              <h2>¿Qué pieza necesitas?</h2>

              <p>
                Selecciona una categoría para consultar sus piezas.
              </p>
            </div>

            <Link className="text-link" to="/catalogo">
              Ver todo el catálogo
              <ArrowRight size={17} />
            </Link>
          </div>

          <div className="category-grid">
            <button
              type="button"
              className={`category-tile ${
                activeCategory === "Todas" ? "selected" : ""
              }`}
              onClick={() => {
                setActiveCategory("Todas");
                document
                  .getElementById("inventory")
                  ?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              <span className="category-emoji">🚘</span>
              <strong>Todas</strong>
              <ArrowRight size={16} className="category-arrow" />
            </button>

            {categories.map((category) => (
              <button
                type="button"
                key={category.name}
                className={`category-tile ${
                  normalize(activeCategory) === normalize(category.name)
                    ? "selected"
                    : ""
                }`}
                onClick={() => {
                  setActiveCategory(category.name);
                  document
                    .getElementById("inventory")
                    ?.scrollIntoView({ behavior: "smooth" });
                }}
              >
                <span className="category-emoji">
                  {category.icon}
                </span>

                <strong>{category.name}</strong>

                <ArrowRight
                  size={16}
                  className="category-arrow"
                />
              </button>
            ))}
          </div>
        </section>

        {/* INVENTARIO */}
        <section
          className="section inventory-section"
          id="inventory"
        >
          <div className="section-heading">
            <div>
              <span className="section-kicker">
                {hasRealProducts ? "INVENTARIO PUBLICADO" : "DESCUBRE ECparts"}
              </span>

              <h2>
                {activeCategory === "Todas"
                  ? hasFilters
                    ? "Resultados de búsqueda"
                    : "Piezas disponibles"
                  : activeCategory}
              </h2>

              <p>
                {productsLoading && !hasRealProducts
                  ? "Consultando inventario..."
                  : hasRealProducts
                    ? `${filteredParts.length} resultado(s) según tus filtros.`
                    : "Vista de demostración mientras se publican anuncios."}
              </p>
            </div>

            <Link className="text-link" to="/catalogo">
              Explorar catálogo
              <ArrowRight size={17} />
            </Link>
          </div>

          <div className="filter-row">
            {[
              "Todas",
              ...categories.map((category) => category.name),
            ].map((categoryName) => (
              <button
                key={categoryName}
                type="button"
                className={
                  normalize(activeCategory) === normalize(categoryName)
                    ? "filter-pill active"
                    : "filter-pill"
                }
                onClick={() => setActiveCategory(categoryName)}
              >
                {categoryName === "Todas" ? "Todas las piezas" : categoryName}
              </button>
            ))}
          </div>

          {productsLoading && (
            <p className="inventory-status" role="status">
              Cargando inventario...
            </p>
          )}

          {productsError && (
            <div className="empty-state" role="status">
              <h3>No pudimos consultar todos los productos</h3>
              <p>{productsError}</p>
            </div>
          )}

          {!productsLoading && hasRealProducts && filteredParts.length === 0 && (
            <div className="empty-state">
              <PackageSearch size={30} />

              <h3>No encontramos piezas con esos filtros</h3>

              <p>
                Cambia la búsqueda o elimina uno o más filtros.
              </p>

              <button
                type="button"
                className="button-secondary"
                onClick={clearFilters}
              >
                <RotateCcw size={16} />
                Limpiar filtros
              </button>

              <button
                type="button"
                className="text-link"
                onClick={() => openCatalog()}
              >
                Ver catálogo completo
                <ArrowRight size={16} />
              </button>
            </div>
          )}

          {filteredParts.length > 0 && (
            <div className="parts-grid">
              {filteredParts.map((part) =>
                realProductIds.has(part.id) ? (
                  <FirebaseProductCard
                    key={part.id}
                    product={part}
                  />
                ) : (
                  <PartCard
                    key={part.id}
                    part={part}
                  />
                )
              )}
            </div>
          )}

          {!productsLoading &&
            !productsError &&
            !hasRealProducts &&
            filteredParts.length === 0 && (
              <div className="empty-state">
                <PackageSearch size={30} />
                <h3>No hay piezas para esta búsqueda</h3>
                <p>Prueba con otra palabra o categoría.</p>

                <button
                  type="button"
                  className="button-secondary"
                  onClick={clearFilters}
                >
                  Limpiar filtros
                </button>
              </div>
            )}

          {hasFilters && filteredParts.length > 0 && (
            <div className="inventory-actions">
              <button
                type="button"
                className="button-secondary"
                onClick={clearFilters}
              >
                <RotateCcw size={16} />
                Limpiar filtros
              </button>

              <button
                type="button"
                className="text-link"
                onClick={() => openCatalog(activeCategory)}
              >
                Ver estos filtros en el catálogo
                <ArrowRight size={16} />
              </button>
            </div>
          )}

          <p className="demo-disclaimer">
            {hasRealProducts
              ? "Los anuncios publicados provienen de ECpartZ. Verifica compatibilidad, disponibilidad y condiciones de envío antes de comprar."
              : "Las piezas de demostración son ilustrativas y no representan anuncios reales."}
          </p>
        </section>

        {/* VENDEDORES */}
        <section className="seller-cta">
          <div className="cta-icon">
            <Wrench size={28} />
          </div>

          <div className="cta-copy">
            <span className="section-kicker">
              ¿TIENES INVENTARIO?
            </span>

            <h2>
              Tu próximo cliente está buscando esa pieza.
            </h2>

            <p>
              Publica tu inventario y conecta con compradores
              a través de ECpartZ.
            </p>
          </div>

          <Link to="/vender" className="cta-button">
            Comenzar a vender
            <ArrowRight size={18} />
          </Link>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="site-footer">
        <Link className="brand footer-brand" to="/">
          <span className="brand-mark">
            <Wrench size={20} />
          </span>

          <span>
            EC<span>partZ</span>
            <small>PUERTO RICO</small>
          </span>
        </Link>

        <p>Piezas usadas. Nuevas posibilidades.</p>

        <span>
          © {currentYear} ECpartZ · Marketplace de piezas automotrices
        </span>
      </footer>
    </>
  );
}
