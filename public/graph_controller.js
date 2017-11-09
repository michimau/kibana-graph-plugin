import { uiModules } from 'ui/modules';
import { AggResponseTabifyProvider } from 'ui/agg_response/tabify/tabify';

import graphVisTemplate from 'plugins/graph/graph.html';
import graphVisParamsTemplate from 'plugins/graph/graph_params.html';
//import { errors } from 'ui/errors';

define(function(require) {

    var module = uiModules.get('kibana/graph_values_vis', ['kibana']);
    const visN = require('vis');
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

        /*$scope.slider = {
            minValue: 10,
            maxValue: 90,
            options: {
                floor: 0,
                ceil: 100,
                step: 1
            }
        };*/
        var tabifyAggResponse = Private(AggResponseTabifyProvider);
        

        //var metrics = $scope.metrics = [];
        //var buckets = $scope.buckets = [];
        let rootElement = $element;
        let width;
        let height;

        let margin = {
            top: 5,
            right: 5,
            bottom: 5,
            left: 5
        };
        var idchart = $element.children().find(".graph-container");

        //console.log('$scope.vis.aggs[0].id:' + $scope.vis.aggs[0].id);
        //console.log('$scope.vis.aggs[0].params:' + $scope.vis.aggs[0].params);
        //console.log('$scope.vis.aggs[0].type:' + $scope.vis.aggs[0].type);
        //console.log('$scope.vis.aggs[1].type:' + $scope.vis.aggs[1].type);
        //console.log('$scope.vis.aggs[2]._opts.params.customLabel:' + $scope.vis.aggs[2]._opts.params.customLabel);
        //console.log('$scope.vis.agg.type.params[0]:' + $scope.vis.agg.type.params[0]);
        //console.log('$scope.vis.agg.type.params[2]:' + $scope.vis.agg.type.params[2]);
        //console.log('$scope.vis.aggs.0.id:' + $scope.vis.aggs.0.id);
        //console.log('$scope.vis.aggs.0.params.customLabel:' + $scope.vis.aggs.0.params.customLabel);

        function showGraph() {
            //var transform = d3.zoomIdentity;
            nodeDepth = $scope.vis.params.nodeDepth;
            radius = $scope.vis.params.radius;
            width = $(rootElement).width() - margin.left - margin.right;
            height = $(rootElement).height() - margin.top - margin.bottom;

            var simulation = d3force.forceSimulation()
                .force("collide", d3.forceCollide(radius * 1.5))
                .force("link", d3force.forceLink().id(function(d) {
                    return d.id;
                }))
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
                    .attr("x1", function(d) {
                        return d.source.x;
                    })
                    .attr("y1", function(d) {
                        return d.source.y;
                    })
                    .attr("x2", function(d) {
                        return d.target.x;
                    })
                    .attr("y2", function(d) {
                        return d.target.y;
                    });
                node
                    .attr("transform", function(d) {
                        return "translate(" + d.x + ", " + d.y + ")";
                    });
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
                d3.select("svg").selectAll('.node').transition()
                    .delay(function(d, i) {
                        return i * 10;
                    })
                    .duration(1250)
                    .style('opacity', 0);

                d3.select("svg").selectAll('.node').classed(".in", false);
                d3.select("svg").selectAll('.node').classed(".out", true);
                d3.select("svg").selectAll('.link').classed(".in", false);
                d3.select("svg").selectAll('.link').classed(".out", true);

                d3.select("svg").selectAll('.link').remove();
                d3.select("svg").selectAll('.node').remove();

                d3.select("svg").selectAll('.node').classed(".out", false);
                d3.select("svg").selectAll('.node').classed(".in", true);
                d3.select("svg").selectAll('.link').classed(".out", false);
                d3.select("svg").selectAll('.link').classed(".in", true);
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
                    .attr("stroke-width", function(d) {
                        return Math.sqrt(d.value);
                    });
                //link = linkEnter.merge(link);

                link.exit().remove();

                node = svg.append("g")
                    .attr("class", "node")
                    .selectAll("circle")
                    .data(tmpGraph.nodes)
                    .enter().append("circle")
                    .attr("r", radius)
                    .attr("fill", function(d) {
                        return color(d.group);
                    })
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

        //data parsing
        $scope.$watchMulti(['esResponse', 'vis.params.aggs', 'vis.params', 'vis', 'vis.params.metric'], function([resp]) {
            var aggs = $scope.vis.params.aggs;
            var metrics = $scope.vis.params.metrics;
            metrics.length = 0;
            aggs.length = 0;
            var numAggs = (Object.keys($scope.vis.aggs).length - 3);
            for (i = 0; i < numAggs; i++) {
                console.log('i:' + i + ' of ' + numAggs);
                if (typeof $scope.vis.aggs[i]._opts.schema == 'undefined' ) {
                //if ($scope.vis.aggs[i]._opts.schema == 'metric' ) {
                    /*console.log('metrics: $scope.vis.aggs[i]._opts.schema:' + $scope.vis.aggs[i]._opts.schema);
                    console.log('metrics: $scope.vis.aggs[i].type.title:' + $scope.vis.aggs[i].type.title);
                    console.log('metrics: $scope.vis.aggs[i]_opts.params.field:' + $scope.vis.aggs[i]._opts.params.field);*/
                    metrics.push({
                        "id": $scope.vis.aggs[i].id,
                        "title": $scope.vis.aggs[i].type.title,
                        "field": $scope.vis.aggs[i]._opts.params.field,
                        "type": $scope.vis.aggs[i].__type.name
                    });
                }  else if ($scope.vis.aggs[i]._opts.schema == 'metric') {
                    /*console.log('metrics: $scope.vis.aggs[i]._opts.schema:' + $scope.vis.aggs[i]._opts.schema);
                    console.log('metrics: $scope.vis.aggs[i].type.title:' + $scope.vis.aggs[i].type.title);
                    console.log('metrics: $scope.vis.aggs[i]_opts.params.field:' + $scope.vis.aggs[i]._opts.params.field);*/
                    metrics.push({
                        "id": $scope.vis.aggs[i].id,
                        "title": $scope.vis.aggs[i].type.title,
                        "field": $scope.vis.aggs[i]._opts.params.field,
                        "type": $scope.vis.aggs[i].__type.name
                    });    
                }  else {
                    /*console.log('aggs: scope.vis.aggs[i]._opts.schema:' + $scope.vis.aggs[i]._opts.schema);
                    console.log('aggs: $scope.vis.aggs[i].type.title:' + $scope.vis.aggs[i].type.title);
                    console.log('aggs: $scope.vis.aggs[i]_opts.params.field:' + $scope.vis.aggs[i]._opts.params.field);*/
                    aggs.push({
                        "id": $scope.vis.aggs[i].id,
                        "title": $scope.vis.aggs[i].type.title,
                        "field": $scope.vis.aggs[i]._opts.params.field,
                        "schema": $scope.vis.aggs[i]._opts.schema,
                        "type": $scope.vis.aggs[i].__type.name
                    });
                }
                
            };
            //$scope.$apply();
            //console.log('$scope.vis.params.aggs[0]:' + $scope.vis.params.aggs[0]);
            //console.log('$scope.vis.params.aggs[0]._opts.schema:' + $scope.vis.params.aggs[0]._opts.schema);
            //console.log('$scope.vis.params.aggs[0].type.title:' + $scope.vis.params.aggs[0].type.title);

            //console.log('aggs2:' + aggs2);
            //console.log('aggs2[0]._opts.schema:' + aggs2[0]._opts.schema);
            //console.log('aggs2[0].type.title:' + aggs2[0].type.title);
            graph = null;
            graph = {
                "nodes": [],
                "links": []
            };
            if (resp) {
                var tableGroups = tabifyAggResponse($scope.vis, resp);
                tableGroups.tables.forEach(function(table) {
                    /*tmpGraph = {
                        "nodes": [],
                        "links": []
                    };*/
                    //var nbr_r = (Object.keys(table.rows).length);
                    var numColumns = (Object.keys(table.columns).length);
                    var sum = 0;
                    var tmpLinks = [];
                    table.rows.forEach(function(row, i) {
                        sum += row[numColumns - 1];
                        record = table.rows[row, i];
                        for (i = 0; i < numColumns - 1; i++) {
                            graph.nodes.push({
                                "id": record[i],
                                "group": i,
                                "level": i
                            });
                            tmpLinks.push(record[i]);
                        }
                        for (i = 0; i < numColumns - 2; i++) {
                            linkId = record[i].concat('-').concat(record[i + 1]);
                            graph.links.push({
                                "id": linkId,
                                "source": record[i],
                                "target": record[i + 1]
                            });
                        }
                    });

                    //remove duplicated from nodes
                    graph.nodes = _.uniqWith(graph.nodes, _.isEqual);
                    graph.links = _.uniqWith(graph.links, _.isEqual);

                    //graph.nodes = _.uniqBy(graph.nodes, 'id');
                    //graph.links = _.uniqBy(graph.links, 'id');
                    //console.log('tmpLinks from response: ' + graph.links);
                });
                tableGroups = null;
                record = null;
                linkId = null;
                //console.log('links from response: ' + graph.links);
                //$scope.
                tmpGraph = graph;
                showGraph();
            }
        });
    });
});