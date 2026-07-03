// Generación de certificados en PDF (RF-015), compartida entre la pantalla
// de Perfil y la pantalla de Reto (para el aviso al completar la Fase 1).

// ===== CERTIFICADO DE FINALIZACIÓN =====
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
// Mismo diseño institucional que el certificado de la Fase 1, aplicado
// aquí con el contexto de cierre total del programa ("¡Finalizamos!").
function generarCertificadoPDF() {
  const nombreJugador = localStorage.getItem("dq_nombre_jugador");
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const anchoPagina = doc.internal.pageSize.getWidth();
  const altoPagina = doc.internal.pageSize.getHeight();
  const centroX = anchoPagina / 2;

  const numeroCertificado = obtenerNumeroCertificado();
  const fecha = new Date().toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" });

  const morado = [136, 30, 128];
  const moradoOscuro = [107, 23, 102];
  const dorado = [197, 160, 63];
  const gris = [100, 100, 100];

  const aclarar = (color, factor) => color.map((c) => Math.round(c + (255 - c) * factor));
  const moradoMuySuave = aclarar(morado, 0.95);

  // ===== FONDO Y TARJETA CON MARCO DORADO =====
  doc.setFillColor(...moradoMuySuave);
  doc.rect(0, 0, anchoPagina, altoPagina, "F");

  const margen = 8;
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(margen, margen, anchoPagina - margen * 2, altoPagina - margen * 2, 4, 4, "F");
  doc.setDrawColor(...dorado);
  doc.setLineWidth(0.9);
  doc.roundedRect(margen, margen, anchoPagina - margen * 2, altoPagina - margen * 2, 4, 4, "S");

  // ===== MARCA DE AGUA: isotipo Movilis, muy tenue, centrado en la tarjeta =====
  const tamanoMarcaAgua = 150;
  doc.saveGraphicsState();
  doc.setGState(new doc.GState({ opacity: 0.05 }));
  doc.addImage(
    LOGO_MOVILIS_OUTLINE_BASE64, "PNG",
    centroX - tamanoMarcaAgua / 2, altoPagina / 2 - tamanoMarcaAgua / 2,
    tamanoMarcaAgua, tamanoMarcaAgua
  );
  doc.restoreGraphicsState();

  // ===== ENCABEZADO: LOGOTIPO INSTITUTO SUPERIOR TECNOLÓGICO MOVILIS =====
  const anchoLogo = 92;
  const altoLogo = (anchoLogo * 271) / 829;
  doc.addImage(LOGO_MOVILIS_TEXTO_VIOLETA_BASE64, "PNG", centroX - anchoLogo / 2, 15, anchoLogo, altoLogo);

  doc.setDrawColor(...dorado);
  doc.setLineWidth(0.5);
  doc.line(centroX - 55, 50, centroX + 55, 50);

  // ===== TÍTULO =====
  doc.setFont("glacial indifference", "normal");
  doc.setFontSize(15);
  doc.setTextColor(...moradoOscuro);
  doc.text("OTORGA EL PRESENTE", centroX, 62, { align: "center" });

  doc.setFont("glacial indifference", "bold");
  doc.setFontSize(36);
  doc.setTextColor(...morado);
  doc.text("CERTIFICADO", centroX, 78, { align: "center" });

  doc.setFont("glacial indifference", "normal");
  doc.setFontSize(13);
  doc.setTextColor(...gris);
  doc.text("A", centroX, 87, { align: "center" });

  // ===== NOMBRE DEL ESTUDIANTE =====
  doc.setFont("griffiths", "bolditalic");
  doc.setFontSize(32);
  doc.setTextColor(...moradoOscuro);
  doc.text(nombreJugador, centroX, 105, { align: "center" });

  doc.setDrawColor(...dorado);
  doc.setLineWidth(0.4);
  doc.line(centroX - 75, 110, centroX + 75, 110);

  // ===== TEXTO MOTIVADOR: contexto de cierre total del programa =====
  doc.setFont("montserrat", "normal");
  doc.setFontSize(12.5);
  doc.setTextColor(...gris);
  const cuerpo = doc.splitTextToSize(
    "Por su dedicación, esfuerzo y constancia a lo largo de todo el recorrido, culminando con éxito la totalidad del programa:",
    170
  );
  doc.text(cuerpo, centroX, 122, { align: "center" });

  doc.setFont("Montserrat", "bold");
  doc.setFontSize(20);
  doc.setTextColor(...morado);
  doc.text("TEAM CODER EXPERIENCE", centroX, 138, { align: "center" });

  doc.setFont("questrial", "normal");
  doc.setFontSize(12.5);
  doc.setTextColor(...moradoOscuro);
  doc.text(`¡Finalizamos! · Niveles 1 al ${niveles.length} completados`, centroX, 146, { align: "center" });

  // ===== LUGAR Y FECHA =====
  doc.setFont("questrial", "bold");
  doc.setFontSize(11);
  doc.setTextColor(50, 50, 50);
  doc.text(`Quito, ${fecha}`, centroX, 160, { align: "center" });

  // ===== FIRMA =====
  const yFirma = altoPagina - 28;
  doc.setDrawColor(160, 160, 160);
  doc.setLineWidth(0.3);
  doc.line(centroX - 35, yFirma, centroX + 35, yFirma);

  doc.setFont("questrial", "bold");
  doc.setFontSize(11);
  doc.setTextColor(30, 30, 30);
  doc.text("MSc. Patricia Ruiz", centroX, yFirma + 5.5, { align: "center" });

  doc.setFont("times", "italic");
  doc.setFontSize(10);
  doc.setTextColor(...gris);
  doc.text("Rectora", centroX, yFirma + 10.5, { align: "center" });

  // ===== NÚMERO DE CERTIFICADO =====
  doc.setFont("questrial", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...gris);
  doc.text(`N° de certificado: ${numeroCertificado}`, margen + 6, altoPagina - margen - 4);

  doc.save(`TeamCoderExperience_Certificado_${nombreJugador.replace(/\s+/g, "_")}.pdf`);
}

// ===== CERTIFICADO DE FASE 1: FUNDAMENTOS DE HTML (NIVELES 1 Y 2) =====
// Reconoce el primer hito del programa, antes de completarlo por completo,
// para celebrar el avance temprano del jugador.
function obtenerNumeroCertificadoFase1() {
  let numero = localStorage.getItem("dq_certificado_fase1_numero");
  if (!numero) {
    const sufijo = Math.floor(10000 + Math.random() * 90000);
    numero = `TCE-F1-${new Date().getFullYear()}-${sufijo}`;
    localStorage.setItem("dq_certificado_fase1_numero", numero);
  }
  return numero;
}

function generarCertificadoFase1PDF() {
  const nombreJugador = localStorage.getItem("dq_nombre_jugador");
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const anchoPagina = doc.internal.pageSize.getWidth();
  const altoPagina = doc.internal.pageSize.getHeight();
  const centroX = anchoPagina / 2;

  const numeroCertificado = obtenerNumeroCertificadoFase1();
  const fecha = new Date().toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" });

  const morado = [136, 30, 128];
  const moradoOscuro = [107, 23, 102];
  const dorado = [197, 160, 63];
  const gris = [100, 100, 100];

  const aclarar = (color, factor) => color.map((c) => Math.round(c + (255 - c) * factor));
  const moradoMuySuave = aclarar(morado, 0.95);

  // ===== FONDO Y TARJETA CON MARCO DORADO =====
  doc.setFillColor(...moradoMuySuave);
  doc.rect(0, 0, anchoPagina, altoPagina, "F");

  const margen = 8;
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(margen, margen, anchoPagina - margen * 2, altoPagina - margen * 2, 4, 4, "F");
  doc.setDrawColor(...dorado);
  doc.setLineWidth(0.9);
  doc.roundedRect(margen, margen, anchoPagina - margen * 2, altoPagina - margen * 2, 4, 4, "S");

  // ===== MARCA DE AGUA: isotipo Movilis, muy tenue, centrado en la tarjeta =====
  const tamanoMarcaAgua = 150;
  doc.saveGraphicsState();
  doc.setGState(new doc.GState({ opacity: 0.05 }));
  doc.addImage(
    LOGO_MOVILIS_OUTLINE_BASE64, "PNG",
    centroX - tamanoMarcaAgua / 2, altoPagina / 2 - tamanoMarcaAgua / 2,
    tamanoMarcaAgua, tamanoMarcaAgua
  );
  doc.restoreGraphicsState();

  // ===== ENCABEZADO: LOGOTIPO INSTITUTO SUPERIOR TECNOLÓGICO MOVILIS =====
  const anchoLogo = 92;
  const altoLogo = (anchoLogo * 271) / 829;
  doc.addImage(LOGO_MOVILIS_TEXTO_VIOLETA_BASE64, "PNG", centroX - anchoLogo / 2, 15, anchoLogo, altoLogo);

  doc.setDrawColor(...dorado);
  doc.setLineWidth(0.5);
  doc.line(centroX - 55, 50, centroX + 55, 50);

  // ===== TÍTULO =====
  doc.setFont("glacial indifference", "normal");
  doc.setFontSize(15);
  doc.setTextColor(...moradoOscuro);
  doc.text("OTORGA EL PRESENTE", centroX, 62, { align: "center" });

  doc.setFont("glacial indifference", "bold");
  doc.setFontSize(36);
  doc.setTextColor(...morado);
  doc.text("CERTIFICADO", centroX, 78, { align: "center" });

  doc.setFont("glacial indifference", "normal");
  doc.setFontSize(13);
  doc.setTextColor(...gris);
  doc.text("A", centroX, 87, { align: "center" });

  // ===== NOMBRE DEL ESTUDIANTE =====
  doc.setFont("griffiths", "bolditalic");
  doc.setFontSize(32);
  doc.setTextColor(...moradoOscuro);
  doc.text(nombreJugador, centroX, 105, { align: "center" });

  doc.setDrawColor(...dorado);
  doc.setLineWidth(0.4);
  doc.line(centroX - 75, 110, centroX + 75, 110);

  // ===== TEXTO MOTIVADOR (en vez de "por haber culminado el programa...") =====
  doc.setFont("montserrat", "normal");
  doc.setFontSize(12.5);
  doc.setTextColor(...gris);
  const cuerpo = doc.splitTextToSize(
    "Por su dedicación, curiosidad y constancia al escribir sus primeras líneas de código, superando con entusiasmo la primera fase del programa:",
    170
  );
  doc.text(cuerpo, centroX, 122, { align: "center" });

  doc.setFont("Montserrat", "bold");
  doc.setFontSize(20);
  doc.setTextColor(...morado);
  doc.text("TEAM CODER EXPERIENCE", centroX, 138, { align: "center" });

  doc.setFont("questrial", "normal");
  doc.setFontSize(12.5);
  doc.setTextColor(...moradoOscuro);
  doc.text("Fase 1 · Fundamentos de HTML (Nivel 1 y 2)", centroX, 146, { align: "center" });

  // ===== LUGAR Y FECHA =====
  doc.setFont("questrial", "bold");
  doc.setFontSize(11);
  doc.setTextColor(50, 50, 50);
  doc.text(`Quito, ${fecha}`, centroX, 160, { align: "center" });

  // ===== FIRMA =====
  const yFirma = altoPagina - 28;
  doc.setDrawColor(160, 160, 160);
  doc.setLineWidth(0.3);
  doc.line(centroX - 35, yFirma, centroX + 35, yFirma);

  doc.setFont("questrial", "bold");
  doc.setFontSize(11);
  doc.setTextColor(30, 30, 30);
  doc.text("MSc. Patricia Ruiz", centroX, yFirma + 5.5, { align: "center" });

  doc.setFont("times", "italic");
  doc.setFontSize(10);
  doc.setTextColor(...gris);
  doc.text("Rectora", centroX, yFirma + 10.5, { align: "center" });

  // ===== NÚMERO DE CERTIFICADO =====
  doc.setFont("questrial", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...gris);
  doc.text(`N° de certificado: ${numeroCertificado}`, margen + 6, altoPagina - margen - 4);

  doc.save(`TeamCoderExperience_CertificadoFase1_${nombreJugador.replace(/\s+/g, "_")}.pdf`);
}
