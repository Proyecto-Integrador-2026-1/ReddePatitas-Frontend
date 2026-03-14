import React from "react";
import { useNavigate, Link } from "react-router-dom";
import { Avatar, Badge, Button, Chip, PetCard, Pet, SideNav } from "./ui";

const assets = {
  map: "/assets/mapa.png",
  hero: "/assets/mapa-hero.png",
  reporter: "/assets/reporter.png",
  max: "/assets/max.png",
  rocky: "/assets/rocky.png",
  gato: "/assets/gato.png",
};

const navItems = [
  { label: "Mapa Principal", active: true, icon: <span className="h-5 w-5 rounded-full bg-[#8c7851]" /> },
  { label: "Publicar Mascota", icon: <span className="h-5 w-5 rounded-full border border-[#8c7851]" /> },
  { label: "Mis Reportes", count: 3, icon: <span className="h-5 w-5 rounded-full bg-[#e5e7eb]" /> },
  { label: "Notificaciones", icon: <span className="h-5 w-5 rounded-full bg-[#e5e7eb]" /> },
  { label: "Mi Perfil", icon: <span className="h-5 w-5 rounded-full bg-[#e5e7eb]" /> },
  { label: "Configuración", icon: <span className="h-5 w-5 rounded-full bg-[#e5e7eb]" /> },
];

const pets: Pet[] = [
  {
    name: "Max",
    status: "PERDIDO",
    description: "Golden Retriever, collar rojo. Visto cerca del parque central.",
    time: "Hace 2h",
    location: "Av. Reforma 123",
    image: assets.max,
  },
  {
    name: "Rocky",
    status: "PERDIDO",
    description: "Bulldog francés, muy asustadizo. Tiene una mancha en el ojo.",
    time: "Hace 4h",
    location: "Calle 5 de Mayo",
    image: assets.rocky,
    highlight: true,
  },
  {
    name: "Sin Nombre",
    status: "ENCONTRADO",
    description: "Gato atigrado encontrado en jardín. Parece doméstico.",
    time: "Ayer",
    location: "Colonia Roma Norte",
    image: assets.gato,
  },
];

const hero = {
  name: "Rocky",
  location: "Calle 5 de Mayo, Centro",
  status: "PERDIDO",
  summary: [
    "Se perdió ayer por la tarde cuando dejamos la puerta abierta.",
    "Es muy amigable pero asustadizo con los ruidos fuertes.",
    "Tiene una mancha característica en el ojo derecho y lleva un collar azul sin placa.",
    "Por favor, si lo ven, avísenme. ¡Lo extrañamos mucho!",
  ],
  stats: [
    { label: "Raza", value: "Bulldog" },
    { label: "Edad", value: "2 Años" },
    { label: "Sexo", value: "Macho" },
  ],
  rating: 4.8,
  reporter: {
    name: "Miguel Ángel",
    avatar: assets.reporter,
  },
};

const markers = [
  { id: "marker-max", label: "Max", status: "Perdido", x: "12%", y: "38%", image: assets.max },
  { id: "marker-rocky", label: "Rocky", status: "Perdido", x: "42%", y: "55%", image: assets.rocky },
  { id: "marker-gato", label: "Sin Nombre", status: "Encontrado", x: "62%", y: "32%", image: assets.gato },
];

export function MapaPrincipal() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-[#f5f1ea] text-[#020826]">
      <div className="mx-auto flex w-full max-w-[1380px] gap-6 px-6 py-8">
        <aside className="w-[260px] rounded-3xl border border-[#e5e7eb] bg-white/90 p-6 shadow-[0px_25px_50px_rgba(0,0,0,0.1)]">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#020826] text-white">🐾</div>
            <p className="text-xl font-bold">Red de Patitas</p>
          </div>
          <SideNav items={navItems} />
        </aside>

        <div className="relative flex-1 overflow-hidden rounded-3xl border border-[#e5e7eb] bg-[#f9f4ef] shadow-[0px_20px_50px_rgba(0,0,0,0.15)]">
          <div className="absolute inset-0">
            <img src={assets.map} alt="Mapa de Medellín" className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#f9f4ef]/60 to-[#f9f4ef]" />
          </div>

          <div className="absolute inset-x-6 top-6 z-10 flex items-center gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-4 rounded-2xl border border-[#e5e7eb] bg-white/90 px-4 py-2 shadow-sm">
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="7" cy="7" r="5.5" stroke="#8c7851" strokeWidth="1.5" />
                  <path d="M11.2 11.2L16 16" stroke="#8c7851" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
                <input
                  className="w-full bg-transparent text-sm font-medium text-[#716040] placeholder:text-[#b7a888] focus:outline-none"
                  placeholder="Buscar zona, calle o ciudad..."
                  type="search"
                />
                </div>
            </div>
            <div className="flex items-center gap-2">
              <Link to="/login">
                <Button variant="solid" size="md" onClick={() => navigate("/login")} className="z-20 pointer-events-auto">
                  Acceder
                </Button>
              </Link>
              <Link to="/reportar">
                <Button variant="solid" size="md" onClick={() => navigate("/reportar")} className="z-20 pointer-events-auto">
                  Reportar Mascota
                </Button>
              </Link>
            </div>
          </div>

          <div className="absolute top-6 right-6 z-10 flex items-center gap-3">
            <Chip active icon={<span className="h-3 w-3 rounded-full bg-white" />}>
              Perros
            </Chip>
            <Chip icon={<span className="h-3 w-3 rounded-full bg-[#f25042]" />}>Gatos</Chip>
            <Chip icon={<span className="h-3 w-3 rounded-full bg-[#020826]" />}>Recientes</Chip>
          </div>

          <div className="absolute left-10 top-32 z-10 space-y-4">
            {pets.map((pet) => (
              <PetCard key={pet.name} pet={pet} />
            ))}
            <div className="rounded-2xl border border-dashed border-[#e5e7eb] bg-white/70 p-4 text-sm text-[#716040]">
              Cargando más reportes...
            </div>
          </div>

          {markers.map((marker) => (
            <div
              key={marker.id}
              className="pointer-events-none absolute z-10 flex flex-col items-center gap-2 rounded-3xl text-center shadow-[0px_8px_20px_rgba(0,0,0,0.15)]"
              style={{ left: marker.x, top: marker.y, transform: "translate(-50%, -50%)" }}
            >
              <div className="flex flex-col items-center gap-1 rounded-3xl border border-white bg-white p-2">
                <div className="h-16 w-16 overflow-hidden rounded-2xl">
                  <img src={marker.image} alt={marker.label} className="h-full w-full object-cover" />
                </div>
                <Badge tone={marker.status === "Perdido" ? "warning" : "success"}>{marker.status}</Badge>
              </div>
              <p className="text-xs font-semibold text-[#020826]">{marker.label}</p>
            </div>
          ))}

          <div className="absolute right-10 top-32 z-10 w-[360px] space-y-6">
            <div className="rounded-[32px] border border-[#e5e7eb] bg-white p-5 shadow-[0px_20px_35px_rgba(0,0,0,0.15)]">
              <div className="relative h-[220px] overflow-hidden rounded-[28px]">
                <img src={assets.hero} alt="Rocky" className="h-full w-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <div className="absolute inset-0 flex flex-col justify-end p-4 text-white">
                  <p className="text-2xl font-bold">{hero.name}</p>
                  <p className="text-sm">{hero.location}</p>
                  <Badge tone="warning" className="mt-3 self-start">
                    {hero.status}
                  </Badge>
                </div>
              </div>

              <div className="mt-5 flex gap-3">
                {hero.stats.map((stat) => (
                  <div key={stat.label} className="flex-1 rounded-2xl border border-[#e5e7eb] bg-[#f9f6ef] p-3 text-sm">
                    <p className="text-xs text-[#716040]">{stat.label}</p>
                    <p className="font-semibold text-[#020826]">{stat.value}</p>
                  </div>
                ))}
              </div>

              <div className="mt-6 space-y-2 text-sm text-[#716040]">
                {hero.summary.map((line) => (
                  <p key={line}>{line}</p>
                ))}
              </div>

              <div className="mt-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar src={hero.reporter.avatar} alt={hero.reporter.name} />
                  <div>
                    <p className="text-sm font-semibold text-[#020826]">Reportado por</p>
                    <p className="text-base font-bold text-[#020826]">{hero.reporter.name}</p>
                    <p className="text-xs text-[#716040]">({hero.rating} ⭐️)</p>
                  </div>
                </div>
                <div className="flex flex-col items-end text-xs text-[#8c7851]">
                  <span>Reputación</span>
                  <span className="text-lg font-bold">4.8</span>
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <Button variant="solid" size="md" className="flex-1">
                  Contactar
                </Button>
                <Button variant="outline" size="md" className="flex-1">
                  Compartir
                </Button>
              </div>

              <Button variant="ghost" size="md" className="mt-4 w-full">
                Ver ruta
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MapaPrincipal;
