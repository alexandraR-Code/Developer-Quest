// Si ya hay un nombre guardado en esta sesión (pestaña abierta), no se vuelve
// a pedir: se entra directo al sendero de niveles.
if (sessionStorage.getItem("dq_nombre_jugador")) {
  window.location.href = "index.html";
}

document.getElementById("formularioBienvenida").addEventListener("submit", (evento) => {
  evento.preventDefault();

  const campoNombre = document.getElementById("campoNombre");
  const nombre = campoNombre.value.trim();
  if (!nombre) return;

  sessionStorage.setItem("dq_nombre_jugador", nombre);
  window.location.href = "index.html";
});
