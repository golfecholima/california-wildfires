mapboxgl.accessToken = 'pk.eyJ1IjoiY2FsbmV3c3Jvb20iLCJhIjoiY2ttYzhwZ2wyMDVobTJwbXhiaG81bXpzdSJ9.xnkn2BlbVZvFfGukyV_-0g';

const bounds = [
    [-179.691800, 0.572312], // Southwest coordinates 
    [-31.805816, 76.179739] // Northeast coordinates 
];

const map = new mapboxgl.Map({
    container: 'map', // container ID
    style: 'mapbox://styles/calnewsroom/cktxg3xf3026p18o15i0p1z9v', // style URL
    center: [-119.5788478538649, 36.498509688945572], // starting position [lng, lat]
    maxZoom: 13, // sets max zoom
    minZoom: 2, // sets min zoom
    zoom: 2, // starting zoom
    maxBounds: bounds
});

map.on('load', () => {

    // Update last updated section
    var client = new XMLHttpRequest();
    client.open('GET', 'last-updated.txt');
    client.onload = function () {
        document.getElementById('lastUpdated').innerHTML += client.responseText;
    }
    client.send();

    // Add sources

    // 
    // map.addSource('AirNow', {
    //     type: 'geojson',
    //     // Use a URL for the value for the `data` property.
    //     data: '/airnow.geojson'
    // });

    // // https://www.fire.ca.gov/incidents
    // map.addSource('CalFire', {
    //     type: 'geojson',
    //     // Use a URL for the value for the `data` property.
    //     data: '/calfire.geojson'
    // });

    // https://data-nifc.opendata.arcgis.com/search?tags=Category%2C2021_wildlandfire_opendata
    map.addSource('NIFC Polygons', {
        type: 'vector',
        // Use a URL for the value for the `data` property.
        url: 'mapbox://calnewsroom.nifc-polygons-test0'
    });

    // https://data-nifc.opendata.arcgis.com/search?tags=Category%2C2021_wildlandfire_opendata
    map.addSource('NIFC Points', {
        type: 'geojson',
        // Use a URL for the value for the `data` property.
        data: 'gis/nifc_points.geojson'
    });

    map.addSource('NASA ALL', {
        type: 'geojson',
        // Use a URL for the value for the `data` property.
        data: 'gis/nasa_all.geojson'
    });

    // Add layers w/ styling

    // Add NIFC fire perimeters
    map.addLayer({
        'id': 'Fire perimeters',
        'type': 'fill',
        'source': 'NIFC Polygons', // reference the data source
        'source-layer': 'nifc-polygons-test0',
        'layout': {
            // Make the layer visible by default.
            'visibility': 'visible'
        },
        'paint': {
            'fill-color': '#FFA700', // re color fill
            'fill-opacity': 0.5
        }
    });

    // Add NIFC fire origin points
    map.addLayer({
        'id': 'Fire origins',
        'type': 'symbol',
        'source': 'NIFC Points',
        'layout': {
            // Make the layer visible by default.
            'visibility': 'visible',
            'icon-image': 'level-crossing'
            // 'icon-size': .1
        }
    });

    // // Add CalFire points
    // map.addLayer({
    //     'id': 'Fire origins',
    //     'type': 'symbol',
    //     'source': 'CalFire',
    //     'layout': {
    //         // Make the layer visible by default.
    //         'visibility': 'visible',
    //         'icon-image': 'level-crossing'
    //         // 'icon-size': .1
    //     }
    // });

    // Add all NASA points
    map.addLayer({
        'id': 'Hotspots',
        'type': 'circle',
        'source': 'NASA ALL',
        'layout': {
            // Make the layer visible by default.
            'visibility': 'visible'
        },
        'paint': {
            'circle-radius': {
                // Make circles larger as the user zooms from z12 to z22.
                'base': 1.75,
                'stops': [
                    [9, 2],
                    [18, 180]
                ]
            },
            'circle-color': '#811005',
            'circle-opacity': 0.5
        }
    });

    // Add AirNow points
    // map.addLayer({
    //     'id': 'Air quality',
    //     'type': 'circle',
    //     'source': 'AirNow',
    //     'layout': {
    //         // Make the layer invisible by default.
    //         'visibility': 'none'
    //     },
    //     'paint': {
    //         'circle-radius': {
    //             // Make circles larger as the user zooms from z12 to z22.
    //             'base': 1.75,
    //             'stops': [
    //                 [9, 2],
    //                 [18, 180]
    //             ]
    //         },
    //         'circle-color': 'pink',
    //     }
    // });

});

// ZOOM LEVELS/CENTERS FOR MOBILE

var width = window.innerWidth;

if (width >= '1000') {
    setTimeout(function () {
        map.flyTo({
            zoom: 5.5,
            center: [-122.914, 37.695]
        }), 5000
    })
} else if (width >= '750') {
    setTimeout(function () {
        map.flyTo({
            zoom: 4.5,
            center: [-122.914, 35.695]
        }), 5000
    })
} else {
    setTimeout(function () {
        map.flyTo({
            zoom: 4.5,
            center: [-120.914, 35.695]
        }), 5000
    })
}


// CONTROLS

// Search
map.addControl(
    new MapboxGeocoder({
        accessToken: mapboxgl.accessToken,
        countries: 'us ca',
        mapboxgl: mapboxgl
    }),
    'top-left',
);

document.querySelector('.mapboxgl-ctrl-geocoder--input').placeholder = "State, City, Zip, Address";

// Zoom in/out, compass, fullscreen
const nav = new mapboxgl.NavigationControl();
map.addControl(nav, 'bottom-right');

map.addControl(new mapboxgl.FullscreenControl({
    container: document.querySelector('body')
}));

// Geolocation option
map.addControl(new mapboxgl.GeolocateControl({
    positionOptions: { enableHighAccuracy: true },
    trackUserLocation: true,
    showUserHeading: true
}));

// Scale ruler
const scale = new mapboxgl.ScaleControl({
    maxWidth: 80,
    unit: 'imperial'
});
map.addControl(scale);

scale.setUnit('imperial');

// TOGGLING LAYERS
// After the last frame rendered before the map enters an "idle" state.
map.on('idle', () => {

    // If these layers were not added to the map, abort
    if (!map.getLayer('Fire origins') || !map.getLayer('Fire perimeters') || !map.getLayer('Hotspots')) {
        return;
    }

    // Enumerate ids of the layers.
    // const toggleableLayerIds = ['Fire origins', 'Fire perimeters', 'Hotspots'];

    const layerSVG = { 'Fire origins': '<svg xmlns="http://www.w3.org/2000/svg" id="level-crossing" class="legend" width="15" height="15" viewBox="0 0 15 15"><g><path d="M11,13a2,2,0,0,1-1.4-.6L7.5,10.3,5.4,12.4A2,2,0,1,1,2.6,9.6L4.7,7.5,2.6,5.4a1.93,1.93,0,0,1-.072-2.728q.036-.038.072-.072a1.93,1.93,0,0,1,2.728-.072L5.4,2.6,7.5,4.7,9.6,2.6a1.93,1.93,0,0,1,2.728-.072q.038.036.072.072a1.93,1.93,0,0,1,.072,2.728q-.036.037-.072.072L10.3,7.5l2.1,2.1A2,2,0,0,1,11,13Z" fill="rgb(89, 89, 89)"></path><path d="M8.9,7.5l2.8-2.8a1,1,0,0,0-1.4-1.4L7.5,6.1,4.7,3.3A1,1,0,0,0,3.3,4.7L6.1,7.5,3.3,10.3a1,1,0,0,0,0,1.4A.908.908,0,0,0,4,12a.908.908,0,0,0,.7-.3L7.5,8.9l2.8,2.8a.99.99,0,0,0,1.4-1.4Z" fill="hsl(230, 10%, 74%)"></path></g></svg>', 'Fire perimeters': '<svg viewBox="0 0 15 15" class="legend" width="11px" height="15px" xmlns="http://www.w3.org/2000/svg" xmlns:bx="https://boxy-svg.com"><path d="M 15 7.5 C 15 11.642 11.642 15 7.5 15 C 3.358 15 0 11.642 0 7.5 C 0 3.358 3.358 0 7.5 0 C 11.642 0 15 3.358 15 7.5 Z" style="fill: rgb(255, 167, 0);" bx:origin="0 0"/></svg>', 'Hotspots': '<svg viewBox="0 0 15 15" class="legend" width="11px" height="15px" xmlns="http://www.w3.org/2000/svg" xmlns:bx="https://boxy-svg.com"><path d="M 15 7.5 C 15 11.642 11.642 15 7.5 15 C 3.358 15 0 11.642 0 7.5 C 0 3.358 3.358 0 7.5 0 C 11.642 0 15 3.358 15 7.5 Z" style="fill: rgb(129, 16, 5);" bx:origin="0 0"/></svg>' }

    // Set up the corresponding toggle button for each layer.
    for (const [layer, svg] of Object.entries(layerSVG)) {
        // Skip layers that already have a button set up.
        if (document.getElementById(layer)) {
            continue;
        }

        // Create a button.
        const button = document.createElement('button');
        button.id = layer;
        button.href = '#';
        button.textContent = layer;
        button.innerHTML += svg;
        button.className = 'active';
        // button.setAttribute('type', 'button');
        // button.setAttribute('data-action', 'aria-switch');
        // button.setAttribute('aria-labelledby', 'toggle_label');
        // button.setAttribute('aria-labelledby', 'toggle_label');
        // button.setAttribute('aria-checked', 'true');
        // button.setAttribute('role', 'switch');                

        // Show or hide layer when the toggle is clicked.
        button.onclick = function (e) {
            const clickedLayer = this.textContent;
            e.preventDefault();
            e.stopPropagation();

            const visibility = map.getLayoutProperty(
                clickedLayer,
                'visibility'
            );

            // Toggle layer visibility by changing the layout object's visibility property.
            if (visibility === 'visible') {
                map.setLayoutProperty(clickedLayer, 'visibility', 'none');
                this.className = '';
            } else {
                this.className = 'active';
                map.setLayoutProperty(
                    clickedLayer,
                    'visibility',
                    'visible'
                );
            }

        };

        const layers = document.getElementById('menu');
        layers.appendChild(button);

    }

});

// Show a pointer while hovering on the fire perimeters or fire origins
map.on('mouseenter', 'Fire perimeters', () => {
    map.getCanvas().style.cursor = 'pointer'
})
map.on('mouseleave', 'Fire perimeters', () => {
    map.getCanvas().style.cursor = ''
})

map.on('mouseenter', 'Fire origins', () => {
    map.getCanvas().style.cursor = 'pointer'
})
map.on('mouseleave', 'Fire origins', () => {
    map.getCanvas().style.cursor = ''
})

// Show a popup when fire perimeters are clicked and zoom to the area
map.on('click', 'Fire perimeters', function (e) {

    // IRWINS variables
    var fire_name = e.features[0].properties.poly_IncidentName.toUpperCase()
    var cost = 'Unknown'
    var acres = 'Unknown'
    var contained = 'Unknown'

    if (e.features[0].properties.irwin_PercentContained >= 0) {
        console.log(fire_name)
        console.log(e.features[0].properties.irwin_PercentContained)
        contained = e.features[0].properties.irwin_PercentContained + '%'
    }

    if (e.features[0].properties.irwin_CalculatedAcres >= 0) {
        console.log(fire_name)
        console.log(e.features[0].properties.irwin_CalculatedAcres)
        acres = Math.round(e.features[0].properties.irwin_CalculatedAcres)
    }

    if (e.features[0].properties.irwin_EstimatedCostToDate >= 0) {
        console.log(fire_name)
        console.log(e.features[0].properties.irwin_EstimatedCostToDate)
        cost = '$' + Math.round(e.features[0].properties.irwin_EstimatedCostToDate).toLocaleString()
    }

    if (fire_name == null || fire_name == 'N/A') {
        fire_name = 'Unknown';
    }

    popup_html = '<strong>Name: ' + fire_name + '</strong><br/>' + 'Containment: ' + contained + '<br/>' + 'Acres: ' + acres.toLocaleString() + '<br/>' + 'Cost: ' + cost;

    new mapboxgl.Popup()
        .setLngLat(e.lngLat)
        .setHTML(popup_html)
        .addTo(map);

    var bbox = turf.extent(e.features[0].geometry);

    if (window.innerHeight <= '800') {
        console.log(bbox);
        map.fitBounds(bbox, {
            padding:
                { top: 40, bottom: 300, left: 40, right: 40 }
        });
    } else {
        console.log(bbox);
        map.fitBounds(bbox, { padding: 40 });
    }



});

// Show a popup when fire origins are clicked and center and zoom to the area
map.on('click', 'Fire origins', function (e) {

    console.log('WOOT!')

    // IRWINS variables
    var fire_name = e.features[0].properties.IncidentName.toUpperCase()
    var cost = 'Unknown'
    var acres = 'Unknown'
    var contained = 'Unknown'

    if (e.features[0].properties.PercentContained >= 0) {
        console.log(fire_name)
        console.log(e.features[0].properties.PercentContained)
        contained = e.features[0].properties.PercentContained + '%'
    }

    if (e.features[0].properties.CalculatedAcres >= 0) {
        console.log(fire_name)
        console.log(e.features[0].properties.CalculatedAcres)
        acres = Math.round(e.features[0].properties.CalculatedAcres)
    }

    if (e.features[0].properties.EstimatedCostToDate >= 0) {
        console.log(fire_name)
        console.log(e.features[0].properties.EstimatedCostToDate)
        cost = '$' + Math.round(e.features[0].properties.EstimatedCostToDate).toLocaleString()
    }

    if (fire_name == null || fire_name == 'N/A') {
        fire_name = 'Unknown';
    }

    popup_html = '<strong>Name: ' + fire_name + '</strong><br/>' + 'Containment: ' + contained + '<br/>' + 'Acres: ' + acres.toLocaleString() + '<br/>' + 'Cost: ' + cost;

    new mapboxgl.Popup()
        .setLngLat(e.lngLat)
        .setHTML(popup_html)
        .addTo(map);

    map.flyTo({
        zoom: 9,
        center: e.features[0].geometry.coordinates
    })

});

// ABOUT MODAL
var modal = document.getElementById("modal");
var btn = document.getElementById("modalBtn");
var span = document.getElementsByClassName("close")[0];

btn.onclick = function () {
    modal.style.display = "block";
}

span.onclick = function () {
    modal.style.display = "none";
}

window.onclick = function (event) {
    if (event.target == modal) {
        modal.style.display = "none";
    }
}