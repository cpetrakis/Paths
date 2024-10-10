/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

var url_string = window.location.href;
var url = new URL(url_string);
var lang = url.searchParams.get("lang");
var path = url.searchParams.get("path");
var language = url.searchParams.get("lang");

function switch_english() {
    if (language !== 'en') {
        window.location.replace(url_string.replace("lang=gr", "lang=en"));
    }
}

function switch_greek() {
    if (language !== 'gr') {
        window.location.replace(url_string.replace("lang=en", "lang=gr", "_self"));
    }
}

function setOverlayOpacity(opacity) {
    overlay.setOpacity(opacity);
}

function getColor(d) {

    var color = '';
    if (d === 'Good') {
        color = '#FED976';
    } else if (d === 'Mixed') {
        color = '#FEB24C';
    } else if (d === 'Ruin') {
        color = '#E31A1C';
    } else {
        color = '#800026';
    }

    return color;
}

function style(feature) {
    return {
        weight: 2,
        opacity: 1,
        color: '#800026',
        dashArray: '3',
        fillOpacity: 0.7,
        fillColor: getColor(feature.properties.Buildings_STATUS)
    };
}

function highlightFeature(e) {
    var layer = e.target;

    if (!(layer._latlng)) {
        layer.setStyle({
            weight: 5,
            color: '#666',
            dashArray: '',
            fillOpacity: 0.7
        });

        if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
            layer.bringToFront();
        }
    }
    //info.update(layer.feature.properties);
}

function zoomToFeature(e) {
    // map.fitBounds(e.target.getBounds());
}

function createBaseLayers(config_layers) {

    var result = new Object();

    $.each(config_layers, function (row) {
        if (this.id) {
            result[this.name] = L.tileLayer(this.link, {
                id: this.id,
                attribution: this.attribution
            });
        } else if (this.ext) {
            result[this.name] = L.tileLayer(this.link, {
                id: this.id,
                attribution: this.attribution,
                maxZoom: this.maxZoom,
                ext: this.ext
            });
        } else {
            result[this.name] = L.tileLayer(this.link, {
                maxZoom: this.maxZoom,
                attribution: this.attribution
            });
        }

    });

    return result;
}


$(document).ready(function () {
    //console.log(language)
    if (language === "en") {
        $("#lang_en").css("color", "gray");
        $("#lang_en").css("cursor", "default");
    } else if (language === "gr") {
        $("#lang_gr").css("color", "gray");
        $("#lang_gr").css("cursor", "default");
    }
});



$.getJSON('configuration/config.json', function (config_data) {


    L.Control.Button = L.Control.extend({
        options: {
            position: 'topleft'
        },
        initialize: function (options) {
            this._button = {};
            this.setButton(options);
        },

        onAdd: function (map) {
            this._map = map;
            var container = L.DomUtil.create('div', 'leaflet-control-button');

            this._container = container;

            this._update();
            return this._container;
        },

        onRemove: function (map) {
        },

        setButton: function (options) {
            var button = {
                'text': options.text, //string
                'iconUrl': options.iconUrl, //string
                'onClick': options.onClick, //callback function
                'hideText': !!options.hideText, //forced bool
                'maxWidth': options.maxWidth || 70, //number
                'doToggle': options.toggle, //bool
                'toggleStatus': false					//bool
            };

            this._button = button;
            this._update();
        },

        getText: function () {
            return this._button.text;
        },

        getIconUrl: function () {
            return this._button.iconUrl;
        },

        destroy: function () {
            this._button = {};
            this._update();
        },

        toggle: function (e) {
            if (typeof e === 'boolean') {
                this._button.toggleStatus = e;
            } else {
                this._button.toggleStatus = !this._button.toggleStatus;
            }
            this._update();
        },

        _update: function () {
            if (!this._map) {
                return;
            }

            this._container.innerHTML = '';
            this._makeButton(this._button);

        },

        _makeButton: function (button) {
            var newButton = L.DomUtil.create('div', 'leaflet-buttons-control-button', this._container);
            if (button.toggleStatus)
                L.DomUtil.addClass(newButton, 'leaflet-buttons-control-toggleon');

            var image = L.DomUtil.create('img', 'leaflet-buttons-control-img', newButton);
            image.setAttribute('src', button.iconUrl);

            if (button.text !== '') {

                L.DomUtil.create('br', '', newButton);  //there must be a better way

                var span = L.DomUtil.create('span', 'leaflet-buttons-control-text', newButton);
                var text = document.createTextNode(button.text);  //is there an L.DomUtil for this?
                span.appendChild(text);
                if (button.hideText)
                    L.DomUtil.addClass(span, 'leaflet-buttons-control-text-hide');
            }

            L.DomEvent
                    .addListener(newButton, 'click', L.DomEvent.stop)
                    .addListener(newButton, 'click', button.onClick, this)
                    .addListener(newButton, 'click', this._clicked, this);
            L.DomEvent.disableClickPropagation(newButton);
            return newButton;

        },

        _clicked: function () {  //'this' refers to button
            if (this._button.doToggle) {
                if (this._button.toggleStatus) {	//currently true, remove class
                    L.DomUtil.removeClass(this._container.childNodes[0], 'leaflet-buttons-control-toggleon');
                } else {
                    L.DomUtil.addClass(this._container.childNodes[0], 'leaflet-buttons-control-toggleon');
                }
                this.toggle();
            }
            return;
        }

    });


    var baseLayers = createBaseLayers(config_data.baseLayers);

    var lrs = new Array();
    lrs.push(baseLayers['Open Street Maps']);

// control that shows state info on hover
    /*var info = L.control();
     
     info.onAdd = function (map) {
     this._div = L.DomUtil.create('div', 'info');
     this.update();
     return this._div;
     };
     */
    var geojson;
    var FetchbinLink = config_data.FetchBinFile;
    var dbSuffix = config_data.db_suffix;
    var serverIPandPort = config_data.db;
    var publicRecordsDB_remote = new PouchDB(serverIPandPort + '/public_records' + dbSuffix + '');



    var zoom = config_data.init.zoom;//data['zoom'];
    var minzoom = config_data.init.minZoom;
    console.log(config_data);

    var map = L.map('map', {
        center: [config_data.init.center.latitude, config_data.init.center.longitude],
        zoom: zoom,
        minZoom: minzoom,
        layers: lrs
    });

    var overlayMaps = new Object();


    publicRecordsDB_remote.allDocs({
        include_docs: true,
        descending: false
    }).then(function (result) {


        $.each((result.rows), function (rs) {

            var data = this.doc.data;

            if (data) {
               
                function resetHighlight(e) {
                    geojson.resetStyle(e.target);
                }

                function onEachFeature(feature, layer) {

                    var onerror = 'onerror=\'this.src="img/katopsi.PNG";\'';
                    var html = '';
//console.log(data)
                    html = html + '<div style="overflow:hidden;"><img src="'+FetchbinLink + data.characteristic_image + '" style="max-height:100%;max-width:100%; min-height:200px;min-width:200px;"  ' + onerror + '  </img>' + '</div>';
                    html = html + "<span><span style='font-weight:bold;'>Path TItle: </span>" + data.language.en.title + '</span><br>';

                    layer.bindPopup(html);
                    layer.on({
                        mouseover: highlightFeature,
                        mouseout: resetHighlight,
                        click: zoomToFeature
                    });
                }

                geojson = L.geoJson(data.geojson, {
                    style: style,
                    onEachFeature: onEachFeature
                }).addTo(map);

                console.log(data)
                overlayMaps[data.language.en.title] = geojson;

            }
        });
        
        L.control.layers(baseLayers, overlayMaps).addTo(map);
    
});

    function create_path_onMap(path_id) {


    }



});


/*
 
 var current_position, current_accuracy;
 
 function onLocationFound(e) {
 // if position defined, then remove the existing position marker and accuracy circle from the map
 if (current_position) {
 map.removeLayer(current_position);
 map.removeLayer(current_accuracy);
 }
 
 var radius = e.accuracy / 2;
 
 current_position = L.marker(e.latlng).addTo(map)
 .bindPopup("You are within " + radius + " meters from this point").openPopup();
 
 current_accuracy = L.circle(e.latlng, radius).addTo(map);
 }
 
 function onLocationError(e) {
 alert(e.message);
 }
 
 map.on('locationfound', onLocationFound);
 map.on('locationerror', onLocationError);
 
 // wrap map.locate in a function    
 function locate() {
 map.locate({setView: true, maxZoom: 16});
 }
 
 locate()
 // call locate every 3 seconds... forever
 // setInterval(locate, 3000);
 
 */
