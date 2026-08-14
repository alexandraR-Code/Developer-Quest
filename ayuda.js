// Pantalla de Ayuda: acordeón simple, cada pregunta se abre/cierra por
// separado. El estilo (.acordeon-ayuda, .item-ayuda...) vive en styles.css,
// compartido con el panel de pistas de reto.js.
document.querySelectorAll(".item-ayuda__boton").forEach((boton) => {
  boton.addEventListener("click", () => {
    boton.closest(".item-ayuda").classList.toggle("abierto");
  });
});
