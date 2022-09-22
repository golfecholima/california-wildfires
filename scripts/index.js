var pymChild = new pym.Child();
mapboxgl.accessToken = 'pk.eyJ1IjoiY2FsbmV3c3Jvb20iLCJhIjoiY2ttYzhwZ2wyMDVobTJwbXhiaG81bXpzdSJ9.xnkn2BlbVZvFfGukyV_-0g';

const bounds = [
    [-179.691800, 0.572312], // Southwest coordinates 
    [-31.805816, 76.179739] // Northeast coordinates 
];

const map = new mapboxgl.Map({
    container: 'map', // container ID
    style: 'mapbox://styles/calnewsroom/cktxg3xf3026p18o15i0p1z9v', // style URL
    center: [-119.58, 36.5], // starting position [lng, lat]
    maxZoom: 10, // sets max zoom
    minZoom: 2, // sets min zoom
    zoom: 5, // starting zoom
    maxBounds: bounds, // restrict panning area
    hash: true // enable custon center/zoom via URL
});

// Add icons

map.loadImage('./assets/outline_local_fire_department_black_18dp_2x.png', (error, image) => {
    if (error) throw error;
    // add image to the active style and make it SDF-enabled
    map.addImage('fire', image, { sdf: true });
});

// map.loadImage('./assets/pattern.png', (error, image) => {
//     if (error) throw error;
//     // add image to the active style and make it SDF-enabled
//     map.addImage('pattern', image, { sdf: true });
// });

map.on('load', () => {

    // Update the 'last updated' section of about
    var client = new XMLHttpRequest();
    client.open('GET', 'https://raw.githubusercontent.com/golfecholima/california-wildfires/main/last-updated.txt');
    client.onload = function () {
        document.getElementById('lastUpdated').innerHTML += client.responseText;
    }
    client.send();

    // Add sources

    // https://data-nifc.opendata.arcgis.com/search?tags=Category%2C2021_wildlandfire_opendata
    map.addSource('NIFC Polygons', {
        type: 'vector',
        url: 'mapbox://calnewsroom.nifc-polygons-tp'
    });

    // https://data-nifc.opendata.arcgis.com/search?tags=Category%2C2021_wildlandfire_opendata
    map.addSource('NIFC Points', {
        type: 'geojson',
        data: 'https://raw.githubusercontent.com/golfecholima/california-wildfires/main/gis/nifc_points.geojson',
        cluster: true,
        clusterMaxZoom: 8, // Max zoom to cluster points on
        clusterRadius: 50 // Radius of each cluster when clustering points (defaults to 50)
    });

    map.addSource('NASA ALL', {
        type: 'geojson',
        data: 'https://raw.githubusercontent.com/golfecholima/california-wildfires/main/gis/nasa_all.geojson'
    });

    // Add layers w/ styling

    // Add NIFC fire perimeters
    map.addLayer({
        'id': 'Fire perimeters',
        'type': 'fill',
        'source': 'NIFC Polygons', // reference the data source
        'source-layer': 'nifc_polygons',
        'layout': {
            'visibility': 'visible'
        },
        'paint': {
            'fill-color': '#FFA700',
            'fill-opacity': 0.5
            // 'fill-pattern': 'pattern'
        }
    });

    // Add all NASA points
    map.addLayer({
        'id': 'Hotspots',
        'type': 'circle',
        'source': 'NASA ALL',
        'layout': {
            'visibility': 'visible'
        },
        'paint': {
            'circle-radius': {
                // Make circles larger as the user zooms in.
                'base': 1.75,
                'stops': [
                    [2, 1],
                    [4, 2],
                    [6, 3],
                    [8, 3.5],
                    [10, 4]
                ]
            },
            'circle-color': 'firebrick',
            'circle-opacity': 1
        }
    });

    // Add clusters
    map.addLayer({
        'id': 'clusters',
        'type': 'circle',
        'source': 'NIFC Points',
        'layout': {
            'visibility': 'visible'
        },
        'filter': ['has', 'point_count'],
        'paint': {
            'circle-color': 'cornflowerblue',
            'circle-radius': [
                'step',
                ['get', 'point_count'], 6, 2, 8, 4, 10, 6, 12, 8, 14, 10, 16
            ]
        }
    });

    // // Add cluster text
    // map.addLayer({
    //     'id': 'cluster-count',
    //     'type': 'symbol',
    //     'source': 'NIFC Points',
    //     'filter': ['has', 'point_count'],
    //     'layout': {
    //         'visibility': 'visible',
    //         'text-field': '{point_count}',
    //         'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
    //         'text-size': 10
    //     },
    //     'paint': {
    //         'text-color': 'white'
    //     }
    // });

    // Add NIFC fire origin points
    map.addLayer({
        id: 'Fire origins',
        type: 'symbol',
        source: 'NIFC Points',
        filter: ['!', ['has', 'point_count']],
        'layout': {
            'visibility': 'visible',
            'icon-image': 'fire',
            'icon-size': .5
        },
        'paint': {
            'icon-color': 'cornflowerblue'
        }
    });

    // Mouse pointer behavior
    map.on('mousemove', (e) => {
        const layers = ['Fire origins', 'Fire perimeters', 'clusters'];
        const features = map.queryRenderedFeatures(e.point, {
            layers: layers
        });

        if (features.length) {
            map.getCanvas().style.cursor = 'pointer'
        } else {
            map.getCanvas().style.cursor = ''
        }

    });

});

// CUSTOM URL BASED ZOOM LEVELS/CENTERS

var width = window.innerWidth;
var href = window.location.href;

var rez = /(?:#)(.*?)(?=\/)/;
var relat = /\d*\.\d*(?=\/-)/;
var relon = /-.*$/;

var z = rez.exec(href)[1];
var latitude = relat.exec(href);
var longitude = relon.exec(href);

var coords = [+longitude[0], +latitude[0]];

setTimeout(function () {
    map.flyTo({
        zoom: z,
        center: coords
    })
}, 5000)

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

    // Enumerate layer ids and svgs.
    const layerSVG = {
        'Fire origins': '<svg xmlns="http://www.w3.org/2000/svg" enable-background="new 0 0 24 24" height="16px" viewBox="0 0 24 24" width="16px" fill="CornflowerBlue" style="position: relative;top: 3px;left: 7px;"><g><rect fill="none" height="24" width="24" y="0"></rect></g><g><path d="M19.48,12.35c-1.57-4.08-7.16-4.3-5.81-10.23c0.1-0.44-0.37-0.78-0.75-0.55C9.29,3.71,6.68,8,8.87,13.62 c0.18,0.46-0.36,0.89-0.75,0.59c-1.81-1.37-2-3.34-1.84-4.75c0.06-0.52-0.62-0.77-0.91-0.34C4.69,10.16,4,11.84,4,14.37 c0.38,5.6,5.11,7.32,6.81,7.54c2.43,0.31,5.06-0.14,6.95-1.87C19.84,18.11,20.6,15.03,19.48,12.35z M10.2,17.38 c1.44-0.35,2.18-1.39,2.38-2.31c0.33-1.43-0.96-2.83-0.09-5.09c0.33,1.87,3.27,3.04,3.27,5.08C15.84,17.59,13.1,19.76,10.2,17.38z"></path></g></svg>',
        'Fire perimeters': '<svg xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape" xmlns:sodipodi="http://sodipodi.sourceforge.net/DTD/sodipodi-0.dtd" xmlns="http://www.w3.org/2000/svg" xmlns:svg="http://www.w3.org/2000/svg" width="14.999997" height="15.000007" viewBox="0 0 3.9687492 3.9687519" version="1.1" id="svg5" inkscape:version="1.1.1 (c3084ef, 2021-09-22)" sodipodi:docname="poly_icon.svg" style="top: 2px;left: 7px;position: relative;"><sodipodi:namedview id="namedview7" pagecolor="#ffffff" bordercolor="#111111" borderopacity="1" inkscape:pageshadow="0" inkscape:pageopacity="0" inkscape:pagecheckerboard="1" inkscape:document-units="px" showgrid="false" inkscape:zoom="9.591727" inkscape:cx="59.895366" inkscape:cy="26.637539" inkscape:window-width="1440" inkscape:window-height="847" inkscape:window-x="0" inkscape:window-y="25" inkscape:window-maximized="0" inkscape:current-layer="layer1" units="px" fit-margin-top="0" fit-margin-left="0" fit-margin-right="0" fit-margin-bottom="0"></sodipodi:namedview><defs id="defs2"></defs><g inkscape:label="Layer 1" inkscape:groupmode="layer" id="layer1" transform="translate(-0.04463171,-0.04388963)"><path sodipodi:type="star" style="fill:#ffa700;fill-opacity:1;fill-rule:evenodd;top: 10px;left: 10px;" id="path33" inkscape:flatsided="false" sodipodi:sides="5" sodipodi:cx="95.189667" sodipodi:cy="222.70792" sodipodi:r1="193.44685" sodipodi:r2="132.29352" sodipodi:arg1="-0.22471116" sodipodi:arg2="0.13548742" inkscape:rounded="0.12" inkscape:randomized="0.3" d="m 323.00124,142.39346 c 7.03064,4.97817 -36.72118,64.43318 -44.52716,71.077 -14.11409,12.01278 -47.36382,173.60457 -59.70746,188.05395 -6.82681,7.99141 -52.83044,-40.51866 -61.86161,-44.36679 -16.32938,-6.95785 -175.976255,39.26323 -186.455445,25.90526 -5.79565,-7.3878 45.42205,-42.69365 40.01863,-50.49988 C 0.69820232,318.44845 -116.50949,187.43013 -121.27342,169.48503 -123.90818,159.56027 -16.953793,75.514741 -6.6749331,73.986286 11.910406,71.222666 84.502305,11.366624 102.17365,16.657075 c 9.77336,2.925952 -0.81425,107.569235 9.09224,111.900225 17.91206,7.83094 199.02316,4.83506 211.73535,13.83616 z" transform="matrix(0.00891685,0,0,0.01027946,1.1264355,-0.12393451)" inkscape:transform-center-x="-0.060087351" inkscape:transform-center-y="-0.12551184"></path></g></svg>',
        'Hotspots': '<svg viewBox="0 0 15 15" class="legend" width="11px" height="15px" xmlns="http://www.w3.org/2000/svg" xmlns:bx="https://boxy-svg.com"><path d="M 15 7.5 C 15 11.642 11.642 15 7.5 15 C 3.358 15 0 11.642 0 7.5 C 0 3.358 3.358 0 7.5 0 C 11.642 0 15 3.358 15 7.5 Z" style="fill: firebrick;" bx:origin="0 0"/></svg>'
    }

    // Set up the corresponding toggle button for each layer.
    for (const [layer, svg] of Object.entries(layerSVG)) {
        // Skip layers that already have a button set up.
        if (document.getElementById(layer)) {
            continue;
        }

        // Create a button.
        const button = document.createElement('button');
        var checkbox = '<label class="container">' + layer + '<input id="' + layer.replace(/\s+/g, '') + '-check" type="checkbox" checked="checked" tabindex ="-1"><label for="' + layer.replace(/\s+/g, '') + '"></label><span class="checkmark"></span></label>'
        button.id = layer;
        button.innerHTML += checkbox + svg;
        button.className = 'active';

        // Show or hide layer when the toggle is clicked.
        button.onclick = function (e) {
            const check = document.getElementById(layer.replace(/\s+/g, '') + '-check')
            const clickedLayer = this.id;
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
                check.checked = !check.checked;

                if (button.id === 'Fire origins') {
                    map.setLayoutProperty('clusters', 'visibility', 'none');
                    // map.setLayoutProperty('cluster-count', 'visibility', 'none');
                }

            } else {
                map.setLayoutProperty(clickedLayer, 'visibility', 'visible');
                this.className = 'active';
                check.checked = !check.checked;

                if (button.id === 'Fire origins') {
                    map.setLayoutProperty('clusters', 'visibility', 'visible');
                    // map.setLayoutProperty('cluster-count', 'visibility', 'visible');
                }

            }

        };

        const layers = document.getElementById('menu');
        layers.appendChild(button);

    }

});

// Clusters / Popups
// Inspect a cluster on click
map.on('click', 'clusters', (e) => {
    const features = map.queryRenderedFeatures(e.point, {
        layers: ['clusters']
    });
    const clusterId = features[0].properties.cluster_id;
    map.getSource('NIFC Points').getClusterExpansionZoom(
        clusterId,
        (err, zoom) => {
            if (err) return;

            map.easeTo({
                center: features[0].geometry.coordinates,
                zoom: zoom
            });
        }
    );
});

// Bespoke popup behavior for points v polygons
map.on('click', function (e) {

    let f = map.queryRenderedFeatures(e.point, { layers: ['Fire origins', 'Fire perimeters', 'clusters'] }); // Needed to avoid duplicate popups for origin points that fall on top of polygons

    if (f.length) { // Needed to avoid duplicate popups for origin points that fall on top of polygons

        // Points - Fire origins section
        if (f[0].properties.IncidentName) {

            // Query all features from a single layer
            const poly_features = map.querySourceFeatures('NIFC Polygons', {
                sourceLayer: 'nifc_polygons'
            });

            var irwinid = f[0].properties.IrwinID

            for (let i = 0; i < poly_features.length; i++) {

                var poly_id = poly_features[i].properties.irwin_IrwinID

                if (irwinid === poly_id) {
                    var mp = turf.multiPolygon(poly_features[i].geometry)
                    var bbox = turf.bbox(mp.geometry.coordinates)
                    var cen = turf.centroid(poly_features[i].geometry)


                    if (window.innerHeight <= '700') {
                        map.fitBounds(bbox, {
                            padding:
                                { top: 50, bottom: 150, left: 50, right: 50 }
                        });
                    } else {
                        map.fitBounds(bbox, {
                            padding:
                                { top: 100, bottom: 100, left: 100, right: 100 }
                        });
                    }

                    var fire_name = poly_features[i].properties.poly_IncidentName.toUpperCase()
                    var cost = 'Unknown'
                    var acres = 'Unknown'
                    var contained = 'Unknown'

                    if (poly_features[i].properties.irwin_PercentContained >= 0) {
                        contained = poly_features[i].properties.irwin_PercentContained + '%'
                    }

                    if (poly_features[i].properties.irwin_DailyAcres >= 0) {
                        acres = Math.round(poly_features[i].properties.irwin_DailyAcres).toLocaleString()
                    }

                    if (poly_features[i].properties.irwin_EstimatedCostToDate >= 0) {
                        cost = '$' + Math.round(poly_features[i].properties.irwin_EstimatedCostToDate).toLocaleString()
                    }

                    if (fire_name == null || fire_name == 'N/A') {
                        fire_name = 'Unknown';
                    }

                    popup_html = `<strong>${fire_name}</strong><br/>Containment: ${contained}<br/>Acres: ${acres}<br/>Cost: ${cost}`;

                    new mapboxgl.Popup()
                        .setLngLat(cen.geometry.coordinates)
                        .setHTML(popup_html)
                        .addTo(map)

                    break;
                }
            }

        } else { // Polys - Fire perimeters section

            var mp = turf.multiPolygon(f[0].geometry)
            var bbox = turf.bbox(mp.geometry.coordinates)
            var cen = turf.centroid(f[0].geometry)

            if (window.innerHeight <= '700') {
                map.fitBounds(bbox, {
                    padding:
                        { top: 50, bottom: 150, left: 50, right: 50 }
                });
            } else {
                map.fitBounds(bbox, {
                    padding: { top: 100, bottom: 100, left: 100, right: 100 }
                });
            }

            if (f[0].properties.poly_IncidentName !== undefined) {
                var fire_name = f[0].properties.poly_IncidentName.toUpperCase()
                var cost = 'Unknown'
                var acres = 'Unknown'
                var contained = 'Unknown'

                if (f[0].properties.irwin_PercentContained >= 0) {
                    contained = f[0].properties.irwin_PercentContained + '%'
                }

                if (f[0].properties.irwin_DailyAcres >= 0) {
                    acres = Math.round(f[0].properties.irwin_DailyAcres).toLocaleString()
                }

                if (f[0].properties.irwin_EstimatedCostToDate >= 0) {
                    cost = '$' + Math.round(f[0].properties.irwin_EstimatedCostToDate).toLocaleString()
                }

                if (fire_name == null || fire_name == 'N/A') {
                    fire_name = 'Unknown';
                }

                popup_html = `<strong>${fire_name}</strong><br/>Containment: ${contained}<br/>Acres: ${acres}<br/>Cost: ${cost}`;

                new mapboxgl.Popup()
                    .setLngLat(cen.geometry.coordinates)
                    .setHTML(popup_html)
                    .addTo(map);
            }
        }
    }
});

// ABOUT MODAL

const close = document.getElementById("close");
const container = document.getElementById('modal');
const content = document.getElementById('modal-content');

const ft = focusTrap.createFocusTrap('#modal-content', {
    clickOutsideDeactivates: true,
    escapeDeactivates: true,
    delayInitialFocus: true,
    // Called before focus is sent
    onActivate: () => container.classList.add('is-active') || content.classList.add('is-active'),

    // There is a delay between when the class is applied
    // and when the element is focusable
    checkCanFocusTrap: (trapContainers) => {
        const results = trapContainers.map((trapContainer) => {
            return new Promise((resolve) => {
                const interval = setInterval(() => {
                    if (getComputedStyle(trapContainer).visibility !== 'hidden') {
                        resolve();
                        clearInterval(interval);
                    }
                }, 5);
            });
        });
        // Return a promise that resolves when all the trap containers are able to receive focus
        return Promise.all(results);
    },

    // Called after focus is sent to the focus trap
    onDeactivate: () => container.classList.remove('is-active') || content.classList.remove('is-active')
});

document
    .getElementById('modalBtn')
    .addEventListener('click', ft.activate);

document
    .getElementById('close')
    .addEventListener('click', ft.deactivate);

// WARNING

var elem = document.getElementById("warning");

window.setTimeout(function () {
    elem.style.opacity = '0';
}, 5000);

window.setTimeout(function () {
    elem.style.display = 'none';
}, 6000);