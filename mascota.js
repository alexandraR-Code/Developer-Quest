// Mascota flotante de la pantalla de Reto: robot SVG con 4 emociones que
// acompaña al jugador mientras resuelve el reto. Vive únicamente en reto.html.
//
// Punto de entrada público para reto.js: reaccionarMascota(estado, mensaje).
//
// Condicional de uso de los 4 estados (además de "idle"):
//  - wave  -> saludo al entrar a un reto (una vez por sesión), check-in tras
//             45s sin interacción, y gesto breve de compañía cada 10s
//             mientras el jugador sigue activo intentando resolver.
//  - think -> el jugador abre cualquiera de las pistas de ayuda.
//  - hype  -> la primera vez que sus criterios cumplidos llegan a la mitad
//             o más (va bien encaminado), sin haber terminado aún.
//  - win   -> se muestra el banner de "¡Reto Completado!".

// ===== CONTROL DE ADMINISTRADOR (RF-018) =====
// Interruptor global de la mascota. Sin panel/servidor todavía, este es el
// lugar donde tú, como administradora, lo activas o desactivas: cambia el
// valor y vuelve a publicar el sitio. false = nadie ve la mascota, sin
// importar lo que cada jugador haya elegido individualmente con su botón
// de cerrar. true = cada jugador vuelve a decidir por su cuenta (respetando
// lo que ya haya cerrado antes).
const MASCOTA_ACTIVADA_GLOBALMENTE = true;

const CLAVE_MASCOTA_OCULTA = "dq_mascota_oculta";
const CLAVE_MASCOTA_SALUDO_SESION = "dq_mascota_saludo_sesion";
const TIEMPO_INACTIVIDAD_MS = 45000;
const DURACION_REACCION_MS = 2600;
const TIEMPO_COMPANIA_MS = 10000;
const UMBRAL_ACTIVIDAD_RECIENTE_MS = 15000;

const MENSAJES_MASCOTA = {
  idle: "",
  think: "Vamos paso a paso, ya casi llegas 💡",
  hype: "¡Vas muy bien, sigue así! 🚀",
  win: "¡Excelente, eres un crack! ✅",
  wave: "¡Aquí sigo, cuando quieras! 💻",
};

// Gestos de compañía: variados y a veces sin texto, para no ser repetitivos
// en una sesión larga de intentos.
const MENSAJES_COMPANIA = ["", "", "Aquí ando ⚙️", "Sigue así 🔍"];

const MOVIMIENTOS_BOCA = {
  idle: "M100 148 Q110 154 120 148",
  think: "M100 149 Q110 152 120 149",
  hype: "M98 146 Q110 160 122 146",
  win: "M96 144 Q110 164 124 144",
  wave: "M98 147 Q110 157 122 147",
};

let temporizadorInactividad = null;
let temporizadorRevertirEstado = null;
let temporizadorCompania = null;
let ultimaActividadTimestamp = Date.now();

function inicializarMascota() {
  const contenedor = document.getElementById("mascotaFlotante");
  if (!contenedor) return; // esta página no tiene mascota

  const ocultaPorElJugador = localStorage.getItem(CLAVE_MASCOTA_OCULTA) === "true";
  if (!MASCOTA_ACTIVADA_GLOBALMENTE || ocultaPorElJugador) {
    contenedor.classList.add("mascota-flotante--oculta");
    return;
  }

  document.getElementById("mascotaBotonCerrar").addEventListener("click", ocultarMascota);
  document.getElementById("mascotaContenedorAvatar").addEventListener("click", () => {
    reaccionarMascota("wave", "¡Aquí estoy! 💻");
  });

  ajustarPosicionSobreFooter();
  window.addEventListener("resize", ajustarPosicionSobreFooter);

  reiniciarTemporizadorInactividad();
  ["mousemove", "keydown", "click", "scroll"].forEach((evento) => {
    document.addEventListener(evento, reiniciarTemporizadorInactividad, { passive: true });
  });

  programarGestoCompania();
  saludarSiEsNuevaSesion();
}

// El footer .pie-reto (con el botón "Siguiente") no es fijo: solo se ve al
// hacer scroll hasta el final. Medimos su alto real para que la mascota
// flote siempre por encima de él y nunca lo tape, en cualquier tamaño de
// pantalla.
function ajustarPosicionSobreFooter() {
  const footer = document.querySelector(".pie-reto");
  if (!footer) return;
  const margen = 22;
  document.documentElement.style.setProperty("--mascota-offset-inferior", `${footer.offsetHeight + margen}px`);
}

function ocultarMascota() {
  document.getElementById("mascotaFlotante").classList.add("mascota-flotante--oculta");
  localStorage.setItem(CLAVE_MASCOTA_OCULTA, "true");
}

function reiniciarTemporizadorInactividad() {
  ultimaActividadTimestamp = Date.now();
  clearTimeout(temporizadorInactividad);
  temporizadorInactividad = setTimeout(() => reaccionarMascota("wave"), TIEMPO_INACTIVIDAD_MS);
}

// Gesto breve cada 10s mientras el jugador sigue activo (no inactivo: eso ya
// lo cubre el check-in de 45s) y el reto aún no se resolvió, para que se
// sienta acompañado durante los tramos largos de intentar resolver.
function programarGestoCompania() {
  temporizadorCompania = setTimeout(() => {
    const retoYaResuelto = typeof retoYaCompletado !== "undefined" && retoYaCompletado;
    const huboActividadReciente = Date.now() - ultimaActividadTimestamp < UMBRAL_ACTIVIDAD_RECIENTE_MS;
    if (!retoYaResuelto && huboActividadReciente) {
      const mensaje = MENSAJES_COMPANIA[Math.floor(Math.random() * MENSAJES_COMPANIA.length)];
      reaccionarMascota("wave", mensaje);
    }
    programarGestoCompania();
  }, TIEMPO_COMPANIA_MS);
}

function saludarSiEsNuevaSesion() {
  if (sessionStorage.getItem(CLAVE_MASCOTA_SALUDO_SESION) === "true") return;
  sessionStorage.setItem(CLAVE_MASCOTA_SALUDO_SESION, "true");
  reaccionarMascota("wave");
}

function mostrarBurbuja(texto) {
  const burbuja = document.getElementById("mascotaBurbuja");
  if (!texto) {
    burbuja.classList.remove("mascota-flotante__burbuja--visible");
    return;
  }
  burbuja.textContent = texto;
  burbuja.classList.add("mascota-flotante__burbuja--visible");
  clearTimeout(burbuja._temporizador);
  burbuja._temporizador = setTimeout(() => {
    burbuja.classList.remove("mascota-flotante__burbuja--visible");
  }, 4000);
}

function lanzarConfeti() {
  const colores = ["#f9eb1d", "#e6d610", "#fff3a0", "#4ce0b3", "#ffffff"];
  const contenedor = document.getElementById("mascotaConfetti");
  for (let i = 0; i < 16; i++) {
    const pieza = document.createElement("div");
    pieza.className = "mascota-flotante__confetti-pieza";
    pieza.style.left = `${Math.random() * 100}%`;
    pieza.style.background = colores[Math.floor(Math.random() * colores.length)];
    pieza.style.animationDuration = `${1 + Math.random() * 0.7}s`;
    pieza.style.animationDelay = `${Math.random() * 0.25}s`;
    contenedor.appendChild(pieza);
    setTimeout(() => pieza.remove(), 2000);
  }
}

// Punto de entrada público: dispara una de las 4 emociones (o "idle").
function reaccionarMascota(estado, mensajeForzado) {
  const contenedor = document.getElementById("mascotaFlotante");
  if (!contenedor || contenedor.classList.contains("mascota-flotante--oculta")) return;

  clearTimeout(temporizadorRevertirEstado);

  const bot = document.getElementById("mascotaBot");
  const armL = bot.querySelector(".arm-l");
  const armR = bot.querySelector(".arm-r");
  const antenaGlow = bot.querySelector(".glow");
  const eyeGroup = document.getElementById("mascotaEyeGroup");
  const boca = document.getElementById("mascotaMouth");
  const cachetes = [document.getElementById("mascotaCheekL"), document.getElementById("mascotaCheekR")];

  bot.className = "bot";
  armL.className = "arm-l";
  armR.className = "arm-r";
  antenaGlow.className = "glow";
  eyeGroup.className = "eyes";
  cachetes.forEach((c) => (c.style.opacity = 0));

  void bot.offsetWidth;

  const mapaBrazos = { think: "arm-r", hype: "ambos", win: "ambos", wave: "arm-r" };
  bot.classList.add(estado);
  if (mapaBrazos[estado] === "arm-r") {
    armR.classList.add(estado);
  } else if (mapaBrazos[estado] === "ambos") {
    armL.classList.add(estado);
    armR.classList.add(estado);
  }
  antenaGlow.classList.add(`glow-${estado}`);

  boca.setAttribute("d", MOVIMIENTOS_BOCA[estado] || MOVIMIENTOS_BOCA.idle);
  const esFeliz = estado === "hype" || estado === "win" || estado === "wave";
  eyeGroup.classList.add(esFeliz ? "eyes-happy" : "eyes-normal");
  if (esFeliz) cachetes.forEach((c) => (c.style.opacity = 0.7));

  mostrarBurbuja(mensajeForzado !== undefined ? mensajeForzado : MENSAJES_MASCOTA[estado]);

  if (estado === "win") lanzarConfeti();

  if (estado !== "idle") reiniciarTemporizadorInactividad();
  if (estado !== "idle") {
    temporizadorRevertirEstado = setTimeout(() => reaccionarMascota("idle"), DURACION_REACCION_MS);
  }
}

document.addEventListener("DOMContentLoaded", inicializarMascota);
