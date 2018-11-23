# Frontend Data

_**Student:** jesse Dijkman_ 🤓

## Introduction
For this course I will be fetching data from the oba API and then create a visualization using d3.js. The last time I created a data-visualization using d3.js was on [Observable](https://beta.observablehq.com/). In this course I will make an interactive data-visualization with d3.js from scratch; so no magic packages like Vega-Lite. (Can't host the application on github-pages, the express server in my repo is a necessary part of the concept.)

---

## Table of Contents
- [Installation guide](#installation-guide)
- [Concept](#concept)
  - [Feedback](#feedback)
  - [Iteration](#iteration)
- [Process](#process)
  - [Step 1](#step-1)
  - [Step 2](#step-2)
  - [Step 3](#step-3)
  - [Conclusion](#conclusion)
- [Sources](#sources)
---

## Installation Guide 
#### 1. Clone the repository 
```
https://github.com/jesseDijkman1/frontend-data.git
```
#### 2. Navigate to the repository 
```
cd frontend-data
```
#### 3. Install the NPM packages 
```
npm install
```
#### 4. Run the application on localhost:3000 
```
node index.js
```

---

## Concept

![Imgur](https://i.imgur.com/r219hAA.jpg)

I want to make a stacked barchart that is going to display the genres in each year. I will give users the option to give their own search query; look up what they want. The concept isn't a datavisualization that tells a specific story, it's more of a tool for looking at the genres in the oba data. The users can draw their own conclusions. The app will look up new data each time a user searches for something in the search input.

![Imgur](https://i.imgur.com/LSoYMgr.jpg)

**Functions:**
- When a user clicks on a bar from a stacked group of bars the graph will transition to a graph that only shows the clicked genre.
- When a user clicks on a year on the x-axis the graph will transition to a pie chart only showing that year.
- When a user clicks on the search button, the graph will display new data.
- When a user clicks on a list item in the legend, the app will filter the clicked on genre out.

### Feedback
**14-11-18 (14th November):**
_The problem with a stacked bar chart is that with a lot of different bars it will be chaotic. Too much data for such a graph; I need to make the data smaller._

### Iteration
I definitely agree on that a stacked barchart is chaotic and ugly. I will focus on making a line chart first, but if I have spare time I will add the option to switch graphs, and I will start only with the top 3. The new concept will have a select filter. The user can get the top 3, bottom 3 or all. 

**The new concept looks like the following:**

![Imgur](https://i.imgur.com/m9m9E7V.jpg)

This is probably hard to realize because of the styling, but it is exactly what I want to make right now. But I need to focus on the functionalities first before getting to the styling (css). 

---

## Process

### Steps
1. Write the code to get most of the genres (data) from the oba API.
2. Write the code to let users make requests to the oba API. 
3. Write d3 javascript and experiment a little.

#### Step 1
For step 1 I had too look at my previous [repository (Functional programming)](https://github.com/jesseDijkman1/functional-programming) and how I made requests to the API. I felt like it could be alot cleaner and better. I looked at the [API documentation](https://zoeken.oba.nl/api/v1/) and I saw the refine endpoint, so I tried using it. Using the refine endpoint meant that I had to use a token (rctx), which I could get from a search endpoint request. 

```js
/*The getData function makes a request, and takes 2 parameters: 'query' and 'year'*/

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
```

When I resolve this promise the results token (rctx) is then passed to another function with the refine endpoint. 

```js
getData(search, j).then(data1 => {
          refineData(JSON.parse(data1).aquabrowser.meta.rctx)
```

The refineData uses the token to get more info of the complete result; all the pages with all the data. 

```js
function refineData(token) {

  return new Promise((resolve, reject) => {

    client.get('refine', {
      rctx: token,
      count: 39, // Looking at DanielvandeVelde's functionalprogramming readme I counted 39 genres. So I specified that here
      facets: 'Genre' // I'm only interested in the genres
    }).then(data => {

      resolve(JSON.parse(data))
    })
    .catch(err => {

      reject('Error while refining data')
    })
  })
}
```

Great now I can get a list of all the genres for a particular year and query. But my concept has the option to get from a range of years. So I needed to make a loop that creates requests. I did that with an array of promises.

```js
function makeRequests(search, yearRange) {
  return new Promise((resolve1, reject1) => {
    let promises = [];

    for (let j = yearRange.start; j <= yearRange.end; j++) {
      promises.push(new Promise((resolve2, reject2) => {

        getData(search, j).then(data1 => {
          refineData(JSON.parse(data1).aquabrowser.meta.rctx).then(data2 => {
          
            // Add the looked for year to the aquabrowser object
            data2.aquabrowser.year = j;

            resolve2(data2)

          }).catch(err => console.log(err))

        }).catch(err => console.log(err))
      }))
    }
    
    // When all the promises are done resolve all the data
    Promise.all(promises).then(vals => {
      resolve1(vals)
    })
  })
}
```

My first code would work well with 15 requests (years), but when looking for 1920 to 2018 it would still crash. So I tried to fix it, which wasn't easy (it actually was tho). I maximized the amount of years looked for at once to 20. 

```js
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
    // {start: 1920, end: 1939}
    yearRanges.push({start: newRangeStart, end: newRangeEnd})

  }
  return yearRanges
}
```

Now I just needed to loop through the yearRanges. 

```js
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
        // Done return the data to the user
        res.send(data)
      }

    })
  }
  waiter()
```
---

#### Step 2
I could make request to the API but I need to make a way for users to do it. I thought about using d3.XML('url'), but this was just too hard with authentication ant the amount of time I had, and my way is easier (thanks to [rijkvanzanten's package](https://github.com/rijkvanzanten/node-oba-api). I tried to make an express server and writing the index.html file in the root directory. This index.html needs to make requests to the express server it's in, using d3.json. I tried making a get request to my server, but turns out I needed the [cors](https://www.npmjs.com/package/cors) package for it to work. And it worked 😱🙏.

---

#### Step 3
The second week into the course I started to use d3 for real. I had experimented with it in the weekend before the course started, I used codepen for these CRAZY 🔥 experiments. [Codepen d3 Laboratory](https://codepen.io/WillyW/pen/oaEBJm)
Codepen was a really easy way to try things, because the code runs everytime the user is "done" with writing. 

After a little while I got the following to work:

![Imgur](https://i.imgur.com/40F8hJc.png)

And when the user hovers over an area its fill attribute is updated.
![Imgur](https://i.imgur.com/Upyd1uR.png)

#### Conclusion
Last day and I'm writing this README. I didn't have enough time to get all the parts of the concept working. Like switching graphs and creating a pie chart, and zooming in. With a day (or two) extra I think I could have added these options. The reason for not getting to these parts of the concept is probably because I started with d3 in the second week; not even the visualization aspect of d3, mostly the data formatting. But for my first try at d3 I think it went ok.

The end result is the following (if I don't add anymore styling)

![Imgur](https://i.imgur.com/I5hZr3X.png?1)

## Sources
- [Rijkvanzanten package]https://github.com/rijkvanzanten/node-oba-api
- [DanielvandeVelde's genres list](https://github.com/DanielvandeVelde/functional-programming)
