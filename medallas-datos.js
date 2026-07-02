// Catálogo de medallas y lógica de desbloqueo automático (RF-009), usando
// "niveles" y "calcularProgresoNivel" de niveles-datos.js. Se guarda la fecha
// de desbloqueo en localStorage para que sobreviva entre sesiones (RF-011).
//
// Simplificaciones respecto al SRS: "intentos" cuenta cada vez que se abre
// el reto (no hay botón "enviar" del que contar intentos reales) y "rápido"
// mide el tiempo desde que se abre el reto hasta que se completa.

const CLAVE_MEDALLAS_DESBLOQUEADAS = "dq_medallas_desbloqueadas";

function totalRetos() {
  return niveles.reduce((suma, nivel) => suma + nivel.retos.length, 0);
}

function totalRetosCompletados() {
  return niveles.reduce((suma, nivel) => suma + nivel.retos.filter((r) => r.estado === "completado").length, 0);
}

function contarNivelesCompletados() {
  return niveles.filter((nivel) => calcularProgresoNivel(nivel).estadoGeneral === "completado").length;
}

function todosLosRetosConEstrellas(idNivel, minimoEstrellas) {
  const nivel = niveles.find((n) => n.id === idNivel);
  return !!nivel && nivel.retos.every((r) => r.estrellas >= minimoEstrellas);
}

function algunRetoConEstrellas(minimoEstrellas) {
  return niveles.some((nivel) => nivel.retos.some((r) => r.estrellas >= minimoEstrellas));
}

function recorrerClavesPorReto(sufijoClave) {
  const valores = [];
  niveles.forEach((nivel) => {
    nivel.retos.forEach((_, indice) => {
      const numeroReto = indice + 1;
      valores.push(localStorage.getItem(`dq_${sufijoClave}_nivel${nivel.id}_reto${numeroReto}`));
    });
  });
  return valores;
}

function algunRetoConIntentos(minimo) {
  return recorrerClavesPorReto("intentos").some((valor) => (parseInt(valor, 10) || 0) >= minimo);
}

function contarRetosRapidos() {
  return recorrerClavesPorReto("rapido").filter((valor) => valor === "true").length;
}

function nivelCompletadoSinPistas(idNivel) {
  const nivel = niveles.find((n) => n.id === idNivel);
  if (!nivel || calcularProgresoNivel(nivel).estadoGeneral !== "completado") return false;
  return nivel.retos.every((_, indice) => localStorage.getItem(`dq_usopista_nivel${idNivel}_reto${indice + 1}`) !== "true");
}

const CATALOGO_MEDALLAS = [
  { id: "principiante", nombre: "Principiante", icono: "fa-solid fa-shoe-prints", dificultad: "Fácil",
    descripcion: "Completa el Nivel 1",
    cumplida: () => calcularProgresoNivel(niveles.find((n) => n.id === 1)).estadoGeneral === "completado" },
  { id: "primer-paso", nombre: "Primer Paso", icono: "fa-solid fa-flag", dificultad: "Fácil",
    descripcion: "Completa tu primer reto",
    cumplida: () => totalRetosCompletados() >= 1 },
  { id: "persistente", nombre: "Persistente", icono: "fa-solid fa-fire", dificultad: "Fácil",
    descripcion: "Intenta 10 veces un mismo reto",
    cumplida: () => algunRetoConIntentos(10) },
  { id: "constructor-html", nombre: "Constructor de HTML", icono: "fa-solid fa-hammer", dificultad: "Media",
    descripcion: "Obtén 3 estrellas en todos los retos del Nivel 1",
    cumplida: () => todosLosRetosConEstrellas(1, 3) },
  { id: "artista-css", nombre: "Artista CSS", icono: "fa-solid fa-palette", dificultad: "Media",
    descripcion: "Completa todos los retos del Nivel 3",
    cumplida: () => calcularProgresoNivel(niveles.find((n) => n.id === 3)).estadoGeneral === "completado" },
  { id: "mago-javascript", nombre: "Mago JavaScript", icono: "fa-solid fa-wand-magic-sparkles", dificultad: "Media",
    descripcion: "Completa todos los retos del Nivel 5",
    cumplida: () => calcularProgresoNivel(niveles.find((n) => n.id === 5)).estadoGeneral === "completado" },
  { id: "independiente", nombre: "Independiente", icono: "fa-solid fa-brain", dificultad: "Media-Alta",
    descripcion: "Completa el Nivel 5 sin usar pistas",
    cumplida: () => nivelCompletadoSinPistas(5) },
  { id: "velocidad", nombre: "Velocidad", icono: "fa-solid fa-bolt", dificultad: "Difícil",
    descripcion: "Completa 3 retos en menos de 2 minutos cada uno",
    cumplida: () => contarRetosRapidos() >= 3 },
  { id: "perfeccionista", nombre: "Perfeccionista", icono: "fa-solid fa-gem", dificultad: "Difícil",
    descripcion: "Obtén 100 puntos (3 estrellas) en un reto",
    cumplida: () => algunRetoConEstrellas(3) },
  { id: "disenador-web", nombre: "Diseñador Web", icono: "fa-solid fa-swatchbook", dificultad: "Alta",
    descripcion: "Obtén 3 estrellas en todos los retos del Nivel 4",
    cumplida: () => todosLosRetosConEstrellas(4, 3) },
  { id: "programador-js", nombre: "Programador JS", icono: "fa-solid fa-laptop-code", dificultad: "Alta",
    descripcion: "Obtén 3 estrellas en todos los retos de los Niveles 5, 6 y 7",
    cumplida: () => [5, 6, 7].every((id) => todosLosRetosConEstrellas(id, 3)) },
  { id: "desarrollador", nombre: "Desarrollador", icono: "fa-solid fa-server", dificultad: "Alta",
    descripcion: "Completa 7 de los 10 niveles",
    cumplida: () => contarNivelesCompletados() >= 7 },
  { id: "experto-web", nombre: "Experto Web", icono: "fa-solid fa-globe", dificultad: "Alta",
    descripcion: "Completa 9 de los 10 niveles",
    cumplida: () => contarNivelesCompletados() >= 9 },
  { id: "full-stack-junior", nombre: "Full Stack Junior", icono: "fa-solid fa-graduation-cap", dificultad: "Muy alta",
    descripcion: "Completa los 10 niveles",
    cumplida: () => contarNivelesCompletados() >= 10 },
  { id: "certificado", nombre: "Certificado", icono: "fa-solid fa-award", dificultad: "Muy alta",
    descripcion: "Descarga tu certificado de finalización",
    cumplida: () => localStorage.getItem("dq_certificado_descargado") === "true" },
];

function obtenerMedallasDesbloqueadas() {
  try {
    return JSON.parse(localStorage.getItem(CLAVE_MEDALLAS_DESBLOQUEADAS)) || {};
  } catch (error) {
    return {};
  }
}

// Revisa el catálogo completo, guarda la fecha de desbloqueo de las medallas
// recién cumplidas y devuelve solo esas (para poder notificar al jugador).
function verificarMedallasNuevas() {
  aplicarProgresoReal();
  const desbloqueadas = obtenerMedallasDesbloqueadas();
  const nuevas = [];

  CATALOGO_MEDALLAS.forEach((medalla) => {
    if (desbloqueadas[medalla.id]) return;
    if (medalla.cumplida()) {
      desbloqueadas[medalla.id] = new Date().toISOString();
      nuevas.push(medalla);
    }
  });

  if (nuevas.length > 0) {
    localStorage.setItem(CLAVE_MEDALLAS_DESBLOQUEADAS, JSON.stringify(desbloqueadas));
  }
  return nuevas;
}
