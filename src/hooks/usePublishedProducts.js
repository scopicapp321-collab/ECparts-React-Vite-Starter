
import { useEffect, useState } from "react";
import {
  collection,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";

import { db } from "../firebase";

export function usePublishedProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const productsQuery = query(
      collection(db, "products"),
      where("status", "==", "published")
    );

    const unsubscribe = onSnapshot(
      productsQuery,
      (snapshot) => {
        const publishedProducts = snapshot.docs.map((document) => {
          const data = document.data();

          const vehicle =
            data.vehicle && typeof data.vehicle === "object"
              ? data.vehicle
              : {};

          const make = vehicle.make || data.make || "";
          const model = vehicle.model || data.model || "";
          const year = vehicle.year || data.year || "";

          const vehicleLabel = [
            make,
            model,
            year,
          ]
            .filter(Boolean)
            .join(" ");

          const images = Array.isArray(data.images)
            ? data.images
            : [];

          return {
            id: document.id,
            ...data,

            // Datos normalizados para las tarjetas y el catálogo.
            title: data.title || "Pieza sin título",
            price: Number(data.price || 0),
            quantity: Number(data.quantity || 0),
            category: data.category || "Otras piezas",
            condition: data.condition || "No especificada",

            images,
            image:
              images[0] ||
              data.image ||
              data.imageUrl ||
              "",

            // Conservamos el objeto original para filtrar
            // correctamente por marca, modelo y año.
            vehicle: data.vehicle || vehicleLabel,
            make,
            model,
            year,

            sellerName:
              data.sellerName ||
              data.seller ||
              "Vendedor ECparts",

            seller: data.sellerName || data.seller || "Vendedor ECparts",
            isFirebaseProduct: true,
          };
        });

        setProducts(publishedProducts);
        setError(null);
        setLoading(false);
      },
      (firebaseError) => {
        console.error(
          "Error al cargar productos publicados:",
          firebaseError
        );

        setError(firebaseError);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  return {
    products,
    loading,
    error,
  };
}

// También permite importarlo como exportación predeterminada.
export default usePublishedProducts;
