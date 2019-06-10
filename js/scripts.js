mapboxgl.accessToken = 'pk.eyJ1IjoicnVmZWlmZmZmZmZmIiwiYSI6ImNqdXczZWZ1NjA4Yjc0ZHBmdHVlYTVhNHgifQ.h-vyoVrI270wgwU6Y11NOQ';

var map = new mapboxgl.Map({
  container: 'mapContainer',
  center: [-73.97604882, 40.7489006],
  style: 'mapbox://styles/mapbox/streets-v9',
  // change the style can change map
  zoom: 10.5,
});

map.addControl(new mapboxgl.NavigationControl());

// define function to color each taxi zone with highest possible transporatation manner
var TopTransportation = (choice) => {
  switch (choice) {
    case 'Public Transit':
      return {
        color: '#98CDCE',
        description: 'Public Transit is the top choice',
      };

    case 'Taxi':
      return {
        color: '#FCCF76',
        description: 'Taxi is the top choice',
      };

    case 'Others':
      return {
        color: '#D4FCFF',
        description: 'Other commute manner',
      };

    default:
      return{
        color: '#D4FCFF',
        description: 'Other commute manner',
      };
  }
};

// use J-query to create a legend
let mode = ['Public Transit', 'Taxi', 'Others'];
for (let i = 0; i < mode.length; i++) {
  const choiceinfo = TopTransportation(mode[i]);

  $('.legend').append(`
    <div>
      <div class='legend-color-box' style='background-color:${choiceinfo.color};'></div>
      ${choiceinfo.description}
    </div>
    `)
}

// marker the citibike location
subwayStationLocation.forEach(function(subwayStation) {
    var popup = new mapboxgl.Popup({
        offset: 40 })
        .setText(`${subwayStation.name}`);

    var el = document.createElement('div');
    el.className = 'marker';
    el.style.backgroundImage = './image/subway.png';
    el.style.width = 7;
    el.style.height = 7;

    // add marker to map
    new mapboxgl.Marker(el)
    .setLngLat([subwayStation.longitude, subwayStation.latitude])
    .setPopup(popup)
    .addTo(map);
})

// airport location
var airportLocation = {
  'JFK_airport' : [-73.7803278, 40.6413111],
  'EWR_airport' : [-74.1766511, 40.6895314],
  'LGA_airport' : [-73.8761546, 40.7769271],
}

map.on('style.load', function() {

  $('.flyto').on('click', function(e) {
    var airport = $(e.target).data('airport');
    var center = airportLocation[airport];
    map.flyTo({center: center, zoom: 12});

  })

  map.addSource('NYC_Taxi_Zones', {
      type: 'geojson',
      data: './data/NYC_transportationChoice.geojson',
  });

  map.addLayer({
    id: 'taxi_zone_fill',
    type: 'fill',
    source: 'NYC_Taxi_Zones',
    paint: {
      'fill-opacity' : 0.7,
      'fill-color' : {
        type: 'categorical',
        property: 'Top_choice',
        stops: [
          [
            'Public Transit',
            TopTransportation('Public Transit').color,
          ],
          [
            'Taxi',
            TopTransportation('Taxi').color,
          ],
          [
            'Others',
            TopTransportation('Others').color,
          ],
        ]
      }
    }
  });

  map.addLayer({
    id: 'NYC_Taxi_Zones_line',
    type: 'line',
    source: 'NYC_Taxi_Zones',
    paint: {
      'line-opacity': 0.7,
      'line-color': 'gray',
      'line-opacity': {
        stops: [[10, 0], [11, 1]],
      }
    }
  })

  map.addSource('highlight-feature', {
    type: 'geojson',
    data: {
      type: 'FeatureCollection',
      features: []
    }
  })

  map.addLayer({
    id: 'highlight-line',
    type: 'line',
    source: 'highlight-feature',
    paint: {
      'line-width' : 3,
      'line-opacity' : 0.9,
      'line-color' : 'black'
    }
  });


  var currentZone = null;
  map.on('mousemove', function(e) {
    var features = map.queryRenderedFeatures(e.point, {
        layers: ['taxi_zone_fill'],
    });

    var taxi_zone = features[0];
    // var taxi_zone = features[0]
    // if (taxi_zone)
    if (taxi_zone.properties.objectid !== currentZone)
    {
      currentZone = taxi_zone.properties.objectid
      map.getCanvas().style.cursor = 'pointer';
      $('#zonename').text(taxi_zone.properties.zone);
      $('#brough').text(taxi_zone.properties.borough);
      map.getSource('highlight-feature').setData(taxi_zone.geometry);

      //pie chart
      // perpare the data
      var pieData = [
          {
            'label': 'Public Transit',
            'value': taxi_zone.properties.Public_Transit
          },
          {
            'label': 'Taxi',
            'value': taxi_zone.properties.Taxi
          },
          {
            'label': 'Others',
            'value': taxi_zone.properties.Others
          },
        ];

      // console.log(pieData)
      var height = 200;
      var width = 200;
      //Regular pie chart
      nv.addGraph(function() {
        var chart = nv.models.pieChart()
            .x(function(d) { return d.label })
            .y(function(d) { return d.value })
            .width(width)
            .height(height)
            .showLabels(true);

          d3.select("#piechart")
              .datum(pieData)
              .transition().duration(350)
              .attr('width', width)
              .attr('height', height)
              .call(chart);

        return chart;
      });


    }
    else{
      map.getCanvas().style.cursor = 'default';
      map.getSource('highlight-feature').setData({
        type: 'FeatureCollection',
        features: []
      });
    }
  })
})
