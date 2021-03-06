/**
 *
 * ©2018-2019 EdgeVerve Systems Limited (a fully owned Infosys subsidiary),
 * Bangalore, India. All Rights Reserved.
 *
 */

module.exports = function GruntConfig(grunt) {
  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    clean: {
      coverage: {
        src: ['coverage/']
      },
      dist: {
        src: ['dist/']
      }
    },

    mocha_istanbul: {
      options: {
        mochaOptions: ['--exit']
      },
      coverage: {
        src: ['test/version-mixin-test.js', 'test/audit-field-test.js', 'test/history-mixin-test.js', 'test/soft-delete-mixin-test.js', 'test/crypto-test.js'],
        options: {
          timeout: 60000,
          check: {
            lines: 80,
            statements: 80,
            branches: 60,
            functions: 80
          },
          reportFormats: ['lcov']
        }
      }
    }
  });

  // Add the grunt-mocha-test tasks.
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-mocha-istanbul');

  grunt.registerTask('test-with-coverage', ['clean:coverage', 'mocha_istanbul']);
};
