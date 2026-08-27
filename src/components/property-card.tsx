import { MapPin, BedDouble, Bath, Maximize, ArrowRight } from "lucide-react";
import { Link } from "@tanstack/react-router";
import type { Property } from "@/lib/properties";
import { GlassCard } from "@/components/cards";
import { getListingBadgeColor } from "@/lib/properties";

export function PropertyCard({ property }: { property: Property }) {
  return (
    <Link to="/imoveis/$id" params={{ id: property.id }} className="block">
      <GlassCard interactive className="group overflow-hidden">
        {/* Image area */}
        <div className="relative h-48 w-full overflow-hidden">
          <img
            src={property.image}
            alt={property.title}
            loading="lazy"
            width={800}
            height={600}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          {/* Listing type badge */}
          <span
            className={`absolute left-3 top-3 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wide shadow-lg ${getListingBadgeColor(property.listingType)}`}
          >
            {property.listingLabel}
          </span>
          {/* Featured badge */}
          {property.featured && (
            <span className="absolute right-3 top-3 rounded-full bg-gold px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-gold-foreground shadow-gold">
              Destaque
            </span>
          )}
          {/* Gradient overlay at bottom for readability */}
          <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/50 to-transparent" />
        </div>

        {/* Content */}
        <div className="p-4">
          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {property.kindLabel}
          </p>
          <h3 className="mb-1 font-display text-base font-bold leading-snug text-foreground">
            {property.title}
          </h3>
          <p className="mb-3 flex items-center gap-1.5 text-xs text-muted-foreground">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-primary-vibrant" />
            <span className="truncate">{property.address}</span>
          </p>

          {/* Specs */}
          <div className="mb-3 flex items-center gap-4 text-xs text-muted-foreground">
            {typeof property.bedrooms === "number" && (
              <span className="flex items-center gap-1">
                <BedDouble className="h-3.5 w-3.5" />
                {property.bedrooms} {property.bedrooms === 1 ? "quarto" : "quartos"}
              </span>
            )}
            {typeof property.bathrooms === "number" && (
              <span className="flex items-center gap-1">
                <Bath className="h-3.5 w-3.5" />
                {property.bathrooms} {property.bathrooms === 1 ? "banheiro" : "banheiros"}
              </span>
            )}
            {typeof property.areaM2 === "number" && (
              <span className="flex items-center gap-1">
                <Maximize className="h-3.5 w-3.5" />
                {property.areaM2} m²
              </span>
            )}
          </div>

          {/* Price + CTA */}
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-xs text-muted-foreground">{property.listingLabel}</p>
              <p className="font-display text-lg font-bold tracking-tight text-foreground">
                {property.price}
              </p>
            </div>
            <button className="gradient-brand flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold text-primary-foreground shadow-elegant transition-all active:scale-95">
              Ver imóvel
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </GlassCard>
    </Link>
  );
}
