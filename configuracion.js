// Pantalla de Configuración (RF-016): cada control guarda su preferencia de
// inmediato en localStorage, sin necesidad de un botón "Guardar".

const prefsActuales = obtenerPreferencias();

// ===== TEMA =====
const botonesTema = document.querySelectorAll(".selector-tema__opcion");

function marcarTemaActivo(tema) {
  botonesTema.forEach((boton) => boton.classList.toggle("selector-tema__opcion--activo", boton.dataset.tema === tema));
}

marcarTemaActivo(prefsActuales.tema);

botonesTema.forEach((boton) => {
  boton.addEventListener("click", () => {
    guardarPreferencia(CLAVE_PREF_TEMA, boton.dataset.tema);
    marcarTemaActivo(boton.dataset.tema);
  });
});

// ===== TAMAÑO DE FUENTE DEL EDITOR =====
const controlTamanoFuente = document.getElementById("controlTamanoFuente");
const valorTamanoFuente = document.getElementById("valorTamanoFuente");

controlTamanoFuente.value = prefsActuales.tamanoFuenteEditor;
valorTamanoFuente.textContent = `${prefsActuales.tamanoFuenteEditor}px`;

controlTamanoFuente.addEventListener("input", () => {
  valorTamanoFuente.textContent = `${controlTamanoFuente.value}px`;
  guardarPreferencia(CLAVE_PREF_TAMANO_EDITOR, controlTamanoFuente.value);
});

// ===== SONIDO Y VOLUMEN =====
const controlSonido = document.getElementById("controlSonido");
const controlVolumen = document.getElementById("controlVolumen");
const valorVolumen = document.getElementById("valorVolumen");

controlSonido.checked = prefsActuales.sonido;
controlVolumen.value = prefsActuales.volumen;
valorVolumen.textContent = `${prefsActuales.volumen}%`;

controlSonido.addEventListener("change", () => {
  guardarPreferencia(CLAVE_PREF_SONIDO, controlSonido.checked);
  if (controlSonido.checked) reproducirSonidoExito();
});

controlVolumen.addEventListener("input", () => {
  valorVolumen.textContent = `${controlVolumen.value}%`;
  guardarPreferencia(CLAVE_PREF_VOLUMEN, controlVolumen.value);
});

controlVolumen.addEventListener("change", () => {
  if (controlSonido.checked) reproducirSonidoExito();
});

// ===== NOTIFICACIONES DE LOGROS =====
const controlNotifLogros = document.getElementById("controlNotifLogros");
controlNotifLogros.checked = prefsActuales.notificacionesLogros;

controlNotifLogros.addEventListener("change", () => {
  guardarPreferencia(CLAVE_PREF_NOTIF_LOGROS, controlNotifLogros.checked);
});
