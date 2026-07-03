// "niveles", "calcularProgresoNivel", "nivelEstaDesbloqueado" y
// "aplicarProgresoReal" vienen de niveles-datos.js (compartido con reto.js).
// El guardián de sesión, la insignia de nivel de usuario y el menú lateral
// colapsable viven en menu.js (compartido con otras pantallas del shell).
aplicarProgresoReal();

document.getElementById("textoSaludoJugador").textContent = `¡Hola, ${nombreJugador}! Sigue el sendero y desbloquea cada nivel`;

const iconoPorEstadoReto = {
  "completado": '<i class="fa-solid fa-circle-check fila-reto__icono--completado"></i>',
  "en-progreso": '<i class="fa-solid fa-spinner fila-reto__icono--en-progreso"></i>',
  "no-iniciado": '<i class="fa-regular fa-circle fila-reto__icono--no-iniciado"></i>',
};

function generarEstrellasHtml(cantidad, total = 3) {
  let html = "";
  for (let i = 0; i < total; i++) {
    html += i < cantidad
      ? '<i class="fa-solid fa-star"></i>'
      : '<i class="fa-solid fa-star vacia"></i>';
  }
  return html;
}

// ===== GEOMETRÍA DEL SENDERO =====
// La onda hace un ciclo completo de seno a lo largo de todos los niveles:
// la primera mitad se curva hacia un lado (forma de "C") y la segunda mitad
// se curva hacia el lado opuesto (forma de "C" invertida).
const ESPACIO_VERTICAL = 134;
const MARGEN_SUPERIOR = 80;
const FRACCION_AMPLITUD = 0.38;
const RADIO_NODO_NORMAL = 50;
const RADIO_NODO_ACTUAL = 58;
const MARGEN_SEGURO_BORDE = 14;

function calcularPuntosSendero(cantidadNiveles, anchoContenedor) {
  const centroX = anchoContenedor / 2;
  const amplitudMaxima = centroX - RADIO_NODO_ACTUAL - MARGEN_SEGURO_BORDE;
  const amplitud = Math.max(0, Math.min(anchoContenedor * FRACCION_AMPLITUD, amplitudMaxima));
  const frecuencia = (2 * Math.PI) / (cantidadNiveles - 1);

  const puntos = [];
  for (let i = 0; i < cantidadNiveles; i++) {
    puntos.push({
      x: centroX + amplitud * Math.sin(i * frecuencia),
      y: MARGEN_SUPERIOR + i * ESPACIO_VERTICAL,
    });
  }
  return puntos;
}

function trazarRutaSuave(puntos) {
  let d = `M ${puntos[0].x} ${puntos[0].y}`;
  for (let i = 1; i < puntos.length; i++) {
    const anterior = puntos[i - 1];
    const actual = puntos[i];
    const yMedio = (anterior.y + actual.y) / 2;
    d += ` C ${anterior.x} ${yMedio}, ${actual.x} ${yMedio}, ${actual.x} ${actual.y}`;
  }
  return d;
}

function dibujarLineasSendero(svg, puntos, anchoContenedor, altoContenedor, indiceNivelActual) {
  svg.setAttribute("viewBox", `0 0 ${anchoContenedor} ${altoContenedor}`);
  svg.setAttribute("width", anchoContenedor);
  svg.setAttribute("height", altoContenedor);

  const rutaCompleta = trazarRutaSuave(puntos);

  const limiteRecorrido = indiceNivelActual === -1 ? puntos.length - 1 : indiceNivelActual;
  const puntosRecorridos = puntos.slice(0, limiteRecorrido + 1);
  const rutaRecorrida = puntosRecorridos.length > 1 ? trazarRutaSuave(puntosRecorridos) : "";

  svg.innerHTML = `
    <defs>
      <linearGradient id="degradadoRuta" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#6e5fa5" />
        <stop offset="100%" stop-color="#46368d" />
      </linearGradient>
    </defs>
    <path class="ruta-base" d="${rutaCompleta}" />
    ${rutaRecorrida ? `<path class="ruta-recorrida" d="${rutaRecorrida}" />` : ""}
  `;
}

// ===== CREACIÓN DE NODOS =====
function crearNodoNivel(nivel, punto, progreso, desbloqueado, esNodoActual) {
  const nodo = document.createElement("button");
  nodo.type = "button";
  nodo.className = "nodo-nivel";
  nodo.dataset.id = nivel.id;
  nodo.style.left = `${punto.x}px`;
  nodo.style.top = `${punto.y}px`;

  if (progreso.estadoGeneral === "completado") nodo.classList.add("nodo-nivel--completado");
  if (!desbloqueado) nodo.classList.add("nodo-nivel--bloqueado");
  if (esNodoActual) nodo.classList.add("nodo-nivel--actual");

  let iconoMostrado = nivel.icono;
  if (!desbloqueado) iconoMostrado = "fa-solid fa-lock";
  else if (progreso.estadoGeneral === "completado") iconoMostrado = "fa-solid fa-check";

  const etiqueta = esNodoActual
    ? `<span class="etiqueta-actual">${progreso.estadoGeneral === "en-progreso" ? "Continúa aquí" : "¡Empieza aquí!"}</span>`
    : "";

  nodo.innerHTML = `
    <i class="${iconoMostrado}"></i>
    <span class="nodo-nivel__numero">${nivel.id}</span>
    ${etiqueta}
  `;

  nodo.addEventListener("click", () => mostrarPopoverNivel(nodo, nivel, progreso, desbloqueado));
  return nodo;
}

// ===== RENDERIZADO DEL SENDERO COMPLETO =====
const elementoSendero = document.getElementById("sendero");
const elementoLineas = document.getElementById("senderoLineas");

function renderizarSendero() {
  ocultarPopoverNivel();
  elementoSendero.innerHTML = "";

  const datosPorNivel = niveles.map((nivel, indice) => ({
    nivel,
    progreso: calcularProgresoNivel(nivel),
    desbloqueado: nivelEstaDesbloqueado(indice),
  }));

  const indiceNivelActual = datosPorNivel.findIndex((d) => d.progreso.estadoGeneral !== "completado");
  const anchoContenedor = elementoSendero.clientWidth;
  const puntos = calcularPuntosSendero(niveles.length, anchoContenedor);
  const alturaTotal = puntos[puntos.length - 1].y + MARGEN_SUPERIOR;
  elementoSendero.style.height = `${alturaTotal}px`;

  datosPorNivel.forEach((datos, indice) => {
    const esNodoActual = indice === indiceNivelActual && datos.desbloqueado;
    const nodo = crearNodoNivel(datos.nivel, puntos[indice], datos.progreso, datos.desbloqueado, esNodoActual);
    elementoSendero.appendChild(nodo);
  });

  dibujarLineasSendero(elementoLineas, puntos, anchoContenedor, alturaTotal, indiceNivelActual);
}

// ===== POPOVER DE DETALLE DE NIVEL =====
const popoverNivel = document.getElementById("popoverNivel");

function construirContenidoPopover(nivel, progreso, desbloqueado) {
  if (!desbloqueado) {
    return `
      <button class="popover-nivel__cerrar" id="botonCerrarPopover"><i class="fa-solid fa-xmark"></i></button>
      <div class="popover-nivel__encabezado">
        <div class="popover-nivel__icono"><i class="fa-solid fa-lock"></i></div>
        <div>
          <div class="popover-nivel__eyebrow">Nivel ${nivel.id}</div>
          <div class="popover-nivel__titulo">${nivel.nombre}</div>
        </div>
      </div>
      <div class="popover-nivel__bloqueo">
        <i class="fa-solid fa-circle-info"></i>
        <span>Completa el 80% del nivel anterior para desbloquear este nivel.</span>
      </div>
    `;
  }

  let textoBoton = "Comenzar";
  let claseBoton = "";
  if (progreso.estadoGeneral === "completado") {
    textoBoton = "Revisitar";
    claseBoton = "boton-estado--completado";
  } else if (progreso.estadoGeneral === "en-progreso") {
    textoBoton = "Continuar";
  }

  const promedioEstrellas = Math.round(progreso.estrellasObtenidas / progreso.totalRetos);

  return `
    <button class="popover-nivel__cerrar" id="botonCerrarPopover"><i class="fa-solid fa-xmark"></i></button>
    <div class="popover-nivel__encabezado">
      <div class="popover-nivel__icono"><i class="${nivel.icono}"></i></div>
      <div>
        <div class="popover-nivel__eyebrow">Nivel ${nivel.id}</div>
        <div class="popover-nivel__titulo">${nivel.nombre}</div>
      </div>
    </div>
    <p class="popover-nivel__descripcion">${nivel.descripcion}</p>
    <div class="bloque-progreso">
      <div class="barra-progreso">
        <div class="barra-progreso__relleno" style="width: ${progreso.porcentaje}%"></div>
      </div>
      <div class="texto-progreso">${progreso.retosCompletados} / ${progreso.totalRetos} retos completados (${progreso.porcentaje}%)</div>
      <div class="bloque-estrellas">${generarEstrellasHtml(promedioEstrellas)} ${progreso.estrellasObtenidas} / ${progreso.estrellasMaximas}</div>
    </div>
    <button class="boton-estado popover-nivel__boton ${claseBoton}">${textoBoton}</button>
    <div class="lista-retos">
      ${nivel.retos.map((reto) => `
        <div class="fila-reto">
          <span class="fila-reto__nombre">
            ${iconoPorEstadoReto[reto.estado]}
            ${reto.nombre}
          </span>
          <span class="fila-reto__estrellas">${reto.estrellas > 0 ? generarEstrellasHtml(reto.estrellas) : "-"}</span>
        </div>
      `).join("")}
    </div>
  `;
}

function mostrarPopoverNivel(nodo, nivel, progreso, desbloqueado) {
  popoverNivel.innerHTML = construirContenidoPopover(nivel, progreso, desbloqueado);
  popoverNivel.classList.add("visible");
  document.getElementById("botonCerrarPopover").addEventListener("click", ocultarPopoverNivel);

  const botonAccion = popoverNivel.querySelector(".popover-nivel__boton");
  if (botonAccion && datosNiveles[nivel.id]) {
    const indiceProximoReto = nivel.retos.findIndex((r) => r.estado !== "completado");
    const numeroReto = indiceProximoReto === -1 ? 1 : indiceProximoReto + 1;
    botonAccion.addEventListener("click", () => { window.location.href = `reto.html?nivel=${nivel.id}&reto=${numeroReto}`; });
  }

  const posicionNodo = nodo.getBoundingClientRect();
  requestAnimationFrame(() => {
    const anchoPopover = popoverNivel.offsetWidth;
    const altoPopover = popoverNivel.offsetHeight;

    let izquierda = posicionNodo.left + posicionNodo.width / 2 - anchoPopover / 2;
    izquierda = Math.max(16, Math.min(izquierda, window.innerWidth - anchoPopover - 16));

    let arriba = posicionNodo.top - altoPopover - 16;
    if (arriba < 16) arriba = posicionNodo.bottom + 16;

    popoverNivel.style.left = `${izquierda}px`;
    popoverNivel.style.top = `${arriba}px`;
  });
}

function ocultarPopoverNivel() {
  popoverNivel.classList.remove("visible");
}

window.addEventListener("scroll", ocultarPopoverNivel);
document.addEventListener("click", (evento) => {
  const clickEnPopover = popoverNivel.contains(evento.target);
  const clickEnNodo = evento.target.closest(".nodo-nivel");
  if (popoverNivel.classList.contains("visible") && !clickEnPopover && !clickEnNodo) {
    ocultarPopoverNivel();
  }
});

// ===== REDIBUJAR AL CAMBIAR EL TAMAÑO DE VENTANA =====
let temporizadorRedimension;
window.addEventListener("resize", () => {
  clearTimeout(temporizadorRedimension);
  temporizadorRedimension = setTimeout(renderizarSendero, 150);
});

renderizarSendero();
