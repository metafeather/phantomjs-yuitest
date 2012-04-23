// make a list of test urls
function makeTestUrls(options){

  // look elsewhere for test HTML, JS or JSON files
  if (isString(options.testDirectory)){
    fs.changeWorkingDirectory(fs.workingDirectory + fs.separator + options.testDirectory);
  }

  // workout paths to test files to load based on sensible defaults and supplied options
  var dir = fs.workingDirectory,
      allFiles = dirwalk(dir),
      testFiles = [],
      FILE_MATCH_RE = /\.html$/;

  // override default file match pattern
  if (isString(options.testFileMatch)){
    FILE_MATCH_RE = new RegExp(options.testFileMatch);
  }

  // start with any paths supplied as args
  if (!isUndefined(options.args)) {
    testFiles = options.args;
  }

  // convert paths to full paths if not urls
  for(var i = 0; i < testFiles.length; i++) {
    var file = testFiles[i];
    if (!file.match(/^http/)){
      testFiles[i] = fs.absolute(file);
    }
  }

  // filter the list of files from the filesystem using our regex
  if (isString(options.testDirectory)){
    // onsole.log('Looking for test files in '+ options.testDirectory);

    for(var i = 0; i < allFiles.length; i++) {
      var file = allFiles[i],
          fullPath = fs.absolute(file),
          relativePath = fullPath.replace(dir + '/', ''),
          testUrl = '';

      // check if path exists and matches, then create a test url to it
      if(fs.isFile(fullPath) || fs.isDirectory(fullPath)) {
        if(fs.isDirectory(fullPath)){
          fullPath = fullPath + fs.separator;
        }
        // onsole.log('Match test file using '+ options.testFileMatch + ' on '+ fullPath);
        if(fullPath.match(FILE_MATCH_RE)) {
          testUrl = fullPath;

          if(isString(options.testFileMatch) && isString(options.testUrl)) {
            testUrl = fs.workingDirectory + fs.separator + options.testUrl + relativePath;
          }
          if(isString(options.testUrl) && options.testUrl.match(/^http/)){
           testUrl = options.testUrl + relativePath;
          }
          // onsole.log('Created test url as '+ testUrl);

          testFiles.push(testUrl);
        }
      }
    }
  }

  //onsole.log('Made '+ testFiles.length +' test urls');
  return testFiles;

}
