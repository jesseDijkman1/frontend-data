function formatData(data) {

}

function findData(value, yearStart, yearEnd) {
  d3.json(`http://localhost:3000/data?q=${query}`).then(res => {
    console.log(res)
  })
}

const searchBtn = document.getElementById('sendQuery')

searchBtn.addEventListener('click', () => {
  var searchValue = document.getElementById('query').value;
  d3.json(`http://localhost:3000/data?q=${searchValue}`).then(res => {
    console.log(res)
  })

  var yearRangeStart;
  var yearRangeEnd;

})
