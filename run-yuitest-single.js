/*
* PhantomJS YUITest driver (v0.5)
*
* Runs a single HTML file with YUITest setup in it and reports the results in (human readable) TAP format.
* This is a simple example for comparison with run-qunit.js, run-jasmine.js, etc.
*
* Home: https://github.com/metafeather/phantomjs-yuitest
*
* PhantomJS binaries: http://phantomjs.org/download.html
* Requires PhantomJS 1.6+ (1.7+ recommended)
*
* Run with:
*   phantomjs runner.js [url-of-your-testsuite]
*
* e.g.
*   phantomjs runner.js http://localhost/tests/index.html
*/
/*global phantom:true, require:true, console:true, window:true */

(function(phantom, console) {
	'use strict';

  var versioncheck = ((1 <= phantom.version.major) && (6 <= phantom.version.minor));
  if (!versioncheck){
    console.log('Requires PhantomJS 1.6+ (1.7+ recommended)');
    console.log('PhantomJS binaries: http://phantomjs.org/download.html');
		phantom.exit(1);
	}

	// arg[0]: scriptName, args[1...]: arguments
  var args = require('system').args
	if (args.length !== 2) {
		console.error('Usage:\n  phantomjs runner.js [url-of-your-testsuite]');
		phantom.exit(1);
	}

  function createPage(){
    var page = require('webpage').create();
    page.settings.javascriptEnabled = true;
    page.settings.localToRemoteUrlAccessEnabled = true;
    page.settings.webSecurityEnabled = true;  // enforce Same-Origin sandbox
    page.settings.loadImages = true;
    page.settings.loadPlugins = true;
    page.viewportSize = {
      width: 1024,
      height: 2048
    }
    return page;
  };

  var context = this,
      url = args[1],
      page = createPage();

	// Route console.log() calls from within the Page context to the main Phantom context (i.e. current this)
	page.onConsoleMessage = function(msg) {
		console.log(msg);
	};

	page.onInitialized = function() {
    console.log('Page loading...');
	};

  // invoked by calling window.callPhantom() in the page
	page.onCallback = function(message) {
    console.log('Test data received...');

		var fs = require('fs'),
		    exit;

		if (message) {
			if ('YUITest.TestRunner.COMPLETE_EVENT' === message.name) {

        // save an image of the page
        page.render("results/screenshot.png");

        if (message.data){
          // parseable but human readable output
          if (message.data.tap){
            //console.log('Test results: '+ message.data.tap);
            //fs.write("tap.txt", message.data.tap, 'w');
          }

          if (message.data.junit){
            // console.log('Results in JUnit format can easily be saved to the filesystem');
            fs.write("results/junit.xml", message.data.junit, 'w');
          }

          if (message.data.js){
            // exit indicating failed status
            exit = (parseInt(message.data.js.failed) > 0 ? 1: 0);
          }
        }
        phantom.exit(exit);

			}
		}
	};

	page.open(
	  url,
    function(status) {
      if (status !== 'success') {
        console.error('Unable to access network: ' + status + ' ' + url);
        phantom.exit(1);
      } else {
        // Cannot do this verification with the 'DOMContentLoaded' handler because it
        // will be too late to attach it if a page does not have any script tags.
        var missing = page.evaluate(function() { return (typeof YUITest === 'undefined' || !YUITest); });
        if (missing) {
          console.error('The YUITest object is not present on this page.');
          phantom.exit(1);
        }

        // Do nothing... the callback mechanism will handle everything!
      }
    }
  );

}(phantom, console));
