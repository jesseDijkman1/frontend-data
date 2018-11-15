function findData(value, yearStart, yearEnd) {
  let data = d3.json(`http://localhost:3000/data?q=${query}`).then(res => {
    console.log(res)
  })
}

const searchBtn = document.getElementById('sendQuery')

searchBtn.addEventListener('click', () => {
  var searchValue = document.getElementById('query').value;
  var yearRangeStart;
  var yearRangeEnd;

})
