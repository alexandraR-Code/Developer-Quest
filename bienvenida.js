// Si ya hay un nombre guardado (RF-011: persiste entre sesiones en localStorage),
// no se vuelve a pedir: se entra directo al sendero de niveles.
if (localStorage.getItem("dq_nombre_jugador")) {
  window.location.href = "index.html";
}

document.getElementById("formularioBienvenida").addEventListener("submit", (evento) => {
  evento.preventDefault();

  const campoNombre = document.getElementById("campoNombre");
  const nombre = campoNombre.value.trim();
  if (!nombre) return;

  localStorage.setItem("dq_nombre_jugador", nombre);
  localStorage.setItem("dq_fecha_inscripcion", new Date().toISOString());
  window.location.href = "index.html";
});
