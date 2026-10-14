import { MapPin, ShieldCheck, ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";
import { money } from "../data/parts";

export default function PartCard({ part }) {
  return (
    <article className="part-card">
      <Link to={`/pieza/${part.id}`} className="part-image-wrap" aria-label={`Ver ${part.title}`}>
        <img src={part.image} alt={part.title} className="part-image" loading="lazy" />
        <span className={part.mode === "buy" ? "listing-tag tag-buy" : "listing-tag tag-quote"}>
          {part.mode === "buy" ? "Compra directa" : "Cotización"}
        </span>
        <span className="image-arrow"><ArrowUpRight size={18} /></span>
      </Link>
      <div className="part-info">
        <div className="part-price-row">
          <strong>{money(part.price)}</strong>
          <span className="condition">{part.condition.split(" · ")[0]}</span>
        </div>
        <Link to={`/pieza/${part.id}`} className="part-title">{part.title}</Link>
        <p className="fitment">{part.vehicle}</p>
        <div className="seller-line">
          <span className="seller-name">{part.verified && <ShieldCheck size={14} />} {part.seller}</span>
          <span className="location"><MapPin size={13} />{part.location}</span>
        </div>
      </div>
    </article>
  );
}