import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { Menu, Search, ShoppingCart, Store, UserRound, X, Wrench } from "lucide-react";

export default function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="site-header">
      <div className="header-inner">
        <Link className="brand" to="/" aria-label="ECpartz inicio" onClick={() => setOpen(false)}>
          <span className="brand-mark"><Wrench size={22} strokeWidth={2.7} /></span>
          <span>EC<span>partZ</span><small>PUERTO RICO</small></span>
        </Link>
        <form className="header-search" action="/catalogo">
          <Search size={18} />
          <input name="q" placeholder="Busca una pieza, marca o modelo..." aria-label="Buscar piezas" />
          <button type="submit">Buscar</button>
        </form>
        <nav className={open ? "main-nav nav-open" : "main-nav"}>
          <NavLink to="/catalogo" onClick={() => setOpen(false)}>Explorar piezas</NavLink>
          <NavLink to="/vender" onClick={() => setOpen(false)}>Vender</NavLink>
          <Link className="nav-account" to="/cuenta" onClick={() => setOpen(false)}><UserRound size={18} /> Mi cuenta</Link>
          <Link className="cart-link" to="/carrito" aria-label="Carrito" onClick={() => setOpen(false)}><ShoppingCart size={20} /><span>0</span></Link>
        </nav>
        <button className="mobile-menu" onClick={() => setOpen(!open)} aria-label={open ? "Cerrar menú" : "Abrir menú"}>
          {open ? <X /> : <Menu />}
        </button>
      </div>
    </header>
  );
}