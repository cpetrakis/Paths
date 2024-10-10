/*
 To change this license header, choose License Headers in Project Properties.
 To change this template file, choose Tools | Templates
 and open the template in the editor.
 
 
 Created on : March, 2020, 1:11:54 PM
 Author     : cpetrakis
 Contact: cpetrakis@ics.forth.gr
 */



console.log('dsfds')
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
        }
         else if (this.subdomains) {
            result[this.name] = L.tileLayer(this.link, {               
                maxZoom: this.maxZoom,
                subdomains: this.subdomains
            });
        }      
        else {
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

    publicRecordsDB_remote.get(path, {conflicts: true}).then(function (response) {
        
        console.log(response.data.geojson)

        var data = response.data;
        var lang = url.searchParams.get("lang");

        if (!lang) {
            lang = 'en';
        }

        var zoom = config_data.init.zoom;//data['zoom'];
        var minzoom = config_data.init.minZoom;
      //  console.log(config_data);

        var map = L.map('map', {
            // center: [data["map_center_lat"], data["map_center_lon"]],
            zoom: zoom,
            minZoom: minzoom,
            layers: lrs
        });

        map.setMaxBounds(bounds);


        var hip = JSON.stringify(data.geojson);
      

        if (data.geojson.features[0].geometry.coordinates) {
            if (data.geojson.features[0].geometry.coordinates[0].length > 2) {

                var opts = {

                    elevationControl: {
                        data: hip,
                        options: {
                            theme: "lime-theme", //default: lime-theme
                            useHeightIndicator: false, //if false a marker is drawn at map position
                            elevationDiv: "#elevation-div",
                            detachedView: true
                        }
                    },
                    layersControl: {
                        options: {
                            collapsed: false
                        }
                    }
                };


                var controlElevation = L.control.elevation(opts.elevationControl.options);

                map.on('eledata_loaded', function (e) {
                    //console.log(e)
                    var q = document.querySelector.bind(document);
                    var track = e.track_info;
                    // console.log(e.track_info)
                    if (track.distance) {
                      //  console.log(e.track_info) // track = e.track_info;

                        q('.totlen .summaryvalue').innerHTML = track.distance.toFixed(2) + " km";
                        q('.maxele .summaryvalue').innerHTML = track.elevation_max.toFixed(2) + " m";
                        q('.minele .summaryvalue').innerHTML = track.elevation_min.toFixed(2) + " m";
                    }
                });

                controlElevation.loadChart(map);
                controlElevation.loadData(hip);

            }
        }
///////////////////////////

        $('#path_id').html(data.id + ' <small id="path_title">' + data.language[lang].title + '<small>');
        $('#description_label').html(data.language[lang].description_label);
        $('#description').html(data.language[lang].description);
        
       
        if(lang ==='en'){
            $('#activities_label').html('Activities');
        }else if (lang==='gr'){
            $('#activities_label').html('Δρατηριότητες');
        }
        
        var act = data.activity.split(',');
        //console.log(act)
        
        
        var activity_html ="";
        $.each(act, function (key) {
            activity_html = activity_html+ "<img style='cursor:pointer; width:40px; height: 40px;' class='' src='img/"+this.toString()+".png' alt='' title='"+this.toString()+"'>";
       
        });
        
       
        $('#activities').append(activity_html);

        var details = data.language[lang].details;
        var details_html = "";

        $.each(details, function (key) {
            details_html = details_html + "<li> " + key + " : " + this + "</li>";
        });

        $('#details_label').html(data.language[lang].details_label);
        $('#details').html(details_html);

        $('#gallery_label').html(data.language[lang].gallery_label);


        // console.log(data);

        var images = data.other_images;
        var images_html = "";

        $.each(images, function (key) {
            images_html = images_html + '<li><img style="height:260px; width:260px;" data-original="' + FetchbinLink + this.toString() + '" src="' + FetchbinLink + this.toString() + '" alt="' + this.toString() + '"></li>';
        });



        function resetHighlight(e) {
            geojson.resetStyle(e.target);
        }

        function onEachFeature(feature, layer) {

            var onerror = 'onerror=\'this.src="img/katopsi.PNG";\'';
            var html = '';

            html = html + '<div style="overflow:hidden;"><img src="path_files/' + path + '.jpg" style="max-height:100%;max-width:100%; min-height:200px;min-width:200px;"  ' + onerror + '  </img>' + '</div>';
            html = html + "<span><span style='font-weight:bold;'>Path Name: </span>" + path + '</span><br>';

            layer.bindPopup(html);
            layer.on({
                mouseover: highlightFeature,
                mouseout: resetHighlight,
                click: zoomToFeature
            });
        }


        $('#images').html(images_html);



        geojson = L.geoJson(data.geojson, {
            style: style,
            onEachFeature: onEachFeature
        }).addTo(map);


        var bounds = geojson.getBounds();
        var center = bounds.getCenter();
        map.panTo(center);
//console.log(bounds)



        var overlayMaps = {
            // "Werdmuller 1668 - Gerola": overlay,
            // "Κόφινας- Μονή Κουδουμά": geojson
        };


        L.control.layers(baseLayers, overlayMaps).addTo(map);

        $(function () {
            'use strict';

            // var console = window.console || {log: function () {}};
            var $images = $('.docs-pictures');
            var $toggles = $('.docs-toggles');
            var $buttons = $('.docs-buttons');
            var options = {
                // inline: true,
                url: 'data-original',
                ready: function (e) {
                    //console.log(e.type);
                },
                show: function (e) {
                    //console.log(e.type);
                },
                shown: function (e) {
                    //console.log(e.type);
                },
                hide: function (e) {
                    //console.log(e.type);
                },
                hidden: function (e) {
                    //console.log(e.type);
                },
                view: function (e) {
                    //console.log(e.type);
                },
                viewed: function (e) {
                    //console.log(e.type);
                }
            };

            function toggleButtons(mode) {
                if (/modal|inline|none/.test(mode)) {
                    $buttons
                            .find('button[data-enable]')
                            .prop('disabled', true)
                            .filter('[data-enable*="' + mode + '"]')
                            .prop('disabled', false);
                }
            }

            $images.on({
                ready: function (e) {
                    //console.log(e.type);
                },
                show: function (e) {
                    $('.leaflet-control-attribution').hide();
                    //console.log(e.type);
                },
                shown: function (e) {
                    //console.log(e.type);
                },
                hide: function (e) {
                    $('.leaflet-control-attribution').show();
                    //console.log(e.type);
                },
                hidden: function (e) {
                    //console.log(e.type);
                },
                view: function (e) {
                    //console.log(e.type);
                },
                viewed: function (e) {
                    //console.log(e.type);
                }
            }).viewer(options);

            toggleButtons(options.inline ? 'inline' : 'modal');

            $toggles.on('change', 'input', function () {
                var $input = $(this);
                var name = $input.attr('name');

                options[name] = name === 'inline' ? $input.data('value') : $input.prop('checked');
                $images.viewer('destroy').viewer(options);
                toggleButtons(options.inline ? 'inline' : 'modal');
            });

            $buttons.on('click', 'button', function () {
                var data = $(this).data();
                var args = data.arguments || [];

                if (data.method) {
                    if (data.target) {
                        $images.viewer(data.method, $(data.target).val());
                    } else {
                        $images.viewer(data.method, args[0], args[1]);
                    }

                    switch (data.method) {
                        case 'scaleX':
                        case 'scaleY':
                            args[0] = -args[0];
                            break;

                        case 'destroy':
                            toggleButtons('none');
                            break;
                    }
                }
            });
        });
    });
});



