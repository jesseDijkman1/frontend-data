let search = document.getElementById('query');
let startYear = document.getElementById('yearStart');
let endYear = document.getElementById('yearEnd');

const searchBtn = document.getElementById('sendQuery')

const fallBackStart = new Date().getFullYear() - 10;
const fallBackEnd = new Date().getFullYear();

(function() {
  startYear.value = fallBackStart;
  endYear.value = fallBackEnd;
})();

function checkYears(start, end) {

  start.value = parseInt(start.value)
  end.value = parseInt(end.value)

  if (isNaN(start.value) || start.value.length < 4 || start.value >= fallBackEnd) {
    start.value = fallBackStart
  }

  if (isNaN(end.value) || end.value.length < 4 || end.value > fallBackEnd) {
    end.value = fallBackEnd
  }
}



searchBtn.addEventListener('click', () => {
  if (!search.value) {
    return alert('Please enter a search value')
  }

  checkYears(startYear, endYear);

  d3.json(`http://localhost:3000/data?q=${search.value}&ys=${startYear.value}&ye=${endYear.value}`).then(res => {
      formatData(res)
    })
})

// =============================
let data;
let allGenres = [];


var svgWidth = 500;
var svgHeight = 500;
var svgPadding = 25;

const colorScale = d3.scaleOrdinal(d3.schemeSpectral[11]);
const greyScale = d3.scaleOrdinal(d3.schemeGreys[9]);

const xScale = d3.scaleTime()
  .domain([1999, 2018])
  .range([svgPadding, svgWidth - svgPadding]);

const yScale = d3.scaleLinear()
  .domain([])
  .range([svgPadding, svgHeight - svgPadding])

const xAxis = d3.axisBottom(xScale)
  .tickFormat(d3.format('d'));

const yAxis = d3.axisLeft(yScale);

const line = d3.line()
  .x((d, i) => xScale(d.year))
  .y(d => yScale(d.amt))


const svg = d3.select('#chart-container')
  .append('svg')
  .attr('width', svgWidth)
  .attr('height', svgHeight)
  .style('border', 'solid 1px');


svg.append('g')
  .classed('x-axis', true)
  .attr('transform', `translate(0, ${svgHeight - svgPadding})`)
  .call(xAxis);

svg.append('g')
  .classed('y-axis', true)
  .attr('transform', `translate(${svgPadding}, 0)`)
  .call(yAxis);

function formatData(r) {
  data = d3.nest()
    .key((d) => d.aquabrowser.year)
    .rollup((v) => {
      return v[0].aquabrowser.facets.facet.value.map(d => {
          return {
            genre: d.id,
            amt: parseInt(d.count),
            year: v[0].aquabrowser.year
          }
        })
    })
    .entries(r);

  let allYears = data.map(d => d.key);
  // let allGenres = [];

  data.forEach(d => {
    d.value.forEach(v => {
      if (!allGenres.includes(v.genre)) {
        allGenres.push(v.genre)
      }
    })
  })

  // console.log(allGenres)

  allGenres.forEach(g => {
    data.forEach(d => {
      if (!d.value.find(dv => dv.genre == g)) {
        d.value.push({genre: g, amt: 0, year: parseInt(d.key)})
      }
    })
  })



  dataAll = data.map(d => d.value).flat()

// Not sure if I need this
  data = d3.nest()
    .key(d => d.genre)
    .rollup(v => v)
    .entries(dataAll);

  console.log(data)
  // let test = d3.sum(data)
  updateGraph()
}

function setStroke(data, index, elements) {
  if (index >= 11 && index < 22) {
    d3.select(elements[index])
      .attr('stroke-dasharray', ('3, 3'))
  } else if (index >= 22 && index < 33) {
    d3.select(elements[index])
      .attr('stroke-dasharray', ('15, 3'))
  } else if (index >= 33) {
    d3.select(elements[index])
      .attr('stroke-dasharray', ('25, 10'))
  }
}

function updateGraph() {
  // console.log(data)
  colorScale.domain(allGenres)

  xScale.domain([d3.min(dataAll, d => d.year), d3.max(dataAll, d => d.year)])

  yScale.domain([0, d3.max(dataAll, d => d.amt)].reverse())
  // console.log(data)

  d3.select('.x-axis')
    .transition()
    .call(xAxis);

  d3.select('.y-axis')
    .transition()
    .call(yAxis);

  svg.selectAll('path.line-chart')
    .remove()

  svg.selectAll('path')
    .data(data)
    .enter()
    .append('path')
      .classed('line-chart', true)
      .attr('fill', 'none')
      .attr('stroke', d => colorScale(d.key))
      .attr('stroke-width', 2)
      .attr('d', d => line(d.value));

  svg.selectAll('path.line-chart')
    .each(setStroke)
}
