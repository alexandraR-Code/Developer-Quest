// Si ya hay un nombre guardado (RF-011: persiste entre sesiones en localStorage),
// no se vuelve a pedir: se entra directo al sendero de niveles.
if (localStorage.getItem("dq_nombre_jugador")) {
  window.location.href = "index.html";
}

const LONGITUD_MAXIMA_NOMBRE = 40;

document.getElementById("formularioBienvenida").addEventListener("submit", (evento) => {
  evento.preventDefault();

  const campoNombre = document.getElementById("campoNombre");
  const errorNombre = document.getElementById("errorNombre");
  const nombre = campoNombre.value.trim();

  if (!nombre) {
    errorNombre.textContent = "Escribe tu nombre para continuar.";
    errorNombre.classList.add("visible");
    return;
  }
  // El maxlength del HTML ya limita a 40 al escribir, pero un valor pegado o
  // inyectado por fuera del formulario podría saltárselo: se revalida aquí.
  if (nombre.length > LONGITUD_MAXIMA_NOMBRE) {
    errorNombre.textContent = `Tu nombre es muy largo (máximo ${LONGITUD_MAXIMA_NOMBRE} caracteres).`;
    errorNombre.classList.add("visible");
    return;
  }
  errorNombre.classList.remove("visible");

  localStorage.setItem("dq_nombre_jugador", nombre);
  localStorage.setItem("dq_fecha_inscripcion", new Date().toISOString());
  // Identificador único del jugador (RF-011): a diferencia del nombre, que dos
  // personas pueden repetir, este código no se repite. Se usará más adelante
  // para el sistema de código de acceso y para cualquier futuro backend.
  localStorage.setItem("dq_id_jugador", crypto.randomUUID());
  window.location.href = "index.html";
});
