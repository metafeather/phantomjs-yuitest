/*
 * Uses YUITest with TestCase .js files that can be used to output JUnit reports.
 */
(function() {

  YUI.add('phantomjs-test-runner',
    function(Y) {

      // Own namespace for storing references etc
      Y.namespace('phantomjs');

      Y.phantomjs.testrunner = function(){

        // Own namespace for storing references etc
        Y.namespace('phantomjs.tests');

         // Get the test_suite file, in YUI TestCase format
        Y.Get.script(url_options.test_suite, {
          onEnd: function () {

            // Setup the suites and runners from the tests declared in the file loaded
            var suite = new Y.Test.Suite({name: "Unit Test Suite"});
            Y.Object.each(Y.phantomjs.tests, function (value, key, obj){
              suite.add(value);
            });
            Y.Test.Runner.add(suite);
            Y.Test.Runner.setName(suite.name + " Test Runner");

            // Get core dependencies dependent on the framework being used
            var files = [];
            // Add the src code to test
            Y.phantomjs.scripts = files.concat(Y.phantomjs.scripts);

            Y.Get.script(Y.phantomjs.scripts, {
              onEnd: function () {
                // Start testing
                Y.Test.Runner.run();
              }
            });
          }
        });

        // UI for results
        var testRunnerConsole = new Y.Console({
          width: "750px",
          height: "90%"
        }).render();

      } // end testrunner
    },
    '0.1.0' /* module version */,
    {
      requires: ['console', 'test']
    }
  );

  // Parse options declared in the URL, e.g. the test_suite filename
  var url_options = {},
      url = url || YUI().config.doc.location.search;

  if (url){
    var  params = url.slice(1).split(",");
    for (var i=0; i <params.length; i++){
      var param = params[i].split("=");
      url_options[param[0]] = param[1];
    }
  }

  // The actual test runner is used if only a test_suite file has been declared.
  if (url_options && url_options.test_suite){
    window.Y = YUI({
        logInclude:{"TestRunner":true},
        useConsole: true,
        useBrowserConsole: true
    }).use('phantomjs-test-runner', function(Y){

    // execute automatically
    Y.on('available', function() {
      Y.phantomjs.testrunner();
    }, 'body');

    });
  }
})();