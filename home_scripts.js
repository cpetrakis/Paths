/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

$(document).ready(function () {

    $.getJSON('configuration/config.json', function (data) {

        //console.log(data);
        var FetchbinLink = data.FetchBinFile;
        var serverIPandPort = data.db;
        var dbSuffix = data.db_suffix;
        var publicRecordsDB_remote = new PouchDB(serverIPandPort + '/public_records' + dbSuffix + '');
       
        publicRecordsDB_remote.allDocs({
            include_docs: true,
            descending: false
        }).then(function (result) {

            $.each((result.rows), function (rs) {
                if (this.doc.data) {

                    var html = "";
                    var filters = "";
                    
                    if (this.doc.data.activity && this.doc.data.region) {
                        filters = this.doc.data.activity.replace(/,/g, "_") + '_' + this.doc.data.region.replace(/,/g, "_");

                    }

                    html = html + '<div class="col-sm-6 col-md-3 ">' +
                            '<h4 class="images-title ' + filters + '">' + this.doc.data.language.en.title + '</h4>' +
                            '<a href="paths.html?path=' + this.doc.data.uuid + '&lang=en" target="_blank"><img style="height:247px; width:340px;" src="' + FetchbinLink + this.doc.data.characteristic_image + '" class="img-rounded img-responsive" alt="Rounded Image"></a> ' +
                            '<div class="img-details">' +
                            '</div>' +
                            '</div>';

                    $("#path_content").append(html);
                }
            });

        });


        $("#show_all").click(function () {

            var elements = $('.container').children('.row');
            $(".form-check-input").prop("checked", false);
            $.each($(elements).children('.col-sm-6'), function (key) {
                $(this).show();
            });
        });

        $("#category_search").click(function () {

            var elements = $('.container').children('.row');
            $.each($(elements).children('.col-sm-6'), function (key) {
                $(this).hide();
            });

            $('input:checkbox.form-check-input').each(function () {
                var selected = (this.checked ? $(this).val() : "");
                if (selected) {
                    $.each($(elements).children('.col-sm-6'), function (key) {
                        var activities = $(this).children(0).attr('class').replace("images-title", "");
                        if (activities.indexOf(selected) > -1) {
                            $(this).show();
                        }
                    });
                } else {
                    console.log('no selection');
                }
            });
        });
    });
});