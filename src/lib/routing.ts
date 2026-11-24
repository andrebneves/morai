// Rota real nas ruas, calculada pelo servidor público de demonstração do OSRM
// (router.project-osrm.org) — gratuito, sem chave de API, mantendo a fase Beta 1.0 só com
// serviços de tier gratuito. Limitação conhecida: é o servidor de demonstração do projeto
// (não tem SLA/garantia de disponibilidade), então todo uso daqui tem fallback silencioso
// pro modo "linha reta" quando a busca falha.
const OSRM_BASE = "https://router.project-osrm.org/route/v1";

export interface RotaPasso {
  distanciaMetros: number;
  instrucao: string;
  nomeRua: string | null;
  tipo: string;
  modificador: string | null;
  local: { lat: number; lng: number };
}

export interface ResultadoRota {
  /** pares [lng, lat], prontos pra virar um LineString no mapa */
  coordenadas: [number, number][];
  passos: RotaPasso[];
  distanciaMetros: number;
  duracaoSegundos: number;
}

function capitalizar(texto: string): string {
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

function traduzirModificador(modifier?: string): string {
  switch (modifier) {
    case "uturn":
      return "faça o retorno";
    case "sharp right":
      return "vire fortemente à direita";
    case "right":
      return "vire à direita";
    case "slight right":
      return "mantenha-se à direita";
    case "slight left":
      return "mantenha-se à esquerda";
    case "left":
      return "vire à esquerda";
    case "sharp left":
      return "vire fortemente à esquerda";
    case "straight":
    default:
      return "siga em frente";
  }
}

function traduzirManobra(tipo: string, modificador: string | undefined, nomeRua: string | null): string {
  const rua = nomeRua ? ` na ${nomeRua}` : "";
  switch (tipo) {
    case "depart":
      return "Siga em frente para iniciar o trajeto";
    case "arrive":
      return "Você chegou ao seu destino";
    case "roundabout":
    case "rotary":
      return `Entre na rotatória${rua}`;
    case "exit roundabout":
    case "exit rotary":
      return `Saia da rotatória${rua}`;
    case "merge":
      return `Siga${rua}`;
    case "fork":
    case "end of road":
    case "turn":
      return `${capitalizar(traduzirModificador(modificador))}${rua}`;
    case "new name":
    case "continue":
      return modificador && modificador !== "straight"
        ? `${capitalizar(traduzirModificador(modificador))}${rua}`
        : `Continue${rua}`;
    default:
      return `${capitalizar(traduzirModificador(modificador))}${rua}`;
  }
}

interface OsrmStep {
  distance: number;
  name: string;
  maneuver: { type: string; modifier?: string; location: [number, number] };
}

interface OsrmResponse {
  code: string;
  routes?: Array<{
    distance: number;
    duration: number;
    geometry: { coordinates: [number, number][] };
    legs: Array<{ steps: OsrmStep[] }>;
  }>;
}

export async function buscarRota(
  origem: { lat: number; lng: number },
  destino: { lat: number; lng: number },
  modo: "pe" | "carro",
): Promise<ResultadoRota | null> {
  const profile = modo === "pe" ? "foot" : "driving";
  const url = `${OSRM_BASE}/${profile}/${origem.lng},${origem.lat};${destino.lng},${destino.lat}?geometries=geojson&steps=true&overview=full`;

  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const data: OsrmResponse = await res.json();
    if (data.code !== "Ok" || !data.routes?.[0]) return null;

    const route = data.routes[0];
    const steps = route.legs.flatMap((leg) => leg.steps);

    const passos: RotaPasso[] = steps.map((s) => ({
      distanciaMetros: s.distance,
      instrucao: traduzirManobra(s.maneuver.type, s.maneuver.modifier, s.name || null),
      nomeRua: s.name || null,
      tipo: s.maneuver.type,
      modificador: s.maneuver.modifier ?? null,
      local: { lat: s.maneuver.location[1], lng: s.maneuver.location[0] },
    }));

    return {
      coordenadas: route.geometry.coordinates,
      passos,
      distanciaMetros: route.distance,
      duracaoSegundos: route.duration,
    };
  } catch {
    return null;
  }
}
