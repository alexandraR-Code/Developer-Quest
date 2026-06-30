// Motor genérico de la pantalla de reto: lee el nivel y el número de reto de
// la URL (?nivel=N&reto=M) y carga su contenido desde datosNiveles (retos-datos.js).

function escaparHtml(texto) {
  return texto.replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// Sin nombre de jugador no hay partida: se exige pasar por la bienvenida primero.
if (!sessionStorage.getItem("dq_nombre_jugador")) {
  window.location.href = "bienvenida.html";
}

const parametrosUrl = new URLSearchParams(window.location.search);
const numeroNivel = parseInt(parametrosUrl.get("nivel"), 10) || 1;
const nivelActual = datosNiveles[numeroNivel];
const totalRetosDelNivel = Object.keys(nivelActual.retos).length;

const numeroRetoSolicitado = parseInt(parametrosUrl.get("reto"), 10) || 1;
const numeroReto = Math.min(Math.max(numeroRetoSolicitado, 1), totalRetosDelNivel);
const retoActual = nivelActual.retos[numeroReto];

const CLAVE_ALMACENAMIENTO = `dq_progreso_nivel${numeroNivel}_reto${numeroReto}`;

// ===== TEXTOS DEL ENCABEZADO, VIDEO Y PIE DE PÁGINA =====
document.getElementById("tituloPagina").textContent = `Reto ${numeroReto}: ${retoActual.nombre} - Developer Quest`;
document.getElementById("textoTituloEncabezado").textContent = `Nivel ${numeroNivel}, Reto ${numeroReto}: ${retoActual.nombre}`;
document.getElementById("textoProgresoEncabezado").textContent = `Reto ${numeroReto} de ${totalRetosDelNivel}`;
document.getElementById("barraProgresoEncabezado").style.width = `${(numeroReto / totalRetosDelNivel) * 100}%`;
document.getElementById("textoFooterReto").textContent = `Reto ${numeroReto} de ${totalRetosDelNivel}`;

document.getElementById("textoDuracionVideo").textContent = retoActual.duracionVideo;
document.getElementById("textoObjetivo").textContent = retoActual.objetivo;
document.getElementById("textoConceptoClave").innerHTML = retoActual.conceptoClave;
document.getElementById("textoMasInformacion").textContent = retoActual.masInformacion;
document.getElementById("textoPistaGeneral").innerHTML = retoActual.pistaGeneral;
document.getElementById("textoSolucion").textContent = retoActual.solucion;

// ===== NAVEGACIÓN ANTERIOR / SIGUIENTE =====
const botonAnterior = document.getElementById("botonAnterior");
const botonSiguiente = document.getElementById("botonSiguiente");

if (numeroReto > 1) {
  botonAnterior.disabled = false;
  botonAnterior.addEventListener("click", () => { window.location.href = `reto.html?nivel=${numeroNivel}&reto=${numeroReto - 1}`; });
}

const esUltimoReto = numeroReto === totalRetosDelNivel;

// El destino real del botón "Siguiente" se decide al completar el reto
// (necesitamos saber si el nivel ya llegó al 80% para desbloquear el próximo).
let destinoSiguiente = { tipo: "reto", nivel: numeroNivel, reto: numeroReto + 1 };

function configurarBotonSiguiente() {
  if (!esUltimoReto) return;

  aplicarProgresoReal();
  const datosNivelActualEnSendero = niveles.find((n) => n.id === numeroNivel);
  const progresoNivel = calcularProgresoNivel(datosNivelActualEnSendero);
  const siguienteNivelId = numeroNivel + 1;
  const siguienteNivelConstruido = !!datosNiveles[siguienteNivelId];
  const siguienteNivelDesbloqueado = progresoNivel.porcentaje >= 80;

  if (siguienteNivelConstruido && siguienteNivelDesbloqueado) {
    botonSiguiente.innerHTML = 'Siguiente Nivel <i class="fa-solid fa-arrow-right"></i>';
    destinoSiguiente = { tipo: "reto", nivel: siguienteNivelId, reto: 1 };
  } else {
    botonSiguiente.innerHTML = 'Volver al Nivel <i class="fa-solid fa-flag-checkered"></i>';
    destinoSiguiente = { tipo: "sendero" };
  }
}

function irAlSiguienteReto() {
  if (destinoSiguiente.tipo === "sendero") {
    window.location.href = "index.html";
  } else {
    window.location.href = `reto.html?nivel=${destinoSiguiente.nivel}&reto=${destinoSiguiente.reto}`;
  }
}

// ===== EDITOR DE CÓDIGO (CodeMirror) =====
const codigoGuardado = sessionStorage.getItem(CLAVE_ALMACENAMIENTO);

const editor = CodeMirror(document.getElementById("editorContenedor"), {
  value: codigoGuardado || retoActual.plantilla,
  mode: "htmlmixed",
  theme: "material-darker",
  lineNumbers: true,
  indentUnit: 2,
  tabSize: 2,
  lineWrapping: true,
  autoCloseBrackets: true,
  autoCloseTags: true,
});

const contadorLineas = document.getElementById("contadorLineas");
const contadorCaracteres = document.getElementById("contadorCaracteres");

function actualizarContadores() {
  const cursor = editor.getCursor();
  contadorLineas.textContent = `Línea ${cursor.line + 1}, Columna ${cursor.ch + 1}`;
  contadorCaracteres.textContent = `${editor.getValue().length} caracteres`;
}

editor.on("cursorActivity", actualizarContadores);

// ===== GUARDADO AUTOMÁTICO (RN-006: cada 2 segundos, solo dura la sesión) =====
const indicadorGuardado = document.getElementById("indicadorGuardado");
let temporizadorGuardado = null;

function marcarComoSinGuardar() {
  indicadorGuardado.classList.add("sin-guardar");
  indicadorGuardado.innerHTML = '<i class="fa-solid fa-ellipsis"></i> Escribiendo...';
  clearTimeout(temporizadorGuardado);
  temporizadorGuardado = setTimeout(guardarProgreso, 2000);
}

function guardarProgreso() {
  sessionStorage.setItem(CLAVE_ALMACENAMIENTO, editor.getValue());
  indicadorGuardado.classList.remove("sin-guardar");
  indicadorGuardado.innerHTML = '<i class="fa-solid fa-check"></i> Guardado';
}

// ===== LIVE PREVIEW (RF-004: actualización cada 500ms, consola integrada) =====
const previewIframe = document.getElementById("previewIframe");
const consolaCuerpo = document.getElementById("consolaCuerpo");

const SCRIPT_PUENTE_CONSOLA = `
  <script>
    function enviarAlPadre(tipo, args) {
      const mensaje = args.map((valor) => {
        try { return typeof valor === "object" ? JSON.stringify(valor) : String(valor); }
        catch (e) { return String(valor); }
      }).join(" ");
      parent.postMessage({ origenDeveloperQuest: true, tipo, mensaje }, "*");
    }
    ["log", "warn", "error", "info"].forEach((metodo) => {
      const original = console[metodo];
      console[metodo] = function (...args) {
        enviarAlPadre(metodo, args);
        original.apply(console, args);
      };
    });
    window.addEventListener("error", (evento) => {
      enviarAlPadre("error", [evento.message + " (línea " + evento.lineno + ")"]);
    });
  <\/script>
`;

function construirContenidoPreview(codigoUsuario) {
  if (/<head>/i.test(codigoUsuario)) {
    return codigoUsuario.replace(/<head>/i, "<head>" + SCRIPT_PUENTE_CONSOLA);
  }
  return SCRIPT_PUENTE_CONSOLA + codigoUsuario;
}

function actualizarPreview(codigo) {
  previewIframe.srcdoc = construirContenidoPreview(codigo);
}

function agregarLineaConsola(tipo, mensaje) {
  const linea = document.createElement("div");
  linea.className = `consola__linea consola__linea--${tipo}`;
  linea.textContent = mensaje;
  consolaCuerpo.appendChild(linea);
  consolaCuerpo.scrollTop = consolaCuerpo.scrollHeight;
}

window.addEventListener("message", (evento) => {
  if (evento.source !== previewIframe.contentWindow) return;
  if (evento.data && evento.data.origenDeveloperQuest) {
    agregarLineaConsola(evento.data.tipo, evento.data.mensaje);
  }
});

document.getElementById("botonLimpiarConsola").addEventListener("click", () => {
  consolaCuerpo.innerHTML = "";
});

document.getElementById("botonReiniciarPreview").addEventListener("click", () => {
  consolaCuerpo.innerHTML = "";
  actualizarPreview(editor.getValue());
});

// ===== PANEL DE VALIDACIÓN (RF-005, RN-008) =====
const listaCriterios = document.getElementById("listaCriterios");
const barraCriterios = document.getElementById("barraCriterios");
const textoCriterios = document.getElementById("textoCriterios");
const bannerExito = document.getElementById("bannerExito");
const puntosObtenidos = document.getElementById("puntosObtenidos");

let retoYaCompletado = false;
let temporizadorCompletitud = null;

function actualizarPanelValidacion(codigo) {
  const resultados = retoActual.criterios.map((criterio) => ({
    descripcion: criterio.descripcion,
    cumplido: criterio.cumple(codigo),
  }));

  const cumplidos = resultados.filter((r) => r.cumplido).length;
  const porcentaje = Math.round((cumplidos / resultados.length) * 100);

  listaCriterios.innerHTML = resultados.map((r) => `
    <li class="criterio ${r.cumplido ? "criterio--cumplido" : "criterio--pendiente"}">
      <i class="fa-solid ${r.cumplido ? "fa-circle-check" : "fa-circle"}"></i>
      <span>${r.descripcion}</span>
    </li>
  `).join("");

  barraCriterios.style.width = `${porcentaje}%`;
  textoCriterios.textContent = `${cumplidos} de ${resultados.length} criterios cumplidos`;

  manejarPosibleCompletitud(cumplidos === resultados.length);
}

// RN-008: espera 2 segundos sin cambios antes de dar el reto por completado
function manejarPosibleCompletitud(todosCumplidos) {
  clearTimeout(temporizadorCompletitud);
  if (!todosCumplidos || retoYaCompletado) return;

  temporizadorCompletitud = setTimeout(() => {
    retoYaCompletado = true;
    mostrarBannerExito();
  }, 2000);
}

function mostrarBannerExito() {
  const puntos = calcularPuntuacion();
  const estrellas = calcularEstrellas(puntos);
  puntosObtenidos.textContent = puntos;

  // Guarda el resultado real de la sesión: esto es lo que aplicarProgresoReal()
  // lee después para que el sendero y el desbloqueo de niveles reflejen lo jugado.
  sessionStorage.setItem(`dq_estado_nivel${numeroNivel}_reto${numeroReto}`, "completado");
  sessionStorage.setItem(`dq_estrellas_nivel${numeroNivel}_reto${numeroReto}`, estrellas);

  bannerExito.classList.add("visible");
  botonSiguiente.disabled = false;
  configurarBotonSiguiente();
  botonSiguiente.addEventListener("click", irAlSiguienteReto, { once: true });
}

// ===== SISTEMA DE PISTAS (RF-010): cada pista reduce la puntuación =====
const pistasUsadas = { nivel1: false, nivel2: false, nivel3: false };

function calcularPuntuacion() {
  let puntos = 100;
  if (pistasUsadas.nivel1) puntos -= 10;
  if (pistasUsadas.nivel2) puntos -= 10;
  if (pistasUsadas.nivel3) puntos = Math.min(puntos, 70);
  return Math.max(70, puntos);
}

// RF-007: sistema de estrellas según la puntuación obtenida
function calcularEstrellas(puntos) {
  if (puntos >= 100) return 3;
  if (puntos >= 85) return 2;
  return 1;
}

document.querySelectorAll(".item-ayuda__boton").forEach((boton) => {
  boton.addEventListener("click", () => {
    if (boton.disabled) return;
    const item = boton.closest(".item-ayuda");
    item.classList.toggle("abierto");

    const nivelPista = item.dataset.nivel;
    if (nivelPista === "1" && !pistasUsadas.nivel1) {
      pistasUsadas.nivel1 = true;
      desbloquearPistaNivel2();
    } else if (nivelPista === "3" && !pistasUsadas.nivel3) {
      pistasUsadas.nivel3 = true;
    }
  });
});

function desbloquearPistaNivel2() {
  const itemNivel2 = document.querySelector('.item-ayuda[data-nivel="2"]');
  itemNivel2.classList.remove("item-ayuda--bloqueado");
  itemNivel2.querySelector(".item-ayuda__boton").disabled = false;
  itemNivel2.querySelector(".item-ayuda__contenido").innerHTML = `
    <pre class="bloque-codigo">${escaparHtml(retoActual.pistaCodigo)}</pre>
    <span class="aviso-puntos">-10 puntos adicionales</span>
  `;
  itemNivel2.addEventListener("click", () => { pistasUsadas.nivel2 = true; }, { once: true });
}

// ===== BOTÓN "MÁS INFORMACIÓN" =====
document.getElementById("botonMasInfo").addEventListener("click", (evento) => {
  evento.currentTarget.classList.toggle("abierto");
  document.getElementById("masInfo").classList.toggle("visible");
});

// ===== ACCIONES DEL EDITOR: descargar y copiar =====
document.getElementById("botonDescargar").addEventListener("click", () => {
  const blob = new Blob([editor.getValue()], { type: "text/html" });
  const enlace = document.createElement("a");
  enlace.href = URL.createObjectURL(blob);
  enlace.download = `nivel${numeroNivel}-reto-${numeroReto}.html`;
  enlace.click();
  URL.revokeObjectURL(enlace.href);
});

document.getElementById("botonCopiar").addEventListener("click", async () => {
  const boton = document.getElementById("botonCopiar");
  await navigator.clipboard.writeText(editor.getValue());
  const iconoOriginal = boton.innerHTML;
  boton.innerHTML = '<i class="fa-solid fa-check"></i>';
  setTimeout(() => { boton.innerHTML = iconoOriginal; }, 1200);
});

// ===== ORQUESTACIÓN: cada cambio en el editor dispara guardado, preview y validación =====
let temporizadorActualizacion = null;

editor.on("change", () => {
  marcarComoSinGuardar();
  actualizarContadores();

  clearTimeout(temporizadorActualizacion);
  temporizadorActualizacion = setTimeout(() => {
    const codigo = editor.getValue();
    actualizarPreview(codigo);
    actualizarPanelValidacion(codigo);
  }, 500);
});

// Primer render al cargar la página
actualizarContadores();
actualizarPreview(editor.getValue());
actualizarPanelValidacion(editor.getValue());
