;(function(ROOT, undefined) { 'use strict';

  var _defaults = {
        level: 0,
        outputLevel: true,
        outputTimestamp: false,
        outputSource: true,
        useAbsoluteSource: false,
        textStyle: 'color:black;',
        sourceStyle: false,
        nameStyle: 'color:purple',
        newLine: false
      },

      _nodeEnv = typeof exports === 'object',
      _chalk = _nodeEnv ? require('chalk') : null,
      _sep = _nodeEnv ? require('path').sep : '/',

      _levels = ['log', 'trace', 'debug', 'info', 'warn', 'error'],

      // level color - matches the colors of the left-adjacent chrome icons
      _colors = [
        'gray', // dummy
        'gray', // log
        'green', // debug
        _nodeEnv ? 'cyan' : 'blue', // info
        _nodeEnv ? 'yellow' : 'darkorange', // warn
        'red', // error
        'gray' // timestamp
      ],

      // does the log contain format specifiers?
      _formatReg = /%[ojdifsc]/,

      // allow node to use browser's %o, %f, and %i specifiers
      _browserSpecReg = /%[ofi]/g, 
      _nodeSpecReg = /%j/g,

      _slice = Array.prototype.slice, 
      _push  = Array.prototype.push;

  function _log(instance, level, args) {

    var opts = instance.options,
        ilevel = opts.level;

    if (Lo66er.off || ilevel < Lo66er.LOG || level < ilevel || ilevel > Lo66er.ERROR) {
      return;
    }

    opts._activeLevel = level;

    var format = '%s', // <name><level><timestamp><source>
        pargs = [], // final parsed args for console call
        arg0 = args[0],
        arg0isString = typeof arg0 === 'string';

    args = _slice.call(args);

    if (_nodeEnv) {

      if (arg0isString && _formatReg.test(arg0)) {
        format += args.shift().replace(_browserSpecReg, function(m, p) {
          return (m === '%o') ? '%j' : (m === '%f' || m === '%i') ? '%d' : m;
        });
      }
      pargs.unshift(format, 
        _getFormattedName(instance) +
        _getFormattedLevelAndTimestamp(level, instance) + 
        _getFormattedSource(instance));


    } else { // window

      format = 
        '%c' + // nameStyle
        '%s' + // name
        '%c' + // levelFormat
        '%s' + // level
        '%c' + // sourceStyle
        '%s' + // line
        '%c' ; // textStyle

      if (arg0isString) {
        if (_formatReg.test(arg0)) {
          format += args.shift().replace(_nodeSpecReg, '%o');
        } else {
          format += args.shift();
        }
      }

      var color = 'color:' + _colors[level] + ';',
          revertSource = false;

      if (!opts.sourceStyle) {
        opts.sourceStyle = color;
        revertSource = true;
      }

      pargs = [
        format, 
        opts.nameStyle, 
        _getFormattedName(instance), 
        opts.outputLevel ? color : '', 
        opts.outputLevel ? _getFormattedLevelAndTimestamp(level, instance) : '', 
        opts.outputSource ? opts.sourceStyle : '', 
        _getFormattedSource(instance),
        opts.textStyle
      ];

      if (revertSource) opts.sourceStyle = false;
    }

    _push.apply(pargs, args);

    // there is no native console.debug > use log instead
    console[ level === Lo66er.DEBUG ? 'log' : _levels[level] ].apply(console, pargs);
  }

  /**
   * When wrapping `console`, we loose the convenient source lines printed on the right
   * side in most browsers. The work around is to throw an error to retrieve the correct line from the stack trace,
   * and include that in our output prefix.
   */
  function _getFormattedSource(instance) {

    var opts = instance.options,
        end = (opts.newLine) ? '\n\t' : ''; 

    if (!opts.outputSource) return end;

    var err = new Error(),
        stack = ('stack' in err) ? err.stack.split('\n') : null,
        line;

    if (stack && stack.length >= 3) {

      var at = stack[4];

      if (_nodeEnv) {
        line = at.substr(at.indexOf('at')+3);

      } else {

        // Chrome 'at' === [4], Firefox|Firebug '@' === [3]
        if (at === '') {
          at = stack[3];
          if (at === '') return '';
        }

        // Firefox uses `@` symbol with no whitespace after, 
        // but stack[?].indexOf('at') seems to work just fine.
        line = at.substr(at.indexOf('at')+2);

        // Chrome uses 'at' with a space after, so shift
        if (line.charAt(0) === ' ') line = line.substr(1);

      }

      // use of parens in inconsistent accross envs...
      line = line.replace(/[()]/, '');

      if (!opts.useAbsoluteSource) {
        line = line.substr(line.lastIndexOf(_sep)+1);
      }

      if (line.charAt(0) !== '(') line = '(' + line;
      if (line.charAt(line.length-1) !== ')') line += ')';
    }
    
    if (_nodeEnv) line = _chalk[ _colors[opts._activeLevel] ]( line );

    return line + ' ' + end;
  }

  function _getFormattedName(instance) {
    var name = instance.name || '';
    return _nodeEnv ? _chalk.magenta(name) : name;
  }

  function _getFormattedLevelAndTimestamp(level, instance) {
    var lev = _levels[level].toUpperCase(),
        opts = instance.options;
    // right align level string (not worth it in browser due to icon offset)
    // if (_nodeEnv) {
      if (lev === 'INFO' || lev === 'WARN') {
        lev = ' ' + lev;
      } else if (lev === 'LOG') {
        lev = '  ' + lev;
      }
    // }
    var levelOut = _chalkify(level, ' ' + lev + ' ');
    var timestamp = opts.outputTimestamp 
      ? _chalkify(/*6*/opts._activeLevel, '[' + _getFormattedDate() + '] ') 
      : '';
    return levelOut + timestamp;
  }

  function _fmt(n) { 
    return n < 10 ? '0' + n : n; 
  }

  function _getFormattedDate() {
    var d = new Date();
    return [
      _fmt(d.getHours()),
      _fmt(d.getMinutes()),
      _fmt(d.getSeconds()),
      d.getMilliseconds()
    ].join(':');
  }

  function _chalkify(level, str) {
    return _nodeEnv ? _chalk[ _colors[level] ]( str ) : str;
  }

  /* PUBLIC API */      

  /**
   * Console logger for Nodejs and Browser environments. Supports five logging levels
   * including 0:log, 1:trace, 2:debug, 3:info, 4:warn, and 5:error. A Lo66er instance by default
   * will only log calls that are greater or equal to its current level. For example if
   * an instance is set to level 5, only errors will be logged. This level is per logger, so
   * Lo66er A's level will not effect Lo66er B.  There is, however, a global off switch available
   * through the static `Lo66er.off`, which will silence all loggers.
   *
   * ## Default options
   * These options can be configured via hash passed as second argument to the constructor,
   * or via Lo66er#options
   * ```js
   * {
   *   level: 0,
   *   outputLevel: true,
   *   outputTimestamp: false,
   *   outputSource: false,
   *   textStyle: 'color:black;',
   *   sourceStyle: 'color:gray;font-size:10px;',
   *   nameStyle: 'color:purple',
   *   newLine: false
   * }
   * ```
   *
   * Note: Lo66er has been primarily developed for use in latest Chrome Version 42.0.2311.90
   * and secondarily for Firefox 36.0.4. There are currently some kinks regarding Firefox
   * which may solved in version 40. 
   * See [this bug](https://bugzilla.mozilla.org/show_bug.cgi?id=977586)
   *
   * @param {String}        name     the name of this Lo66er instance
   * @param {Object|Number} options  [optional] Either a hash with configuration options, 
   *                                 or a number setting this instance's logging level.
   */
  function Lo66er(name, options) {
    var logger = this,
        level;

    options = options || {};

    // enable instantiation without the `new` keyword
    if (!(logger instanceof Lo66er)) {
      return new Lo66er(name, options);
    }

    logger.name = name;

    if (typeof options === 'number' || typeof options === 'string') {
      level = options;
      options = { level: level };
    }

    for (var prop in _defaults) {
      if (!options.hasOwnProperty(prop)) {
        options[prop] = _defaults[prop];
      }
    }
    logger.options = options;

    Lo66er.lo66ers.push(logger);
    return logger;
  }

  /* STATIC CLASS MEMBERS */

  /**
   * Disable logging for all Lo66ers
   * @type {Boolean}
   * @static
   */
  Lo66er.off = false;

  /**
   * References to all created Lo66ers
   * @type {Array[Lo66er]}
   * @static
   */
  Lo66er.lo66ers = [];


  /**
   * Lo66er.<LEVEL> constants to use in place of literal numbers
   * @static
   */
  _levels.forEach(function(level, i) {
    Lo66er[level.toUpperCase()] = i; 
  });

  /**
   * Get a Lo66er instance by name
   * @param  {String} name The name as passed to the Lo66er constructor
   * @return {Lo66er}      the logger instance or undefined if no match
   * @static
   */
  Lo66er.Lo66er = function(name) {
    var found;
    Lo66er.lo66ers.some(function(logger) {
      if (logger.name === name) {
        return (found = logger);
      }
    });
    return found;
  };

  /**
   * If using many Lo66ers throughout an application, it can be annoying to have
   * to keep configuring each constructor call with the same options object. Use this method
   * to override any/all of the factory defaults. These defaults can still be overridden on
   * a per-logger basis.
   * 
   * @param {Object} defaults  Object hash of Lo66er configuration properties
   * @static
   */
  Lo66er.setDefaults = function(defaults) {
    for (var prop in _defaults) {
      if (!defaults.hasOwnProperty(prop)) {
        defaults[prop] = prop;
      }
    }
    _defaults = defaults;
  };

  /**
   * Node only. Creates super basic Connect/Express request logging middlware.
   *   
   * ### Usage
   * ```js
   * var connect = require('connect');
   * var Lo66er = require('lo66er');
   * var app = connect();
   * app.use(Lo66er.createRequestLo66er('APP_REQUEST_LOGGER'));
   * ```
   * 
   * Note: the request Lo66er's default options differs as `outputSource=false`
   * 
   * @param  {String} name    [optional] the name of the request logger
   * @param  {Object} options [option] same as any Lo66er instance
   * @return {Function}       Connect middleware
   */
  Lo66er.createRequestLo66er = function(name, options) {

    var logger = new this(name, { outputSource: false });

    for (var prop in options) {
      if (options.hasOwnProperty(prop)) {
        logger.options[prop] = prop;
      }
    }

    function middleware(req, res, next) {

      var statusColor = res.statusCode < 400 ? 'green' : 'red',
          start = Date.now();

      res.on('finish', function() {

        logger.info('%s %s %s %s', 
          _chalk.yellow(req.method), 
          _chalk.white(req.path || req.url),
          _chalk[statusColor](res.statusCode),
          _chalk.cyan((Date.now() - start) + 'ms')
        );

      });

      next();
    }

    return middleware;
  };

  /* INSTANCE API */

  Lo66er.prototype.setLevel = function(level) {
    this.options.level = level;
    return this;
  };

  Lo66er.prototype.group = function() { 
    if (!arguments.length) {
      console.group();
    } else if (arguments.length === 1) {
      console.group(arguments[0]);
    } else {
      console.group.apply(console, _slice.call(arguments, 0));
    }
    return this;
  };

  Lo66er.prototype.groupEnd = function() { 
    console.groupEnd(); 
    return this;
  };

  Lo66er.prototype.log   = function() { _log(this, 0, arguments); return this; };
  Lo66er.prototype.trace = function() { _log(this, 1, arguments); return this; };
  Lo66er.prototype.debug = function() { _log(this, 2, arguments); return this; };
  Lo66er.prototype.info  = function() { _log(this, 3, arguments); return this; };
  Lo66er.prototype.warn  = function() { _log(this, 4, arguments); return this; };
  Lo66er.prototype.error = function() { _log(this, 5, arguments); return this; };  
  
  /* UNIVERSAL MODULE DEFINITION */

  (function(factory) {
    if (typeof define === 'function' && define.amd)
      define('Lo66er', [], function() { return (ROOT.returnExportsGlobal = factory()); });
    else if (typeof exports === 'object') module.exports = factory();
    else ROOT.Lo66er = factory();
  })(function() { return Lo66er; });

})(this);