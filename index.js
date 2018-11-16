const express = require('express');
const fs = require('fs')
const cors = require('cors');
require('dotenv').config()

const port = 3000;


const OBA = require('oba-api');

const client = new OBA({
  public: process.env.PUBLIC,
  secret: process.env.SECRET
});

function refineData(rctx) {
  return new Promise((resolve, reject) => {
    client.get('refine', {
      rctx: rctx,
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

    }).catch(err => {
      reject(err)
    })
  })
  }

function makeRequests(search, startingYr, endingYr) {
  return new Promise((resolve1, reject1) => {
    let promises = [];

    for (let j = startingYr; j <= endingYr; j++) {
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
let i;

const app = express();

app.use(cors());
app.use(express.static('static'));

// Open the home page
app.get('/', (req, res) => res.sendFile('/index.html', {root: __dirname }));

// Get request for getting the data
app.get('/data', (req, res) => {
  i = 0;
  let search = req.query.q;
  // let startingYear = req.query.startingYr;
  let startingYear = 1920;
  let endingYear = 2005;
  // let endingYear = req.query.q.endingYr;
  var yearRanges = [{s: 1920, e: 1939}, {s: 1940, e: 1959}, {s: 1960, e: 1979}, {s: 1980, e: 1999}, {s: 2000, e: 2005}]

  let data = [];


  function extraStep() {
      i++
      waiter()
  }

  function waiter() {
    makeRequests(search, yearRanges[i].s, yearRanges[i].e).then(val => {
      data.push(val)
      if (i < yearRanges.length - 1) {
        extraStep()
      } else {
        res.send(data)
      }

    })
  }
  waiter()

})

// app.get('/data', (req, res) => )

app.listen(3000, () => {
  console.log('Listening to port 3000');
});
