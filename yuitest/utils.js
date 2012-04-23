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
 * Boolean to see if a var is an array
 */
function isArray(ref){
  return (typeof(ref) === 'array');
}

/**
 * Boolean to see if a var is an object
 */
function isObject(ref){
  return (typeof(ref) === 'object');
}

/**
 * Normalise path separators x-platform.
 */
function fixPathSeparator(path) {
	return path.replace(/\\/g, fs.separator).replace(/\//g, fs.separator);
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
	var filename = path.substring(nameStart);

	// remove bad chars
	[':', '\\', '/', '*', '"', '<', '>', '|' , '^', '\\0'].forEach(
	  function (v,i,a){
    	filename = filename.replace(v, '');
	  }
	)
	filename = filename.replace('?', '#'); // treat query as fragment
	return filename;
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
    // convert true/false/yes/no strings to booleans
    pair[1] = ((pair[1] === 'true') ?  true : pair[1])
    pair[1] = ((pair[1] === 'yes') ?  true : pair[1])
    pair[1] = ((pair[1] === 'false') ?  false : pair[1])
    pair[1] = ((pair[1] === 'no') ?  false : pair[1])

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
 * List all the files in a Tree of Directories
 * @param path The starting directory to look in.
 * @returns An array of all the paths to files in the given dir.
 */
function dirwalk(path) {
  var files = [];

  // inner function to recurse trough the directories
  function scanDirectory(path) {
    if (isUndefined(path)) {
      throw 'scanDirectory requires a path to walk.';
    }
    var fs = require('fs');

    // onsole.log(path);
    if (fs.exists(path) && fs.isFile(path)) {
      files.push(path);
    } else if (fs.isDirectory(path)) {
      files.push(path);
      fs.list(path).forEach(function (v,i,a) {
        if ( v !== "." && v !== ".." ) {    //< Avoid loops
          scanDirectory(path + fs.separator + v);
        }
      });
    }
  };

  scanDirectory(path);
  // onsole.log(files.length)
  return files;
};


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