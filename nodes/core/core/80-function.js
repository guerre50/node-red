/**
 * Copyright 2013 IBM Corp.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 **/

var RED = require(process.env.NODE_RED_HOME+"/red/red");

var util = require("util");
var vm = require("vm");
var fs = require('fs');
var fspath = require('path');

function FunctionNode(n) {
    RED.nodes.createNode(this,n);
    this.name = n.name;
    this.func = n.func;
    this.topic = n.topic;
    this.context = {global:RED.settings.functionGlobalContext || {}};
    var functionText = "'use strict'; return (function(msg){" + this.func + "\n})(msg);";
    this.code = new Function('context', 'msg', functionText);
    try {           
        this.on("input", function(msg) {
                if (msg != null) {
                    try {
                        var results = this.code(this.context, msg);

                        if (results == null) {
                            results = [];
                        } else if (results.length == null) {
                            results = [results];
                        }
                        if (msg._topic) {
                            for (var m in results) {
                                if (results[m]) {
                                    if (util.isArray(results[m])) {
                                        for (var n in results[m]) {
                                            results[m][n]._topic = msg._topic;
                                        }
                                    } else {
                                        results[m]._topic = msg._topic;
                                    }
                                }
                            }
                        }
                        this.send(results);

                    } catch(err) {
                        this.error(err.message);
                    }
                }
        });
    } catch(err) {
        this.error(err.message);
    }
}

RED.nodes.registerType("function",FunctionNode);
RED.library.register("functions");
