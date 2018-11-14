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

function refineData(data) {
  return new Promise((resolve, reject) => {
    client.get('refine', {
      rctx: JSON.parse(res).aquabrowser.meta.rctx,
      count: 39,
      facets: 'Genre'
    })
    .then(res => resolve(r))
    .then(err => reject(err))
  })
}

function getData(query) {
  return new Promise((resolve, reject) => {
    client.get('search', {
      q: query,
      librarian: 'true',
      refine: 'true',
      facet: [`pubYear(2000)`, `type(book)`],
      pagesize: 1
    })
    .then(res => {
      refineData(JSON.parse(res))
        .then(data => resolve(data))
        .catch(err => reject(err))
    })
    .catch(err => console.log(err))
  })
}

  // .then(res => console.log(res)) // JSON results
  // .catch(err => console.log(err))


const app = express();

app.use(cors())

// Open the home page
app.get('/', (req, res) => {
    res.sendFile('/index.html', {root: __dirname })
});

app.get('/data', (req, res) => {
  let searchQuery = req.query.q;

  getData(searchQuery).then(data => res.send(data))

})

// app.get('/data', (req, res) => )

app.listen(3000, () => {
  console.log('Listening to port 3000');
});
