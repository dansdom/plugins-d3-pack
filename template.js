// extend code
// https://github.com/dansdom/extend
var Extend = Extend || function(){var h,g,b,e,i,c=arguments[0]||{},f=1,k=arguments.length,j=!1,d={hasOwn:Object.prototype.hasOwnProperty,class2type:{},type:function(a){return null==a?String(a):d.class2type[Object.prototype.toString.call(a)]||"object"},isPlainObject:function(a){if(!a||"object"!==d.type(a)||a.nodeType||d.isWindow(a))return!1;try{if(a.constructor&&!d.hasOwn.call(a,"constructor")&&!d.hasOwn.call(a.constructor.prototype,"isPrototypeOf"))return!1}catch(c){return!1}for(var b in a);return void 0===b||d.hasOwn.call(a, b)},isArray:Array.isArray||function(a){return"array"===d.type(a)},isFunction:function(a){return"function"===d.type(a)},isWindow:function(a){return null!=a&&a==a.window}};"boolean"===typeof c&&(j=c,c=arguments[1]||{},f=2);"object"!==typeof c&&!d.isFunction(c)&&(c={});k===f&&(c=this,--f);for(;f<k;f++)if(null!=(h=arguments[f]))for(g in h)b=c[g],e=h[g],c!==e&&(j&&e&&(d.isPlainObject(e)||(i=d.isArray(e)))?(i?(i=!1,b=b&&d.isArray(b)?b:[]):b=b&&d.isPlainObject(b)?b:{},c[g]=Extend(j,b,e)):void 0!==e&&(c[g]= e));return c};

// D3 plugin template
(function (d3) {
    // this ones for you 'uncle' Doug!
    'use strict';
    
    // Plugin namespace definition
    d3.TestPlugin = function (options, element, callback)
    {
        // wrap the element in the jQuery object
        this.el = element;

        // this is the namespace for all bound event handlers in the plugin
        this.namespace = "testPlugin";
        // extend the settings object with the options, make a 'deep' copy of the object using an empty 'holding' object
        // using the extend code that I ripped out of jQuery
        this.opts = Extend(true, {}, d3.TestPlugin.settings, options);
        this.init();
        // run the callback function if it is defined
        if (typeof callback === "function")
        {
            callback.call();
        }
    };
    
    // these are the plugin default settings that will be over-written by user settings
    d3.TestPlugin.settings = {
        'height': '930',
        'width': '960',
        'margin': {top: 30, right: 10, bottom: 30, left: 30},
        'data' : null,  // I'll need to figure out how I want to present data options to the user
        'dataRequest' : function(){}  // should I let them specific a request function or do it for them?
    };
    
    // plugin functions go here
    d3.TestPlugin.prototype = {
        init : function() {

            var container = this;

            container.margin = this.opts.margin,
            container.width = this.opts.width - container.margin.left - container.margin.right,
            container.height = this.opts.height - container.margin.top - container.margin.bottom; 

            // define the data for the graph
            if (typeof this.opts.data == "function") {
                container.data = this.opts.data.call();
            }
            else {
                this.setData(30);
            }
            // define the scales and axis
            this.setScale();
            this.setAxis();

            // build the chart with the data
            this.buildChart(container.data);

        },
        buildChart : function(data) {

            var container = this;

            // create the svg element that holds the chart
            container.chart = d3.select(container.el).append("svg")
                .datum(data)
                .attr("width", container.width + container.margin.left + container.margin.right)
                .attr("height", container.height + container.margin.top + container.margin.bottom)
                .append("g")
                .attr("transform", "translate(" + container.margin.left + "," + container.margin.top + ")");

            // add the X and Y axis
            container.chart.append("g")
                .attr("class", "x axis")
                .attr("transform", "translate(0," + container.height + ")")
                .call(container.xAxis);

            container.chart.append("g")
                .attr("class", "y axis")
                .call(container.yAxis);

            // define the line of the chart
            container.line = this.getLine();
            // define the area that sits under the line
            container.area = this.getArea();

            // add the line
            container.chart.append("path")
                .attr("class", "line")
                .attr("d", container.line);
            // add the area 
            container.chart.append("path")
                .attr("class", "area")
                .attr("d", container.area);
            
            // add the dots to the line
            container.chart.selectAll(".dot")
                .data(data.filter(function(d) { return d.y; }))
                .enter().append("circle")
                .attr("class", "dot")
                .attr("cx", container.line.x())
                .attr("cy", container.line.y())
                .attr("r", 3);
            
        },
        getLine : function() {
            // the 'd' here is the data object AHA!!!
            var container = this;
            return d3.svg.line()
                .x(function(d) { return container.xScale(d.x); })
                .y(function(d) { return container.yScale(d.y); });
        },
        getArea : function() {
            var container = this;
            return d3.svg.area()
                .x(container.line.x())
                .y1(container.line.y())
                .y0(container.yScale(0));
        },
        updateData : function() {
            var container = this,
                data = container.data;

            // update the chart line with the new data
            container.chart.selectAll("path.line")
                .data([data])
                .transition()
                .duration(2000)
                .attr("d", container.line);

            // update the chart area with the new data
            container.chart.selectAll("path.area")
                .data([data])
                .transition()
                .duration(2000)
                .attr("d", container.area); 
            
            // get the dots on the line
            var circle = container.chart.selectAll(".dot").data(data, function(d) {return d;});
            // add the new dots
            circle.enter().append("circle")
                .attr("class", "dot")
                .attr("cx", container.line.x())
                .attr("cy", container.line.y())
                .attr("r", 3.5)
                .style("stroke-opacity", 1e-6)
                .style("fill-opacity", 1e-6)
            // define the transition of the new circles
              .transition()
              .delay(1000)
                .duration(500)
                .attr("cx", container.line.x())
                .attr("cy", container.line.y())
                .style("stroke-opacity", 1)
                .style("fill-opacity", 1)

            // remove the old ones
            circle.exit()
              .transition()
                .duration(500)
                //.attr("cy", 1000)
                .style("stroke-opacity", 1e-6)
                .style("fill-opacity", 1e-6)
                .remove();
                
        },
        setData : function(num) {
            var data = d3.range(num).map(function(i) {
                return {x: i / (num-1), y: (Math.sin(i / 2) + 2) / 4};
            });
            this.data = data;
        },
        setScale : function(width, height) {
            this.xScale = d3.scale.linear()
                .domain([0, 1])
                .range([0, this.width]);

            this.yScale = d3.scale.linear()
                .domain([0, 1])
                .range([this.height, 0]);
        },
        setAxis : function() {
            this.xAxis = d3.svg.axis()
                .scale(this.xScale)
                .orient("bottom");

            this.yAxis = d3.svg.axis()
                .scale(this.yScale)
                .orient("left");
        },
        settings : function(settings) {
            // I need to sort out whether I want to refresh the graph when the settings are changed
            this.opts = Extend(true, {}, this.opts, settings);
            // will make custom function to handle setting changes
            this.applySettings();
        },
        destroy : function() {
            this.el.removeAttribute(this.namespace);
            this.el.removeChild(this.el.children[0]);
        }     
    };
    
    // the plugin bridging layer to allow users to call methods and add data after the plguin has been initialised
    // props to https://github.com/jsor/jcarousel/blob/master/src/jquery.jcarousel.js for the base of the code & http://isotope.metafizzy.co/ for a good implementation
    d3.testPlugin = function(element, options, callback) {
        // define the plugin name here so I don't have to change it anywhere else. This name refers to the jQuery data object that will store the plugin data
        var pluginName = "testPlugin",
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
                el[pluginName] = new d3.TestPlugin(options, el, callback);
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
