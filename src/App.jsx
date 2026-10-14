
import { Routes, Route } from "react-router-dom";

import Home from "./pages/Home.jsx";
import Catalog from "./pages/Catalog.jsx";
import PartDetails from "./pages/PartDetails.jsx";
import Placeholder from "./pages/Placeholder.jsx";
import Cart from "./pages/Cart";
export default function App() {
  return (
    <Routes>
      {/* Página principal */}
      <Route path="/" element={<Home />} />

      {/* Catálogo conectado a Firestore */}
      <Route path="/catalogo" element={<Catalog />} />

      {/* Publicar piezas */}
      <Route
        path="/vender"
        element={<Placeholder page="vender" />}
      />

      {/* Cuenta del usuario */}
      <Route
        path="/cuenta"
        element={<Placeholder page="cuenta" />}
      />

      {/* Carrito de compras */}
    <Route path="/carrito" element={<Cart />} />

      {/* Detalles de cada pieza */}
      <Route
        path="/pieza/:id"
        element={<PartDetails />}
      />

      {/* Rutas no encontradas */}
      <Route
        path="*"
        element={<Placeholder page="notfound" />}
      />
    </Routes>
  );
}
