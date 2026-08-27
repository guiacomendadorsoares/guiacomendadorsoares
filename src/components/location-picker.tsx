import { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Button } from "@/components/ui/button";
import { Loader2, MapPin, Search } from "lucide-react";
import { toast } from "sonner";
import { geocodeAddress } from "@/lib/geocode";

// Fix default marker icon paths (Vite bundling breaks them otherwise)
const icon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const DEFAULT_CENTER: [number, number] = [-22.7711, -43.4196]; // Comendador Soares, Nova Iguaçu

interface Props {
  lat: number | null;
  lng: number | null;
  address?: string;
  onChange: (coords: { lat: number; lng: number } | null) => void;
}

function Recenter({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], Math.max(map.getZoom(), 15));
  }, [lat, lng, map]);
  return null;
}

export function LocationPicker({ lat, lng, address, onChange }: Props) {
  const [busy, setBusy] = useState(false);
  const markerRef = useRef<L.Marker | null>(null);
  const hasCoords =
    typeof lat === "number" && typeof lng === "number" && !isNaN(lat) && !isNaN(lng);
  const center: [number, number] = hasCoords ? [lat!, lng!] : DEFAULT_CENTER;

  async function handleGeocode() {
    if (!address?.trim()) {
      toast.error("Informe o endereço antes de buscar no mapa.");
      return;
    }
    setBusy(true);
    try {
      const r = await geocodeAddress(address);
      if (!r) {
        toast.error("Endereço não encontrado. Ajuste o marcador manualmente.");
        return;
      }
      onChange({ lat: r.lat, lng: r.lng });
      toast.success("Localização encontrada");
    } catch {
      toast.error("Falha ao buscar no mapa.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" size="sm" variant="outline" onClick={handleGeocode} disabled={busy}>
          {busy ? (
            <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
          ) : (
            <Search className="mr-1 h-3.5 w-3.5" />
          )}
          Buscar pelo endereço
        </Button>
        {hasCoords && (
          <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
            <MapPin className="h-3 w-3" /> {lat!.toFixed(6)}, {lng!.toFixed(6)}
          </span>
        )}
      </div>
      <div className="h-64 w-full overflow-hidden rounded-lg border border-border">
        <MapContainer
          center={center}
          zoom={hasCoords ? 16 : 13}
          className="h-full w-full"
          scrollWheelZoom
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {hasCoords && (
            <>
              <Recenter lat={lat!} lng={lng!} />
              <Marker
                position={[lat!, lng!]}
                draggable
                icon={icon}
                ref={(m) => {
                  markerRef.current = m;
                }}
                eventHandlers={{
                  dragend: () => {
                    const m = markerRef.current;
                    if (!m) return;
                    const p = m.getLatLng();
                    onChange({ lat: p.lat, lng: p.lng });
                  },
                }}
              />
            </>
          )}
        </MapContainer>
      </div>
      <p className="text-[11px] text-muted-foreground">
        Arraste o marcador para ajustar a posição exata.
      </p>
    </div>
  );
}
