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
let filteredOut = [];
let allGenres = [];
let dataAll;

var svgWidth = 500;
var svgHeight = 500;
var svgPadding = 25;

const colorScaleLarge = d3.scaleOrdinal(d3.schemeSpectral[11]);
const colorScaleSmall = d3.scaleOrdinal(d3.schemeCategory10);

const xScale = d3.scaleTime()
  .domain([1999, 2018])
  .range([svgPadding, svgWidth - svgPadding]);

const yScale = d3.scaleLinear()
  .range([svgPadding, svgHeight - svgPadding])

const xAxis = d3.axisBottom(xScale)
  .tickFormat(d3.format('d'));

const yAxis = d3.axisLeft(yScale);

const line = d3.line()
  .x(d => xScale(d.year))
  .y(d => yScale(d.amt));

const area = d3.area()
  .x((d, i) => xScale(d.year))
  .y1(d => yScale(d.amt))

const legend = d3.select('aside#legend ul')
  .style('width', '200px')
  .style('min-height', `${svgHeight}px`)
  .style('border', 'solid 1px')

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

function groupAll(all) {

  dataAll = all.map(d => {
    let vals = (d.value.data) ? d.value.data : d.value;

    return vals.filter(dv => {

      if (!filteredOut.map(fd => fd.key).includes(d.key)) {
        return dv
      }
    })

  }).flat()
}

function sortData(all) {

  data = all.sort((d1, d2) => {
    return d3.descending(d1.value.totalAmt, d2.value.totalAmt)
  })
}

function formatData(r) {

  data = d3.nest()
    .key(d => d.aquabrowser.year)
    .rollup(v => {

      if (!v[0].aquabrowser.facets) {

        return {}

      } else {

        if (!Array.isArray(v[0].aquabrowser.facets.facet.value)) {

          return [{
            genre: v[0].aquabrowser.facets.facet.value.id,
            amt: parseInt(v[0].aquabrowser.facets.facet.value.count),
            year: v[0].aquabrowser.year
          }]

        } else {

          return v[0].aquabrowser.facets.facet.value.map(d => {

            return {
              genre: d.id,
              amt: parseInt(d.count),
              year: v[0].aquabrowser.year
            }

          })
        }
      }
    })
    .entries(r)

  let allYears = data.map(d => d.key);

  data.forEach(d => {

    if (Array.isArray(d.value)) {

      d.value.forEach(v => {

        if (!allGenres.includes(v.genre)) {

          allGenres.push(v.genre);
        }
      })
    } else if (d.value.genre) {

      allGenres.push(d.value.genre)
    }
  })

  allGenres.forEach(genre => {

    data.forEach(d => {

      if (Array.isArray(d.value)) {

        if (!d.value.find(dv => dv.genre == genre)) {

            d.value.push({
              genre: genre,
              amt: 0,
              year: parseInt(d.key)
            })

          }
      } else {

        if (!d.value.genre) {

          d.value = [];

          d.value.push({
            genre: genre,
            amt: 0,
            year: parseInt(d.key)
          })

        }
      }
    })
  })

  groupAll(data)

  data = d3.nest()
    .key(d => d.genre)
    .rollup(v => {
      return {
        data: v,
        totalAmt: d3.sum(v, l => l.amt)
      }
    })
    .entries(dataAll);

  sortData(data)

  newGraph()

}

function highlight() {
  let target = d3.select(d3.event.target);
  let genre = target.attr('data-genre');
  let fill = target.attr('fill');
  let elClass = target.attr('class');

  d3.selectAll(`.${elClass}`)
    .style('opacity', 0.2);

  d3.select(d3.event.target)
    .attr('fill', genreColor(genre))
    .style('opacity', 1);

  legend.selectAll('li')
    .style('opacity', 0.2)

  legend.select(`li[data-genre=${genre}]`)
    .style('opacity', 1)

  d3.select(d3.event.target)
    .on('mouseleave', () => {
      d3.select(this)
        .attr('fill', fill);

      d3.selectAll(`.${elClass}`)
        .style('opacity', 1);

      legend.selectAll('li')
        .style('opacity', 1)
    })
}

function newGraph() {
  updateLegend()
  colorScaleLarge.domain(allGenres)
  colorScaleSmall.domain(allGenres)

  xScale.domain([d3.min(dataAll, d => d.year), d3.max(dataAll, d => d.year)])

  yScale.domain([0, d3.max(dataAll, d => d.amt)].reverse())

  area.y0(yScale(0))

  d3.select('.x-axis')
    .transition()
    .call(xAxis);

  d3.select('.y-axis')
    .transition()
    .call(yAxis);

  svg.selectAll('path.area-chart')
    .remove();

  svg.selectAll('path.area-chart')
    .data(data)
    .enter()
    .append('path')
      .classed('area-chart', true)
      .attr('data-genre', d => d.key)
      .attr('fill', 'rgba(255,255,255,.2)')
      .attr('stroke', d => genreColor(d.key))
      .attr('stroke-width', 2)
      .attr('d', d => area(d.value.data))

  svg.selectAll('path.area-chart')
    .on('mouseover', highlight)

}

function genreColor(d) {
  if (data.length < 10) {
    return colorScaleSmall(d)
  } else {
    return colorScaleLarge(d)
  }
}

function updateGraph() {
  updateLegend()
  xScale.domain([d3.min(dataAll, d => d.year), d3.max(dataAll, d => d.year)])

  yScale.domain([0, d3.max(dataAll, d => d.amt)].reverse())

  area.y0(yScale(0))

  d3.select('.x-axis')
    .transition()
    .call(xAxis);

  d3.select('.y-axis')
    .transition()
    .call(yAxis);

  svg.selectAll('path.area-chart')
    .transition()
    .attr('d', d => area(d.value.data))
}

function filterGraph(genre, action) {
  if (action === 'hide') {

    data.find((d, i) => {
      if (d.key === genre) {

        filteredOut.push(d)
        return data.splice(i, 1)
      }
    })

    groupAll(data)
    updateGraph()

    d3.select(`path.area-chart[data-genre=${genre}]`)
      .transition()
      .style('opacity', 0);

      return;
  }

  if (action === 'show') {

    filteredOut.find((d, i) => {
      if (d.key === genre) {

        data.push(d)
        return filteredOut.splice(i, 1)
      }
    })

    sortData(data)

    groupAll(data)
    updateGraph()

    d3.select(`path.area-chart[data-genre=${genre}]`)
      .transition()
      .style('opacity', 1);

      return;
  }

}

function legendFilter() {
  if (!d3.event.target.checked) {

    filterGraph(d3.event.target.value, 'hide')

    d3.select(d3.event.target.parentNode)
      .classed('selected', false)
  } else {

    filterGraph(d3.event.target.value, 'show')

    d3.select(d3.event.target.parentNode)
      .classed('selected', true)
  }
}

function updateLegend() {
  let legendGenre = legend.selectAll('li')
    .data(data)
    .enter()
    .append('li')
    .classed('selected', true)
    .attr('data-genre', d => d.key)

  let genreLabel = legendGenre.append('label')
    .attr('for', d => d.key)

  genreLabel
    .append('span')
    .classed('customCheckbox', true)
    .style('display', 'inline-block')
    .style('width', '10px')
    .style('height', '10px')
    .style('border', 'solid 1px')
    .style('background-color', d => genreColor(d.key))

  genreLabel
    .append('span')
    .text(d => d.key)

  legendGenre.append('input')
    .attr('id', d => d.key)
    .attr('type', 'checkbox')
    .style('display', 'none')
    .property('checked', true)
    .attr('value', d => d.key)
    .on('change', legendFilter)
}
