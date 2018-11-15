# Frontend Data

## Introduction
For this course I will be fetching data from the oba API and then create a visualization using d3.js. The last time I created a data-visualization using d3.js was on (Observable)[https://beta.observablehq.com/]. In this course I will make an interactive data-visualization with d3.js from scratch; so no magic packages like Vega-Lite.

---

## Table of Contents


---

## Concept
[Image]
I want to make a stacked barchart that is going to display the genres in each year. I will give users the option to give their own search query. I will also give them a year range option; so they only get the data from the years they choose to see.

[Image]
**Functions:**
- When a user clicks on a bar from a stacked group of bars the graph will transition to a graph that only shows the clicked on genre.
- When a user clicks on a year on the x-axis the graph will transition to a pie chart only showing that year.

### Feedback
**14-11-18 (14th November):**
_The problem with a stacked bar chart is that with a lot of different bars it will be chaotic. A good alternative to my problem is an area or line chart. I could also give users only the top 3 or bottom 3._

### Iteration
I definitely agree on that a stacked barchart is chaotic and ugly. I will focus on making a line chart first, but if I have spare time I will add the option to switch graphs, and I will start only with the top 3. 
