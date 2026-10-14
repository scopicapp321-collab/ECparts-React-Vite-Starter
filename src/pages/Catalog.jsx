
import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Search,
  SlidersHorizontal,
  RotateCcw,
  PackageSearch,
  AlertCircle,
  LoaderCircle,
  CarFront,
  X,
  ArrowLeft,
} from "lucide-react";

import { usePublishedProducts } from "../hooks/usePublishedProducts";
import FirebaseProductCard from "../components/FirebaseProductCard";
import { categories } from "../data/parts";

const normalize = (value = "") =>
  String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

function getVehicle(product) {
  const vehicle = product?.vehicle;

  if (vehicle && typeof vehicle === "object") {
    return {
      make: vehicle.make || product.make || "",
      model: vehicle.model || product.model || "",
      year: vehicle.year || product.year || "",
    };
  }

  return {
    make: product?.make || "",
    model:
      product?.model ||
      (typeof vehicle === "string" ? vehicle : ""),
    year: product?.year || "",
  };
}

function getProductText(product) {
  const vehicle = getVehicle(product);

  return normalize(
    [
      product.title,
      product.description,
      product.category,
      product.partNumber,
      product.condition,
      product.sellerName,
      vehicle.make,
      vehicle.model,
      vehicle.year,
    ]
      .filter(Boolean)
      .join(" ")
  );
}

function getProductImage(product) {
  if (Array.isArray(product.images) && product.images.length) {
    return product.images[0];
  }

  return product.image || product.imageUrl || "";
}

function getCategoryName(category) {
  return typeof category === "string"
    ? category
    : category?.name || "";
}

export default function Catalog() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const {
    products: firebaseProducts = [],
    loading: productsLoading,
    error: productsError,
  } = usePublishedProducts();

  const [search, setSearch] = useState(
    () => searchParams.get("q") || ""
  );
  const [category, setCategory] = useState(
    () => searchParams.get("categoria") || ""
  );
  const [make, setMake] = useState(
    () => searchParams.get("marca") || ""
  );
  const [model, setModel] = useState(
    () => searchParams.get("modelo") || ""
  );
  const [year, setYear] = useState(
    () => searchParams.get("año") || searchParams.get("year") || ""
  );

  const [condition, setCondition] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [sortBy, setSortBy] = useState("recent");
  const [showFilters, setShowFilters] = useState(false);

  const publishedProducts = useMemo(
    () =>
      firebaseProducts.map((product) => {
        const vehicle = getVehicle(product);

        return {
          ...product,
          id: product.id,
          title: product.title || "Pieza sin título",
          price: Number(product.price) || 0,
          quantity: Number(product.quantity ?? 0),
          category: product.category || "Otros",
          condition: product.condition || "No especificada",
          partNumber: product.partNumber || "",
          description: product.description || "",
          image: getProductImage(product),
          vehicle,
          make: vehicle.make,
          model: vehicle.model,
          year: vehicle.year,
          sellerName: product.sellerName || "Vendedor ECparts",
        };
      }),
    [firebaseProducts]
  );

  const availableMakes = useMemo(
    () =>
      [...new Set(
        publishedProducts
          .map((product) => getVehicle(product).make)
          .filter(Boolean)
      )].sort((a, b) => String(a).localeCompare(String(b))),
    [publishedProducts]
  );

  const availableCategories = useMemo(() => {
    const productCategories = publishedProducts
      .map((product) => product.category)
      .filter(Boolean);

    const savedCategories = (categories || [])
      .map(getCategoryName)
      .filter(Boolean);

    return [...new Set([...savedCategories, ...productCategories])]
      .sort((a, b) => String(a).localeCompare(String(b)));
  }, [publishedProducts]);

  const availableModels = useMemo(
    () =>
      [...new Set(
        publishedProducts
          .filter((product) => {
            const vehicle = getVehicle(product);
            return !make || normalize(vehicle.make) === normalize(make);
          })
          .map((product) => getVehicle(product).model)
          .filter(Boolean)
      )].sort((a, b) => String(a).localeCompare(String(b))),
    [publishedProducts, make]
  );

  const availableYears = useMemo(
    () =>
      [...new Set(
        publishedProducts
          .filter((product) => {
            const vehicle = getVehicle(product);

            return (
              (!make || normalize(vehicle.make) === normalize(make)) &&
              (!model || normalize(vehicle.model) === normalize(model))
            );
          })
          .map((product) => getVehicle(product).year)
          .filter(Boolean)
          .map(String)
      )].sort((a, b) => Number(b) - Number(a)),
    [publishedProducts, make, model]
  );

  const filteredProducts = useMemo(() => {
    let result = [...publishedProducts];

    if (search.trim()) {
      const term = normalize(search);
      result = result.filter((product) =>
        getProductText(product).includes(term)
      );
    }

    if (category) {
      result = result.filter(
        (product) => normalize(product.category) === normalize(category)
      );
    }

    if (make) {
      result = result.filter(
        (product) => normalize(getVehicle(product).make) === normalize(make)
      );
    }

    if (model) {
      result = result.filter(
        (product) => normalize(getVehicle(product).model) === normalize(model)
      );
    }

    if (year) {
      result = result.filter(
        (product) => String(getVehicle(product).year) === String(year)
      );
    }

    if (condition) {
      result = result.filter(
        (product) => normalize(product.condition) === normalize(condition)
      );
    }

    if (minPrice !== "") {
      result = result.filter(
        (product) => product.price >= Number(minPrice)
      );
    }

    if (maxPrice !== "") {
      result = result.filter(
        (product) => product.price <= Number(maxPrice)
      );
    }

    result.sort((a, b) => {
      if (sortBy === "price-low") return a.price - b.price;
      if (sortBy === "price-high") return b.price - a.price;

      if (sortBy === "name") {
        return String(a.title).localeCompare(String(b.title));
      }

      const dateValue = (value) => {
        if (value?.toDate) return value.toDate().getTime();
        if (!value) return 0;

        const timestamp = new Date(value).getTime();
        return Number.isNaN(timestamp) ? 0 : timestamp;
      };

      return dateValue(b.createdAt) - dateValue(a.createdAt);
    });

    return result;
  }, [
    publishedProducts,
    search,
    category,
    make,
    model,
    year,
    condition,
    minPrice,
    maxPrice,
    sortBy,
  ]);

  const activeFiltersCount = [
    category,
    make,
    model,
    year,
    condition,
    minPrice,
    maxPrice,
  ].filter(Boolean).length;

  function updateURL() {
    const params = new URLSearchParams();

    if (search.trim()) params.set("q", search.trim());
    if (category) params.set("categoria", category);
    if (make) params.set("marca", make);
    if (model) params.set("modelo", model);
    if (year) params.set("año", year);

    setSearchParams(params, { replace: true });
  }

  function clearFilters() {
    setSearch("");
    setCategory("");
    setMake("");
    setModel("");
    setYear("");
    setCondition("");
    setMinPrice("");
    setMaxPrice("");
    setSortBy("recent");
    setSearchParams({}, { replace: true });
  }

  function handleSearchSubmit(event) {
    event.preventDefault();
    updateURL();
  }

  return (
    <main className="catalog-page">
      <header className="catalog-hero">
        <div className="catalog-container">
          <button
            type="button"
            className="catalog-back"
            onClick={() => navigate("/")}
          >
            <ArrowLeft size={17} />
            Volver al inicio
          </button>

          <div className="catalog-heading">
            <div className="catalog-heading-copy">
              <span className="catalog-eyebrow">
                ECPARTS MARKETPLACE
              </span>

              <h1>Catálogo de piezas</h1>

              <p>
                Encuentra piezas y accesorios para tu vehículo
                entre los productos publicados por nuestros vendedores.
              </p>
            </div>

            <div className="catalog-counter">
              <span>Piezas disponibles</span>
              <strong>
                {productsLoading ? "…" : filteredProducts.length}
              </strong>
            </div>
          </div>

          <form
            className="catalog-search"
            onSubmit={handleSearchSubmit}
          >
            <div className="catalog-search-input">
              <Search size={20} aria-hidden="true" />

              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Busca por pieza, número, marca o modelo..."
                aria-label="Buscar piezas"
              />

              {search && (
                <button
                  type="button"
                  className="catalog-clear-search"
                  onClick={() => setSearch("")}
                  aria-label="Borrar búsqueda"
                >
                  <X size={18} />
                </button>
              )}
            </div>

            <button className="catalog-search-submit" type="submit">
              Buscar piezas
            </button>

            <button
              className={`catalog-filter-toggle ${
                showFilters ? "is-active" : ""
              }`}
              type="button"
              onClick={() => setShowFilters((value) => !value)}
            >
              <SlidersHorizontal size={18} />
              Filtros
              {activeFiltersCount > 0 && (
                <span>{activeFiltersCount}</span>
              )}
            </button>
          </form>
        </div>
      </header>

      <div className="catalog-container catalog-content">
        <section className="catalog-categories">
          <div className="catalog-section-heading">
            <div>
              <h2>Explorar categorías</h2>
              <p>Encuentra rápidamente el tipo de pieza que necesitas.</p>
            </div>

            {category && (
              <button
                type="button"
                className="catalog-text-button"
                onClick={() => setCategory("")}
              >
                Ver todas
              </button>
            )}
          </div>

          <div className="catalog-category-list">
            <button
              type="button"
              className={`catalog-category-chip ${
                !category ? "is-selected" : ""
              }`}
              onClick={() => setCategory("")}
            >
              Todas las piezas
            </button>

            {availableCategories.map((item) => (
              <button
                type="button"
                key={item}
                onClick={() =>
                  setCategory(item === category ? "" : item)
                }
                className={`catalog-category-chip ${
                  normalize(category) === normalize(item)
                    ? "is-selected"
                    : ""
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        </section>

        {showFilters && (
          <section className="catalog-filter-panel">
            <div className="catalog-filter-heading">
              <h2>
                <SlidersHorizontal size={19} />
                Filtrar resultados
              </h2>

              <button
                type="button"
                className="catalog-icon-button"
                onClick={() => setShowFilters(false)}
                aria-label="Cerrar filtros"
              >
                <X size={20} />
              </button>
            </div>

            <div className="catalog-filter-grid">
              <label>
                <span>Categoría</span>
                <select
                  value={category}
                  onChange={(event) => setCategory(event.target.value)}
                >
                  <option value="">Todas las categorías</option>
                  {availableCategories.map((item) => (
                    <option key={item} value={item}>{item}</option>
                  ))}
                </select>
              </label>

              <label>
                <span>Marca</span>
                <select
                  value={make}
                  onChange={(event) => {
                    setMake(event.target.value);
                    setModel("");
                    setYear("");
                  }}
                >
                  <option value="">Todas las marcas</option>
                  {availableMakes.map((item) => (
                    <option key={item} value={item}>{item}</option>
                  ))}
                </select>
              </label>

              <label>
                <span>Modelo</span>
                <select
                  value={model}
                  onChange={(event) => {
                    setModel(event.target.value);
                    setYear("");
                  }}
                >
                  <option value="">Todos los modelos</option>
                  {availableModels.map((item) => (
                    <option key={item} value={item}>{item}</option>
                  ))}
                </select>
              </label>

              <label>
                <span>Año</span>
                <select
                  value={year}
                  onChange={(event) => setYear(event.target.value)}
                >
                  <option value="">Todos los años</option>
                  {availableYears.map((item) => (
                    <option key={item} value={item}>{item}</option>
                  ))}
                </select>
              </label>

              <label>
                <span>Condición</span>
                <select
                  value={condition}
                  onChange={(event) => setCondition(event.target.value)}
                >
                  <option value="">Cualquier condición</option>
                  <option value="Nueva">Nueva</option>
                  <option value="Usada">Usada</option>
                  <option value="Reacondicionada">Reacondicionada</option>
                </select>
              </label>

              <label>
                <span>Precio mínimo ($)</span>
                <input
                  type="number"
                  min="0"
                  value={minPrice}
                  onChange={(event) => setMinPrice(event.target.value)}
                  placeholder="Ej. 50"
                />
              </label>

              <label>
                <span>Precio máximo ($)</span>
                <input
                  type="number"
                  min="0"
                  value={maxPrice}
                  onChange={(event) => setMaxPrice(event.target.value)}
                  placeholder="Ej. 1000"
                />
              </label>

              <label>
                <span>Ordenar por</span>
                <select
                  value={sortBy}
                  onChange={(event) => setSortBy(event.target.value)}
                >
                  <option value="recent">Más recientes</option>
                  <option value="price-low">Precio: menor a mayor</option>
                  <option value="price-high">Precio: mayor a menor</option>
                  <option value="name">Nombre A–Z</option>
                </select>
              </label>
            </div>

            <div className="catalog-filter-actions">
              <button
                type="button"
                className="catalog-reset-button"
                onClick={clearFilters}
              >
                <RotateCcw size={16} />
                Limpiar filtros
              </button>

              <button
                type="button"
                className="catalog-apply-button"
                onClick={() => {
                  updateURL();
                  setShowFilters(false);
                }}
              >
                Aplicar filtros
              </button>
            </div>
          </section>
        )}

        {productsLoading && (
          <div className="catalog-state">
            <LoaderCircle className="catalog-spinner" size={36} />
            <h2>Cargando piezas...</h2>
            <p>Buscando productos publicados en ECparts.</p>
          </div>
        )}

        {!productsLoading && productsError && (
          <div className="catalog-state catalog-error">
            <AlertCircle size={34} />
            <h2>No pudimos cargar el catálogo</h2>
            <p>
              Verifica la conexión con Firebase, los permisos de Firestore
              y el estado de publicación de los productos.
            </p>
          </div>
        )}

        {!productsLoading && !productsError && (
          <section className="catalog-results">
            <div className="catalog-results-heading">
              <div>
                <h2>
                  {search.trim()
                    ? `Resultados para "${search.trim()}"`
                    : category || "Todas las piezas"}
                </h2>

                <p>
                  {filteredProducts.length}{" "}
                  {filteredProducts.length === 1
                    ? "pieza encontrada"
                    : "piezas encontradas"}
                </p>
              </div>

              {activeFiltersCount > 0 && (
                <button
                  type="button"
                  className="catalog-reset-inline"
                  onClick={clearFilters}
                >
                  <RotateCcw size={15} />
                  Limpiar filtros
                </button>
              )}
            </div>

            {filteredProducts.length > 0 ? (
              <div className="catalog-product-grid">
                {filteredProducts.map((product) => (
                  <FirebaseProductCard
                    key={product.id}
                    product={product}
                  />
                ))}
              </div>
            ) : (
              <div className="catalog-state catalog-empty">
                <div className="catalog-empty-icon">
                  {publishedProducts.length === 0
                    ? <PackageSearch size={32} />
                    : <CarFront size={32} />}
                </div>

                <h2>
                  {publishedProducts.length === 0
                    ? "Todavía no hay piezas publicadas"
                    : "No encontramos piezas con esos filtros"}
                </h2>

                <p>
                  {publishedProducts.length === 0
                    ? "Cuando los vendedores publiquen productos, aparecerán aquí."
                    : "Prueba otra búsqueda o elimina algunos filtros."}
                </p>

                <button
                  type="button"
                  className="catalog-apply-button"
                  onClick={clearFilters}
                >
                  Ver todas las piezas
                </button>
              </div>
            )}
          </section>
        )}
      </div>
    </main>
  );
}
