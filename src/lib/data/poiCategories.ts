import type { POICategory } from "@/lib/types";

export interface POICategoryDef {
  categoria: POICategory;
  label: string;
  /** pares chave/valor OSM combinados com OR na consulta Overpass */
  osmTags: [string, string][];
}

export const POI_CATEGORIES: POICategoryDef[] = [
  { categoria: "farmacia", label: "Farmácias", osmTags: [["amenity", "pharmacy"]] },
  { categoria: "supermercado", label: "Supermercados", osmTags: [["shop", "supermarket"]] },
  { categoria: "mercadinho", label: "Mercadinhos", osmTags: [["shop", "convenience"]] },
  { categoria: "padaria", label: "Padarias", osmTags: [["shop", "bakery"]] },
  { categoria: "escola", label: "Escolas", osmTags: [["amenity", "school"]] },
  { categoria: "creche", label: "Creches", osmTags: [["amenity", "kindergarten"]] },
  { categoria: "hospital", label: "Hospitais", osmTags: [["amenity", "hospital"]] },
  { categoria: "clinica", label: "Clínicas", osmTags: [["amenity", "clinic"]] },
  { categoria: "academia", label: "Academias", osmTags: [["leisure", "fitness_centre"]] },
  { categoria: "restaurante", label: "Restaurantes", osmTags: [["amenity", "restaurant"]] },
  { categoria: "cafeteria", label: "Cafeterias", osmTags: [["amenity", "cafe"]] },
  { categoria: "shopping", label: "Shoppings", osmTags: [["shop", "mall"]] },
  { categoria: "ponto_onibus", label: "Pontos de ônibus", osmTags: [["highway", "bus_stop"]] },
  { categoria: "ponto_taxi", label: "Pontos de táxi", osmTags: [["amenity", "taxi"]] },
  { categoria: "posto_combustivel", label: "Postos de combustível", osmTags: [["amenity", "fuel"]] },
  { categoria: "banco", label: "Bancos", osmTags: [["amenity", "bank"]] },
  { categoria: "praca", label: "Praças", osmTags: [["place", "square"]] },
  { categoria: "parque", label: "Parques", osmTags: [["leisure", "park"]] },
  { categoria: "praia", label: "Praias", osmTags: [["natural", "beach"]] },
  { categoria: "pet_shop", label: "Pet shops", osmTags: [["shop", "pet"]] },
  { categoria: "veterinario", label: "Veterinários", osmTags: [["amenity", "veterinary"]] },
  { categoria: "estacionamento", label: "Estacionamentos", osmTags: [["amenity", "parking"]] },
];

export function findPOICategory(categoria: POICategory): POICategoryDef | undefined {
  return POI_CATEGORIES.find((c) => c.categoria === categoria);
}
