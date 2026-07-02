// Lógica compartida del "shell" de la app (sidebar, guardián de sesión,
// saludo, insignia de nivel de usuario). La usan todas las pantallas que
// tienen el menú lateral: index.html, perfil.html, configuracion.html.

// Sin nombre de jugador no hay partida: se exige pasar por la bienvenida primero.
const nombreJugador = localStorage.getItem("dq_nombre_jugador");
if (!nombreJugador) {
  window.location.href = "bienvenida.html";
}

// ===== INSIGNIA DE NIVEL DE USUARIO (RF-008) =====
function renderizarInsigniaNivelUsuario() {
  if (!document.getElementById("textoNivelUsuario")) return;

  const { nivel, xpEnNivel, xpParaSiguiente } = calcularNivelUsuario(obtenerXpTotal());
  const porcentaje = Math.round((xpEnNivel / xpParaSiguiente) * 100);

  document.getElementById("textoNivelUsuario").textContent = nivel;
  document.getElementById("barraXpUsuario").style.width = `${porcentaje}%`;
  document.getElementById("textoXpUsuario").textContent = `${xpEnNivel} / ${xpParaSiguiente} XP`;
}

renderizarInsigniaNivelUsuario();

// ===== MENÚ LATERAL COLAPSABLE (<1200px) =====
const menuLateral = document.getElementById("menuLateral");
const fondoMenu = document.getElementById("fondoMenu");
const botonHamburguesa = document.getElementById("botonHamburguesa");

function alternarMenuLateral() {
  menuLateral.classList.toggle("menu-lateral--abierto");
  fondoMenu.classList.toggle("fondo-menu--visible");
}

botonHamburguesa.addEventListener("click", alternarMenuLateral);
fondoMenu.addEventListener("click", alternarMenuLateral);

document.querySelectorAll(".enlace-menu").forEach((enlace) => {
  enlace.addEventListener("click", (evento) => {
    if (enlace.dataset.vista === "salir") {
      evento.preventDefault();
      localStorage.clear();
      window.location.href = "bienvenida.html";
      return;
    }

    // Los enlaces que aún no tienen pantalla propia usan href="#": solo
    // marcan el ítem activo. Los que ya llevan a una página real navegan.
    if (enlace.getAttribute("href") === "#") {
      evento.preventDefault();
      document.querySelectorAll(".enlace-menu").forEach((e) => e.classList.remove("enlace-menu--activo"));
      enlace.classList.add("enlace-menu--activo");
    }

    if (window.innerWidth <= 1200) alternarMenuLateral();
  });
});
