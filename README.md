# phantomjs-yuitest

The javascript scripts in *phantomjs-yuitest* enable the execution and gathering of [YUI Test][] results via PhantomJS.

## Highlights

* Compatible with the standard YUI Test runner, so you can use existing YUI Test HTML files and tests unchanged.
* Run a single test file.
* Run a list of multiple files or use a RegExp to find test files in a directory and report all results as a single **Test Run**.
* Run tests from the filesystem or hosted on other servers.
* Fast headless testing on [PhantomJS][], a full featured WebKit browser with native support for
various web standards: DOM handling, CSS selector, JSON, Canvas, and SVG.
* Run the same tests in exactly the same manner in a browser for easy test debugging.
* Command line options for CI server integration.
* Output reports in all supported YUI Test formats: [JUnit][], [TAP][], JSON, XML, and render a screenshot of each page.
* Runs on Mac OS X, Linux and Windows.

## Install

You need the PhantomJS browser installed on your system. You can download binaries for Mac OS X and Windows from
[the PhantomJS download section][].

You will also need a HTML page with YUI Test present and test cases setup to run *onload*, and which exposes the test runner as *window.Y.Test.Runner*.
(see *examples/unit_testing_file/unit.html*)

## Usage

To get a list of options and some examples run:

`phantomjs run-yuitest-multi.js --help`

## How it works

In a typical use case on a developers machine:

* The developer sets up a test page to host tests for the area of work under development
* The URL to the page is passed as the argument to the script
* PhantomJS loads the page and executes all tests, just as if loaded in a browser
* On completion the results are collected and output in the console

In a typical use case with lots of test files running from a continuous integration server:

* The script uses the supplied `testFilesMatch` RegExp to scan a `testDirectory` to find test files to execute
* Individual URLs for each test file are made from the files path in the directory and a supplied `testUrl` prefix
* Each URL is opened in PhantomJS and the page loads and executes all present tests, just as if loaded in a browser
* Listeners are attached the the YUI Test Runner to monitor tests as they run and provide feedback
* On completion of each page the results are collected and output in the console and reports saved to disk using the `testRunId` in the path
* Results are aggregated as a Test Run, including whether the page failed to load, timed out or was missing tests
* After all pages are loaded the total pass/fail result is shown and a summary saved
* The CI server (such as [Hudson][] or [Go][]) reads all the saved JUnit XML reports and displays the data such as individually failing tests with stack traces

## Alternatives

A minimal standalone script *run-yuitest-single.js* is supplied for comparison with the *run-qunit.js* and *run-jasmine.js* examples and as a starting point for custom development.

## History

**2012-01-10** First release v0.3

## Contributors

* [Liam Clancy (metafeather)](http://metafeather.net/)

## License

(The MIT License)

Copyright (c) 2011 Michael Kessler

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
'Software'), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

[MF.net]: http://metafeather.net/
[YUI Test]: http://yuilibrary.com/yui/docs/test/
[PhantomJS]: http://www.phantomjs.org/
[the PhantomJS download section]: http://code.google.com/p/phantomjs/downloads/list
[JUnit]: http://www.junit.org/
[TAP]: http://testanything.org/wiki/index.php/Main_Page
[Hudson]: http://hudson-ci.org/
[Go]: http://www.thoughtworks-studios.com/go-agile-release-management