require('dotenv').config()

const express = require('express');
const fs = require('fs')
const cors = require('cors');
const OBA = require('oba-api');

const port = 3000;

const client = new OBA({
  public: process.env.PUBLIC,
  secret: process.env.SECRET
});

function refineData(token) {

  return new Promise((resolve, reject) => {

    client.get('refine', {
      rctx: token,
      count: 39,
      facets: 'Genre'
    }).then(data => {

      resolve(JSON.parse(data))
    })
    .catch(err => {

      reject('Error while refining data')
    })
  })
}

function getData(query, year) {

  return new Promise((resolve, reject) => {

    client.get('search', {
      q: query,
      librarian: 'true',
      refine: 'true',
      facet: [`pubYear(${year})`, `type(book)`],
      pagesize: 1
    }).then(data => {

      resolve(data)
    })
    .catch(err => {
      reject(err)
    })
  })
  }

function makeRequests(search, yearRange) {
  return new Promise((resolve1, reject1) => {
    let promises = [];

    for (let j = yearRange.start; j <= yearRange.end; j++) {
      promises.push(new Promise((resolve2, reject2) => {

        getData(search, j).then(data1 => {
          refineData(JSON.parse(data1).aquabrowser.meta.rctx).then(data2 => {

            data2.aquabrowser.year = j;

            resolve2(data2)

          }).catch(err => console.log(err))

        }).catch(err => console.log(err))
      }))
    }

    Promise.all(promises).then(vals => {
      resolve1(vals)
    })
  })
}


function defineRanges(startingYear, endingYear) {
  let yearRanges = []
  let rangesAmount = Math.floor((endingYear - startingYear) / 20);

  for (let i = 0; i <= rangesAmount; i++) {
    let newRangeStart = startingYear + i * 20;
    let newRangeEnd;

    if ((newRangeStart + 19) > endingYear) {
      newRangeEnd = endingYear
    } else {
      newRangeEnd = newRangeStart + 19
    }
    yearRanges.push({start: newRangeStart, end: newRangeEnd})

  }
  return yearRanges
}

const app = express();

app.use(cors());
app.use(express.static('static'));

app.get('/', (req, res) => res.sendFile('/index.html', {root: __dirname }));

app.get('/data', (req, res) => {
  let data = [];
  let i = 0;
  let search = req.query.q;
  let startingYear = parseInt(req.query.ys);
  let endingYear = parseInt(req.query.ye);
  let yearRanges = defineRanges(startingYear, endingYear)

  function nextYears() {
      i++
      waiter()
  }

  function waiter() {
    makeRequests(search, yearRanges[i]).then(val => {
      data = data.concat(val)
      if (i < yearRanges.length - 1) {
        nextYears()
      } else {
        res.send(data)
      }

    })
  }
  waiter()

})

app.listen(3000, () => {
  console.log('Listening to port 3000');
});
