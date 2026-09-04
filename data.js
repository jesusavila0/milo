/* =========================================================================
   data.js
   -------------------------------------------------------------------------
   "Base de datos" de la aplicación Rated Games.

   Cada juego es un objeto con la siguiente forma:
   {
     id:        string único (slug del título)
     titulo:    string
     portada:   URL de la imagen de portada
     genero:    string
     anio:      number
     notas: {
       metacritic: number (0-100) | null   -> Bloque 1 (automático)
       ign:        number (0-10)  | null   -> Bloque 1 (automático)
       steam:      number (0-100) | null   -> Bloque 1 (automático, % positivas)
     },
     opiniones: {
       milo:   number (0-10) | null        -> Bloque 2 (personalizado)
       jesus:  number (0-10) | null        -> Bloque 2 (personalizado)
     },
     nuevo: boolean  -> true solo para juegos recién agregados por el buscador
                        (se usa para mostrar la cinta "Nuevo" y la animación
                        de entrada especial)
   }

   Cuando "opiniones.milo" u "opiniones.jesus" es null, la interfaz debe
   mostrar el estado "Pendiente" en vez de una nota.
   ========================================================================= */

const gamesDatabase = [
  {
    id: "elden-ring",
    titulo: "Elden Ring",
    portada: "https://picsum.photos/seed/elden-ring/500/700",
    genero: "RPG de mundo abierto",
    anio: 2022,
    notas: { metacritic: 96, ign: 10, steam: 93 },
    opiniones: { milo: 9.5, jesus: 8.8 },
    nuevo: false,
  },
  {
    id: "hades-ii",
    titulo: "Hades II",
    portada: "https://picsum.photos/seed/hades-ii/500/700",
    genero: "Roguelike de acción",
    anio: 2025,
    notas: { metacritic: 90, ign: 9, steam: 96 },
    opiniones: { milo: 8.7, jesus: null },
    nuevo: false,
  },
  {
    id: "baldurs-gate-3",
    titulo: "Baldur's Gate 3",
    portada: "https://picsum.photos/seed/baldurs-gate-3/500/700",
    genero: "RPG táctico",
    anio: 2023,
    notas: { metacritic: 96, ign: 10, steam: 96 },
    opiniones: { milo: 9.8, jesus: 9.4 },
    nuevo: false,
  },
  {
    id: "cyberpunk-2077",
    titulo: "Cyberpunk 2077",
    portada: "https://picsum.photos/seed/cyberpunk-2077/500/700",
    genero: "Acción / Mundo abierto",
    anio: 2020,
    notas: { metacritic: 86, ign: 9, steam: 88 },
    opiniones: { milo: 7.9, jesus: 8.2 },
    nuevo: false,
  },
  {
    id: "hollow-knight-silksong",
    titulo: "Hollow Knight: Silksong",
    portada: "https://picsum.photos/seed/silksong/500/700",
    genero: "Metroidvania",
    anio: 2025,
    notas: { metacritic: 92, ign: 9, steam: 95 },
    opiniones: { milo: null, jesus: null },
    nuevo: false,
  },
  {
    id: "the-last-of-us-part-ii",
    titulo: "The Last of Us Part II",
    portada: "https://picsum.photos/seed/tlou2/500/700",
    genero: "Acción / Narrativo",
    anio: 2020,
    notas: { metacritic: 93, ign: 10, steam: 84 },
    opiniones: { milo: 8.4, jesus: 9.0 },
    nuevo: false,
  },
  {
    id: "stardew-valley",
    titulo: "Stardew Valley",
    portada: "https://picsum.photos/seed/stardew-valley/500/700",
    genero: "Simulación / Indie",
    anio: 2016,
    notas: { metacritic: 89, ign: 9, steam: 98 },
    opiniones: { milo: 9.1, jesus: null },
    nuevo: false,
  },
  {
    id: "doom-eternal",
    titulo: "Doom Eternal",
    portada: "https://picsum.photos/seed/doom-eternal/500/700",
    genero: "Shooter",
    anio: 2020,
    notas: { metacritic: 88, ign: 9, steam: 92 },
    opiniones: { milo: 8.0, jesus: 8.6 },
    nuevo: false,
  },
];

/* Listas usadas por app.js para "simular" la carga externa de un juego
   nuevo cuando el usuario busca un título que no existe todavía. */
const GENEROS_SIMULADOS = [
  "Acción",
  "Aventura",
  "RPG",
  "Shooter",
  "Estrategia",
  "Deportes",
  "Terror",
  "Plataformas",
  "Mundo abierto",
  "Indie",
];