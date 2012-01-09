// Test run data holder
var testRunData = {
      timestamp: new Date().toString(),
      id: 0,
      userAgent: '',
      files: {
        total: 0,
        missing: 0, // files that do not have any tests in them
        timeouts: 0 // file that threw errors or took too long
      },
      duration: 0,
      progress: '',
      total: 0,
      passed: 0,
      failed: 0,
      ignored: 0
    };

if (!isUndefined(options.testRunId)){
  testRunData.id = options.testRunId;
}

// This callback is invoked after the web page is created and before a URL is loaded. The callback may be used to change global objects.
function initPageProperties(){

  page.evaluate(function(){
    // tell the page its running under PhantomJS
    window.PhantomJS = true;
  });

};

// subscribe to TestRunner events
function subscribeToTestRunner(){

  page.evaluate(function(){

    if(window.Y && Y.Test.Runner) {

      // visual record of tests results
      window.TestRunProgress = '';
      function handleTestResult(data){
        switch(data.type) {
          case Y.Test.Runner.TEST_PASS_EVENT:
            // onsole.log("Test named '" + data.testName + "' passed.");
            window.TestRunProgress += '.'
            break;
          case Y.Test.Runner.TEST_FAIL_EVENT:
            // onsole.log("Test named '" + data.testName + "' failed with message: '" + data.error.message + "'.");
            window.TestRunProgress += 'F'
            break;
          case Y.Test.Runner.TEST_IGNORE_EVENT:
            // onsole.log("Test named '" + data.testName + "' was ignored.");
            window.TestRunProgress += 'I'
            break;
        }
      }
      Y.Test.Runner.subscribe(Y.Test.Runner.TEST_FAIL_EVENT, handleTestResult);
      Y.Test.Runner.subscribe(Y.Test.Runner.TEST_IGNORE_EVENT, handleTestResult);
      Y.Test.Runner.subscribe(Y.Test.Runner.TEST_PASS_EVENT, handleTestResult);
    }
    return true;
  });

};

// get data from TestRunner when complete
function waitForResults(){

  // poll the page
  waitFor(
    // monitor the TestRunner for when it finishes
    function test(){
      console.log('Waiting for results ... ');

      return page.evaluate(function(){
        if(window.Y && Y.Test.Runner) {
          return !Y.Test.Runner.isRunning();
        } else if(window.leon && leon.TestRunner) {
          return !leon.TestRunner.isRunning();
        } else {
          console.log("Not a test page");
          return true;
        }
      });
    },

    // once the TestRunner has finished collect the data
    function onReady(){
      console.log('Collecting results ...')

      // export test results data
      var data = page.evaluate(function(){
        if(window.Y && Y.Test.Runner) {
          return {
            js: Y.Test.Runner.getResults(), // JS object
            tap: Y.Test.Runner.getResults(Y.Test.Format.TAP), // plain text
            json: Y.Test.Runner.getResults(Y.Test.Format.JSON), // JSON String
            junit: Y.Test.Runner.getResults(Y.Test.Format.JUnitXML), // Single JUnit file
            xml: Y.Test.Runner.getResults(Y.Test.Format.XML), // Single XML file
            progress: window.TestRunProgress,
            userAgent: navigator.userAgent
          }
        } else if(window.leon && leon.TestRunner) {
          return {
            js: leon.TestRunner.getResults(), // JS object
            progress: window.TestRunProgress
          }
        } else {
          return false;
        }
      });

      if (data){
        testResultsToDisk(data);

        // update test run
        updateTestRunData(data)
        testRunData.files.total++;

      } else {
        testResultsMissing();
      }

      // get next file
      nextPage();
    },

    // if the tests take too long, or errored, log and move on
    10000, // default timeout 30000
    function onTimeout(){
      testResultsTimeout();

      // get next file
      nextPage();
    }
  );

}

function testResultsMissing() {
  console.log('Test results: MISSING')
  console.log('')

  // update test run
  testRunData.progress += 'M';
  testRunData.files.missing++;
  testRunData.files.total++;
}

function testResultsTimeout() {
  console.log('Test results: TIMEOUT')
  console.log('')

      // update test run
      testRunData.progress += 'T';
      testRunData.files.timeouts++;
      testRunData.files.total++;
}

function testResultsToDisk(data) {

  // save an image of the page
  page.render(outDir +"images/" + (pageindex + 1) +'-'+ fileName + ".png");

  // save other formats
  if (data.json){
    fs.write(outDir +"json/" + (pageindex + 1) +'-'+ fileName + ".json", data.json, 'w');
  }
  if (data.junit){
    fs.write(outDir +"junit/" + (pageindex + 1) +'-'+ fileName + ".xml", data.junit, 'w');
  }
  if (data.xml){
    fs.write(outDir +"xml/" + (pageindex + 1) +'-'+ fileName + ".xml", data.xml, 'w');
  }
  // parseable but human readable output
  if (data.tap){
    fs.write(outDir +"tap/" + (pageindex + 1) +'-'+ fileName + ".txt", data.txt, 'w');
    console.log('Test results: '+ data.tap);
  }

};

// update test run with aggregate data
function updateTestRunData(data) {

  if (data.js && !isUndefined(testRunData)){
    testRunData.userAgent = data.userAgent;
    testRunData.progress += data.progress;
    testRunData.timestamp = data.js.timestamp;
    testRunData.duration += data.js.duration;
    testRunData.total += data.js.total;
    testRunData.passed += data.js.passed;
    testRunData.failed += data.js.failed;
    testRunData.ignored += data.js.ignored;
  }

};

function testRunStart(){
  var data = testRunData;
  console.log(fileoverview);
  console.log("Test run "+ data.id +" started");
  return data;
}

function testRunReport(){
  var data = testRunData;
  console.log(fileoverview);
  console.log(data.progress);
  console.log("Test run "+ data.id +" completed at "+ data.timestamp);
  console.log("Passed:"+ data.passed +" Failed:"+ data.failed +" Total:"+ data.total +" ("+ data.ignored +" ignored)");
  console.log("Files:"+ data.files.total +" ("+ data.files.missing +" missing, "+ data.files.timeouts +" timeout"+ (data.files.timeouts === 1 ? "" : "s") +")");

  fs.write(outDir +"run/" + data.id + ".json", JSON.stringify(data, null, 2), 'w');

  return data;
}
