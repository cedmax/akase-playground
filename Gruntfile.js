/*global module:false */

var fs = require('fs');
var mustache = require('mustache');

module.exports = function(grunt) {
    "use strict";

    function createJsLib(type,name){
        var destinationFolder = "js/" + type;
        var destinationFile = destinationFolder + "/" + name + ".js";
        var testFile = 'test/' + name.replace(/\//, '.') + 'Test.js';

        if (!fs.existsSync(destinationFolder)){
            fs.mkdirSync(destinationFolder);
        }

        if (fs.existsSync(destinationFile) || fs.existsSync(testFile)){
            grunt.fail.warn("Either the "+ type +" or its test already exists.");
            return;
        } else {
            var fileTpl, modDefinition = {name: name, type: type, isModule: (type==="module")};
            if (type === "main") {
                fileTpl = fs.readFileSync('.tpl/main.mustache', 'utf8');
                fs.writeFileSync(destinationFile, mustache.render(fileTpl, modDefinition));
            } else {
                fileTpl = fs.readFileSync('.tpl/lib.mustache', 'utf8');
                fs.writeFileSync(destinationFile, mustache.render(fileTpl, modDefinition));

                if (!fs.existsSync('test')){
                    fs.mkdirSync('test');
                }

                var testTpl = fs.readFileSync('.tpl/test.mustache', 'utf8');
                fs.writeFileSync(testFile, mustache.render(testTpl, modDefinition));
            }
        }
    }

    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-htmlrefs');
    grunt.loadNpmTasks('grunt-contrib-requirejs');
    grunt.loadNpmTasks('grunt-qunit-amd');
    grunt.loadNpmTasks('grunt-exec');
    grunt.loadNpmTasks('grunt-notify');
    grunt.loadNpmTasks('grunt-bower');

    grunt.initConfig({
        jshint: {
            options: {
                curly: true,
                eqeqeq: true,
                immed: true,
                latedef: true,
                newcap: true,
                noarg: true,
                sub: true,
                undef: true,
                unused: true,
                boss: true,
                eqnull: true,
                browser: true,
                globals: {
                    require:false,
                    define: false
                }
            },
            lib: {
                src: ['js/**/*.js', '!js/lib/**/*.js']
            },
            override: {
                options: {
                    globals: {
                        sinon:false, require:false, define:false, QUnit: false, test:true, start: false,
                        asyncTest:true, module:true, deepEqual:false, equal:false, notDeepEqual:false,
                        notEqual:false, notStrictEqual:false, ok:false, strictEqual:false, throws:false
                    }
                },
                files: {
                    src: ['test/**/*.js']
                }
            }
        },
        exec:{
            bower: {
                cmd: 'node_modules/bower/bin/bower install'
            }
        },
        watch: {
            js: {
                files: ['js/**/*.js', 'test/**/*.js'],
                tasks: ['jshint']
            }
        },
        clean: {
            bower: ['components'],
            libs: ['js', 'test', "index.html"]
        },
        bower: {
            dev: {
                dest: 'js/lib'
            }
        },
        qunit_amd: {
            unit: function(file){
                var config = {
                    include: [
                        'js/lib/sinon.js',
                    ],
                    tests: [
                        file?"test/"+file+"Test.js":"test/*Test.js"
                    ],
                    require: {
                        baseUrl: 'js',
                        paths: {
                            akase: 'js/lib/akase',
                        }
                    }
                };
                return config;
            }
        },
        htmlrefs: {
            dist: {
                src: 'src/index.html',
                dest: '.'
            }
        },
        requirejs: {
            compile: {
                options: {
                    optimize:"uglify2",
                    baseUrl: "js",
                    paths: {
                        akase: 'lib/akase',
                    },
                    out: "js/main/main.min.js",
                    name: "main/main"
                }
            }
        }
    });

    grunt.registerTask('unit', function(file){
        grunt.task.run('qunit_amd:unit' + ((file)? ":" + file : ""));
    });

    grunt.registerTask('create', createJsLib);
    grunt.registerTask('bower_run', ['exec:bower', 'bower', 'clean:bower']);
    grunt.registerTask('init', ['bower_run', 'create:main:main', 'create:module:example']);
    grunt.registerTask('dev', ['bower_run', 'watch']);
    grunt.registerTask('reset', ['clean']);
    grunt.registerTask('default', ['requirejs', 'htmlrefs']);

};
