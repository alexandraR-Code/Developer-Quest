// Sistema de XP y Nivel de Usuario (RF-008), sobre localStorage (RF-011) para
// que el progreso sobreviva entre sesiones del navegador, no solo la pestaña.

const CLAVE_XP_TOTAL = "dq_xp_total";

function obtenerXpTotal() {
  return parseInt(localStorage.getItem(CLAVE_XP_TOTAL), 10) || 0;
}

// RN-004: 50 XP base + 0.5 XP por punto de puntuación (máx +50) + 10 XP por estrella (máx +30)
function calcularXpGanado(puntos, estrellas) {
  const bonusPuntuacion = Math.min(puntos * 0.5, 50);
  const bonusEstrellas = Math.min(estrellas * 10, 30);
  return Math.round(50 + bonusPuntuacion + bonusEstrellas);
}

// RF-008.2: XP para subir del Nivel N al N+1 = 1000 + (N * 500)
function xpRequeridoParaNivel(nivel) {
  return 1000 + nivel * 500;
}

function calcularNivelUsuario(xpTotal) {
  let nivel = 1;
  let xpRestante = xpTotal;
  let xpParaSiguiente = xpRequeridoParaNivel(nivel);

  while (xpRestante >= xpParaSiguiente) {
    xpRestante -= xpParaSiguiente;
    nivel++;
    xpParaSiguiente = xpRequeridoParaNivel(nivel);
  }

  return { nivel, xpEnNivel: xpRestante, xpParaSiguiente };
}

// Suma XP al total acumulado y devuelve el nuevo estado, indicando si esto
// implicó subir de nivel de usuario (para poder celebrarlo en la interfaz).
function agregarXp(cantidad) {
  const nivelAnterior = calcularNivelUsuario(obtenerXpTotal()).nivel;

  const xpNuevo = obtenerXpTotal() + cantidad;
  localStorage.setItem(CLAVE_XP_TOTAL, xpNuevo);

  const estadoNuevo = calcularNivelUsuario(xpNuevo);
  return { ...estadoNuevo, subioDeNivel: estadoNuevo.nivel > nivelAnterior };
}
