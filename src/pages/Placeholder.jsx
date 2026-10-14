
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Construction, Wrench } from "lucide-react";
import Header from "../components/Header";
import Account from "./Account.jsx";
import SellerEditor from "./SellerEditor.jsx";


const content = {
  catalogo: [
    "Catálogo de piezas",
    "Aquí estarán los filtros avanzados, resultados y búsqueda completa del inventario.",
  ],
  vender: [
    "Vende en ECparts",
    "Registro de junkers y vendedores particulares, perfil, verificación y publicación de inventario.",
  ],
  carrito: [
    "Tu carrito",
    "Las piezas que elijas para comprar se mostrarán aquí.",
  ],
  pieza: [
    "Detalles de la pieza",
    "Galería, compatibilidad, información del vendedor, compra directa y solicitud de cotización.",
  ],
  notfound: [
    "Página no encontrada",
    "No pudimos encontrar la página que buscas.",
  ],
};

export default function Placeholder({ page }) {
  if (page === "cuenta") {
    return <Account />;
  }
if (page === "vender") {
  return <SellerEditor />;
}
  const params = useParams();
  const [title, description] = content[page] || content.notfound;

  return (
    <>
      <Header />
      <main className="placeholder-page">
        <div className="placeholder-card">
          <span className="placeholder-icon">
            <Construction size={30} />
          </span>
          <span className="section-kicker">ECparts · EN DESARROLLO</span>
          <h1>
            {page === "pieza"
              ? `Pieza ${params.id || ""}`
              : title}
          </h1>
          <p>{description}</p>
          <Link className="cta-button" to="/">
            <ArrowLeft size={17} /> Volver al inicio
          </Link>
        </div>
      </main>
      <footer className="site-footer">
        <Link className="brand footer-brand" to="/">
          <span className="brand-mark">
            <Wrench size={20} />
          </span>
          <span>
            EC<span>parts</span>
            <small>PUERTO RICO</small>
          </span>
        </Link>
        <span>© {new Date().getFullYear()} ECparts</span>
      </footer>
    </>
  );
}
