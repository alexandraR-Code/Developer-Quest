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

// ===== CERTIFICADO DE FINALIZACIÓN (RF-015) =====
function obtenerNumeroCertificado() {
  let numero = localStorage.getItem("dq_certificado_numero");
  if (!numero) {
    const sufijo = Math.floor(10000 + Math.random() * 90000);
    numero = `TCE-${new Date().getFullYear()}-${sufijo}`;
    localStorage.setItem("dq_certificado_numero", numero);
  }
  return numero;
}

// No hay backend que emita una URL/QR de verificación real, así que el
// certificado no simula uno: solo lleva un número único de referencia.
function generarCertificadoPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const anchoPagina = doc.internal.pageSize.getWidth();
  const altoPagina = doc.internal.pageSize.getHeight();

  const numeroCertificado = obtenerNumeroCertificado();
  const fecha = new Date().toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" });

  const morado = [136, 30, 128];
  const moradoOscuro = [107, 23, 102];
  const amarillo = [249, 235, 29];
  const amarilloOscuro = [230, 214, 16];
  const gris = [100, 100, 100];

  // Aclara un color mezclándolo con blanco (simula opacidad sin depender
  // del plugin de transparencia de jsPDF).
  const aclarar = (color, factor) => color.map((c) => Math.round(c + (255 - c) * factor));
  const moradoMuySuave = aclarar(morado, 0.94);

  // ===== FONDO =====
  doc.setFillColor(...moradoMuySuave);
  doc.rect(0, 0, anchoPagina, altoPagina, "F");
  doc.setFillColor(255, 255, 255);
  doc.rect(4, 4, anchoPagina - 8, altoPagina - 8, "F");

  // ===== FRANJA LATERAL, en los colores del logo =====
  const anchoFranja = 46;
  const xFranja = anchoPagina - anchoFranja;
  doc.setFillColor(...morado);
  doc.rect(xFranja, 4, anchoFranja - 4, altoPagina - 8, "F");
  doc.setFillColor(...amarillo);
  doc.rect(xFranja, 26, anchoFranja - 4, 9, "F");

  // Marco fino alrededor del área de contenido (no invade la franja).
  doc.setDrawColor(...moradoMuySuave.map((c) => Math.max(0, c - 20)));
  doc.setLineWidth(0.3);
  doc.rect(9, 9, xFranja - 9 - 6, altoPagina - 18);

  // Sello circular dentro de la franja.
  const centroBadgeX = xFranja + (anchoFranja - 4) / 2;
  const centroBadgeY = 90;
  doc.setFillColor(...amarillo);
  doc.circle(centroBadgeX, centroBadgeY, 19, "F");
  doc.setDrawColor(255, 255, 255);
  doc.setLineWidth(1);
  doc.circle(centroBadgeX, centroBadgeY, 15.5, "S");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(...moradoOscuro);
  doc.text("PROGRAMA", centroBadgeX, centroBadgeY - 2, { align: "center" });
  doc.text("COMPLETO", centroBadgeX, centroBadgeY + 4, { align: "center" });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.text("FECHA DE EMISIÓN", centroBadgeX, altoPagina - 34, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  const fechaPartida = doc.splitTextToSize(fecha, anchoFranja - 10);
  doc.text(fechaPartida, centroBadgeX, altoPagina - 27, { align: "center" });

  // ===== CONTENIDO PRINCIPAL =====
  const margenIzq = 20;
  const anchoContenido = xFranja - margenIzq - 12;

  doc.addImage(LOGO_MOVILIS_BASE64, "PNG", margenIzq, 16, 13, 13);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...morado);
  doc.text("TEAM CODER EXPERIENCE", margenIzq + 17, 24.5);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(34);
  doc.setTextColor(...moradoOscuro);
  doc.text("CERTIFICADO", margenIzq, 56);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(15);
  doc.setTextColor(...morado);
  doc.text("DE FINALIZACIÓN", margenIzq, 65);

  doc.setDrawColor(...amarilloOscuro);
  doc.setLineWidth(1.2);
  doc.line(margenIzq, 70, margenIzq + 38, 70);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(...gris);
  doc.text("Se otorga a", margenIzq, 85);

  doc.setFont("times", "bolditalic");
  doc.setFontSize(30);
  doc.setTextColor(30, 30, 30);
  doc.text(nombreJugador, margenIzq, 102);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(...gris);
  const cuerpo = doc.splitTextToSize(
    "En reconocimiento por completar exitosamente el programa TEAM CODER EXPERIENCE, demostrando dedicación y compromiso en el desarrollo de sus habilidades de programación web.",
    anchoContenido
  );
  doc.text(cuerpo, margenIzq, 114);

  // ===== FIRMA =====
  const yFirma = altoPagina - 40;
  doc.setDrawColor(...moradoOscuro);
  doc.setLineWidth(0.7);
  doc.lines([[7, -5], [7, 7], [9, -9], [7, 6]], margenIzq, yFirma - 6);

  doc.setDrawColor(160, 160, 160);
  doc.setLineWidth(0.3);
  doc.line(margenIzq, yFirma + 4, margenIzq + 58, yFirma + 4);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(30, 30, 30);
  doc.text("MSc. Patricia Ruiz", margenIzq, yFirma + 10);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...gris);
  doc.text("Rectora", margenIzq, yFirma + 15);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...gris);
  doc.text("N° DE CERTIFICADO", margenIzq + 95, yFirma + 4);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(30, 30, 30);
  doc.text(numeroCertificado, margenIzq + 95, yFirma + 10);

  doc.save(`TeamCoderExperience_Certificado_${nombreJugador.replace(/\s+/g, "_")}.pdf`);
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
renderizarCertificado();
