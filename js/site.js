var DATA_STORE = {};

var temperatureMatchPlayedGraph = false;

var tempMatchPlayedDefinition = {
  type: 'bar',
  data: {
    labels: [],
    datasets: [{
      label: 'Matches Played',
      data:[]
    }]
  },
  options: {
    scales: {
      yAxes: [{
        ticks: {
          beginAtZero:true
        },
        display: false
      }],
      xAxes: [{
        ticks: {
          beginAtZero:true
        },
      }]
    },
    legend: {
      display: false
    }
  }
};


$(document).ready(function(){
  init();
});


function init(){
  console.log('doing init');
  initTemperature();
}


function initTemperature(){
  $.ajax({
    url: 'data/temperature/matches-played.csv',
    success: function(data){
      if(data){
        Papa.parse(data, {
          header: true,
          delimiter: ',',
        	complete: function(results) {
            if(results && results.meta && results.meta.fields){
              DATA_STORE.temperatureMatchesPlayed = results;
              var min = false;
              var max = false;
              for(var i=0; i < results.meta.fields.length; i++){
                if(results.meta.fields[i] != "name"){
                  var value = parseFloat(results.meta.fields[i]);
                  if(min === false || value < min){
                    min = value;
                  }
                  if(max === false || value > max){
                    max = value;
                  }
                }
              }
              initTemperatureSlider(min,max);
              updateTemperatureMatchPlayedGraph(min,max+1);
            }
        	},
          error: function(err){
            console.log(err);
          }
        });
      }
    }
  });
}


function initTemperatureSlider(minValue, maxValue){
  console.log(minValue + ' ' + maxValue);
  var slider = $('#temperature')[0];
  noUiSlider.create(slider, {
		start: [ minValue, maxValue ],
    connect: [false, true, false],
    behaviour: 'drag',
		orientation: "vertical",
    step: 1,
    direction: 'rtl',
		range: {
			'min': minValue,
			'max': maxValue
		},
    pips: {
      mode: 'range',
      density: 5
    }
	});
  slider.noUiSlider.on('slide', function(data){
    // max temp always bigger than temp as set so include full range
    updateTemperatureMatchPlayedGraph(data[0], data[1]+1);
  });
}



function updateTemperatureMatchPlayedGraph(minTemp, maxTemp){
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
            if(temp >= minTemp && temp < maxTemp){
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

  if(!temperatureMatchPlayedGraph){
    var ctx = document.getElementById('graph_temperature_match_played').getContext('2d');
    temperatureMatchPlayedGraph = new Chart(ctx, tempMatchPlayedDefinition);
  }

  temperatureMatchPlayedGraph.data.datasets[0].data = [];
  temperatureMatchPlayedGraph.data.labels = [];
  for(var i=0; i < filteredData.length; i++){
    temperatureMatchPlayedGraph.data.datasets[0].data.push(filteredData[i].matchesPlayed);
    temperatureMatchPlayedGraph.data.labels.push(filteredData[i].name);
  }
  temperatureMatchPlayedGraph.update();


}
