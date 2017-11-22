import {
    uiModules
} from 'ui/modules';
import {
    AggResponseTabifyProvider
} from 'ui/agg_response/tabify/tabify';
import graphVisTemplate from 'plugins/graph/graph.html';
import graphVisParamsTemplate from 'plugins/graph/graph_params.html';
//import { errors } from 'ui/errors';

//var $scope.tableGroups ;
var metrics;
var buckets;
var module = uiModules.get('kibana/graph_values_vis', ['kibana']);
const visN = require('vis');
var nr = require('scale-number-range');
var d3 = require('d3');
var d3force = require('d3-force');
var d3drag = require('d3-drag');
var d3selection = require('d3-selection');
var d3scale = require('d3-scale');
var _ = require('lodash');
var radius;
var link;
var node;

var nodeRemove = [];
var graph = {
    nodes: [],
    links: []
};

var tmpGraph = {
    nodes: [],
    links: []
};

module.controller('graphController', function($scope, $element, $rootScope, Private) {

    var tabifyAggResponse = Private(AggResponseTabifyProvider);
    let width;
    let height;

    let margin = {
        top: 5,
        right: 5,
        bottom: 5,
        left: 5
    };

    var idchart = $element.children().find(".graph-container");

    function showGraph() {
        //var transform = d3.zoomIdentity;
        //nodeDepth = $scope.vis.params.nodeDepth;
        radius = $scope.vis.params.radius;
        width = $($element).width() - margin.left - margin.right;
        height = $($element).height() - margin.top - margin.bottom;

        var simulation = d3force.forceSimulation()
            .force("collide", d3.forceCollide((function(d) { return (d.size); }) * 1.5))
            .force("link", d3force.forceLink().id(function(d) { return d.id; }))
            .force("charge", d3force.forceManyBody().distanceMax($scope.vis.params.distanceMax).strength($scope.vis.params.strength)) //200 -150
            .force("center", d3force.forceCenter(width / 2, height / 2))
            .on("tick", ticked);

        d3.select(".graph-container").selectAll('svg').remove();
        d3.select(".graph-container").selectAll('text').remove();

        var svg = d3.select(".graph-container")
            .append("svg")
            .attr("width", '100%')
            .attr("height", '100%')
            .call(d3.zoom().scaleExtent([1 / 6, 8]).on("zoom", zoomed))
            .append("g")
            .attr("transform", "translate(40,0)");

        var color = d3scale.scaleOrdinal(d3scale.schemeCategory20);

        //.distance($scope.vis.params.distance)
        function zoomed() {
            svg.attr("transform", d3.event.transform);
        };
        //graph = null;
        function ticked() {
            link
                .attr("x1", function(d) { return d.source.x; })
                .attr("y1", function(d) { return d.source.y; })
                .attr("x2", function(d) { return d.target.x; })
                .attr("y2", function(d) { return d.target.y; });
            node
                .attr("transform", function(d) { return "translate(" + d.x + ", " + d.y + ")"; });
        };

        function dragstarted(d) {
            if (!d3.event.active) simulation.alphaTarget($scope.vis.params.alphaTarget).restart();
            d.fx = d.x;
            d.fy = d.y;
        };

        function dragged(d) {
            d.fx = d3.event.x;
            d.fy = d3.event.y;
        };

        function dragended(d) {
            if (!d3.event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
        };

        update();

        function update() {

            d3.select("svg").selectAll('.link').remove();
            d3.select("svg").selectAll('.node').remove();

            /**/
            //console.log('update!');

            //tmpGraph.nodes = graph.nodes;
            //tmpGraph.links = graph.links;

            //console.log('nodeRemove.length: ' + nodeRemove.length);
            //console.log('nodeRemove: ' + nodeRemove);
            //console.log('links1: ' + tmpGraph.links);

            for (var i = 0, len = nodeRemove.length; i <= len; i++) {
                tmpGraph.links = _.reject(tmpGraph.links, {
                    source: nodeRemove[i]
                });
            };

            //console.log('links2: ' + tmpGraph.links);
            //console.log('buckets: ' + buckets);
            //members = _.without(members, username);

            //simulation.restart();
            //return;

            link = svg.append("g")
                .attr("class", "link")
                .selectAll("line")
                .data(tmpGraph.links)
                .enter().append("line")
                .attr("stroke-width", function(d) { return Math.sqrt(d.value); });
            //link = linkEnter.merge(link);

            link.exit().remove();

            node = svg.append("g")
                .attr("class", "node")
                .selectAll("circle")
                .data(tmpGraph.nodes)
                .enter().append("circle")
                .attr("r", function(d) { return (d.size); })
                .attr("fill", function(d) { return color(d.color); })
                .on("click", click)
                .call(d3.drag()
                    .on("start", dragstarted)
                    .on("drag", dragged)
                    .on("end", dragended));


            node.exit().remove();

            node.append("title")
                .text(function(d) {
                    return d.id;
                });

            node.append("text")
                .text(function(d) {
                    return d.id;
                });

            simulation
                .nodes(tmpGraph.nodes)
                .on("tick", ticked);

            simulation
                .force("link")
                .links(tmpGraph.links);

        };

        function click(d) {
            //nodeRemove = _.uniq(nodeRemove);
            if (_.includes(nodeRemove, d.id) === true) {
                _.pull(nodeRemove, d.id);
            } else {
                nodeRemove.push(d.id);
            };
            //$scope.showGraph();
            nodeRemove = _.uniqWith(nodeRemove, _.isEqual);
            //nodeRemove = _.uniq(nodeRemove);
            update();
        };
    };

    $scope.$watchMulti(['esResponse', 'vis.aggs'], function([resp]) {

        var i = 0;

        graph = null;
        graph = { "nodes": [], "links": []};
     
        if (resp) {
            var tableGroups = tabifyAggResponse($scope.vis, resp);
            //$scope.tableGroups = tableGroups;
            var metric = new Array();
            var record = [];
            tableGroups.tables.forEach(function(table) {
                var aggsLength = $scope.vis.params.aggs_controller.length;
                console.log('aggsLength:' + aggsLength);
                var metricsControllerLength = $scope.vis.params.metrics_controller.length;
                console.log('metricsControllerLength:' + metricsControllerLength);
                var metricsLength = $scope.vis.params.metrics.length;
                console.log('metricsLength:' + metricsLength);
                var numColumns = (Object.keys(table.columns).length);
                var params = $scope.vis.params;
                
                /*for (let key in table.columns[0]) {
                    console.log('key:'  + key)
                    for (let key2 in table.columns[0].aggConfig) {
                        console.log('key2:'  + key2) 
                    }
                }*/

                var sum;
                //var tmpLinks = [];
                console.log($scope.vis.params.metrics_controller[0]);

                var metrics = [];
                metrics.length = 0;
                for (var i=aggsLength; i < (aggsLength+metricsLength+1); i++) {
                    metrics.push([]);
                }
                console.log('metrics.length:' + metrics.length);

                var n = 0;
                table.rows.forEach(function(row, i) {
                    record = table.rows[row, i];

                    //load metrics array
                    n = 0;
                    for (var m = aggsLength; m < (aggsLength+metricsLength); m++) {
                        metrics[n][i] = record.slice(m, m+1);
                        n=n+1;
                    }
                });

                var aggs = [];
                aggs.length = 0;
                for (var i=0; i < (aggsLength); i++) {
                    aggs.push([]);
                }

                table.rows.forEach(function(row, i) {
                    record = table.rows[row, i];

                    //load aggs array
                    n = 0;
                    for (var m = 0; m < (aggsLength); m++) {
                        aggs[n][i] = record.slice(m, m+1);
                        n=n+1;
                    }
                });

                //console.log('metrics.length:' + metrics.length);
                for (var n = 0;  n < metrics.length-1; n++) {
                    $scope.vis.params.minMetric[n] = metrics[n].reduce(function(a, b) { return Math.min(a, b); }) ;
                    $scope.vis.params.maxMetric[n] = metrics[n].reduce(function(a, b) { return Math.max(a, b); }) ;
                }


                table.rows.forEach(function(row, i) {
                    record = table.rows[row, i];
                    console.log('record:' + record);
                    //populate array for nodes
                    sum += row[numColumns - 1];
                    var size = 0;
                    var image = '';
                    var color = '';
                    for (n = 0; n < aggsLength; n++) {
                        if (params.visibleNode[n] == true) {

                            if ($scope.vis.params.nodeSize[n].id == -1) {size = $scope.vis.params.lowNodeSize[n]; } else  
                            { size = nr(metrics[n][i], $scope.vis.params.minMetric[n], $scope.vis.params.maxMetric[n], $scope.vis.params.lowNodeSize[n], $scope.vis.params.highNodeSize[n] ); }

                            if ($scope.vis.params.imageNode[n].id !== -1) { image = aggs[($scope.vis.params.imageNode[n].id)][i]; }

                            if ($scope.vis.params.colourNode[n].id !== -1) { color = aggs[($scope.vis.params.colourNode[n].id)][i]; } else { n }
                            console.log('color:' + color);

                            graph.nodes.push({
                                "id": record[n],
                                "size": Math.round(size),
                                "value": metrics[n][i],
                                "color": n,
                                "image": image
                            });
                            //tmpLinks.push(record[i]);
                        }
                    }
                    
                    //populate array for links
                    var linkId;
                    for (i = 0; i < aggsLength; i++) {
                        if ($scope.vis.params.visibleNode[i] === false) { continue; }
                        for (var o = i+1; o < aggsLength; o++) {
                            if ($scope.vis.params.visibleNode[o] === false) { continue; }
                            linkId = record[i].concat('-').concat(record[o]);
                            //console.log('linkId:' + record[i].concat('-').concat(record[o]));
                            graph.links.push({ "id": linkId, "source": record[i], "target": record[o] });
                            break;
                        }
                    }

                });

                //console.log('metrics[1]:' + metrics[1]);

                

                //console.log('metrics[1][1]:' + metrics[1][1]);
                //remove duplicated from nodes
                graph.nodes = _.uniqWith(graph.nodes, _.isEqual);
                graph.links = _.uniqWith(graph.links, _.isEqual);

            });
            tableGroups = null;
            tmpGraph = graph;
            showGraph();
        }
    }, true);
});


module.controller('graphOptionController', function($scope, $element, $rootScope, Private) {

    $scope.$watchCollection(function() { return $scope.vis.aggs.map(function(obj) { return obj.type }); }, function(newVal) {
        $scope.vis.params.nodeSize.length = $scope.vis.params.aggs_controller.length;
        $scope.vis.params.linkSize.length = $scope.vis.params.aggs_controller.length;
        $scope.vis.params.imageNode.length = $scope.vis.params.aggs_controller_decoration.length;
        $scope.vis.params.colourNode.length = $scope.vis.params.aggs_controller_decoration.length;

        var aggs = $scope.vis.params.aggs_controller;
        var aggs_controller_decoration = $scope.vis.params.aggs_controller_decoration;
        var metrics = $scope.vis.params.metrics_controller;
        var title = '';
        metrics.length = 0;
        aggs.length = 0;
        aggs_controller_decoration.length = 0;

        metrics.push({ "id": -1, "title": "Fixed", "field": "", "type": "" });
        aggs_controller_decoration.push({ "id": -1, "title": "None", "field": "", "type": "" });

        var numAggs = (Object.keys($scope.vis.aggs).length - 3);
        var idMetric = 0;
        var idAgg = 0;
        for (var i = 0; i < numAggs; i++) {

            //console.log('$scope.vis.aggs[i].type.type:' + $scope.vis.aggs[i].type.type);
            //console.log('i:' + i + ' of ' + numAggs);
            if (typeof $scope.vis.aggs[i]._opts.params === 'undefined' || !$scope.vis.aggs[i]._opts.params) {
                title = '';
            } else {
                title = $scope.vis.aggs[i]._opts.params.field;
            }
            //console.log('title:' + title); // || !$scope.vis.aggs[i].type.type
            if (typeof $scope.vis.aggs[i].type.type === 'undefined') {
                //console.log('case undefined');
                metrics.push({
                    "id": idMetric, //$scope.vis.aggs[i].id,
                    "title": $scope.vis.aggs[i].type.title,
                    "field": title,
                    "type": $scope.vis.aggs[i].__type.name
                });
                idMetric++;
            } else if ($scope.vis.aggs[i].type.type === 'metrics') {
                //console.log('case metrics');
                metrics.push({
                    "id": idMetric, //$scope.vis.aggs[i].id,
                    "title": $scope.vis.aggs[i].type.title,
                    "field": title,
                    "type": $scope.vis.aggs[i].__type.name
                });
                idMetric++;
            } else {
                //console.log('case aggs');
                aggs.push({
                    "id": idAgg, //$scope.vis.aggs[i].id,
                    "title": $scope.vis.aggs[i].type.title,
                    "field": title,
                    "schema": $scope.vis.aggs[i]._opts.schema,
                    "type": $scope.vis.aggs[i].__type.name
                });
                aggs_controller_decoration.push({
                    "id": idAgg, //$scope.vis.aggs[i].id,
                    "title": $scope.vis.aggs[i].type.title,
                    "field": title,
                    "schema": $scope.vis.aggs[i]._opts.schema,
                    "type": $scope.vis.aggs[i].__type.name
                });
                idAgg++;
            };

            if (typeof $scope.vis.params.visibleNode[i] == 'undefined') { $scope.vis.params.visibleNode[i] = true; }

            if (typeof $scope.vis.params.nodeSize[i] == 'undefined') { $scope.vis.params.nodeSize[i] = metrics[0]; }
            if (typeof $scope.vis.params.lowNodeSize[i] == 'undefined') { $scope.vis.params.lowNodeSize[i] = 8; }
            if (typeof $scope.vis.params.highNodeSize[i] == 'undefined') { $scope.vis.params.highNodeSize[i] = 8; }

            if (typeof $scope.vis.params.linkSize[i] == 'undefined') { $scope.vis.params.linkSize[i] = metrics[0]; }
            if (typeof $scope.vis.params.lowLinkSize[i] == 'undefined') { $scope.vis.params.lowLinkSize[i] = 8; }
            if (typeof $scope.vis.params.highLinkSize[i] == 'undefined') { $scope.vis.params.highLinkSize[i] = 8; }

            if (typeof $scope.vis.params.imageNode[i] == 'undefined') { $scope.vis.params.imageNode[i] = aggs_controller_decoration[0]; }
            if (typeof $scope.vis.params.colourNode[i] == 'undefined') { $scope.vis.params.colourNode[i] = aggs_controller_decoration[0]; }
        };

        /*for (i = 0; i < $scope.vis.params.nodeSize.length ; i++) {
            console.log('$scope.vis.params.nodeSize[' + i + '].id:' + $scope.vis.params.nodeSize[i].id);
            console.log('$scope.vis.params.nodeSize[' + i + '].title:' + $scope.vis.params.nodeSize[i].title);
        }

        for (i = 0; i < $scope.vis.params.imageNode.length ; i++) {
            console.log('$scope.vis.params.imageNode[' + i + '].id:' + $scope.vis.params.imageNode[i].id);
            console.log('$scope.vis.params.imageNode[' + i + '].title:' + $scope.vis.params.imageNode[i].title);
        } 

        for (i = 0; i < $scope.vis.params.colourNode.length ; i++) {
            console.log('$scope.vis.params.colourNode[' + i + '].id:' + $scope.vis.params.colourNode[i].id);
            console.log('$scope.vis.params.colourNode[' + i + '].title:' + $scope.vis.params.colourNode[i].title);
        }*/
    });

});