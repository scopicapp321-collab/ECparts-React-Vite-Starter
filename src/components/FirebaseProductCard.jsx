
import { Link } from "react-router-dom";
import {
  ImageOff,
  MapPin,
  Package,
  ArrowUpRight,
} from "lucide-react";

export default function FirebaseProductCard({ product }) {
  const image =
    product.image ||
    product.images?.[0] ||
    product.imageUrl ||
    "";

  const vehicle = (() => {
    if (product.vehicle && typeof product.vehicle === "object") {
      const { make, model, year } = product.vehicle;

      return [make, model, year].filter(Boolean).join(" ");
    }

    if (typeof product.vehicle === "string" && product.vehicle.trim()) {
      return product.vehicle;
    }

    return [product.make, product.model, product.year]
      .filter(Boolean)
      .join(" ");
  })();

  const seller =
    product.sellerName ||
    product.seller ||
    "Vendedor ECparts";

  const quantity = Number(product.quantity ?? 0);
  const price = Number(product.price ?? 0);
  const available = quantity > 0;

  const formatPrice = (value) =>
    value.toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
    });

  return (
    <article className="firebase-product-card group flex h-full flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white transition duration-200 hover:-translate-y-1 hover:shadow-lg">
      {/* Imagen y condición */}
      <Link
        to={`/pieza/${product.id}`}
        className="firebase-product-image relative block aspect-[4/3] overflow-hidden bg-gray-100"
        aria-label={`Ver ${product.title || "pieza"}`}
      >
        {image ? (
          <img
            src={image}
            alt={product.title || "Pieza de automóvil"}
            loading="lazy"
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="firebase-product-no-image flex h-full flex-col items-center justify-center gap-2 text-gray-400">
            <ImageOff size={32} />
            <span className="text-sm">Sin fotografía</span>
          </div>
        )}

        <span className="firebase-product-condition absolute left-3 top-3 rounded-full bg-white px-3 py-1 text-xs font-bold text-gray-800 shadow-sm">
          {product.condition || "Pieza"}
        </span>

        {!available && (
          <span className="absolute bottom-3 left-3 rounded-full bg-red-600 px-3 py-1 text-xs font-bold text-white">
            Agotado
          </span>
        )}
      </Link>

      {/* Información del producto */}
      <div className="firebase-product-body flex flex-1 flex-col p-4">
        <span className="firebase-product-category text-xs font-bold uppercase tracking-wider text-orange-600">
          {product.category || "Otras piezas"}
        </span>

        <Link
          to={`/pieza/${product.id}`}
          className="firebase-product-title mt-2 line-clamp-2 text-base font-bold text-gray-900 transition hover:text-orange-600"
        >
          {product.title || "Pieza sin título"}
        </Link>

        <p className="firebase-product-vehicle mt-3 flex items-start gap-2 text-sm text-gray-600">
          <Package size={16} className="mt-0.5 shrink-0" />
          <span>
            {vehicle || "Compatibilidad por confirmar"}
          </span>
        </p>

        {product.partNumber && (
          <p className="mt-2 text-xs text-gray-500">
            Número de pieza:{" "}
            <span className="font-semibold text-gray-700">
              {product.partNumber}
            </span>
          </p>
        )}

        <p className="firebase-product-seller mt-2 flex items-center gap-2 text-sm text-gray-500">
          <MapPin size={15} className="shrink-0" />
          <span className="truncate">{seller}</span>
        </p>

        {/* Precio y disponibilidad */}
        <div className="firebase-product-bottom mt-auto flex items-end justify-between gap-3 border-t border-gray-100 pt-4 mt-4">
          <div>
            <span className="mb-1 block text-xs text-gray-500">
              Precio
            </span>
            <strong className="text-xl font-black text-gray-900">
              {formatPrice(price)}
            </strong>
          </div>

          <span
            className={`text-right text-xs font-semibold ${
              available ? "text-green-700" : "text-red-600"
            }`}
          >
            {available
              ? `${quantity} disponible${quantity === 1 ? "" : "s"}`
              : "Agotado"}
          </span>
        </div>

        {/* Acceso a los detalles */}
        <Link
          className="firebase-product-link mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 py-3 text-sm font-bold text-white transition hover:bg-orange-600"
          to={`/pieza/${product.id}`}
        >
          Ver detalles
          <ArrowUpRight size={17} />
        </Link>
      </div>
    </article>
  );
}
