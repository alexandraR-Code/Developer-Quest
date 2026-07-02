// Agregación de estadísticas e historial para la pantalla de Perfil (RF-014),
// leyendo el detalle que reto.js guarda por reto completado en localStorage.

function recopilarHistorialRetos() {
  aplicarProgresoReal();
  const historial = [];

  niveles.forEach((nivel) => {
    nivel.retos.forEach((reto, indice) => {
      if (reto.estado !== "completado") return;
      const numeroReto = indice + 1;

      const puntos = parseInt(localStorage.getItem(`dq_puntos_nivel${nivel.id}_reto${numeroReto}`), 10);
      const duracionMs = parseInt(localStorage.getItem(`dq_duracion_nivel${nivel.id}_reto${numeroReto}`), 10);

      historial.push({
        nivelId: nivel.id,
        numeroReto,
        nombreReto: reto.nombre,
        estrellas: reto.estrellas,
        puntos: Number.isNaN(puntos) ? null : puntos,
        fecha: localStorage.getItem(`dq_fecha_nivel${nivel.id}_reto${numeroReto}`) || null,
        duracionMs: Number.isNaN(duracionMs) ? null : duracionMs,
      });
    });
  });

  historial.sort((a, b) => new Date(b.fecha || 0) - new Date(a.fecha || 0));
  return historial;
}

function calcularEstadisticasUsuario() {
  const historial = recopilarHistorialRetos();

  const puntosValidos = historial.map((r) => r.puntos).filter((p) => p !== null);
  const promedioPuntuacion = puntosValidos.length > 0
    ? Math.round(puntosValidos.reduce((suma, p) => suma + p, 0) / puntosValidos.length)
    : 0;

  const tiempoTotalMs = historial.map((r) => r.duracionMs).filter((d) => d !== null).reduce((suma, d) => suma + d, 0);
  const totalEstrellas = historial.reduce((suma, r) => suma + (r.estrellas || 0), 0);
  const totalMedallas = Object.keys(obtenerMedallasDesbloqueadas()).length;

  const fechas = historial.map((r) => r.fecha).filter(Boolean).map((f) => new Date(f).getTime());
  let velocidadPorSemana = 0;
  if (fechas.length > 0) {
    const semanasTranscurridas = Math.max(1, (Date.now() - Math.min(...fechas)) / (7 * 24 * 60 * 60 * 1000));
    velocidadPorSemana = Math.round((historial.length / semanasTranscurridas) * 10) / 10;
  }

  return {
    totalCompletados: historial.length,
    promedioPuntuacion,
    totalEstrellas,
    totalMedallas,
    tiempoTotalMs,
    velocidadPorSemana,
  };
}

function formatearDuracion(ms) {
  if (!ms || ms <= 0) return "-";
  const totalSegundos = Math.round(ms / 1000);
  const horas = Math.floor(totalSegundos / 3600);
  const minutos = Math.floor((totalSegundos % 3600) / 60);
  const segundos = totalSegundos % 60;

  if (horas > 0) return `${horas}h ${minutos}m`;
  if (minutos > 0) return `${minutos}m ${segundos}s`;
  return `${segundos}s`;
}

// Agrupa el historial en baldes semanales (la semana actual al final) para
// un gráfico simple de progreso a lo largo del tiempo.
function agruparCompletadosPorSemana(historial, semanas) {
  const DIA_MS = 24 * 60 * 60 * 1000;
  const hoy = new Date();
  const buckets = [];

  for (let i = semanas - 1; i >= 0; i--) {
    const inicioSemana = new Date(hoy.getTime() - i * 7 * DIA_MS);
    inicioSemana.setHours(0, 0, 0, 0);
    const finSemana = new Date(inicioSemana.getTime() + 7 * DIA_MS);

    const cantidad = historial.filter((r) => {
      if (!r.fecha) return false;
      const fecha = new Date(r.fecha);
      return fecha >= inicioSemana && fecha < finSemana;
    }).length;

    buckets.push({ etiqueta: i === 0 ? "Esta semana" : `Hace ${i} sem.`, cantidad });
  }

  return buckets;
}
