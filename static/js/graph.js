let search = document.getElementById('query');
let startYear = document.getElementById('yearStart');
let endYear = document.getElementById('yearEnd');

const searchBtn = document.getElementById('sendQuery')

const fallBackStart = new Date().getFullYear() - 10;
const fallBackEnd = new Date().getFullYear();

// const fallBackStart = 1920;
// const fallBackEnd = 1930;

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
  // .domain([])
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

    // console.log(data)
  // data = d3.nest()
  //   .key((d) => d.aquabrowser.year)
  //   .rollup(v => {
  //     if (!v[0].aquabrowser.facets) {
  //       return {}
  //     } else if (!v[0].aquabrowser.facets.facet.value.length) {
  //       return [{
  //         genre: v[0].aquabrowser.facets.facet.value.id,
  //         amt: parseInt(v[0].aquabrowser.facets.facet.value.count),
  //         year: v[0].aquabrowser.year
  //       }]
  //     } else {
  //         return v[0].aquabrowser.facets.facet.value.map(d => {
  //             return {
  //               genre: d.id,
  //               amt: parseInt(d.count),
  //               year: v[0].aquabrowser.year
  //             }
  //           })
  //     }
  //   })
  //   .entries(r);

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

  // data.forEach(d => {
  //   d.value.forEach(v => {
  //     if (v.genre) {
  //       if (!allGenres.includes(v.genre)) {
  //         allGenres.push(v.genre)
  //       }
  //     }
  //   })
  // })
  //

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

        // if (!d.value.genre || d.value.genre !== genre) {
        //   let tempSave = d.value.genre;
        //   console.log('lol',tempSave)
        //   // d.value.push({
        //   //   genre: genre,
        //   //   amt: 0,
        //   //   year: parseInt(d.key)
        //   // })
        // }

    //   }
    // })
  // })

  // console.log(data)
  // allGenres.forEach(g => {
  //   data.forEach(d => {
  //
  //     if (!d.value.find(dv => dv.genre == g)) {
  //       d.value.push({genre: g, amt: 0, year: parseInt(d.key)})
  //     }
  //   })
  // })
  //

  dataAll = data.map(d => d.value).flat()

  data = d3.nest()
    .key(d => d.genre)
    .rollup(v => {
      return {
        data: v,
        totalAmt: d3.sum(v, l => l.amt)
      }
    })
    .entries(dataAll);

    data.sort((d1, d2) => {
      return d3.descending(d1.value.totalAmt, d2.value.totalAmt)
    })

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

function strokeColor(d) {
  if (data.length < 10) {
    return colorScaleSmall(d)
  } else {
    return colorScaleLarge(d)
  }
}

function updateGraph() {
  // console.log(data)
  colorScaleLarge.domain(allGenres)
  colorScaleSmall.domain(allGenres)
  // console.log(dataAll)
  xScale.domain([d3.min(dataAll, d => d.year), d3.max(dataAll, d => d.year)])

  // area.y0(yScale(0))
  yScale.domain([0, d3.max(dataAll, d => d.amt)].reverse())
  // console.log(data)
  area.y0(yScale(0))
  d3.select('.x-axis')
    .transition()
    .call(xAxis);

  d3.select('.y-axis')
    .transition()
    .call(yAxis);

  svg.selectAll('path.area-chart')
    .remove();
    // console.log(data)
  svg.selectAll('path.area-chart')
    .data(data)
    .enter()
    .append('path')
      .classed('area-chart', true)
      .attr('fill', 'rgba(255,255,255,.2)')
      // .attr('data-lol', d => d.key)
      .attr('stroke', d => strokeColor(d.key))
      .attr('stroke-width', 2)
      .attr('d', d => area(d.value.data))
      .each(setStroke)

  function lightUp() {
    d3.event.preventDefault()
    d3.select(d3.event.target)
      .attr('fill', d => strokeColor(d.key))
  }

  function lightDown() {
    d3.event.preventDefault()
    d3.select(d3.event.target)
      .attr('fill', 'rgba(255,255,255,.2)')
  }

  svg.selectAll('path.area-chart')
    .on('mouseover', lightUp)
    .on('mouseleave', lightDown)
  // svg.selectAll('path.line-chart')
  //
}
