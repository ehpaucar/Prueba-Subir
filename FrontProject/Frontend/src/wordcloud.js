import * as d3 from 'd3';
import cloud from 'd3-cloud';

/**
 * Crea una nube de etiquetas en el elemento especificado
 * @param {string} elementId - El ID del elemento donde se renderizará la nube
 * @param {Array} words - Array de objetos con formato {text: string, value: number}
 * @param {Object} options - Opciones de configuración
 */
export function createWordCloud(elementId, words, options = {}) {
  const {
    width = 500,
    height = 300,
    padding = 5,
    rotate = 0,
    fontSize = word => Math.sqrt(word.value) * 5
  } = options;

  // Limpiar el contenedor si ya tiene contenido
  const container = d3.select(`#${elementId}`);
  container.selectAll("*").remove();

  // Colores para las palabras (colores de la bandera de Ecuador)
  const colors = ['#003893', '#FCD116', '#CE1126', '#003893', '#FCD116'];
  const colorScale = d3.scaleOrdinal(colors);

  // Configurar el layout de la nube
  const layout = cloud()
    .size([width, height])
    .words(words)
    .padding(padding)
    .rotate(() => rotate ? ~~(Math.random() * 2) * 90 : 0)
    .fontSize(fontSize)
    .on("end", draw);

  // Iniciar el cálculo del layout
  layout.start();

  // Función para dibujar la nube
  function draw(words) {
    // Crear el SVG si no existe
    const svg = container
      .append("svg")
      .attr("width", width)
      .attr("height", height)
      .attr("class", "word-cloud")
      .style("display", "block")
      .style("margin", "0 auto");

    // Agregar un grupo al SVG
    const group = svg.append("g")
      .attr("transform", `translate(${width / 2},${height / 2})`);

    // Dibujar las palabras
    group.selectAll("text")
      .data(words)
      .enter()
      .append("text")
      .style("font-size", d => `${d.size}px`)
      .style("font-family", "Impact, sans-serif")
      .style("fill", (d, i) => colorScale(i))
      .attr("text-anchor", "middle")
      .attr("transform", d => `translate(${d.x},${d.y}) rotate(${d.rotate})`)
      .text(d => d.text)
      .style("cursor", "pointer")
      .on("mouseover", function() {
        d3.select(this)
          .transition()
          .duration(200)
          .style("font-size", d => `${d.size * 1.2}px`);
      })
      .on("mouseout", function() {
        d3.select(this)
          .transition()
          .duration(200)
          .style("font-size", d => `${d.size}px`);
      });
  }
}
