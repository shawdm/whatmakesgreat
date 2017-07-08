var DATA_STORE = {};

document.addEventListener('DOMContentLoaded', function(e) {
  initTemperature();
});


function initTemperature(){
  d3.request('data/temperature/matches-played.csv')
    .on('error', function(error) {
      console.log('error' + error);
    })
    .on('load', function(xhr){
      if(xhr && xhr.response){
        Papa.parse(xhr.response, {
          header: true,
          delimiter: ',',
          complete: function(results){
            if(results && results.meta && results.meta.fields){
              DATA_STORE.temperatureMatchesPlayed = results;
              var min = false;
              var max = false;
              for(var i=0; i < results.meta.fields.length; i++){
                if(results.meta.fields[i] != 'name'){
                  var value = parseFloat(results.meta.fields[i]);
                  if(min === false || value < min){
                    min = value;
                  }
                  if(max === false || value > max){
                    max = value;
                  }
                }
              }
              initTemperatureSlider(min,max+1);
              initTemperatureGraph(getFilteredTemperatureData());
            }
        	},
          error: function(err){
            console.log(err);
          }
        });
      }
    })
    .get();
}


function initTemperatureSlider(min,max){
  //https://bl.ocks.org/mbostock/6452972
  console.log('init with ' + min + ' '+ max);

  var slider = d3.select('.slider');
  var bar = d3.select('.bar');
  var handleMax = d3.select('.handle-max');
  var handleMin = d3.select('.handle-min');

  var y = d3.scaleLinear()
    .domain([max, min])
    .range([0, bar.node().getBoundingClientRect().height - handleMax.node().getBoundingClientRect().height])
    .clamp(true);

  handleMax.call(d3.drag()
    .on('start.interrupt',function(){
      handleMax.interrupt();
    })
    .on('start drag',function(e){
      handleMax.style('top', y(y.invert(d3.event.y))+'px');
      updateTemperatureMatchPlayedGraph(getFilteredTemperatureData(Math.round(y.invert(parseFloat(handleMin.style('top')))),Math.round(y.invert(d3.event.y))));
    })
  );

  handleMin.call(d3.drag()
    .on('start.interrupt',function(){
      handleMin.interrupt();
    })
    .on('start drag',function(e){
      handleMin.style('top', y(y.invert(d3.event.y))+'px');
      updateTemperatureMatchPlayedGraph(getFilteredTemperatureData(Math.round(y.invert(d3.event.y)),Math.round(y.invert(parseFloat(handleMax.style('top'))))));
    })
  );
}


function getFilteredTemperatureData(minTemp, maxTemp){
  var filteredData = [];
  if(DATA_STORE && DATA_STORE.temperatureMatchesPlayed && DATA_STORE.temperatureMatchesPlayed.data){
    for(var i=0; i < DATA_STORE.temperatureMatchesPlayed.data.length; i++){
      var playerData = {
        name:false,
        matchesPlayed: 0
      };

      for(var field in DATA_STORE.temperatureMatchesPlayed.data[i]){
        if(field == 'name'){
          playerData.name = DATA_STORE.temperatureMatchesPlayed.data[i][field];
        }
        else{
          var temp = parseFloat(field);
          if(temp && DATA_STORE.temperatureMatchesPlayed.data[i][field] && DATA_STORE.temperatureMatchesPlayed.data[i][field].length > 0){
            var matchesPlayed = parseFloat(DATA_STORE.temperatureMatchesPlayed.data[i][field]);
            if(!minTemp || !maxTemp || (temp >= minTemp && temp < maxTemp)){
              playerData.matchesPlayed = playerData.matchesPlayed + matchesPlayed;
            }
          }
        }
      }

      if(playerData && playerData.name){
        filteredData.push(playerData);
      }
    }
  }
  return filteredData;
}


function initTemperatureGraph(data){
  var barchart = d3.select('.barchart');
  var x = d3.scaleBand().range([0, barchart.node().getBoundingClientRect().width]).padding(0.1);
  var y = d3.scaleLinear().range([0,barchart.node().getBoundingClientRect().height]);
  y.domain([0, d3.max(data, function(d) { return d.matchesPlayed; })]);
  x.domain(data.map(function(d) { return d.name; }));

  barchart.selectAll('div')
    .data(data)
    .enter().append('div')
    .style('height', function(d) {
      return y(d.matchesPlayed) + 'px';
    })
    .style('width', function(d){
      var width = x.bandwidth()+'px';
      return width;
    })
    .style('left', function(d){
      var left = x(d.name)+'px';
      return left;
    })
    .style('bottom','0px')
    .text(function(d) { return d.name; });
}


function updateTemperatureMatchPlayedGraph(filteredData){
  var barchart = d3.select('.barchart');
  var x = d3.scaleBand().range([0, barchart.node().getBoundingClientRect().width]).padding(0.1);
  var y = d3.scaleLinear().range([0, barchart.node().getBoundingClientRect().height]);
  y.domain([0, d3.max(filteredData, function(d) { return d.matchesPlayed; })]);
  x.domain(filteredData.map(function(d) { return d.name; }));

  barchart.selectAll('div').data(filteredData).transition().duration(200)
  .style('height', function(d) {
    return y(d.matchesPlayed) + 'px';
  })
  .style('width', function(d){
    var width = x.bandwidth()+'px';
    return width;
  })
  .style('left', function(d){
    var left = x(d.name)+'px';
    return left;
  })
  .style('bottom','0px')
  .text(function(d) { return d.name; });
}
