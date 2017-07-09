var DATA_STORE = {};
var DISPATCH = false;

document.addEventListener('DOMContentLoaded', function(e) {
  initDispatches();
  initTemperatureMatchPlayed();
  initTemperaturePointsWon();
});


function initDispatches(){
  DISPATCH = d3.dispatch('tempchange','playerchange');

  DISPATCH.on('tempchange', function(minTemp, maxTemp){
    updateTemperatureMatchPlayedGraph(getFilteredTemperatureData(DATA_STORE.temperatureMatchesPlayed.data, minTemp,maxTemp));
    updateTemperaturePointsWonGraph(getFilteredTemperatureData(DATA_STORE.temperaturePointsWon.data, minTemp,maxTemp));
    changeTemperatureSlider(d3.select('.temp-matches-played .slider'),this ,minTemp,maxTemp);
    changeTemperatureSlider(d3.select('.temp-matches-won .slider'),this, minTemp,maxTemp);
  });

  DISPATCH.on('playerchange', function(){
    console.log('dispatch a player change');
    console.dir(this);
  });
}


function initTemperatureMatchPlayed(){
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
              initTemperatureSlider(d3.select('.temp-matches-played .slider'),min,max+1);
              initTemperatureSlider(d3.select('.temp-matches-won .slider'),min,max+1);
              initTemperatureGraph(getFilteredTemperatureData(DATA_STORE.temperatureMatchesPlayed.data));
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


function initTemperaturePointsWon(){
  d3.request('data/temperature/percent-points-won.csv')
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
              DATA_STORE.temperaturePointsWon = results;
              initTemperaturePointsWonGraph(getFilteredTemperatureData(DATA_STORE.temperaturePointsWon.data));
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


//https://bl.ocks.org/mbostock/6452972
function initTemperatureSlider(slider, min,max){

  var bar = slider.select('.bar');
  var handleMax = slider.select('.handle-max');
  var handleMin = slider.select('.handle-min');

  var y = d3.scaleLinear()
    .domain([max, min])
    .range([0, bar.node().getBoundingClientRect().height - handleMax.node().getBoundingClientRect().height])
    .clamp(true);

  handleMax.call(d3.drag()
    .on('start.interrupt',function(){
      handleMax.interrupt();
    })
    .on('start drag',function(e){
      var handleMinTemp = Math.round(y.invert(parseFloat(handleMin.style('top'))));
      var handleMaxTemp = Math.round(y.invert(d3.event.y));
      if(d3.event.y + handleMax.node().getBoundingClientRect().height <= parseFloat(handleMin.style('top'))){
        handleMax.style('top', y(y.invert(d3.event.y))+'px');
      }
      else{
        handleMax.style('top', parseFloat(handleMin.style('top'))-handleMax.node().getBoundingClientRect().height+'px');
      }
      DISPATCH.call('tempchange', this, handleMinTemp, handleMaxTemp);
    })
  );

  handleMin.call(d3.drag()
    .on('start.interrupt',function(){
      handleMin.interrupt();
    })
    .on('start drag',function(e){
      var handleMinTemp = Math.round(y.invert(d3.event.y));
      var handleMaxTemp = Math.round(y.invert(parseFloat(handleMax.style('top'))));
      if(d3.event.y - handleMin.node().getBoundingClientRect().height >= parseFloat(handleMax.style('top'))){
        handleMin.style('top', y(y.invert(d3.event.y))+'px');
      }
      else{
        handleMin.style('top', parseFloat(handleMax.style('top'))+handleMin.node().getBoundingClientRect.height + 'px');
      }
      DISPATCH.call('tempchange', this, handleMinTemp, handleMaxTemp);
    })
  );
}


function changeTemperatureSlider(slider, sourceOfChange, min, max){
  if(slider.node() !== sourceOfChange.parentNode){
    var handleMax = slider.select('.handle-max');
    var handleMin = slider.select('.handle-min');
    handleMax.style('top',d3.select(sourceOfChange.parentNode).select('.handle-max').style('top'));
    handleMin.style('top',d3.select(sourceOfChange.parentNode).select('.handle-min').style('top'));
  }
}


function getFilteredTemperatureData(data, minTemp, maxTemp){
  var filteredData = [];
  if(data){
    for(var i=0; i < data.length; i++){
      var playerData = {
        name:false,
        sum: 0,
        items: 0,
        mean:0
      };

      for(var field in data[i]){
        if(field == 'name'){
          playerData.name = data[i][field];
        }
        else{
          var temp = parseFloat(field);
          if(temp && data[i][field] && data[i][field].length > 0){
            var value = parseFloat(data[i][field]);
            if(!minTemp || !maxTemp || (temp >= minTemp && temp < maxTemp)){
              playerData.sum = playerData.sum + value;
              playerData.items++;
            }
          }
        }
      }

      if(playerData && playerData.name){
        if(playerData.items > 0){
          playerData.mean = playerData.sum / playerData.items;
        }
        filteredData.push(playerData);
      }
    }
  }
  return filteredData;
}


function initTemperatureGraph(data){
  var barchart = d3.select('.temp-matches-played .barchart');
  var x = d3.scaleBand().range([0, barchart.node().getBoundingClientRect().width]).padding(0.1);
  var y = d3.scaleLinear().range([0,barchart.node().getBoundingClientRect().height]);
  y.domain([0, d3.max(data, function(d) { return d.sum; })]);
  x.domain(data.map(function(d) { return d.name; }));

  barchart.selectAll('div')
    .data(data)
    .enter().append('div')
    .style('height', function(d) {
      return y(d.sum) + 'px';
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
    .text(function(d) { return d.name; })
    .on('click',function(data){
      DISPATCH.call('playerchange', data);
    });
}


function updateTemperatureMatchPlayedGraph(filteredData){
  var barchart = d3.select('.temp-matches-played .barchart');
  var x = d3.scaleBand().range([0, barchart.node().getBoundingClientRect().width]).padding(0.1);
  var y = d3.scaleLinear().range([0, barchart.node().getBoundingClientRect().height]);
  y.domain([0, d3.max(filteredData, function(d) { return d.sum; })]);
  x.domain(filteredData.map(function(d) { return d.name; }));

  barchart.selectAll('div').data(filteredData).transition().duration(200)
  .style('height', function(d) {
    return y(d.sum) + 'px';
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


function initTemperaturePointsWonGraph(data){
  var barchart = d3.select('.temp-matches-won .barchart');
  var x = d3.scaleBand().range([0, barchart.node().getBoundingClientRect().width]).padding(0.1);
  var y = d3.scaleLinear().range([0,barchart.node().getBoundingClientRect().height]);
  y.domain([0, d3.max(data, function(d) { return d.mean; })]);
  x.domain(data.map(function(d) { return d.name; }));

  barchart.selectAll('div')
    .data(data)
    .enter().append('div')
    .style('height', function(d) {
      return y(d.mean) + 'px';
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
    .text(function(d) { return d.name; })
    .on('click',function(data){
      DISPATCH.call('playerchange', data);
    });
}


function updateTemperaturePointsWonGraph(filteredData){
  var barchart = d3.select('.temp-matches-won .barchart');
  var x = d3.scaleBand().range([0, barchart.node().getBoundingClientRect().width]).padding(0.1);
  var y = d3.scaleLinear().range([0, barchart.node().getBoundingClientRect().height]);
  y.domain([0, d3.max(filteredData, function(d) { return d.mean; })]);
  x.domain(filteredData.map(function(d) { return d.name; }));

  barchart.selectAll('div').data(filteredData).transition().duration(200)
  .style('height', function(d) {
    return y(d.mean) + 'px';
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
