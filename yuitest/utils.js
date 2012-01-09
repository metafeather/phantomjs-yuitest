/**
 * Boolean to see if a var is undefined
 */
function isUndefined(ref){
  return (typeof(ref) === 'undefined');
}

/**
 * Boolean to see if a var is a string
 */
function isString(ref){
  return (typeof(ref) === 'string');
}

/**
 * Boolean to see if a var is a boolean
 */
function isBoolean(ref){
  return (typeof(ref) === 'boolean');
}

/**
 * Turn a path into just the directory part.
 */
function toFileDir(path) {
	var nameStart = Math.max(path.lastIndexOf("/")+1, path.lastIndexOf("\\")+1, 0);
	return path.substring(0, nameStart-1);
}
/**
 * Turn a path into just the name of the file.
 */
function toFileName(path) {
	var nameStart = Math.max(path.lastIndexOf("/")+1, path.lastIndexOf("\\")+1, 0);
	return path.substring(nameStart);
}
/**
 * Get the extension of a filename
 */
function toFileExtension(filename) {
   return filename.split(".").pop().toLowerCase();
};

/**
 * parse out 'switch' type arguments passed to the script (identified by '--' and value delimited by '=')
 * any other args will be collected and returned as an 'args' array
 * @param [args]
 */
function optionParser(args){
  var args = (isUndefined(args) ? phantom.args: args),
      LONG_SWITCH_RE = /^--/,
      SHORT_SWITCH_RE = /^-/,
      option = '',
      pair,
      key,
      value,
      options = {
        args: []
      };

  // create a [key,value], which may contain its own delimiter in the value
  function createKeyValue(option, delimiter){
    var pair = [],
        index = option.indexOf(delimiter);

    if (index > 0){
      pair[0] = option.slice(0, index);
      pair[1] = option.slice(index + delimiter.length);
    } else {
      pair[0] = option;
    }
    // if a option does not supply a value use true
    pair[1] = ((isUndefined(pair[1]) || pair[1] === '') ?  true : pair[1])

    //onsole.log('Option: '+ pair[0] +'='+ pair[1])
    return pair;
  }

  for(var i = 0; i < args.length; i++) {
    option = args[i];
    if (option.match(LONG_SWITCH_RE) || option.match(SHORT_SWITCH_RE)) {
      option = option.replace(LONG_SWITCH_RE, '');
      option = option.replace(SHORT_SWITCH_RE, '');
      pair = createKeyValue(option, '=');
      key = pair[0];
      value = pair[1];
      options[key] = value;
    } else {
      // not an option so store the arg in the args array
      options.args.push(option);
    }
  }

  // return the parsed options as a JSON object
  return options;
}

/**
 * Collect all files in folders, with optional recursing
 * @param dir The starting directory to look in.
 * @param [recurse=1] How many levels deep to scan.
 * @returns An array of all the paths to files in the given dir.
 */
function dirwalk(dir, recurse, _allFiles, _path) {
  // onsole.log('ls '+ dir +' '+ recurse +' '+ _allFiles +' '+ _path)

  if (isUndefined(dir)) {
    throw 'dirwalk requires a dir to walk.';
  }
  if (isUndefined(_path)) { // initially
    var _allFiles = [];
    var _path = [dir];
  }
  if (_path.length === 0) {
    return _allFiles;
  }
  if (isUndefined(recurse)) {
    recurse = 1;
  }

  // is the dir argument actually a file?
  if (fs.isFile(dir)) {
    _allFiles.push(dir);
  } else {
    var files = fs.list(dir);
    for (var i = 0; i < files.length; i++) {
      var file = files[i];

      if (file.match(/^\./)) {
        continue; // skip dot files
      }

      if (fs.isDirectory(file)) { // it's a directory
        _path.push(file);

        if (_path.length-1 < recurse) {
          // recurse the function with the new path
          dir = _path.join(fs.separator)
          dirwalk(dir, recurse, _allFiles, _path);
        }
        _path.pop();
      }
      else {
        file = (_path.join(fs.separator)+fs.separator+file).replace(fs.separator+fs.separator, fs.separator)
        _allFiles.push(file);
      }
    }
  }

  return _allFiles;
}

/**
 * Wait until the test condition is true or a timeout occurs. Useful for waiting
 * on a server response or for a ui change (fadeIn, etc.) to occur.
 *
 * @param test javascript condition that evaluates to a boolean,
 * it can be passed in as a string (e.g.: "1 == 1" or "$('#bar').is(':visible')" or
 * as a callback function.
 * @param onReady what to do when test condition is fulfilled,
 * it can be passed in as a string (e.g.: "1 == 1" or "$('#bar').is(':visible')" or
 * as a callback function.
 * @param timeOutMillis the max amount of time to wait. If not specified, 3 sec is used.
 * @param onTimeout what to do when test condition timeouts,
 * it can be passed in as a string (e.g.: "1 == 1" or "$('#bar').is(':visible')" or
 * as a callback function.
 */
function waitFor(test, onReady, timeOutMillis, onTimeout) {
  var maxtimeOutMillis = timeOutMillis ? timeOutMillis : 30001, //< Default Max Timeout is 30s
      start = new Date().getTime(),
      condition = false,
      interval = setInterval(
        function() {
          if ( (new Date().getTime() - start < maxtimeOutMillis) && !condition ) {
            // If not time-out yet and condition not yet fulfilled
            condition = (typeof(test) === "string" ? eval(test) : test()); // defensive code
          } else {
            if(!condition) {
              // If condition still not fulfilled (timeout but condition is 'false')
              typeof(onTimeout) === "string" ? eval(onTimeout) : onTimeout();
            } else {
              // Condition fulfilled (condition is 'true')
              typeof(onReady) === "string" ? eval(onReady) : onReady(); // Do what it's supposed to do once the condition is fulfilled
            }
            clearInterval(interval); // Stop this interval
          }
        },
        100
      ); // repeat check every 100ms
};