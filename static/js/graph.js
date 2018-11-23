let search = document.getElementById('query');
let startYear = document.getElementById('yearStart');
let endYear = document.getElementById('yearEnd');

const searchBtn = document.getElementById('sendQuery');

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

searchBtn.addEventListener('click', requestData)
  function requestData() {

    if (!search.value) {
      return alert('Please enter a search value')
    }

    checkYears(startYear, endYear);

    d3.json(`http://localhost:3000/data?q=${search.value}&ys=${startYear.value}&ye=${endYear.value}`).then(res => {
        formatData(res)
      })
}

let data;
let allGenres = [];
let displayableData = [];

// var svgWidth = 800;
function calcProperties(attr) {
  let prop = d3.select('#chart-container').style(attr);

  prop = Math.floor(prop.replace('px', ''));
  return prop;
}

// function calcHeight() {
//   let containerHeight = d3.select('#chart-container').style('height');
//
//   containerHeight = Math.floor(containerHeight.replace('px', ''));
//   console.log(containerHeight)
//   return containerHeight;
// }

var svgWidth = calcProperties('width')
var svgHeight = calcProperties('height')
// var svgHeight = d3.select('#chart-container').style('height')
var svgPadding = 40;


const colorScale = d3.scaleOrdinal(d3.schemeSpectral[11]);

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

const resetBtn = d3.select('#chart-container')
  .append('button')
  .text("Reset")
  .attr('id', 'reset')
  .on('click', reset)

const svg = d3.select('#chart-container')
  .append('svg')
  .attr('width', svgWidth)
  .attr('height', svgHeight)
  // .style('border', 'solid 1px');


svg.append('g')
  .classed('x-axis', true)
  .attr('transform', `translate(0, ${svgHeight - svgPadding})`)
  .call(xAxis);

svg.append('g')
  .classed('y-axis', true)
  .attr('transform', `translate(${svgPadding}, 0)`)
  .call(yAxis);

const allData = (all) => all.map(d => d.value.data).flat();

const filter = {
  memory: null,
  initial: (all) => {
    let selectFilter = d3.select('#main-filter')._groups[0][0];
    let options = selectFilter.options;
    let index = options.selectedIndex;
    let selectVal = options[index].value;

    if (selectVal == 'top_3') {
      return all.filter((d, i) => i <= 2);
    }

    if (selectVal == 'bottom_3') {
      return all.filter((d, i, a) => i >= a.length - 3);
    }

    if (selectVal == 'none') {
      return all
    }
  },
  single: (resetTarget) => {
    if (resetTarget._groups) {

      d3.selectAll(resetTarget._groups[0]).each((d, i, nodes) => {

        d3.select(nodes[i])
          .classed('selected', true);

        d3.select('path.showOnly')
          .classed('showOnly', false);

        displayableData.push(d)
        sortData(displayableData)
      })
      updateGraph()
    } else {

      let target = d3.event.target;
      let genre = target.value;
      let parent = d3.select(target.parentNode)
      let index = displayableData.findIndex(d => d.key == genre);

      if (parent.classed('selected')) {

        parent.classed('selected', false)
      } else {

        parent.classed('selected', true)
      }

      if (index >= 0) {

        displayableData.splice(index, 1);
      } else {

        displayableData.push(data.find(d => d.key === genre))
        sortData(displayableData)
      }
      filter.memory = displayableData;
      updateGraph()
    }
  },
  allButOne: () => {
    let target = d3.select(d3.event.target);
    let genre = target.attr('data-genre');
    let targetData = displayableData.find(d => d.key === genre);

    if (target.classed('showOnly')) {

      displayableData = filter.memory;

      target.classed('showOnly', false)

      displayableData.forEach(d => {
        legend.select(`li[data-genre=${d.key}]`)
          .classed('selected', true)
      })

    } else {

      filter.memory = displayableData;
      displayableData = [targetData]

      legend.selectAll('li.selected')
        .classed('selected', false);

      legend.select(`li[data-genre=${genre}]`)
        .classed('selected', true)
    }

    updateGraph()
  }
}

function sortData(all) {
  all = all.sort((d1, d2) => {
    return d3.descending(d1.value.totalAmt, d2.value.totalAmt)
  })
}

function formatData(r) {
  allGenres = [];
  displayableData = [];

  filter.memory = null;

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

  data = d3.nest()
    .key(d => d)
    .rollup(v => {
      return {
        data: data.map(d => d.value.find(dv => dv.genre == v[0])),
        totalAmt: d3.sum(data.map(d => d.value.find(dv => dv.genre == v[0])), l => l.amt)
      }
    })
    .entries(allGenres);

  legend.selectAll('li').remove()

  sortData(data)

  data = filter.initial(data)

  displayableData = displayableData.concat(data)

  colorScale.domain(allGenres)

  xAxis.ticks(d3.max(allData(data), d => d.year) - d3.min(allData(data), d => d.year))



  newGraph()
}

function reset() {
  filter.single(legend.selectAll('li:not(.selected)'))
}

d3.se

function highlight() {
  let target = d3.select(d3.event.target);
  let genre = target.attr('data-genre');
  let fill = target.attr('fill');
  let elClass = target.attr('class');

  d3.selectAll(`.${elClass}`)
    .style('opacity', 0.2);

  d3.select(d3.event.target)
    .attr('fill', colorScale(genre))
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

  d3.select('#main-filter')
    .on('change', () => {
      requestData()
    })



  xScale.domain([d3.min(allData(displayableData), d => d.year), d3.max(allData(displayableData), d => d.year)])

  yScale.domain([0, d3.max(allData(data), d => d.amt)].reverse())

  area.y0(yScale(0))

  d3.select('.x-axis')
    .transition()
    .call(xAxis)


  d3.select('.y-axis')
    .transition()
    .call(yAxis);

  svg.selectAll('path.area-chart')
    .remove();

  svg.selectAll('path.area-chart')
    .data(displayableData)
    .enter()
    .append('path')
      .classed('area-chart', true)
      .attr('data-genre', d => d.key)
      .attr('fill', 'rgba(255,255,255,.2)')
      .attr('stroke', d => colorScale(d.key))
      .attr('stroke-width', 2)
      .attr('d', d => area(d.value.data))


  svg.selectAll('path.area-chart')
    .on('mouseover', highlight)
    .on('click', filter.allButOne)

}

function updateGraph() {

  updateLegend()

  xScale.domain([d3.min(allData(data), d => d.year), d3.max(allData(data), d => d.year)])

  yScale.domain([0, d3.max(allData(displayableData), d => d.amt)].reverse())

  area.y0(yScale(0))

  d3.select('.x-axis')
    .transition()
    .call(xAxis);

  d3.select('.y-axis')
    .transition()
    .call(yAxis);

  svg.selectAll('path.area-chart')
    .data(displayableData)
    .enter()
    .append('path')
    .classed('area-chart', true)
    .attr('fill', 'rgba(255,255,255,.2)')


  svg.selectAll('path.area-chart')
    .data(displayableData)
    .exit()
    .remove()

  svg.selectAll('path.area-chart')
    .data(displayableData)
    .transition()
    .attr('data-genre', d => d.key)
    .attr('stroke', d => colorScale(d.key))
    .attr('d', d => area(d.value.data))

  if (displayableData.length === 1) {
    svg.select('path.area-chart')
      .classed('showOnly', true)
  }

  svg.selectAll('path.area-chart')
    .on('mouseover', highlight)
    .on('click', filter.allButOne)

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
    .style('background-color', d => colorScale(d.key))

  genreLabel
    .append('span')
    .text(d => d.key)

  legendGenre.append('input')
    .attr('id', d => d.key)
    .attr('type', 'checkbox')
    .style('display', 'none')
    .property('checked', true)
    .attr('value', d => d.key)
    .on('change', filter.single)
}
