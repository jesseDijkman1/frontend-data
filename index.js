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

// function refineData(data) {
//   return new Promise((resolve, reject) => {
//     client.get('refine', {
//       rctx: JSON.parse(res).aquabrowser.meta.rctx,
//       count: 39,
//       facets: 'Genre'
//     })
//     .then(res => resolve(r))
//     .then(err => reject(err))
//   })
// }

// function getData(query) {
//   return new Promise((resolve, reject) => {
//     client.get('search', {
//       q: query,
//       librarian: 'true',
//       refine: 'true',
//       facet: [`pubYear(2000)`, `type(book)`],
//       pagesize: 1
//     })
//     .then(res => {
//       refineData(JSON.parse(res))
//         .then(data => resolve(data))
//         .catch(err => reject(err))
//     })
//     .catch(err => console.log(err))
//   })
// }

  // .then(res => console.log(res)) // JSON results
  // .catch(err => console.log(err))
function refineData(rctx) {

  return new Promise((resolve, reject) => {

      client.get('refine', {
        rctx: rctx,
        count: 39,
        facets: 'Genre'
      }).then(data => {
        resolve(JSON.parse(data))
      })

      .catch(err => reject('Error occured while refining the data'))
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

      reject('Error occurred while getting the data')
    })
  })
  }


function makeRequests(search, startingYr, endingYr) {

  return new Promise((resolve1, reject1) => {
  let promises = [];


  for (let i = startingYr; i <= endingYr; i++) {
    promises.push(new Promise((resolve, reject) => {
      getData(search, i).then(data => {

        refineData(JSON.parse(data).aquabrowser.meta.rctx).then(res => {

          res.aquabrowser.year = i;

          resolve(res)
        })

      }).catch(err => console.log(err))

    }))
  }


  Promise.all(promises).then(data => {

    resolve1(data)
  });
  })

}


const app = express();

app.use(cors());
app.use(express.static('static'));

// Open the home page
app.get('/', (req, res) => res.sendFile('/index.html', {root: __dirname }));

// Get request for getting the data
app.get('/data', (req, res) => {
  let search = req.query.q;
  let startingYear = req.query.startingYr;
  let endingYear = req.query.q.endingYr;

  makeRequests(search, 1999, 2005).then(data => res.send(JSON.stringify(data)))
})

// app.get('/data', (req, res) => )

app.listen(3000, () => {
  console.log('Listening to port 3000');
});
