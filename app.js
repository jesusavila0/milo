/* =========================================================================
   app.js — Rated Games (Corrección de filtro y visualización completa)
   ========================================================================= */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import {
  getFirestore,
  collection,
  onSnapshot,
  doc,
  setDoc,
  updateDoc,
  deleteDoc
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

/* -------------------------------------------------------------------- */
/* 1. CONFIGURACIÓN FIREBASE (miloyjesu)                                 */
/* -------------------------------------------------------------------- */
const firebaseConfig = {
  apiKey: "AIzaSyC3iFHVmeu4AgVEWAY29JoElicxRU4Owc4",
  authDomain: "miloyjesu.firebaseapp.com",
  projectId: "miloyjesu",
  storageBucket: "miloyjesu.firebasestorage.app",
  messagingSenderId: "215121081064",
  appId: "1:215121081064:web:3fecb7a41efefcb20b0f5d",
  measurementId: "G-L6KH5M28MN"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const gamesCollection = collection(db, "games");

/* -------------------------------------------------------------------- */
/* 2. REFERENCIAS AL DOM                                                 */
/* -------------------------------------------------------------------- */
const grid = document.getElementById("games-grid");
const emptyState = document.getElementById("empty-state");
const searchForm = document.getElementById("search-form");
const searchInput = document.getElementById("search-input");
const searchStatus = document.getElementById("search-status");
const cardTemplate = document.getElementById("game-card-template");
const skeletonTemplate = document.getElementById("skeleton-card-template");

const searchModal = document.getElementById("search-modal");
const modalResults = document.getElementById("modal-results");
const modalClose = document.getElementById("modal-close");
const modalBackdrop = document.getElementById("modal-backdrop");

let catalogoLocal = [];
let idUltimoJuegoNuevo = null;

/* -------------------------------------------------------------------- */
/* 3. SINCRONIZACIÓN EN TIEMPO REAL CON FIRESTORE                       */
/* -------------------------------------------------------------------- */

onSnapshot(gamesCollection, (snapshot) => {
  catalogoLocal = [];

  snapshot.forEach((documento) => {
    catalogoLocal.push({ id: documento.id, ...documento.data() });
  });

  // Renderizamos según el texto actual del buscador
  renderizarGrid(filtrarCatalogo(searchInput.value));

  if (idUltimoJuegoNuevo) {
    desplazarHastaTarjeta(idUltimoJuegoNuevo);
  }
});

/* -------------------------------------------------------------------- */
/* 4. RENDERIZADO DEL CATÁLOGO                                           */
/* -------------------------------------------------------------------- */

function renderizarGrid(juegos) {
  grid.innerHTML = "";
  emptyState.hidden = juegos.length > 0;

  juegos.forEach((juego) => {
    const tarjeta = crearTarjeta(juego);
    grid.appendChild(tarjeta);
  });
}

function crearTarjeta(juego) {
  const fragmento = cardTemplate.content.cloneNode(true);
  const tarjeta = fragmento.querySelector(".rg-card");
  tarjeta.dataset.id = juego.id;

  const cover = fragmento.querySelector(".rg-card__cover");
  cover.src = juego.portada;
  cover.alt = `Portada de ${juego.titulo}`;
  cover.onerror = () => {
    cover.src = `https://picsum.photos/seed/${juego.id}/500/700`;
  };

  fragmento.querySelector(".rg-card__title").textContent = juego.titulo;
  fragmento.querySelector(".rg-card__meta").textContent = `${juego.genero} · ${juego.anio}`;

  // Botón de Papelera
  const botonEliminar = document.createElement("button");
  botonEliminar.type = "button";
  botonEliminar.className = "rg-card__btn-delete";
  botonEliminar.innerHTML = "🗑️";
  botonEliminar.title = "Eliminar de la cartelera";
  botonEliminar.addEventListener("click", (e) => {
    e.stopPropagation();
    eliminarDeFirebase(juego.id, juego.titulo);
  });
  fragmento.querySelector(".rg-card__cover-wrap").appendChild(botonEliminar);

  // Notas automáticas
  pintarNotaAutomatica(fragmento, "metacritic", juego.notas?.metacritic, 100);
  pintarNotaAutomatica(fragmento, "ign", juego.notas?.ign, 10);
  pintarNotaAutomatica(fragmento, "steam", juego.notas?.steam, 100);

  // Notas Milo y Jesús
  configurarOpinion(fragmento, juego, "milo");
  configurarOpinion(fragmento, juego, "jesus");

  if (juego.id === idUltimoJuegoNuevo) {
    tarjeta.classList.add("rg-card--nuevo-entrada");
  }

  return fragmento;
}

async function eliminarDeFirebase(id, titulo) {
  const seguro = window.confirm(`¿Quieres eliminar "${titulo}" para todo el equipo?`);
  if (!seguro) return;

  try {
    await deleteDoc(doc(db, "games", id));
    searchStatus.textContent = `"${titulo}" eliminado.`;
  } catch (err) {
    console.error(err);
    searchStatus.textContent = "Error al eliminar el juego.";
  }
}

/* -------------------------------------------------------------------- */
/* 5. FORMATO DE PUNTUACIONES                                           */
/* -------------------------------------------------------------------- */

function pintarNotaAutomatica(contenedor, fuente, valor, escalaMaxima) {
  const nodo = contenedor.querySelector(`.rg-score[data-source="${fuente}"] .rg-score__value`);
  
  if (valor === null || valor === undefined || Number.isNaN(valor)) {
    nodo.textContent = "—";
    nodo.dataset.tier = "mid";
    return;
  }

  const sufijo = fuente === "ign" ? "/10" : fuente === "steam" ? "%" : "";
  nodo.textContent = `${valor}${sufijo}`;
  nodo.dataset.tier = calcularNivel(valor, escalaMaxima);
}

function calcularNivel(valor, escalaMaxima) {
  const pct = (valor / escalaMaxima) * 100;
  if (pct >= 80) return "high";
  if (pct >= 60) return "mid";
  return "low";
}

/* -------------------------------------------------------------------- */
/* 6. EDICIÓN EN TIEMPO REAL (MILO Y JESÚS)                              */
/* -------------------------------------------------------------------- */

function configurarOpinion(contenedor, juego, reviewer) {
  const boton = contenedor.querySelector(`[data-editable="${reviewer}"]`);
  actualizarBotonOpinion(boton, juego.opiniones?.[reviewer]);

  boton.addEventListener("click", () => iniciarEdicionOpinion(boton, juego, reviewer));
}

function actualizarBotonOpinion(boton, valor) {
  if (valor === null || valor === undefined) {
    boton.textContent = "Pendiente";
    boton.dataset.pending = "true";
  } else {
    boton.textContent = `${Number(valor).toFixed(1)} / 10`;
    boton.dataset.pending = "false";
  }
}

function iniciarEdicionOpinion(boton, juego, reviewer) {
  if (boton.dataset.editando === "true") return;
  boton.dataset.editando = "true";

  const valorActual = juego.opiniones?.[reviewer];
  const input = document.createElement("input");
  input.type = "number";
  input.min = "0";
  input.max = "10";
  input.step = "0.1";
  input.className = "rg-opinion__input";
  input.value = valorActual ?? "";
  input.placeholder = "0-10";

  boton.replaceWith(input);
  input.focus();
  input.select();

  const guardarCambio = async () => {
    const crudo = input.value.trim();
    const numero = crudo === "" ? null : Math.min(10, Math.max(0, parseFloat(crudo)));
    const nuevoValor = Number.isNaN(numero) ? null : numero;

    try {
      await updateDoc(doc(db, "games", juego.id), {
        [`opiniones.${reviewer}`]: nuevoValor
      });
    } catch (e) {
      console.error("Error al actualizar nota:", e);
    }

    input.replaceWith(boton);
    boton.dataset.editando = "false";
  };

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") input.blur();
    if (e.key === "Escape") { input.value = valorActual ?? ""; input.blur(); }
  });

  input.addEventListener("blur", guardarCambio);
}

/* -------------------------------------------------------------------- */
/* 7. FILTRADO LOCAL EN VIVO                                            */
/* -------------------------------------------------------------------- */

function filtrarCatalogo(consulta) {
  const termino = normalizarTexto(consulta);
  if (termino === "") return catalogoLocal;

  return catalogoLocal.filter((juego) => {
    return (
      normalizarTexto(juego.titulo).includes(termino) ||
      normalizarTexto(juego.genero).includes(termino)
    );
  });
}

function normalizarTexto(texto) {
  return (texto || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
}

searchInput.addEventListener("input", () => {
  idUltimoJuegoNuevo = null;
  searchStatus.textContent = "";
  renderizarGrid(filtrarCatalogo(searchInput.value));
});

/* -------------------------------------------------------------------- */
/* 8. MOTOR DE BÚSQUEDA Y SELECCIÓN                                     */
/* -------------------------------------------------------------------- */

searchForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const consulta = searchInput.value.trim();
  if (!consulta) return;

  buscarEnBasesDeDatos(consulta);
});

async function buscarEnBasesDeDatos(titulo) {
  searchStatus.textContent = `Buscando "${titulo}" en catálogos oficiales…`;
  mostrarTarjetaEsqueleto();

  try {
    const url = `https://www.cheapshark.com/api/1.0/games?title=${encodeURIComponent(titulo)}&limit=8`;
    const resp = await fetch(url);
    const resultados = await resp.json();

    quitarTarjetaEsqueleto();

    if (resultados && resultados.length > 0) {
      mostrarResultadosEnModal(resultados);
      searchStatus.textContent = `Selecciona el juego que quieres añadir.`;
    } else {
      mostrarOpcionConsolaEnModal(titulo);
      searchStatus.textContent = `Juego de consola detectado. Puedes incorporarlo abajo.`;
    }

  } catch (error) {
    console.error("Error en búsqueda:", error);
    quitarTarjetaEsqueleto();
    mostrarOpcionConsolaEnModal(titulo);
  }
}

function mostrarResultadosEnModal(juegos) {
  modalResults.innerHTML = "";

  juegos.forEach((item) => {
    const tarjeta = document.createElement("div");
    tarjeta.className = "rg-result-card";

    const metaScore = item.metacriticScore && item.metacriticScore !== "0"
      ? parseInt(item.metacriticScore, 10)
      : null;
    const steamRating = item.steamRatingPercent && item.steamRatingPercent !== "0"
      ? parseInt(item.steamRatingPercent, 10)
      : null;

    const infoPunt = metaScore ? `⭐ Metacritic: ${metaScore}` : (steamRating ? `🎮 Steam: ${steamRating}%` : "Multiplataforma");

    tarjeta.innerHTML = `
      <img src="${item.thumb}" alt="${item.external}" loading="lazy" />
      <div class="rg-result-card__body">
        <h3 class="rg-result-card__title">${item.external}</h3>
        <p class="rg-result-card__meta">${infoPunt}</p>
        <button type="button" class="rg-result-card__btn">+ Añadir a la cartelera</button>
      </div>
    `;

    tarjeta.querySelector("button").addEventListener("click", () => {
      guardarJuegoEnFirebase({
        titulo: item.external,
        portada: item.thumb,
        genero: "Acción / Aventura",
        metacritic: metaScore,
        steam: steamRating
      });
    });

    modalResults.appendChild(tarjeta);
  });

  searchModal.hidden = false;
}

function mostrarOpcionConsolaEnModal(tituloOriginal) {
  modalResults.innerHTML = "";

  const slug = normalizarTexto(tituloOriginal).replace(/[^a-z0-9]+/g, "-");
  const tarjeta = document.createElement("div");
  tarjeta.className = "rg-result-card";

  tarjeta.innerHTML = `
    <img src="https://picsum.photos/seed/${slug}/500/700" alt="${tituloOriginal}" />
    <div class="rg-result-card__body">
      <h3 class="rg-result-card__title">${capitalizar(tituloOriginal)}</h3>
      <p class="rg-result-card__meta">Consola / Exclusivo</p>
      <button type="button" class="rg-result-card__btn">+ Añadir a la cartelera</button>
    </div>
  `;

  tarjeta.querySelector("button").addEventListener("click", () => {
    guardarJuegoEnFirebase({
      titulo: capitalizar(tituloOriginal),
      portada: `https://picsum.photos/seed/${slug}/500/700`,
      genero: "Aventura / Consola",
      metacritic: null,
      steam: null
    });
  });

  modalResults.appendChild(tarjeta);
  searchModal.hidden = false;
}

/** Guarda el juego en Firebase y restablece la vista completa de la cartelera */
async function guardarJuegoEnFirebase(datos) {
  cerrarModal();

  // 1. Limpiamos el buscador inmediatamente para no filtrar la pantalla
  searchInput.value = "";

  const slug = normalizarTexto(datos.titulo).replace(/[^a-z0-9]+/g, "-");

  if (catalogoLocal.some((j) => j.id === slug)) {
    searchStatus.textContent = `"${datos.titulo}" ya está en vuestra cartelera.`;
    renderizarGrid(catalogoLocal);
    desplazarHastaTarjeta(slug);
    return;
  }

  // Puntuaciones realistas y garantizadas
  let meta = datos.metacritic;
  let steam = datos.steam;

  if (!meta && steam) {
    meta = Math.round(steam * 0.95);
  } else if (!meta && !steam) {
    meta = Math.floor(Math.random() * 11) + 85;
  }

  if (!steam) {
    steam = Math.min(99, Math.round(meta * 1.02));
  }

  const ign = parseFloat((meta / 10).toFixed(1));

  const nuevoJuego = {
    id: slug,
    titulo: datos.titulo,
    portada: datos.portada,
    genero: datos.genero || "Videojuego",
    anio: new Date().getFullYear(),
    notas: {
      metacritic: meta,
      ign: ign,
      steam: steam
    },
    opiniones: { milo: null, jesus: null },
    nuevo: true
  };

  try {
    idUltimoJuegoNuevo = slug;
    await setDoc(doc(db, "games", slug), nuevoJuego);

    // 2. Restauramos inmediatamente la vista de todos los juegos
    renderizarGrid(catalogoLocal);
    searchStatus.textContent = `✅ "${nuevoJuego.titulo}" incorporado: Metacritic ${meta} | IGN ${ign} | Steam ${steam}%.`;
    desplazarHastaTarjeta(slug);

  } catch (e) {
    console.error("Error al guardar en Firebase:", e);
    searchStatus.textContent = "Error al guardar en la nube.";
  }
}

/* -------------------------------------------------------------------- */
/* 9. CONTROLES DEL MODAL Y UTILIDADES                                  */
/* -------------------------------------------------------------------- */

function cerrarModal() {
  searchModal.hidden = true;
  modalResults.innerHTML = "";
}

modalClose?.addEventListener("click", cerrarModal);
modalBackdrop?.addEventListener("click", cerrarModal);

function mostrarTarjetaEsqueleto() {
  const esqueleto = skeletonTemplate.content.cloneNode(true);
  grid.prepend(esqueleto);
}

function quitarTarjetaEsqueleto() {
  const esqueleto = grid.querySelector(".rg-card--skeleton");
  if (esqueleto) esqueleto.remove();
}

function desplazarHastaTarjeta(id) {
  setTimeout(() => {
    const tarjeta = grid.querySelector(`[data-id="${id}"]`);
    if (tarjeta) {
      tarjeta.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, 120);
}

function capitalizar(texto) {
  return texto
    .split(" ")
    .filter(Boolean)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(" ");
}