// Development seed data for offline testing of reports and contact flow
export function seedLocalData() {
  try {
    // Seed users
    const users = [
      { id: 1, firstName: "Ana", lastName: "Gomez", phone: "3001234567", password: "Pass123" },
      { id: 2, firstName: "Luis", lastName: "Perez", phone: "3007654321", password: "Pass123" },
      { id: 3, firstName: "Carla", lastName: "Santos", phone: "3009988776", password: "Pass123" },
      { id: 4, firstName: "Jorge", lastName: "Ramirez", phone: "3005566778", password: "Pass123" },
      { id: 5, firstName: "María", lastName: "Lopez", phone: "3004433221", password: "Pass123" },
    ];
    localStorage.setItem("rdp_usuarios", JSON.stringify(users));

    // set last login to first user for quick testing (you can still login via /login)
    localStorage.setItem("rdp_last_login", JSON.stringify({ phone: users[0].phone, at: new Date().toISOString() }));

    // Seed mascotas (reports) - these are shaped similarly to what principalService expects
    const mascotas = [
      {
        id: "m-1",
        nombre: "Firulais",
        tipo: "Perro",
        estado: "PERDIDO",
        descripcion: "Perro pequeño, color marrón, responde al nombre Firulais.",
        fecha_publicacion: new Date().toISOString(),
        lugar_desaparicion: "Parque Lleras, El Poblado, Medellín",
        latitud: 6.2126,
        longitud: -75.5678,
        imagen_url: "/assets/mascotas/perro1.png",
        thumbnail_url: "/assets/mascotas/perro1.png",
        telefono: "3001234567",
        propietario: "Ana Gomez",
      },
      {
        id: "m-2",
        nombre: "Mishi",
        tipo: "Gato",
        estado: "ENCONTRADO",
        descripcion: "Gata blanca encontrada cerca de la Universidad de Antioquia.",
        fecha_publicacion: new Date().toISOString(),
        lugar_desaparicion: "Ciudad Universitaria, Medellín",
        latitud: 6.2675,
        longitud: -75.5670,
        imagen_url: "/assets/mascotas/gato1.png",
        thumbnail_url: "/assets/mascotas/gato1.png",
        telefono: "3007654321",
        propietario: "Luis Perez",
      },
      {
        id: "m-3",
        nombre: "Chispa",
        tipo: "Perro",
        estado: "PERDIDO",
        descripcion: "Perro mediano color negro, last seen near Parque de la 93.",
        fecha_publicacion: new Date().toISOString(),
        lugar_desaparicion: "Parque de la 93, Envigado (zona aledaña)",
        latitud: 6.2001,
        longitud: -75.5743,
        imagen_url: "/assets/mascotas/perro2.png",
        thumbnail_url: "/assets/mascotas/perro2.png",
        telefono: "3009988776",
        propietario: "Carla Santos",
      },
      {
        id: "m-4",
        nombre: "Luna",
        tipo: "Gata",
        estado: "PERDIDO",
        descripcion: "Gata atigrada, responde al nombre Luna, vista en Laureles.",
        fecha_publicacion: new Date().toISOString(),
        lugar_desaparicion: "Laureles, Medellín",
        latitud: 6.2470,
        longitud: -75.5900,
        imagen_url: "/assets/mascotas/gato2.png",
        thumbnail_url: "/assets/mascotas/gato2.png",
        telefono: "3005566778",
        propietario: "Jorge Ramirez",
      },
      {
        id: "m-5",
        nombre: "Rocky",
        tipo: "Perro",
        estado: "ENCONTRADO",
        descripcion: "Cachorro encontrado cerca del barrio Buenos Aires.",
        fecha_publicacion: new Date().toISOString(),
        lugar_desaparicion: "Buenos Aires, Medellín",
        latitud: 6.2275,
        longitud: -75.5654,
        imagen_url: "/assets/mascotas/perro3.png",
        thumbnail_url: "/assets/mascotas/perro3.png",
        telefono: "3004433221",
        propietario: "María Lopez",
      },
    ];
    localStorage.setItem("rdp_mascotas", JSON.stringify(mascotas));

    console.info("Seeded local dev data: users and mascotas");
  } catch (e) {
    console.warn("Failed to seed local data", e);
  }
}

export default seedLocalData;

// Expose seed function to the window for manual invocation in any environment
try {
  if (typeof window !== "undefined") {
    (window as any).seedLocalData = seedLocalData;
  }
} catch (e) {
  // ignore
}
