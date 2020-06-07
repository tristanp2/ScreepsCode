module.exports = function(grunt) {

    grunt.loadNpmTasks('grunt-screeps');

    grunt.initConfig({
        screeps: {
            options: {
                email: 'tpart',
                password: 'March1993',
                branch: 'default',
                ptr: false
            },
            dist: {
                src: ['src/*.js']
            }
        }
    });
}