/*
 Simple demo demoing plotting a timeline with Joola as a data store.
 - Install and run Joola (default configuration).
 - Run the dashboard example, node ./examples/joola-dashboard.js
 - Using curl, push events into Joola:
 ```
 $ curl -X POST -H 'Content-Type: application/json' -d '{
     "user": "itay",
     "events": 35
   }' http://localhost:8080/insert/events?APIToken=apitoken-demo
 ```
 - The timeline should reflect the number of events you pushed.
*/

var blessed = require('blessed'),
  contrib = require('../index'),
  joola = require('joola.sdk');

var screen = blessed.screen();
//create layout and widgets
var grid = new contrib.grid({rows: 1, cols: 1});
grid.set(0, 0, contrib.line, { showNthLabel: 5, maxY: 100, label: 'Total Events'});
grid.applyLayout(screen);
var transactionsLine = grid.get(0, 0);
var transactionsData = {x: [], y: []};

//connect to your Joola instance
joola.init({host: 'http://localhost:8080', APIToken: 'apitoken-demo'}, function (err) {
  if (err)
    throw err;

  //Here we specify a simple query to plot `events` timeline.
  var options = {
    timeframe: 'last_second',
    interval: 'second',
    dimensions: ['timestamp'],
    metrics: ['events'],
    collection: 'events',
    realtime: true
  };
  joola.query.fetch(options, function (err, results) {
    if (err)
      throw err;

    //if we have more than 60 points plotted, clear the first one out.
    if (transactionsData.x.length >= 60) {
      transactionsData.x.shift();
      transactionsData.y.shift();
    }
    if (results[0].documents.length === 0) {
      //if we don't have any results, i.e. now new events, push an empty slot;
      var timestamp = new Date();
      timestamp = timestamp.getHours() + ':' + timestamp.getMinutes() + ':' + timestamp.getSeconds();
      transactionsData.x.push(timestamp);
      transactionsData.y.push(0);
    }
    else {
      //we have results, iterate and plot
      results[0].documents.forEach(function (doc) {
        var timestamp = new Date(doc.values.timestamp);
        timestamp = timestamp.getHours() + ':' + timestamp.getMinutes() + ':' + timestamp.getSeconds();
        transactionsData.x.push(timestamp);
        transactionsData.y.push(doc.values.events);
      });
    }
    //render the new set of data on screen
    transactionsLine.setData(transactionsData.x, transactionsData.y);
    screen.render();
  });
});
screen.key(['escape', 'q', 'C-c'], function (ch, key) {
  return process.exit(0);
});
screen.render();
