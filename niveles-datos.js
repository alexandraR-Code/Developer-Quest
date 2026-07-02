// Datos base de los 10 niveles, compartidos entre el sendero (index.html) y
// la pantalla de reto (reto.html). Todos los retos arrancan "no-iniciado":
// aplicarProgresoReal() sobrepone lo que el jugador completó de verdad,
// leyendo su progreso guardado en localStorage.

const niveles = [
  {
    id: 1,
    nombre: "Introducción a HTML",
    icono: "fa-solid fa-file-code",
    descripcion: "Estructura básica de documentos HTML.",
    retos: nombresRetosVacios(["Estructura HTML Básica", "Párrafos y Encabezados", "Crear Listas", "Insertar Imágenes", "Crear Enlaces"]),
  },
  {
    id: 2,
    nombre: "Estructuras HTML Avanzadas",
    icono: "fa-solid fa-sitemap",
    descripcion: "Elementos semánticos, formularios y tablas.",
    retos: nombresRetosVacios(["Elementos Semánticos", "Formularios Básicos", "Tablas", "Atributos Avanzados", "Validación HTML"]),
  },
  {
    id: 3,
    nombre: "Fundamentos CSS",
    icono: "fa-solid fa-palette",
    descripcion: "Colores, fuentes, espaciado y selectores.",
    retos: nombresRetosVacios(["Colores y Fondos", "Fuentes y Textos", "Espaciado", "Bordes y Sombras", "Selectores Avanzados"]),
  },
  {
    id: 4,
    nombre: "Layouts y Responsividad",
    icono: "fa-solid fa-table-cells-large",
    descripcion: "Flexbox, Grid y diseño adaptable.",
    retos: nombresRetosVacios(["Display Flex", "CSS Grid", "Posicionamiento", "Media Queries", "Diseño Responsivo"]),
  },
  {
    id: 5,
    nombre: "JavaScript Básico",
    icono: "fa-brands fa-js",
    descripcion: "Variables, operadores y condicionales.",
    retos: nombresRetosVacios(["Variables y Tipos", "Operadores", "Condicionales", "Bucles", "Funciones Simples"]),
  },
  {
    id: 6,
    nombre: "DOM e Interactividad",
    icono: "fa-solid fa-arrow-pointer",
    descripcion: "Selección y manipulación de elementos.",
    retos: nombresRetosVacios(["Seleccionar Elementos", "Modificar Contenido", "Eventos de Ratón", "Eventos de Teclado", "Manipulación de Clases"]),
  },
  {
    id: 7,
    nombre: "Funciones y Métodos",
    icono: "fa-solid fa-gears",
    descripcion: "Parámetros, retorno y arrow functions.",
    retos: nombresRetosVacios(["Función con Parámetros", "Retorno de Valores", "Arrow Functions", "Métodos de String", "Métodos de Array"]),
  },
  {
    id: 8,
    nombre: "Arrays y Objetos",
    icono: "fa-solid fa-layer-group",
    descripcion: "Estructuras de datos fundamentales.",
    retos: nombresRetosVacios(["Crear Arrays", "Métodos de Array", "Crear Objetos", "Propiedades y Métodos", "Iteración con for...of"]),
  },
  {
    id: 9,
    nombre: "Aplicaciones Web Dinámicas",
    icono: "fa-solid fa-rocket",
    descripcion: "Proyectos prácticos interactivos.",
    retos: nombresRetosVacios(["Lista de Tareas", "Calculadora", "Galería Interactiva", "Formulario Validado", "Aplicación de Notas"]),
  },
  {
    id: 10,
    nombre: "Proyecto Integrador Final",
    icono: "fa-solid fa-flag-checkered",
    descripcion: "Aplica todo lo aprendido en un proyecto final.",
    retos: nombresRetosVacios(["Planificación", "Estructura y Diseño", "Funcionalidad Dinámica", "Validación y Mejoras", "Presentación Final"]),
  },
];

function nombresRetosVacios(nombres) {
  return nombres.map((nombre) => ({ nombre, estado: "no-iniciado", estrellas: 0 }));
}

// Regla de negocio RN-001: un nivel se desbloquea cuando el anterior llega al 80%.
function calcularProgresoNivel(nivel) {
  const retosCompletados = nivel.retos.filter((r) => r.estado === "completado").length;
  const totalRetos = nivel.retos.length;
  const porcentaje = Math.round((retosCompletados / totalRetos) * 100);
  const estrellasObtenidas = nivel.retos.reduce((suma, r) => suma + r.estrellas, 0);
  const estrellasMaximas = totalRetos * 3;

  let estadoGeneral = "no-iniciado";
  if (retosCompletados === totalRetos) {
    estadoGeneral = "completado";
  } else if (retosCompletados > 0 || nivel.retos.some((r) => r.estado === "en-progreso")) {
    estadoGeneral = "en-progreso";
  }

  return { retosCompletados, totalRetos, porcentaje, estrellasObtenidas, estrellasMaximas, estadoGeneral };
}

function nivelEstaDesbloqueado(indiceNivel) {
  if (indiceNivel === 0) return true;
  const progresoAnterior = calcularProgresoNivel(niveles[indiceNivel - 1]);
  return progresoAnterior.porcentaje >= 80;
}

// reto.js guarda aquí el resultado real cada vez que se completa un reto.
// Esta función lo sobrepone a los datos de ejemplo antes de calcular nada.
function aplicarProgresoReal() {
  niveles.forEach((nivel) => {
    nivel.retos.forEach((reto, indice) => {
      const numeroReto = indice + 1;
      const estadoGuardado = localStorage.getItem(`dq_estado_nivel${nivel.id}_reto${numeroReto}`);
      if (!estadoGuardado) return;

      reto.estado = estadoGuardado;
      const estrellasGuardadas = localStorage.getItem(`dq_estrellas_nivel${nivel.id}_reto${numeroReto}`);
      if (estrellasGuardadas) reto.estrellas = parseInt(estrellasGuardadas, 10);
    });
  });
}
