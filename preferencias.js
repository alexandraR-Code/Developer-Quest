// Preferencias del usuario (RF-016), persistidas en localStorage y aplicadas
// en todas las pantallas. Se carga antes que cualquier otro script de la
// página para aplicar el tema lo antes posible.

const CLAVE_PREF_TEMA = "dq_pref_tema";
const CLAVE_PREF_TAMANO_EDITOR = "dq_pref_tamano_editor";
const CLAVE_PREF_SONIDO = "dq_pref_sonido";
const CLAVE_PREF_VOLUMEN = "dq_pref_volumen";
const CLAVE_PREF_NOTIF_LOGROS = "dq_pref_notif_logros";

function obtenerPreferencias() {
  const volumenGuardado = localStorage.getItem(CLAVE_PREF_VOLUMEN);
  const tamanoGuardado = localStorage.getItem(CLAVE_PREF_TAMANO_EDITOR);

  return {
    tema: localStorage.getItem(CLAVE_PREF_TEMA) || "claro",
    tamanoFuenteEditor: tamanoGuardado ? parseInt(tamanoGuardado, 10) : 14,
    sonido: localStorage.getItem(CLAVE_PREF_SONIDO) !== "false",
    volumen: volumenGuardado !== null ? parseInt(volumenGuardado, 10) : 70,
    notificacionesLogros: localStorage.getItem(CLAVE_PREF_NOTIF_LOGROS) !== "false",
  };
}

function guardarPreferencia(clave, valor) {
  localStorage.setItem(clave, valor);
  if (clave === CLAVE_PREF_TEMA) aplicarTema();
}

function aplicarTema() {
  document.documentElement.setAttribute("data-tema", obtenerPreferencias().tema);
}

// Reproduce un tono corto de éxito con Web Audio (sin necesidad de archivos
// de audio); respeta las preferencias de sonido y volumen (RF-016.2).
function reproducirSonidoExito() {
  const prefs = obtenerPreferencias();
  if (!prefs.sonido || prefs.volumen === 0) return;

  try {
    const ContextoAudio = window.AudioContext || window.webkitAudioContext;
    const contexto = new ContextoAudio();
    const oscilador = contexto.createOscillator();
    const ganancia = contexto.createGain();

    oscilador.type = "sine";
    oscilador.frequency.setValueAtTime(880, contexto.currentTime);
    oscilador.frequency.exponentialRampToValueAtTime(1320, contexto.currentTime + 0.15);

    ganancia.gain.setValueAtTime((prefs.volumen / 100) * 0.2, contexto.currentTime);
    ganancia.gain.exponentialRampToValueAtTime(0.0001, contexto.currentTime + 0.4);

    oscilador.connect(ganancia);
    ganancia.connect(contexto.destination);
    oscilador.start();
    oscilador.stop(contexto.currentTime + 0.4);
  } catch (error) {
    // Algunos navegadores bloquean audio sin interacción previa del usuario: se ignora.
  }
}

aplicarTema();
