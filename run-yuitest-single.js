/*
* PhantomJS YUITest driver
*
* Runs a single HTML file with YUITest setup in it and reports the results in (human readable) TAP format.
* This is a simple example for comparison with run-qunit.js, run-jasmine.js, etc.
* See run-yuitest-multi.js for more advanced features, such as running multiple test files as one run, and a results server to store runs from browsers.
*
* Home: https://github.com/metafeather/phantomjs-yuitest
*/

/**
 * Wait until the test condition is true or a timeout occurs. Useful for waiting
 * on a server response or for a ui change (fadeIn, etc.) to occur.
 *
 * @param testFx javascript condition that evaluates to a boolean,
 * it can be passed in as a string (e.g.: "1 == 1" or "$('#bar').is(':visible')" or
 * as a callback function.
 * @param onReady what to do when testFx condition is fulfilled,
 * it can be passed in as a string (e.g.: "1 == 1" or "$('#bar').is(':visible')" or
 * as a callback function.
 * @param timeOutMillis the max amount of time to wait. If not specified, 3 sec is used.
 */
function waitFor(testFx, onReady, timeOutMillis) {
    var maxtimeOutMillis = timeOutMillis ? timeOutMillis : 3001, //< Default Max Timout is 3s
        start = new Date().getTime(),
        condition = false,
        interval = setInterval(function() {
            if ( (new Date().getTime() - start < maxtimeOutMillis) && !condition ) {
                // If not time-out yet and condition not yet fulfilled
                condition = (typeof(testFx) === "string" ? eval(testFx) : testFx()); //< defensive code
            } else {
                if(!condition) {
                    // If condition still not fulfilled (timeout but condition is 'false')
                    console.log("'waitFor()' timeout");
                    phantom.exit(1);
                } else {
                    // Condition fulfilled (timeout and/or condition is 'true')
                    console.log("'waitFor()' finished in " + (new Date().getTime() - start) + "ms.");
                    typeof(onReady) === "string" ? eval(onReady) : onReady(); //< Do what it's supposed to do once the condition is fulfilled
                    clearInterval(interval); //< Stop this interval
                }
            }
        }, 250); //< repeat check every 250ms
};

if (phantom.args.length === 0 || phantom.args.length > 2) {
  console.log('Usage: run-yuitest-single.js URL');
  phantom.exit(1);
}

var page = require('webpage').create();

page.settings.javascriptEnabled = true;
page.settings.localToRemoteUrlAccessEnabled = true;
page.settings.loadImages = true;
page.settings.loadPlugins = true;
page.viewportSize = {
  width: 1024,
  height: 1024
}

// Route "console.log()" calls from within the Page context to the main Phantom context (i.e. current "this")
page.onConsoleMessage = function(msg) {
  console.log(msg);
};

page.open(
  phantom.args[0],
  function(status){
    var timeout=10,
        exit = 1;

    if (status !== "success") {
      console.log("Unable to access network");
      phantom.exit(exit);
    } else {

      waitFor(
        function test(){
          return page.evaluate(function(){
            console.log('Waiting for results ... ');

            // check there is a test runner and query its status
            if(window.Y && Y.Test && Y.Test.Runner && !window.TestRunnerStarted) {
              window.TestRunnerStarted = Y.Test.Runner.isRunning();
              return false;
            } else if(window.Y && Y.Test && Y.Test.Runner && window.TestRunnerStarted) {
              return !Y.Test.Runner.isRunning();
            } else {
              console.log("Not a test page");
              return true;
            }
          });

        },
        function onReady(){
          // export test results data
          var data = page.evaluate(function(){

            // get all the results in various formats for convienience
            if(window.Y && Y.Test.Runner) {
              return {
                js: Y.Test.Runner.getResults(), // JS object
                tap: Y.Test.Runner.getResults(Y.Test.Format.TAP), // plain text
                json: Y.Test.Runner.getResults(Y.Test.Format.JSON), // JSON String
                junit: Y.Test.Runner.getResults(Y.Test.Format.JUnitXML), // Single JUnit file
                xml: Y.Test.Runner.getResults(Y.Test.Format.XML), // Single XML file
              }

            } else {
              return false;
            }
          });

          // save an image of the page
          page.render("screenshot.png");

          if (data){
            // parseable but human readable output
            if (data.tap){
              console.log('Test results: '+ data.tap);
            }

            if (data.junit){
              console.log('Results in JUnit format can easily be saved to the filesystem');
              //fs.write("junit.xml", data.junit, 'w');
            }

            if (data.js){
              // exit indicating failed states
              exit = (parseInt(data.js.failed) > 0 ? 1: 0);
            }
          }
          phantom.exit(exit);
        },
        (timeout * 1000)
      );
    }
  }
);
