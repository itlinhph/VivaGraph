
     
    var URL_API = "http://192.168.100.115:3001" ;

    function getDataFromAPI(url1) {
        var dataOut ;
        console.log(url1);
        $.ajax({
            method: "GET",
            url: url1,
            async: false,
            success: function (data) { 
                dataOut = data; 
            },
            
        });
        return dataOut;
    };
    
    var nodeList = getDataFromAPI(URL_API + "/address/getVertexList");
    var edgeList = getDataFromAPI(URL_API + "/address/getEdgeList");
    console.log(nodeList);
    console.log(edgeList);

    // creat graph
    var graph = Viva.Graph.graph();
    nodeList.forEach(function(item) {
        if(item.trf_level == "kho_tong")
            // graph.addNode(item[0], item[1]).isPinned = true ;
            graph.addNode(item.id, item);
        // else
        //     graph.addNode(item[0], item[1]) ;
        
    });
    
    edgeList.forEach(function(item){
        graph.addLink(item.fr_stid, item.to_stid, item.trf_type) ;
    });

    

    // layout
    var layout = Viva.Graph.Layout.forceDirected(graph, {
        springLength : 120,
        springCoeff : 0.0008,
        dragCoeff : 0.06,
        gravity : -0.2
     });

    // customize node
    var graphics = Viva.Graph.View.svgGraphics(),
        nodeSize = 20,
        hightlightRelateNodes = function(nodeId, isOn) {
            graph.forEachLinkedNode(nodeId, function(node, link) {
                var isFly = (link.data == "fly");
                var linkUI = graphics.getLinkUI(link.id) ;
                
                if(linkUI) {
                    if(!linkUI.baseColor)
                        linkUI.baseColor = "blue" ;
                    if(isFly)
                        linkUI.baseColor = "red";
                linkUI.attr("stroke", isOn ? "yellow" : linkUI.baseColor);
                }
            });
        };

    graphics.node(function(node) {
        var ui  =  Viva.Graph.svg('g'),
        stationName = Viva.Graph.svg('text').attr('y', '-5px').text(node.id+" "+node.data.name),
        img = Viva.Graph.svg('image')     
            .attr('width', nodeSize)
            .attr('height', nodeSize)
            .link('resource/img/ghtk.png');
        ui.append(stationName) ;
        ui.append(img);
        ui.addEventListener('click', function () {
            // toggle pinned mode
            layout.pinNode(node, !layout.isNodePinned(node));
        });
        
        $(ui).hover(function(){
            hightlightRelateNodes(node.id, true);
        }, function() {
            hightlightRelateNodes(node.id, false) ;
        });
        return ui;
    }).placeNode(function(nodeUI, pos) {
        nodeUI.attr('transform',
            'translate(' +
            (pos.x - nodeSize / 2) + ',' + (pos.y - nodeSize / 2) +
            ')');
    });
    
    // creat Marker direct link
    var createMarker = function(id) {
            return Viva.Graph.svg('marker')
                        .attr('id', id)
                        .attr('viewBox', "0 0 10 10")
                        .attr('refX', "10")
                        .attr('refY', "5")
                        .attr('markerUnits', "strokeWidth")
                        .attr('markerWidth', "10")
                        .attr('markerHeight', "5")
                        .attr('orient', "auto");
        },

        marker = createMarker('Triangle');

    marker.append('path').attr('d', 'M 0 0 L 10 5 L 0 10 z');

    var defs = graphics.getSvgRoot().append('defs');
    defs.append(marker);

    var geom = Viva.Graph.geom();
    
    // Custom link
    graphics.link(function(link){
        var isFly = (link.data == 'fly'),
            
        uil = Viva.Graph.svg('path')
                    .attr('stroke', isFly ? 'red' : 'blue')
                    .attr('fill', 'none')
                    .attr('marker-end', 'url(#Triangle)');
        uil.isFly = isFly ;
        return uil;
    }).placeLink(function(linkUI, fromPos, toPos) {
        var toNodeSize = nodeSize,
            fromNodeSize = nodeSize;

        var from = geom.intersectRect(
                // rectangle:
                        fromPos.x - fromNodeSize / 2, // left
                        fromPos.y - fromNodeSize / 2, // top
                        fromPos.x + fromNodeSize / 2, // right
                        fromPos.y + fromNodeSize / 2, // bottom
                // segment:
                        fromPos.x, fromPos.y, toPos.x, toPos.y) || fromPos;

        var to = geom.intersectRect(
                // rectangle:
                        toPos.x - toNodeSize / 2, // left
                        toPos.y - toNodeSize / 2, // top
                        toPos.x + toNodeSize / 2, // right
                        toPos.y + toNodeSize / 2, // bottom
                // segment:
                        toPos.x, toPos.y, fromPos.x, fromPos.y) || toPos; 
        
        var ry = linkUI.isFly ? 5 : 0,
        data = 'M' + from.x + ',' + from.y +
                //    'L' + to.x + ',' + to.y;
                    ' A 5,' + ry + ',-10,0,1,' + to.x + ',' + to.y;
        linkUI.attr('d', data);
    });

    // Render the graph
    var renderer = Viva.Graph.View.renderer(graph, {
        layout    : layout,
        graphics  : graphics,
        container : document.getElementById('graphContainer')
    }) ;
            
    function renderGraph() {
        renderer.run();
    };

    function pauseRender() {
        $("#btnPause").addClass("hide");
        $("#btnResume").removeClass("hide");
        renderer.pause();
    };
    
    function resumeRender() {
        $("#btnPause").removeClass("hide");
        $("#btnResume").addClass("hide");
        renderer.resume();
    };

    function hightlightRoute(arrayId) {
        // var arrayId = [1121, 1260, 657, 705 ];
        

        var edgeHightlight = [];
        for(i=0; i< arrayId.length -1; i++) {
            highlightNode(arrayId[i]);
            edgeHightlight.push([arrayId[i], arrayId[i+1]]);
            edgeHightlight.push([arrayId[i+1], arrayId[i]]);
        }
        console.log(edgeHightlight);

        for(i=0; i< edgeHightlight.length; i++) {
            hightlightLink(edgeHightlight[i]) ;
        }
    };

    function hightlightLink(edge) {
        var link_edge = graph.getLink(edge[0], edge[1]);
        var linkUI = graphics.getLinkUI(link_edge.id) ;
        if(linkUI) {
            linkUI.attr("stroke", "red");
            linkUI.baseColor = "red";
        }

    };

    function highlightNode(nodeId) {
        var ui = graphics.getNodeUI(nodeId);
        ui.attr('fill', 'red');
    };

    function getRoute() {
        var route = [];
        var src = $("#fromStation").val();
        var dst = $("#toStation").val();
        dataSend = {src: src, dst: dst} ;
        // console.log(dataSend);
        $.ajax({
            method: "POST",
            url: "http://192.168.100.115:3001/address/getRoute",
            async: false,
            data: dataSend,
            success: function (data) { 
                route = data; 
            },
            
        });
        console.log("route:", route)
        if(route.length == 0) {
            $(".msgOut").html("Chưa config tuyến đường này!");
        }
        else {
            var msg = "Tuyến config:" + route.join(" --> ");
            
            $(".msgOut").html("Chưa config tuyến đường này!");
            hightlightRoute(route);

        }
    };

    function resetColor() {
        graphics.node(function(node) {
            var ui = graphics.getNodeUI(node.id);
            ui.attr('fill', 'black');
        });
        graphics.link(function(link){
            var linkUI = graphics.getLinkUI(link.id) ;
            linkUI.attr("stroke", "blue");
            linkUI.baseColor = "blue";
        }); 

    };