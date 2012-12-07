// extend code
// https://github.com/dansdom/extend
var Extend = Extend || function(){var h,g,b,e,i,c=arguments[0]||{},f=1,k=arguments.length,j=!1,d={hasOwn:Object.prototype.hasOwnProperty,class2type:{},type:function(a){return null==a?String(a):d.class2type[Object.prototype.toString.call(a)]||"object"},isPlainObject:function(a){if(!a||"object"!==d.type(a)||a.nodeType||d.isWindow(a))return!1;try{if(a.constructor&&!d.hasOwn.call(a,"constructor")&&!d.hasOwn.call(a.constructor.prototype,"isPrototypeOf"))return!1}catch(c){return!1}for(var b in a);return void 0===b||d.hasOwn.call(a, b)},isArray:Array.isArray||function(a){return"array"===d.type(a)},isFunction:function(a){return"function"===d.type(a)},isWindow:function(a){return null!=a&&a==a.window}};"boolean"===typeof c&&(j=c,c=arguments[1]||{},f=2);"object"!==typeof c&&!d.isFunction(c)&&(c={});k===f&&(c=this,--f);for(;f<k;f++)if(null!=(h=arguments[f]))for(g in h)b=c[g],e=h[g],c!==e&&(j&&e&&(d.isPlainObject(e)||(i=d.isArray(e)))?(i?(i=!1,b=b&&d.isArray(b)?b:[]):b=b&&d.isPlainObject(b)?b:{},c[g]=Extend(j,b,e)):void 0!==e&&(c[g]= e));return c};

// D3 plugin template
(function (d3) {
    // this ones for you 'uncle' Doug!
    'use strict';
    
    // Plugin namespace definition
    d3.Pack = function (options, element, callback)
    {
        // wrap the element in the jQuery object
        this.el = element;

        // this is the namespace for all bound event handlers in the plugin
        this.namespace = "pack";
        // extend the settings object with the options, make a 'deep' copy of the object using an empty 'holding' object
        // using the extend code that I ripped out of jQuery
        this.opts = Extend(true, {}, d3.Pack.settings, options);
        this.init();
        // run the callback function if it is defined
        if (typeof callback === "function")
        {
            callback.call();
        }
    };
    
    // these are the plugin default settings that will be over-written by user settings
    d3.Pack.settings = {
        'diameter': 500,
        'padding': 2,
        'data' : null,  // I'll need to figure out how I want to present data options to the user
        'dataUrl' : 'flare.json',  // this is a url for a resource
        'dataType' : 'json',
        // instead of defining a color array, I will set a color scale and then let the user overwrite it
        'colorRange' : [],
        'chartType' : 'pack',
        // defines the data structure of the document
        'dataStructure' : {
            'name' : 'name',
            'children' : 'group',
            'value' : 'size'
        }
    };
    
    // plugin functions go here
    d3.Pack.prototype = {
        init : function() {

            var container = this;
            // define the size of the chart
            container.diameter = this.opts.diameter;
            // define the data format - not 100% sure what this does. will need to research this attribute
            container.format = d3.format(",d");
            // if there is a colour range defined for this chart then use the settings. If not, use the inbuild category20 colour range
            if (this.opts.colorRange.length > 0) {
                container.color = d3.scale.ordinal().range(this.opts.colorRange);
            }
            else {
                container.color = d3.scale.category20();
            }

            // DEFINE EACH OF THE TWO TYPES OF LAYOUTS
            // this is the layout for the regular pack i.e. layered chart
            container.pack = d3.layout.pack()
                .size([container.diameter, container.diameter])
                // custom size function as passed into the options object
                .value(function(d) { return d[container.opts.dataStructure.value]})
                // custom children function as passed into the options object
                .children(function(d) { return d[container.opts.dataStructure.children]})
                .padding(container.opts.padding);

            // this is the layout for the bubble pack i.e. flat chart
            container.bubble = d3.layout.pack()
                .sort(null)
                .size([container.diameter, container.diameter])
                .padding(container.opts.padding);

            // create the svg element that holds the chart
            container.chart = d3.select(container.el).append("svg")
                .attr("width", container.diameter)
                .attr("height", container.diameter)
                .attr("class", container.opts.chartType);

            // define the data for the graph
            if (typeof this.opts.dataUrl == "string") {
                // go get the data
                this.getData(this.opts.dataUrl, this.opts.dataType);
            }
            else {
                // just going to set data from the opts object
                //this.setData(this.opts.data);
            }

        },
        buildChart : function(data) {

            var container = this;
            container.data = data;

            // if type = Bubble (i.e. shallow representation), create the bubble svg
            if (container.opts.chartType == 'bubble') {

                // define the data set and then append the g nodes for the data
                container.node = container.chart.selectAll(".node")
                    .data(container.bubble.nodes(container.parseData(data))
                        .filter(function(d) { return !d.children; }))
                  .enter().append("g")
                    .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; })
                    .attr("class", "node");
                    
                // add the title nodes for each data point
                container.node.append("title")
                    .text(function(d) { return d.className + ": " + container.format(d.value); });

                // add the circles for each data point. Color is dependent on the class name of the package
                container.node.append("circle")
                    .attr("r", function(d) { return d.r; })
                    .style("fill", function(d) { return container.color(d.packageName); });

                // add the text node for each data point and cut it depending on the size of the node
                container.node.append("text")
                    .attr("dy", ".3em")
                    .style("text-anchor", "middle")
                    .text(function(d) { return d.className.substring(0, d.r / 4); });
            }
            // if type = Pack (i.e. deep representation)
            else if (container.opts.chartType == 'pack') {

                // define the data set and then append the g nodes for the data
                // add class depending on if the node has children 
                container.node = container.chart.datum(data).selectAll(".node")
                    .data(container.pack.nodes)
                  .enter().append("g")
                    .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; })
                    .attr("class", function(d) {
                        if (d.children) {
                            return "node";
                        }
                        else {
                            return "leaf node";
                        } 
                    });

                // for each node add the title    
                container.node.append("title")
                    .text(function(d) {
                        if (d.children) {
                            return d[container.opts.dataStructure.name];
                        }
                        else {
                            return d[container.opts.dataStructure.name] + ": " + container.format(d.size);
                        }
                    });

                // add a circle for each data point
                container.node.append("circle")
                    .attr("r", function(d) { return d.r; });

                // add the text node for each data point and cut it depending on the size of the node
                container.node.filter(function(d) { return !d.children; }).append("text")
                    .attr("dy", ".3em")
                    .style("text-anchor", "middle")
                    .text(function(d) { return d[container.opts.dataStructure.name].substring(0, d.r / 4); });
            }
            
        },
        updateChart : function(data) {

            var container = this;
            container.data = data;

            if (container.opts.chartType == 'bubble') {

                // go in and select the nodes
                container.node = container.chart.selectAll(".node")
                    .data(container.bubble.nodes(container.parseData(data))
                        .filter(function(d) { return !d.children; }));
                    
                // set the transition of the existing nodes
                container.node.transition()
                    .duration(3000)
                    .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });

                // for existing nodes, select the circle and do the transition for them
                container.node.select("circle")
                .transition()
                .duration(3000)
                    .attr("r", function(d) { return d.r; })
                    .style("fill", function(d) { return container.color(d.packageName); }); 

                // for existing nodes, select the text and then transition them in
                container.node.select("text")
                    .transition()
                    .delay(1500)
                    .text(function(d) { return d.className.substring(0, d.r / 4); }); 
                
                // define the old nodes that don't exist and then fade them out  
                var oldNodes = container.node.exit()
                    .transition()
                    .duration(3000)
                    .style("fill-opacity", 1e-6)
                    .remove();
                
                // define the new nodes and then move them into the correct place
                var newNodes = container.node.enter()
                    .append("g")
                    .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; })
                    .attr("class", "node");
                    
                // for the new nodes add the4 title for them
                newNodes.append("title")
                        .text(function(d) { return d.className + ": " + container.format(d.value); });

                // for the new nodes, append the circles and then fade them in
                newNodes.append("circle")
                        .attr("r", 0)
                        .transition()
                        .duration(3000)
                        .attr("r", function(d) { return d.r; })
                        .style("fill", function(d) { return container.color(d.packageName); });

                // for the new nodes, append the text and them shorten it after the delay that equals the transition
                newNodes
                    .append("text")
                    .style("text-anchor", "middle")
                    .attr("dy", ".3em")
                    .transition()
                    .delay(3000)
                    .text(function(d) { return d.className.substring(0, d.r / 3); });
            }
            else if (container.opts.chartType == 'pack') {
                container.node = container.chart.datum(data).selectAll(".node")
                    .data(container.pack.nodes);

                container.node.enter().append("g")
                    .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; })
                    .attr("class", function(d) {
                        if (d.children) {
                            return "node";
                        }
                        else {
                            return "leaf node";
                        } 
                    });

                container.node.append("title")
                    .text(function(d) {
                        if (d.children) {
                            return d[container.opts.dataStructure.name];
                        }
                        else {
                            return d[container.opts.dataStructure.name] + ": " + container.format(d.size);
                        }
                    });

                container.node.append("circle")
                    .attr("r", function(d) { return d.r; });

                container.node.filter(function(d) { return !d.children; }).append("text")
                    .attr("dy", ".3em")
                    .style("text-anchor", "middle")
                    .text(function(d) { return d[container.opts.dataStructure.name].substring(0, d.r / 4); });
            }

        },
        // Returns a flattened hierarchy containing all leaf nodes under the root.
        parseData : function(data) {
           
            var dataList = [],
                children = this.opts.dataStructure.children,
                container = this;
        
            function recurse(name, node) {
                console.log(name + ", " + node)
                if (node[children]) {
                    node[children].forEach(function(child) { recurse(node[container.opts.dataStructure.name], child); });
                }
                else {
                    dataList.push({packageName: name, className: node[container.opts.dataStructure.name], value: node.size});
                }
            };

            recurse(null, data);
            return {children: dataList};  
        },
        // updates the data set for the chart
        updateData : function(url, type) {
            var container = this,
                data = container.data;

            d3.json(url, function(error, data) {
                container.updateChart(data);
            });
        },
        // gets data from a JSON request
        getData : function(url, type) {
            var container = this;
            d3.json(url, function(error, data) {
                // build the chart
                container.buildChart(data);
            });
        },
        // updates the settings of the chart
        settings : function(settings) {
            // I need to sort out whether I want to refresh the graph when the settings are changed
            this.opts = Extend(true, {}, this.opts, settings);
            // will make custom function to handle setting changes
            this.applySettings();
        },
        // kills the chart
        destroy : function() {
            this.el.removeAttribute(this.namespace);
            this.el.removeChild(this.el.children[0]);
        }     
    };
    
    // the plugin bridging layer to allow users to call methods and add data after the plguin has been initialised
    // props to https://github.com/jsor/jcarousel/blob/master/src/jquery.jcarousel.js for the base of the code & http://isotope.metafizzy.co/ for a good implementation
    d3.pack = function(element, options, callback) {
        // define the plugin name here so I don't have to change it anywhere else. This name refers to the jQuery data object that will store the plugin data
        var pluginName = "pack",
            args;

        function applyPluginMethod(el) {
            var pluginInstance = el[pluginName];   
            // if there is no data for this instance of the plugin, then the plugin needs to be initialised first, so just call an error
            if (!pluginInstance) {
                alert("The plugin has not been initialised yet when you tried to call this method: " + options);
                //return;
            }
            // if there is no method defined for the option being called, or it's a private function (but I may not use this) then return an error.
            if (typeof pluginInstance[options] !== "function" || options.charAt(0) === "_") {
                alert("the plugin contains no such method: " + options);
                //return;
            }
            // apply the method that has been called
            else {
                pluginInstance[options].apply(pluginInstance, args);
            }
        };

        function initialisePlugin(el) {
            // define the data object that is going to be attached to the DOM element that the plugin is being called on
            // need to create a global data holding object. 
            var pluginInstance = el[pluginName];
            // if the plugin instance already exists then apply the options to it. I don't think I need to init again, but may have to on some plugins
            if (pluginInstance) {
                // going to need to set the options for the plugin here
                pluginInstance.settings(options);
            }
            // initialise a new instance of the plugin
            else {
                el.setAttribute(pluginName, true);
                // I think I need to anchor this new object to the DOM element and bind it
                el[pluginName] = new d3.Pack(options, el, callback);
            }
        };
        
        // if the argument is a string representing a plugin method then test which one it is
        if ( typeof options === 'string' ) {
            // define the arguments that the plugin function call may make 
            args = Array.prototype.slice.call(arguments, 2);
            // iterate over each object that the function is being called upon
            if (element.length) {
                for (var i = 0; i < element.length; i++) {
                    applyPluginMethod(element[i]);
                };
            }
            else {
                applyPluginMethod(element);
            }
            
        }
        // initialise the function using the arguments as the plugin options
        else {
            // initialise each instance of the plugin
            if (element.length) {
                for (var i = 0; i < element.length; i++) {
                    initialisePlugin(element[i]);
                }
            }
            else {
                initialisePlugin(element);
            }
        }
        return this;
    };

    // end of module
})(d3);
