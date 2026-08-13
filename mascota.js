// Mascota flotante: compañera que reacciona al progreso del jugador.
// Placeholder con CSS/emoji hasta integrar el pack Lottie "Robot Collection 2";
// el único punto que hay que tocar para ese cambio es mostrarAnimacion().

const CLAVE_MASCOTA_OCULTA = "dq_mascota_oculta";
const TIEMPO_INACTIVIDAD_MS = 45000;

const MENSAJES_MASCOTA = {
  celebrar: ["¡Bien hecho!", "¡Sigue así!", "¡Otro reto conquistado!"],
  motivar: ["¿Seguimos?", "Tú puedes con este reto", "Un reto más no hace daño 👀"],
};

let temporizadorInactividad = null;

function inicializarMascota() {
  const contenedor = document.getElementById("mascotaFlotante");
  if (!contenedor) return; // esta página no tiene mascota

  if (localStorage.getItem(CLAVE_MASCOTA_OCULTA) === "true") {
    contenedor.classList.add("mascota-flotante--oculta");
  }

  document.getElementById("mascotaBotonCerrar").addEventListener("click", ocultarMascota);
  document.getElementById("mascotaAvatar").addEventListener("click", () => {
    reaccionarMascota("idle", "¡Hola! Estoy aquí para acompañarte 👋");
  });

  reiniciarTemporizadorInactividad();
  ["mousemove", "keydown", "click", "scroll"].forEach((evento) => {
    document.addEventListener(evento, reiniciarTemporizadorInactividad, { passive: true });
  });
}

function ocultarMascota() {
  document.getElementById("mascotaFlotante").classList.add("mascota-flotante--oculta");
  localStorage.setItem(CLAVE_MASCOTA_OCULTA, "true");
}

function reiniciarTemporizadorInactividad() {
  clearTimeout(temporizadorInactividad);
  temporizadorInactividad = setTimeout(() => reaccionarMascota("motivar"), TIEMPO_INACTIVIDAD_MS);
}

// ===== ÚNICO PUNTO A TOCAR CUANDO LLEGUE EL PACK LOTTIE =====
// Hoy: pinta un emoji y aplica una clase CSS con animación.
// Después: aquí se llama lottie.loadAnimation() con el .json del estado.
function mostrarAnimacion(estado) {
  const avatar = document.getElementById("mascotaAvatar");
  avatar.classList.remove(
    "mascota-flotante__avatar--idle",
    "mascota-flotante__avatar--celebrar",
    "mascota-flotante__avatar--motivar"
  );
  avatar.classList.add(`mascota-flotante__avatar--${estado}`);

  const emojis = { idle: "🤖", celebrar: "🎉", motivar: "💡" };
  avatar.textContent = emojis[estado] || "🤖";
}
// ===== FIN DEL PUNTO A TOCAR =====

function mostrarBurbuja(texto) {
  if (!texto) return;
  const burbuja = document.getElementById("mascotaBurbuja");
  burbuja.textContent = texto;
  burbuja.classList.add("mascota-flotante__burbuja--visible");
  clearTimeout(burbuja._temporizador);
  burbuja._temporizador = setTimeout(() => {
    burbuja.classList.remove("mascota-flotante__burbuja--visible");
  }, 4000);
}

function elegirMensajeAleatorio(lista) {
  if (!lista || lista.length === 0) return "";
  return lista[Math.floor(Math.random() * lista.length)];
}

// Función pública: la llaman otros scripts (ej. reto.js) cuando pasa algo.
function reaccionarMascota(estado, mensajeForzado) {
  const contenedor = document.getElementById("mascotaFlotante");
  if (!contenedor || contenedor.classList.contains("mascota-flotante--oculta")) return;

  mostrarAnimacion(estado);
  mostrarBurbuja(mensajeForzado || elegirMensajeAleatorio(MENSAJES_MASCOTA[estado]));

  if (estado !== "idle") reiniciarTemporizadorInactividad();
  if (estado === "celebrar" || estado === "motivar") {
    setTimeout(() => mostrarAnimacion("idle"), 2000);
  }
}

document.addEventListener("DOMContentLoaded", inicializarMascota);
