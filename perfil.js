// Pantalla de Perfil (RF-014): datos personales, nivel, estadísticas,
// gráfico de progreso reciente, historial de retos y medallas destacadas.

function renderizarInfoPersonal() {
  document.getElementById("letraAvatar").textContent = nombreJugador.charAt(0).toUpperCase();
  document.getElementById("textoNombrePerfil").textContent = nombreJugador;

  const fechaInscripcion = localStorage.getItem("dq_fecha_inscripcion");
  document.getElementById("textoFechaInscripcion").textContent = fechaInscripcion
    ? `Miembro desde el ${new Date(fechaInscripcion).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" })}`
    : "Miembro desde -";
}

document.getElementById("botonEditarNombre").addEventListener("click", () => {
  const nuevoNombre = prompt("¿Cómo quieres que te llamemos?", nombreJugador);
  if (!nuevoNombre || !nuevoNombre.trim()) return;
  localStorage.setItem("dq_nombre_jugador", nuevoNombre.trim());
  window.location.reload();
});

function renderizarNivelYProgreso() {
  const { nivel, xpEnNivel, xpParaSiguiente } = calcularNivelUsuario(obtenerXpTotal());
  const porcentajeXp = Math.round((xpEnNivel / xpParaSiguiente) * 100);

  document.getElementById("textoNivelGrande").textContent = nivel;
  document.getElementById("barraXpPerfil").style.width = `${porcentajeXp}%`;
  document.getElementById("textoXpPerfil").textContent = `${xpEnNivel} / ${xpParaSiguiente} XP`;

  aplicarProgresoReal();
  const nivelesCompletados = niveles.filter((n) => calcularProgresoNivel(n).estadoGeneral === "completado").length;
  const porcentajeNiveles = Math.round((nivelesCompletados / niveles.length) * 100);
  document.getElementById("textoProgresoNiveles").textContent =
    `${nivelesCompletados} de ${niveles.length} niveles completados (${porcentajeNiveles}%)`;
}

function renderizarEstadisticas() {
  const stats = calcularEstadisticasUsuario();
  document.getElementById("statRetosCompletados").textContent = stats.totalCompletados;
  document.getElementById("statPromedioPuntuacion").textContent = stats.promedioPuntuacion;
  document.getElementById("statTotalEstrellas").textContent = stats.totalEstrellas;
  document.getElementById("statMedallas").textContent = `${stats.totalMedallas} / ${CATALOGO_MEDALLAS.length}`;
  document.getElementById("statTiempoTotal").textContent = formatearDuracion(stats.tiempoTotalMs);
  document.getElementById("statVelocidad").textContent = stats.velocidadPorSemana;
}

function renderizarGraficoSemanas(historial) {
  const buckets = agruparCompletadosPorSemana(historial, 4);
  const maximo = Math.max(1, ...buckets.map((b) => b.cantidad));

  document.getElementById("graficoSemanas").innerHTML = buckets.map((b) => `
    <div class="barra-semana">
      <div class="barra-semana__valor">${b.cantidad}</div>
      <div class="barra-semana__columna" style="height: ${Math.round((b.cantidad / maximo) * 100)}%"></div>
      <div class="barra-semana__etiqueta">${b.etiqueta}</div>
    </div>
  `).join("");
}

function renderizarHistorial(historial) {
  const cuerpo = document.getElementById("cuerpoHistorial");
  const textoVacio = document.getElementById("textoHistorialVacio");

  if (historial.length === 0) {
    cuerpo.innerHTML = "";
    textoVacio.style.display = "block";
    return;
  }
  textoVacio.style.display = "none";

  cuerpo.innerHTML = historial.slice(0, 20).map((reto) => `
    <tr>
      <td>Nivel ${reto.nivelId}, Reto ${reto.numeroReto}: ${reto.nombreReto}</td>
      <td>${reto.puntos ?? "-"}</td>
      <td>${"★".repeat(reto.estrellas)}${"☆".repeat(3 - reto.estrellas)}</td>
      <td>${reto.fecha ? new Date(reto.fecha).toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" }) : "-"}</td>
      <td>${formatearDuracion(reto.duracionMs)}</td>
    </tr>
  `).join("");
}

// ===== GALERÍA COMPLETA DE MEDALLAS (RF-009), fusionada aquí desde la
// antigua pantalla independiente de Medallas =====
function formatearFechaMedalla(iso) {
  return new Date(iso).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" });
}

function renderizarGaleriaMedallas(filtro) {
  verificarMedallasNuevas();
  const desbloqueadas = obtenerMedallasDesbloqueadas();
  const totalDesbloqueadas = Object.keys(desbloqueadas).length;

  document.getElementById("textoResumenMedallas").textContent = `Has desbloqueado ${totalDesbloqueadas} de ${CATALOGO_MEDALLAS.length} medallas`;
  document.getElementById("barraMedallas").style.width = `${Math.round((totalDesbloqueadas / CATALOGO_MEDALLAS.length) * 100)}%`;

  const medallasFiltradas = CATALOGO_MEDALLAS.filter((medalla) => {
    if (filtro === "desbloqueadas") return !!desbloqueadas[medalla.id];
    if (filtro === "bloqueadas") return !desbloqueadas[medalla.id];
    return true;
  });

  document.getElementById("gridMedallas").innerHTML = medallasFiltradas.map((medalla) => {
    const fechaDesbloqueo = desbloqueadas[medalla.id];
    const estaDesbloqueada = !!fechaDesbloqueo;

    return `
      <div class="tarjeta-medalla ${estaDesbloqueada ? "tarjeta-medalla--desbloqueada" : "tarjeta-medalla--bloqueada"}">
        <div class="tarjeta-medalla__icono"><i class="${estaDesbloqueada ? medalla.icono : "fa-solid fa-lock"}"></i></div>
        <div class="tarjeta-medalla__nombre">${medalla.nombre}</div>
        <div class="tarjeta-medalla__dificultad">${medalla.dificultad}</div>
        ${estaDesbloqueada
          ? `<div class="tarjeta-medalla__fecha"><i class="fa-solid fa-calendar-check"></i> Desbloqueada el ${formatearFechaMedalla(fechaDesbloqueo)}</div>`
          : `<div class="tarjeta-medalla__requisito">${medalla.descripcion}</div>`}
      </div>
    `;
  }).join("");
}

document.querySelectorAll(".filtro-medallas__boton").forEach((boton) => {
  boton.addEventListener("click", () => {
    document.querySelectorAll(".filtro-medallas__boton").forEach((b) => b.classList.remove("filtro-medallas__boton--activo"));
    boton.classList.add("filtro-medallas__boton--activo");
    renderizarGaleriaMedallas(boton.dataset.filtro);
  });
});

// ===== CERTIFICADOS (RF-015) =====
// La generación de los PDF (obtenerNumeroCertificado, generarCertificadoPDF,
// obtenerNumeroCertificadoFase1, generarCertificadoFase1PDF) vive en
// certificados.js, compartida con reto.js.
function renderizarCertificadoFase1() {
  aplicarProgresoReal();
  const fase1Completa = [1, 2].every(
    (id) => calcularProgresoNivel(niveles.find((n) => n.id === id)).estadoGeneral === "completado"
  );
  const bloque = document.getElementById("bloqueCertificadoFase1");

  if (!fase1Completa) {
    bloque.innerHTML = `<p class="texto-vacio">Completa los Niveles 1 y 2 para desbloquear tu certificado de la Fase 1.</p>`;
    return;
  }

  bloque.innerHTML = `
    <p>¡Excelente! Completaste la Fase 1 de TEAM CODER EXPERIENCE: Fundamentos de HTML.</p>
    <button class="boton-estado" id="botonDescargarCertificadoFase1"><i class="fa-solid fa-download"></i> Descargar Certificado</button>
  `;

  document.getElementById("botonDescargarCertificadoFase1").addEventListener("click", () => {
    generarCertificadoFase1PDF();
    localStorage.setItem("dq_certificado_fase1_descargado", "true");
  });
}

function renderizarCertificado() {
  const nivelesCompletados = niveles.filter((n) => calcularProgresoNivel(n).estadoGeneral === "completado").length;
  const bloque = document.getElementById("bloqueCertificado");

  if (nivelesCompletados < niveles.length) {
    bloque.innerHTML = `<p class="texto-vacio">Completa los ${niveles.length} niveles para desbloquear tu certificado. Llevas ${nivelesCompletados} de ${niveles.length}.</p>`;
    return;
  }

  bloque.innerHTML = `
    <p>¡Felicidades! Completaste el programa completo de TEAM CODER EXPERIENCE.</p>
    <button class="boton-estado" id="botonDescargarCertificado"><i class="fa-solid fa-download"></i> Descargar Certificado</button>
  `;

  document.getElementById("botonDescargarCertificado").addEventListener("click", () => {
    generarCertificadoPDF();
    localStorage.setItem("dq_certificado_descargado", "true");
    const filtroActivo = document.querySelector(".filtro-medallas__boton--activo").dataset.filtro;
    renderizarGaleriaMedallas(filtroActivo);
  });
}

renderizarInfoPersonal();
renderizarNivelYProgreso();
renderizarEstadisticas();
const historialRetos = recopilarHistorialRetos();
renderizarGraficoSemanas(historialRetos);
renderizarHistorial(historialRetos);
renderizarGaleriaMedallas("todos");
renderizarCertificadoFase1();
renderizarCertificado();
