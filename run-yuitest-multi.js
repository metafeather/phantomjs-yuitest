/*
 * PhantomJS YUITest driver
 *
 * Enables the use of more advanced features of YUITest.
 *
 *
 * Home: https://github.com/metafeather/phantomjs-yuitest
 */

var fileoverview = "PhantomJS YUITest Driver (v0.3.14)";

if (typeof(phantom) !== "undefined" && (phantom.version.major >= 1 && phantom.version.minor >= 4)) {

  phantom.injectJs('yuitest/utils.js');
  var options = optionParser();

  if (options.version || options.v){
    console.log(fileoverview);
    phantom.exit(0);
  }

  if (options.help || options.h){
    console.log(fileoverview);
    console.log("");
    console.log("  Usage:");
    console.log("    phantomjs [phantom options] run-yuitest.js [script options] [arguments]");
    console.log("");
    console.log("  Examples:");
    console.log("    phantomjs run-yuitest.js -h/--help");
    console.log("    phantomjs run-yuitest.js -v/--version");
    console.log("    phantomjs run-yuitest.js /path/to/yuitest/html/file1.html /path/to/yuitest/html/file2.html");
    console.log("    phantomjs run-yuitest.js http://path/to/yuitest/html/file1.html http://path/to/yuitest/html/file2.html");
    console.log("    phantomjs run-yuitest.js --testRunId=Ticket1234 --browserId=IE8 http://path/to/yuitest/html/file1.html http://path/to/yuitest/html/file2.html");
    console.log("    phantomjs run-yuitest.js --testDirectory=tests --testFileMatch=\.js$ --testUrl=unit.html?test_suite=");
    console.log("    phantomjs run-yuitest.js --outputDirectory=../../output --testDirectory=../../tests --testFileMatch=(model/|view/|controller/)(.*)\.js$ --testUrl=unit.html?test_suite=");
    console.log("    phantomjs run-yuitest.js --testResultsServer=http://localhost:8080");
    console.log("");
    console.log("  Options:");
    console.log("    -o/--outputDirectory     optional path to the output directory, default .");
    console.log("    --testDirectory          optional path to the tests directory, default .");
    console.log("    --testFileMatch          optional regex to match test files, default \.html$");
    console.log("    --testUrl                optional path in testDirectory to html file, or url, which will load tests");
    console.log("    --testRunId              optional ID to store results with (for use with multi file runs)");
    console.log("    --browserId              optional ID to store results with (for use with multi browser runs)");
    console.log("    --timeout                optional number of secs to wait for a test file to complete");
    console.log("    --enableWindowLogging    optional enable the test file to write to console.log");
    // TODO
    //console.log("    --testResultsServer      optional url to send results back to");
    phantom.exit(0);
  }

  var fs = require('fs'),
      outDir = (options.outputDirectory || options.o) ? options.outputDirectory : 'output' + fs.separator;

  // use supplied ID's to create a unique output directory for the run in the browser
  outDir += (!isUndefined(options.testRunId) ? options.testRunId + fs.separator : '0' + fs.separator);
  outDir += (!isUndefined(options.browserId) ? options.browserId + fs.separator : 'unknown' + fs.separator);

  // make path x-platform
  outDir = fixPathSeparator(outDir);

  // clear old results
  fs.removeTree(outDir);

  // get a list of files to load, load all pages in sequence, storing results as we go
  phantom.injectJs('yuitest/urls.js');
  phantom.injectJs('yuitest/results.js');
  var testFiles = makeTestUrls(options),
      page,
      pageindex = 0,
      fileName = '',
      url = '';

  function openPage() {
    var data,
        exit = 1;

    // WebPage API
    page = require('webpage').create();

    page.settings.javascriptEnabled = true;
    page.settings.localToRemoteUrlAccessEnabled = true;
    page.settings.loadImages = true;
    page.settings.loadPlugins = true;
    page.viewportSize = {
      width: 1024,
      height: 1024
    }

    // Route "console.log()" calls from within the Page context to the main Phantom context (i.e. current "this")
    if (options.enableWindowLogging){
      page.onConsoleMessage = function(msg, line, source) {
        // onsole.log(source +':'+ line +':'+ msg);
        console.log('Log: '+msg);
      };
      page.onAlert = function(msg) {
        console.log('Alert: '+ msg);
      };
    }

    // load file
    if (pageindex < testFiles.length) {
      var file = testFiles[pageindex];
      url = (file.match(/^\//) ? 'file://'+ file : file);
      fileName = toFileName(url);

      page.onLoadStarted = function(){
        // onsole.log('page.onLoadStarted');
      }

      page.onInitialized = function(){
        // onsole.log('page.onInitialized');
        initPageProperties();
      }

      page.onLoadFinished = function(status){
        // onsole.log('page.onLoadFinished');
        if (status !== "success") {
          console.log("Unable to access page: " + status);
          testResultsMissing();
          nextPage();
        } else {
          subscribeToTestRunner();
          waitForResults();
        };

        // clear this callback so further loads by the page don't re-init the test run
        page.onLoadFinished = function(){
          // onsole.log('Info: Page has loaded further resources')
        };

        // advanced debugging of tests
        page.onResourceRequested = function(request){
          // onsole.log('Info: Page has requested additional resources from '+ request.url);
        };
        page.onResourceReceived = function(request){
          // onsole.log('Info: Page has received additional resources from '+ request.url);
        };

      };

      console.log('Opening [' + (pageindex + 1) +'/'+ (testFiles.length) + '] '+ url);
      page.open(url);

    }

    // all files loaded
    if (pageindex === testFiles.length) {
      data = testRunReport();

      // exit indicating failed states
      exit = ((data.files.timeouts > 0 || data.files.missing > 0) ? 1: 0);
      console.log('PhantomJS exit status: '+ exit);
      phantom.exit(exit);
    }

  };

  // load the first test file
  testRunStart();
  openPage();

  // load the next test file
  function nextPage() {
    pageindex++;
    openPage();
  }

} else {
  console.log(fileoverview);
  console.log("This script requires PhantomJS > 1.4.x");
  phantom.exit(1);
}