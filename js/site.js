var DATA_STORE = {};
var DISPATCH = false;
var NAMESPACE = 'whatmakesgreat';

var COLOUR_NOT_SELECTED = '#cccccc';
var COLOUR_SELECTED = '#8CBEB2';
var OPACITY_NOT_SELECTED = 0.2;
var OPACITY_SELECTED = 1;
var CHANGE_TO_INITIALS_WHEN = 80;


window.addEventListener('resize', function(){
  updateTemperatureMatchPlayedGraph(getFilteredTemperatureData(DATA_STORE.temperatureMatchesPlayed.data,DATA_STORE.minTemp,DATA_STORE.maxTemp));
  updateTemperaturePointsWonGraph(getFilteredTemperatureData(DATA_STORE.temperaturePointsWon.data,DATA_STORE.minTemp,DATA_STORE.maxTemp));
  updateTemperaturePlayerPointsWonGraph(getFilteredTemperatureData(DATA_STORE.temperaturePointsWon.data), DATA_STORE.absolute_min_temp, DATA_STORE.absolute_max_temp);
});

document.addEventListener('DOMContentLoaded', function(e) {
  initDispatches();
  initTemperatureMatchPlayed();
  initTemperaturePointsWon();
});


function initDispatches(){
  DISPATCH = d3.dispatch('tempchange','playerchange');

  DISPATCH.on('tempchange', function(minTemp, maxTemp){
    DATA_STORE.minTemp = minTemp;
    DATA_STORE.maxTemp = maxTemp;
    updateTemperatureMatchPlayedGraph(getFilteredTemperatureData(DATA_STORE.temperatureMatchesPlayed.data,DATA_STORE.minTemp,DATA_STORE.maxTemp));
    updateTemperaturePointsWonGraph(getFilteredTemperatureData(DATA_STORE.temperaturePointsWon.data,DATA_STORE.minTemp,DATA_STORE.maxTemp));
    changeTemperatureSlider(d3.select('.temp-matches-played .slider'), this, DATA_STORE.minTemp, DATA_STORE.maxTemp);
    changeTemperatureSlider(d3.select('.temp-points-won .slider'), this, DATA_STORE.minTemp, DATA_STORE.maxTemp);
  });

  DISPATCH.on('playerchange', function(){
    updateTemperaturePlayerPointsWonGraphSelected(this.name);
    updateTemperatureMatchPlayedGraphSelected(DATA_STORE.temperatureMatchesPlayed.data, this.name);
    updateTemperaturePointsWonGraphSelected(DATA_STORE.temperatureMatchesPlayed.data, this.name);
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
              initTemperatureSlider(d3.select('.temp-points-won .slider'),min,max+1);
              initTemperatureMatchPlayedGraph(getFilteredTemperatureData(DATA_STORE.temperatureMatchesPlayed.data));
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
              DATA_STORE.temperaturePointsWon = results;
              DATA_STORE.absolute_min_temp = min;
              DATA_STORE.absolute_max_temp = max;
              initTemperaturePointsWonGraph(getFilteredTemperatureData(DATA_STORE.temperaturePointsWon.data));
              initTemperaturePlayerPointsWonGraph(getFilteredTemperatureData(DATA_STORE.temperaturePointsWon.data),  DATA_STORE.absolute_min_temp,  DATA_STORE.absolute_max_temp, 'andy murray');
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


function getFilteredTemperatureData(data, minTemp, maxTemp, player){
  var filteredData = [];
  if(data){
    for(var i=0; i < data.length; i++){
      var playerData = {
        name:false,
        sum: 0,
        itemCount: 0,
        values: [],
        fields: [],
        items: [],
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
              playerData.itemCount++;
              playerData.fields.push(field);
              playerData.values.push(value);
              playerData.items.push({
                field:field,
                value: value
              });
            }
          }
        }
      }

      if(playerData && playerData.name){
        if(playerData.itemCount > 0){
          playerData.mean = playerData.sum / playerData.itemCount;
        }

        // no filter based on player
        if(!player){
          filteredData.push(playerData);
        }
        else if(player === playerData.name){
          filteredData.push(playerData);
        }
      }
    }
  }
  return filteredData;
}


function compressData(data){
  var compressedData =[];
  if(data){
    for(var i=0; i < data.length; i++){
      if(data[i] && data[i].items){
        for(var j=0; j<data[i].items.length; j++){
          var item =   data[i].items[j];
          item.name = data[i].name;
          item.id = data[i].name;
          compressedData.push(item);
        }
      }
    }
  }
  return compressedData;
}

function initTemperatureMatchPlayedGraph(data){
  var barchart = d3.select('.temp-matches-played .barchart');
  var x = d3.scaleBand().range([0, barchart.node().getBoundingClientRect().width]).padding(0.1);
  var y = d3.scaleLinear().range([0,barchart.node().getBoundingClientRect().height]);
  y.domain([0, d3.max(data, function(d) { return d.sum; })]);
  x.domain(data.map(function(d) { return d.name; }));

  var bar = barchart.selectAll('div')
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
    .on('click',function(data){
      DISPATCH.call('playerchange', data);
    })
    .attr('title',function(d){
      return d.name.toUpperCase();
    });

  bar.append('span')
    .text(function(d) {
      if(x.bandwidth()<CHANGE_TO_INITIALS_WHEN){
        var RegEx = /\b\w/g;
        return d.name.match(RegEx)[0]+d.name.match(RegEx)[1];
      }
      else{
        return d.name;
      }
    })
    .attr('class', 'name');

  bar.append('span')
    .text(function(d) {
      if(d.sum>0){
        return d.sum;
      }
      else{
        return '';
      }
    })
    .attr('class', 'count');

}


function updateTemperatureMatchPlayedGraph(filteredData){
  var barchart = d3.select('.temp-matches-played .barchart');
  var x = d3.scaleBand().range([0, barchart.node().getBoundingClientRect().width]).padding(0.1);
  var y = d3.scaleLinear().range([0, barchart.node().getBoundingClientRect().height]);
  y.domain([0, d3.max(filteredData, function(d) { return d.sum; })]);
  x.domain(filteredData.map(function(d) { return d.name; }));

  var bars = barchart.selectAll('div').data(filteredData).transition().duration(200)
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
  .style('bottom','0px');

  bars.select('span.count')
  .text(function(d) {
    if(d.sum > 0){
      return d.sum;
    }
    else{
      return '';
    }
  });

  bars.select('span.name')
  .text(function(d) {
    if(x.bandwidth()<CHANGE_TO_INITIALS_WHEN){
      var RegEx = /\b\w/g;
      return d.name.match(RegEx)[0]+d.name.match(RegEx)[1];
    }
    else{
      return d.name;
    }
  });
}



function updateTemperatureMatchPlayedGraphSelected(filteredData, selectedPlayer){
  var barchart = d3.select('.temp-matches-played .barchart');
  barchart.selectAll('div').data(filteredData)
  .classed('selected', function(d){
    if(d.name && d.name===selectedPlayer){
      return true;
    }
    else{
      return false;
    }
  });
}

function updateTemperaturePointsWonGraphSelected(filteredData, selectedPlayer){
  var barchart = d3.select('.temp-points-won .barchart');
  barchart.selectAll('div').data(filteredData)
  .classed('selected', function(d){
    if(d.name && d.name===selectedPlayer){
      return true;
    }
    else{
      return false;
    }
  });
}


function initTemperaturePointsWonGraph(data){
  var barchart = d3.select('.temp-points-won .barchart');
  var x = d3.scaleBand().range([0, barchart.node().getBoundingClientRect().width]).padding(0.1);
  var y = d3.scaleLinear().range([0,barchart.node().getBoundingClientRect().height]);
  y.domain([0, d3.max(data, function(d) { return d.mean; })]);
  x.domain(data.map(function(d) { return d.name; }));

  var bars = barchart.selectAll('div')
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
    .on('click',function(data){
      DISPATCH.call('playerchange', data);
    })
    .attr('title',function(d){
      return d.name.toUpperCase();
    });

  bars.append('span')
    .text(function(d) {
      if(x.bandwidth()<CHANGE_TO_INITIALS_WHEN){
        var RegEx = /\b\w/g;
        return d.name.match(RegEx)[0]+d.name.match(RegEx)[1];
      }
      else{
        return d.name;
      }
    })
    .attr('class', 'name');

  bars.append('span')
    .text(function(d) {
      if(d.mean > 0){
        return Math.round(d.mean)+'%';
      }
      else{
        return '';
      }
    })
    .attr('class', 'mean');
}


function updateTemperaturePointsWonGraph(data){
  var barchart = d3.select('.temp-points-won .barchart');
  var x = d3.scaleBand().range([0, barchart.node().getBoundingClientRect().width]).padding(0.1);
  var y = d3.scaleLinear().range([0,barchart.node().getBoundingClientRect().height]);
  y.domain([0, d3.max(data, function(d) { return d.mean; })]);
  x.domain(data.map(function(d) { return d.name; }));

  var bars = barchart.selectAll('div')
  .data(data).transition().duration(200)
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
  .style('bottom','0px');

  bars.select('span.mean')
  .text(function(d) {
    if(d.mean > 0){
      return Math.round(d.mean)+'%';
    }
    else{
      return '';
    }
  });

  bars.select('span.name')
  .text(function(d) {
    if(x.bandwidth()<CHANGE_TO_INITIALS_WHEN){
      var RegEx = /\b\w/g;
      return d.name.match(RegEx)[0]+d.name.match(RegEx)[1];
    }
    else{
      return d.name;
    }
  });
}


function initTemperaturePlayerPointsWonGraph(filteredData, minTemp, maxTemp){
  filteredData = compressData(filteredData);

  var minPercent = d3.min(filteredData, function(d){
    return d.value;
  });

  var maxPercent = d3.max(filteredData, function(d){
    return d.value;
  });

  // Nest the entries by symbol
  var dataNest = d3.nest()
    .key(function(d) {
      return d.id;
    })
    .entries(filteredData);

  var axisSize = 25;
  var linechart = d3.select('.temp-player-points-won .linechart');

  var x = d3.scaleLinear().range([axisSize, linechart.node().getBoundingClientRect().width]);
  var y = d3.scaleLinear().range([0, linechart.node().getBoundingClientRect().height - axisSize]);
  var z = d3.scaleOrdinal(d3.schemeCategory10);

  y.domain([maxPercent, minPercent]);
  x.domain([minTemp, maxTemp]);
  z.domain(dataNest.map(function(c) { return c.key; }));

  var valueline = d3.line()
    .x(function(d){
      return x(d.field);
    })
    .y(function(d){
      return y(d.value);
    }
  );

  linechart.selectAll('circle').data(filteredData)
    .enter().append('circle')
    .attr(NAMESPACE+'-key',function(d){
      return d.id;
    })
    .attr('cx', function (d) {
      return x(d.field);
    })
    .attr('cy', function (d) { return y(d.value); })
    .attr('r', function (d) { return 4; })
    .style('fill-opacity',OPACITY_NOT_SELECTED)
    .style('fill', COLOUR_NOT_SELECTED)
    .style('cursor', 'pointer')
    .on('click', function(data) {
      data.name = data.id;
      DISPATCH.call('playerchange', data);
      d3.event.stopPropagation();
    })
    .append('title')
    .text(function(d){
      return d.id.toUpperCase();
    });;


  var paths = linechart.selectAll('path').data(dataNest)
  .enter().append('path')
  .attr(NAMESPACE+'-key',function(d){
    return d.key;
  })
  .attr('class', 'line')
  .style('stroke', COLOUR_NOT_SELECTED)
  .style('stroke-opacity',OPACITY_NOT_SELECTED)
  .style('cursor', 'pointer')
  .attr('d', function(d){
    return valueline(d.values);
  })
  .on('click', function(data) {
    data.name = data.key;
    DISPATCH.call('playerchange', data);
    d3.event.stopPropagation();
  });

  paths.append('title')
  .text(function(d){
    return d.key.toUpperCase();
  });

  // Add the X Axis
  var yShift = linechart.node().getBoundingClientRect().height - axisSize;
  var xAxis = linechart.append('g')
    .attr('transform', 'translate(0,'+yShift+')')
    .attr('class','xaxis')
    .call(d3.axisBottom(x));
  xAxis.selectAll('text')
    .attr('fill', '#ccc');
  xAxis.selectAll('line')
    .attr('stroke', '#ccc');
  xAxis.selectAll('path')
    .attr('stroke', '#ccc');


  // Add the Y Axis
  var yAxis = linechart.append('g')
    .attr('transform', 'translate('+axisSize+',0)')
    .attr('class','yaxis')
    .call(d3.axisLeft(y));
  yAxis.selectAll('text')
    .attr('fill', '#ccc');
  yAxis.selectAll('line')
    .attr('stroke', '#ccc');
  yAxis.selectAll('path')
    .attr('stroke', '#ccc');
}


function updateTemperaturePlayerPointsWonGraph(filteredData, minTemp, maxTemp){
  filteredData = compressData(filteredData);

  var minPercent = d3.min(filteredData, function(d){
    return d.value;
  });

  var maxPercent = d3.max(filteredData, function(d){
    return d.value;
  });

  // Nest the entries by symbol
  var dataNest = d3.nest()
    .key(function(d) {
      return d.id;
    })
    .entries(filteredData);

  var axisSize = 25;
  var linechart = d3.select('.temp-player-points-won .linechart');


  var x = d3.scaleLinear().range([axisSize, linechart.node().getBoundingClientRect().width]);
  var y = d3.scaleLinear().range([0, linechart.node().getBoundingClientRect().height - axisSize]);
  var z = d3.scaleOrdinal(d3.schemeCategory10);

  y.domain([maxPercent, minPercent]);
  x.domain([minTemp, maxTemp]);
  z.domain(dataNest.map(function(c) { return c.key; }));

  var valueline = d3.line()
    .x(function(d){
      return x(d.field);
    })
    .y(function(d){
      return y(d.value);
    }
  );

  linechart.selectAll('circle').data(filteredData)
    .transition().duration(200)
    .attr('cx', function (d) {
      return x(d.field);
    })
    .attr('cy', function (d) { return y(d.value); });

  linechart.selectAll('path').data(dataNest)
  .transition().duration(200)
  .attr('d', function(d){
    return valueline(d.values);
  });

  linechart.select('.yaxis').transition().duration(300)  // https://github.com/mbostock/d3/wiki/Transitions#wiki-d3_ease
    .call(d3.axisLeft(y));

  linechart.select('.xaxis').transition().duration(300)  // https://github.com/mbostock/d3/wiki/Transitions#wiki-d3_ease
    .call(d3.axisBottom(x));
}


function updateTemperaturePlayerPointsWonGraphSelected(selectedPlayer){
  var linechart = d3.select('.temp-player-points-won .linechart');
  linechart.selectAll('path').transition().duration(200)
  .style('stroke', function() {
    if(d3.select(this).attr(NAMESPACE+'-key') && d3.select(this).attr(NAMESPACE+'-key') === selectedPlayer){
      return COLOUR_SELECTED;
    }
    else{
      return COLOUR_NOT_SELECTED;
    }
  })
  .style('stroke-opacity', function() {
    if(d3.select(this).attr(NAMESPACE+'-key') && d3.select(this).attr(NAMESPACE+'-key') === selectedPlayer){
      return OPACITY_SELECTED;
    }
    else{
      return OPACITY_NOT_SELECTED;
    }
  });

  linechart.selectAll('circle').transition().duration(200)
  .style('fill', function() {
    if(d3.select(this).attr(NAMESPACE+'-key') && d3.select(this).attr(NAMESPACE+'-key') === selectedPlayer){
      return COLOUR_SELECTED;
    }
    else{
      return COLOUR_NOT_SELECTED;
    }
  })
  .style('fill-opacity', function() {
    if(d3.select(this).attr(NAMESPACE+'-key') && d3.select(this).attr(NAMESPACE+'-key') === selectedPlayer){
      return OPACITY_SELECTED;
    }
    else{
      return OPACITY_NOT_SELECTED;
    }
  });

}
