(function () {
var table = (function () {
  'use strict';

  var global = tinymce.util.Tools.resolve('tinymce.PluginManager');

  var noop = function () {
    var x = [];
    for (var _i = 0; _i < arguments.length; _i++) {
      x[_i] = arguments[_i];
    }
  };

  var compose = function (fa, fb) {
    return function () {
      var x = [];
      for (var _i = 0; _i < arguments.length; _i++) {
        x[_i] = arguments[_i];
      }
      return fa(fb.apply(null, arguments));
    };
  };
  var constant = function (value) {
    return function () {
      return value;
    };
  };
  var identity = function (x) {
    return x;
  };

  var curry = function (f) {
    var x = [];
    for (var _i = 1; _i < arguments.length; _i++) {
      x[_i - 1] = arguments[_i];
    }
    var args = new Array(arguments.length - 1);
    for (var i = 1; i < arguments.length; i++)
      args[i - 1] = arguments[i];
    return function () {
      var x = [];
      for (var _i = 0; _i < arguments.length; _i++) {
        x[_i] = arguments[_i];
      }
      var newArgs = new Array(arguments.length);
      for (var j = 0; j < newArgs.length; j++)
        newArgs[j] = arguments[j];
      var all = args.concat(newArgs);
      return f.apply(null, all);
    };
  };
  var not = function (f) {
    return function () {
      var x = [];
      for (var _i = 0; _i < arguments.length; _i++) {
        x[_i] = arguments[_i];
      }
      return !f.apply(null, arguments);
    };
  };
  var die = function (msg) {
    return function () {
      throw new Error(msg);
    };
  };
  var apply = function (f) {
    return f();
  };

  var never = constant(false);
  var always = constant(true);

  var never$1 = never;
  var always$1 = always;
  var none = function () {
    return NONE;
  };
  var NONE = function () {
    var eq = function (o) {
      return o.isNone();
    };
    var call$$1 = function (thunk) {
      return thunk();
    };
    var id = function (n) {
      return n;
    };
    var noop$$1 = function () {
    };
    var nul = function () {
      return null;
    };
    var undef = function () {
      return undefined;
    };
    var me = {
      fold: function (n, s) {
        return n();
      },
      is: never$1,
      isSome: never$1,
      isNone: always$1,
      getOr: id,
      getOrThunk: call$$1,
      getOrDie: function (msg) {
        throw new Error(msg || 'error: getOrDie called on none.');
      },
      getOrNull: nul,
      getOrUndefined: undef,
      or: id,
      orThunk: call$$1,
      map: none,
      ap: none,
      each: noop$$1,
      bind: none,
      flatten: none,
      exists: never$1,
      forall: always$1,
      filter: none,
      equals: eq,
      equals_: eq,
      toArray: function () {
        return [];
      },
      toString: constant('none()')
    };
    if (Object.freeze)
      Object.freeze(me);
    return me;
  }();
  var some = function (a) {
    var constant_a = function () {
      return a;
    };
    var self = function () {
      return me;
    };
    var map = function (f) {
      return some(f(a));
    };
    var bind = function (f) {
      return f(a);
    };
    var me = {
      fold: function (n, s) {
        return s(a);
      },
      is: function (v) {
        return a === v;
      },
      isSome: always$1,
      isNone: never$1,
      getOr: constant_a,
      getOrThunk: constant_a,
      getOrDie: constant_a,
      getOrNull: constant_a,
      getOrUndefined: constant_a,
      or: self,
      orThunk: self,
      map: map,
      ap: function (optfab) {
        return optfab.fold(none, function (fab) {
          return some(fab(a));
        });
      },
      each: function (f) {
        f(a);
      },
      bind: bind,
      flatten: constant_a,
      exists: bind,
      forall: bind,
      filter: function (f) {
        return f(a) ? me : NONE;
      },
      equals: function (o) {
        return o.is(a);
      },
      equals_: function (o, elementEq) {
        return o.fold(never$1, function (b) {
          return elementEq(a, b);
        });
      },
      toArray: function () {
        return [a];
      },
      toString: function () {
        return 'some(' + a + ')';
      }
    };
    return me;
  };
  var from = function (value) {
    return value === null || value === undefined ? NONE : some(value);
  };
  var Option = {
    some: some,
    none: none,
    from: from
  };

  var typeOf = function (x) {
    if (x === null)
      return 'null';
    var t = typeof x;
    if (t === 'object' && Array.prototype.isPrototypeOf(x))
      return 'array';
    if (t === 'object' && String.prototype.isPrototypeOf(x))
      return 'string';
    return t;
  };
  var isType = function (type) {
    return function (value) {
      return typeOf(value) === type;
    };
  };
  var isString = isType('string');

  var isArray = isType('array');

  var isBoolean = isType('boolean');

  var isFunction = isType('function');
  var isNumber = isType('number');

  var rawIndexOf = function () {
    var pIndexOf = Array.prototype.indexOf;
    var fastIndex = function (xs, x) {
      return pIndexOf.call(xs, x);
    };
    var slowIndex = function (xs, x) {
      return slowIndexOf(xs, x);
    };
    return pIndexOf === undefined ? slowIndex : fastIndex;
  }();

  var contains = function (xs, x) {
    return rawIndexOf(xs, x) > -1;
  };
  var exists = function (xs, pred) {
    return findIndex(xs, pred).isSome();
  };


  var map = function (xs, f) {
    var len = xs.length;
    var r = new Array(len);
    for (var i = 0; i < len; i++) {
      var x = xs[i];
      r[i] = f(x, i, xs);
    }
    return r;
  };
  var each = function (xs, f) {
    for (var i = 0, len = xs.length; i < len; i++) {
      var x = xs[i];
      f(x, i, xs);
    }
  };
  var eachr = function (xs, f) {
    for (var i = xs.length - 1; i >= 0; i--) {
      var x = xs[i];
      f(x, i, xs);
    }
  };

  var filter = function (xs, pred) {
    var r = [];
    for (var i = 0, len = xs.length; i < len; i++) {
      var x = xs[i];
      if (pred(x, i, xs)) {
        r.push(x);
      }
    }
    return r;
  };

  var foldr = function (xs, f, acc) {
    eachr(xs, function (x) {
      acc = f(acc, x);
    });
    return acc;
  };
  var foldl = function (xs, f, acc) {
    each(xs, function (x) {
      acc = f(acc, x);
    });
    return acc;
  };
  var find = function (xs, pred) {
    for (var i = 0, len = xs.length; i < len; i++) {
      var x = xs[i];
      if (pred(x, i, xs)) {
        return Option.some(x);
      }
    }
    return Option.none();
  };
  var findIndex = function (xs, pred) {
    for (var i = 0, len = xs.length; i < len; i++) {
      var x = xs[i];
      if (pred(x, i, xs)) {
        return Option.some(i);
      }
    }
    return Option.none();
  };
  var slowIndexOf = function (xs, x) {
    for (var i = 0, len = xs.length; i < len; ++i) {
      if (xs[i] === x) {
        return i;
      }
    }
    return -1;
  };
  var push = Array.prototype.push;
  var flatten = function (xs) {
    var r = [];
    for (var i = 0, len = xs.length; i < len; ++i) {
      if (!Array.prototype.isPrototypeOf(xs[i]))
        throw new Error('Arr.flatten item ' + i + ' was not an array, input: ' + xs);
      push.apply(r, xs[i]);
    }
    return r;
  };
  var bind = function (xs, f) {
    var output = map(xs, f);
    return flatten(output);
  };
  var forall = function (xs, pred) {
    for (var i = 0, len = xs.length; i < len; ++i) {
      var x = xs[i];
      if (pred(x, i, xs) !== true) {
        return false;
      }
    }
    return true;
  };

  var slice = Array.prototype.slice;
  var reverse = function (xs) {
    var r = slice.call(xs, 0);
    r.reverse();
    return r;
  };





  var last = function (xs) {
    return xs.length === 0 ? Option.none() : Option.some(xs[xs.length - 1]);
  };
  var from$1 = isFunction(Array.from) ? Array.from : function (x) {
    return slice.call(x);
  };

  var keys = Object.keys;

  var each$1 = function (obj, f) {
    var props = keys(obj);
    for (var k = 0, len = props.length; k < len; k++) {
      var i = props[k];
      var x = obj[i];
      f(x, i, obj);
    }
  };
  var map$1 = function (obj, f) {
    return tupleMap(obj, function (x, i, obj) {
      return {
        k: i,
        v: f(x, i, obj)
      };
    });
  };
  var tupleMap = function (obj, f) {
    var r = {};
    each$1(obj, function (x, i) {
      var tuple = f(x, i, obj);
      r[tuple.k] = tuple.v;
    });
    return r;
  };

  var Immutable = function () {
    var fields = [];
    for (var _i = 0; _i < arguments.length; _i++) {
      fields[_i] = arguments[_i];
    }
    return function () {
      var values = [];
      for (var _i = 0; _i < arguments.length; _i++) {
        values[_i] = arguments[_i];
      }
      if (fields.length !== values.length) {
        throw new Error('Wrong number of arguments to struct. Expected "[' + fields.length + ']", got ' + values.length + ' arguments');
      }
      var struct = {};
      each(fields, function (name, i) {
        struct[name] = constant(values[i]);
      });
      return struct;
    };
  };

  var sort$1 = function (arr) {
    return arr.slice(0).sort();
  };
  var reqMessage = function (required, keys) {
    throw new Error('All required keys (' + sort$1(required).join(', ') + ') were not specified. Specified keys were: ' + sort$1(keys).join(', ') + '.');
  };
  var unsuppMessage = function (unsupported) {
    throw new Error('Unsupported keys for object: ' + sort$1(unsupported).join(', '));
  };
  var validateStrArr = function (label, array) {
    if (!isArray(array))
      throw new Error('The ' + label + ' fields must be an array. Was: ' + array + '.');
    each(array, function (a) {
      if (!isString(a))
        throw new Error('The value ' + a + ' in the ' + label + ' fields was not a string.');
    });
  };
  var invalidTypeMessage = function (incorrect, type) {
    throw new Error('All values need to be of type: ' + type + '. Keys (' + sort$1(incorrect).join(', ') + ') were not.');
  };
  var checkDupes = function (everything) {
    var sorted = sort$1(everything);
    var dupe = find(sorted, function (s, i) {
      return i < sorted.length - 1 && s === sorted[i + 1];
    });
    dupe.each(function (d) {
      throw new Error('The field: ' + d + ' occurs more than once in the combined fields: [' + sorted.join(', ') + '].');
    });
  };

  var MixedBag = function (required, optional) {
    var everything = required.concat(optional);
    if (everything.length === 0)
      throw new Error('You must specify at least one required or optional field.');
    validateStrArr('required', required);
    validateStrArr('optional', optional);
    checkDupes(everything);
    return function (obj) {
      var keys$$1 = keys(obj);
      var allReqd = forall(required, function (req) {
        return contains(keys$$1, req);
      });
      if (!allReqd)
        reqMessage(required, keys$$1);
      var unsupported = filter(keys$$1, function (key) {
        return !contains(everything, key);
      });
      if (unsupported.length > 0)
        unsuppMessage(unsupported);
      var r = {};
      each(required, function (req) {
        r[req] = constant(obj[req]);
      });
      each(optional, function (opt) {
        r[opt] = constant(Object.prototype.hasOwnProperty.call(obj, opt) ? Option.some(obj[opt]) : Option.none());
      });
      return r;
    };
  };

  var dimensions = Immutable('width', 'height');
  var grid = Immutable('rows', 'columns');
  var address = Immutable('row', 'column');
  var coords = Immutable('x', 'y');
  var detail = Immutable('element', 'rowspan', 'colspan');
  var detailnew = Immutable('element', 'rowspan', 'colspan', 'isNew');
  var extended = Immutable('element', 'rowspan', 'colspan', 'row', 'column');
  var rowdata = Immutable('element', 'cells', 'section');
  var elementnew = Immutable('element', 'isNew');
  var rowdatanew = Immutable('element', 'cells', 'section', 'isNew');
  var rowcells = Immutable('cells', 'section');
  var rowdetails = Immutable('details', 'section');
  var bounds = Immutable('startRow', 'startCol', 'finishRow', 'finishCol');
  var $_dbc0gblbjn69h2qy = {
    dimensions: dimensions,
    grid: grid,
    address: address,
    coords: coords,
    extended: extended,
    detail: detail,
    detailnew: detailnew,
    rowdata: rowdata,
    elementnew: elementnew,
    rowdatanew: rowdatanew,
    rowcells: rowcells,
    rowdetails: rowdetails,
    bounds: bounds
  };

  var fromHtml = function (html, scope) {
    var doc = scope || document;
    var div = doc.createElement('div');
    div.innerHTML = html;
    if (!div.hasChildNodes() || div.childNodes.length > 1) {
      console.error('HTML does not have a single root node', html);
      throw 'HTML must have a single root node';
    }
    return fromDom(div.childNodes[0]);
  };
  var fromTag = function (tag, scope) {
    var doc = scope || document;
    var node = doc.createElement(tag);
    return fromDom(node);
  };
  var fromText = function (text, scope) {
    var doc = scope || document;
    var node = doc.createTextNode(text);
    return fromDom(node);
  };
  var fromDom = function (node) {
    if (node === null || node === undefined)
      throw new Error('Node cannot be null or undefined');
    return { dom: constant(node) };
  };
  var fromPoint = function (docElm, x, y) {
    var doc = docElm.dom();
    return Option.from(doc.elementFromPoint(x, y)).map(fromDom);
  };
  var Element$$1 = {
    fromHtml: fromHtml,
    fromTag: fromTag,
    fromText: fromText,
    fromDom: fromDom,
    fromPoint: fromPoint
  };

  var $_b0rko3lhjn69h2tc = {
    ATTRIBUTE: Node.ATTRIBUTE_NODE,
    CDATA_SECTION: Node.CDATA_SECTION_NODE,
    COMMENT: Node.COMMENT_NODE,
    DOCUMENT: Node.DOCUMENT_NODE,
    DOCUMENT_TYPE: Node.DOCUMENT_TYPE_NODE,
    DOCUMENT_FRAGMENT: Node.DOCUMENT_FRAGMENT_NODE,
    ELEMENT: Node.ELEMENT_NODE,
    TEXT: Node.TEXT_NODE,
    PROCESSING_INSTRUCTION: Node.PROCESSING_INSTRUCTION_NODE,
    ENTITY_REFERENCE: Node.ENTITY_REFERENCE_NODE,
    ENTITY: Node.ENTITY_NODE,
    NOTATION: Node.NOTATION_NODE
  };

  var ELEMENT = $_b0rko3lhjn69h2tc.ELEMENT;
  var DOCUMENT = $_b0rko3lhjn69h2tc.DOCUMENT;
  var is = function (element, selector) {
    var elem = element.dom();
    if (elem.nodeType !== ELEMENT)
      return false;
    else if (elem.matches !== undefined)
      return elem.matches(selector);
    else if (elem.msMatchesSelector !== undefined)
      return elem.msMatchesSelector(selector);
    else if (elem.webkitMatchesSelector !== undefined)
      return elem.webkitMatchesSelector(selector);
    else if (elem.mozMatchesSelector !== undefined)
      return elem.mozMatchesSelector(selector);
    else
      throw new Error('Browser lacks native selectors');
  };
  var bypassSelector = function (dom) {
    return dom.nodeType !== ELEMENT && dom.nodeType !== DOCUMENT || dom.childElementCount === 0;
  };
  var all = function (selector, scope) {
    var base = scope === undefined ? document : scope.dom();
    return bypassSelector(base) ? [] : map(base.querySelectorAll(selector), Element$$1.fromDom);
  };
  var one = function (selector, scope) {
    var base = scope === undefined ? document : scope.dom();
    return bypassSelector(base) ? Option.none() : Option.from(base.querySelector(selector)).map(Element$$1.fromDom);
  };
  var $_ez7xfelejn69h2sh = {
    all: all,
    is: is,
    one: one
  };

  var toArray = function (target, f) {
    var r = [];
    var recurse = function (e) {
      r.push(e);
      return f(e);
    };
    var cur = f(target);
    do {
      cur = cur.bind(recurse);
    } while (cur.isSome());
    return r;
  };
  var $_a3pskhljjn69h2u8 = { toArray: toArray };

  var Global = typeof window !== 'undefined' ? window : Function('return this;')();

  var path = function (parts, scope) {
    var o = scope !== undefined && scope !== null ? scope : Global;
    for (var i = 0; i < parts.length && o !== undefined && o !== null; ++i)
      o = o[parts[i]];
    return o;
  };
  var resolve = function (p, scope) {
    var parts = p.split('.');
    return path(parts, scope);
  };

  var unsafe = function (name, scope) {
    return resolve(name, scope);
  };
  var getOrDie = function (name, scope) {
    var actual = unsafe(name, scope);
    if (actual === undefined || actual === null)
      throw name + ' not available on this browser';
    return actual;
  };
  var $_82yq6almjn69h2un = { getOrDie: getOrDie };

  var node = function () {
    var f = $_82yq6almjn69h2un.getOrDie('Node');
    return f;
  };
  var compareDocumentPosition = function (a, b, match) {
    return (a.compareDocumentPosition(b) & match) !== 0;
  };
  var documentPositionPreceding = function (a, b) {
    return compareDocumentPosition(a, b, node().DOCUMENT_POSITION_PRECEDING);
  };
  var documentPositionContainedBy = function (a, b) {
    return compareDocumentPosition(a, b, node().DOCUMENT_POSITION_CONTAINED_BY);
  };
  var $_bdmyg3lljn69h2un = {
    documentPositionPreceding: documentPositionPreceding,
    documentPositionContainedBy: documentPositionContainedBy
  };

  var cached = function (f) {
    var called = false;
    var r;
    return function () {
      var args = [];
      for (var _i = 0; _i < arguments.length; _i++) {
        args[_i] = arguments[_i];
      }
      if (!called) {
        called = true;
        r = f.apply(null, args);
      }
      return r;
    };
  };

  var firstMatch = function (regexes, s) {
    for (var i = 0; i < regexes.length; i++) {
      var x = regexes[i];
      if (x.test(s))
        return x;
    }
    return undefined;
  };
  var find$2 = function (regexes, agent) {
    var r = firstMatch(regexes, agent);
    if (!r)
      return {
        major: 0,
        minor: 0
      };
    var group = function (i) {
      return Number(agent.replace(r, '$' + i));
    };
    return nu(group(1), group(2));
  };
  var detect = function (versionRegexes, agent) {
    var cleanedAgent = String(agent).toLowerCase();
    if (versionRegexes.length === 0)
      return unknown();
    return find$2(versionRegexes, cleanedAgent);
  };
  var unknown = function () {
    return nu(0, 0);
  };
  var nu = function (major, minor) {
    return {
      major: major,
      minor: minor
    };
  };
  var $_eqry3rltjn69h2vq = {
    nu: nu,
    detect: detect,
    unknown: unknown
  };

  var edge = 'Edge';
  var chrome = 'Chrome';
  var ie = 'IE';
  var opera = 'Opera';
  var firefox = 'Firefox';
  var safari = 'Safari';
  var isBrowser = function (name, current) {
    return function () {
      return current === name;
    };
  };
  var unknown$1 = function () {
    return nu$1({
      current: undefined,
      version: $_eqry3rltjn69h2vq.unknown()
    });
  };
  var nu$1 = function (info) {
    var current = info.current;
    var version = info.version;
    return {
      current: current,
      version: version,
      isEdge: isBrowser(edge, current),
      isChrome: isBrowser(chrome, current),
      isIE: isBrowser(ie, current),
      isOpera: isBrowser(opera, current),
      isFirefox: isBrowser(firefox, current),
      isSafari: isBrowser(safari, current)
    };
  };
  var $_16dzpqlsjn69h2vj = {
    unknown: unknown$1,
    nu: nu$1,
    edge: constant(edge),
    chrome: constant(chrome),
    ie: constant(ie),
    opera: constant(opera),
    firefox: constant(firefox),
    safari: constant(safari)
  };

  var windows = 'Windows';
  var ios = 'iOS';
  var android = 'Android';
  var linux = 'Linux';
  var osx = 'OSX';
  var solaris = 'Solaris';
  var freebsd = 'FreeBSD';
  var isOS = function (name, current) {
    return function () {
      return current === name;
    };
  };
  var unknown$2 = function () {
    return nu$2({
      current: undefined,
      version: $_eqry3rltjn69h2vq.unknown()
    });
  };
  var nu$2 = function (info) {
    var current = info.current;
    var version = info.version;
    return {
      current: current,
      version: version,
      isWindows: isOS(windows, current),
      isiOS: isOS(ios, current),
      isAndroid: isOS(android, current),
      isOSX: isOS(osx, current),
      isLinux: isOS(linux, current),
      isSolaris: isOS(solaris, current),
      isFreeBSD: isOS(freebsd, current)
    };
  };
  var $_f4vg9glujn69h2vs = {
    unknown: unknown$2,
    nu: nu$2,
    windows: constant(windows),
    ios: constant(ios),
    android: constant(android),
    linux: constant(linux),
    osx: constant(osx),
    solaris: constant(solaris),
    freebsd: constant(freebsd)
  };

  function DeviceType (os, browser, userAgent) {
    var isiPad = os.isiOS() && /ipad/i.test(userAgent) === true;
    var isiPhone = os.isiOS() && !isiPad;
    var isAndroid3 = os.isAndroid() && os.version.major === 3;
    var isAndroid4 = os.isAndroid() && os.version.major === 4;
    var isTablet = isiPad || isAndroid3 || isAndroid4 && /mobile/i.test(userAgent) === true;
    var isTouch = os.isiOS() || os.isAndroid();
    var isPhone = isTouch && !isTablet;
    var iOSwebview = browser.isSafari() && os.isiOS() && /safari/i.test(userAgent) === false;
    return {
      isiPad: constant(isiPad),
      isiPhone: constant(isiPhone),
      isTablet: constant(isTablet),
      isPhone: constant(isPhone),
      isTouch: constant(isTouch),
      isAndroid: os.isAndroid,
      isiOS: os.isiOS,
      isWebView: constant(iOSwebview)
    };
  }

  var detect$1 = function (candidates, userAgent) {
    var agent = String(userAgent).toLowerCase();
    return find(candidates, function (candidate) {
      return candidate.search(agent);
    });
  };
  var detectBrowser = function (browsers, userAgent) {
    return detect$1(browsers, userAgent).map(function (browser) {
      var version = $_eqry3rltjn69h2vq.detect(browser.versionRegexes, userAgent);
      return {
        current: browser.name,
        version: version
      };
    });
  };
  var detectOs = function (oses, userAgent) {
    return detect$1(oses, userAgent).map(function (os) {
      var version = $_eqry3rltjn69h2vq.detect(os.versionRegexes, userAgent);
      return {
        current: os.name,
        version: version
      };
    });
  };
  var $_2it0iklwjn69h2w4 = {
    detectBrowser: detectBrowser,
    detectOs: detectOs
  };

  var checkRange = function (str, substr, start) {
    if (substr === '')
      return true;
    if (str.length < substr.length)
      return false;
    var x = str.substr(start, start + substr.length);
    return x === substr;
  };





  var contains$1 = function (str, substr) {
    return str.indexOf(substr) !== -1;
  };


  var endsWith = function (str, suffix) {
    return checkRange(str, suffix, str.length - suffix.length);
  };
  var trim = function (str) {
    return str.replace(/^\s+|\s+$/g, '');
  };

  var normalVersionRegex = /.*?version\/\ ?([0-9]+)\.([0-9]+).*/;
  var checkContains = function (target) {
    return function (uastring) {
      return contains$1(uastring, target);
    };
  };
  var browsers = [
    {
      name: 'Edge',
      versionRegexes: [/.*?edge\/ ?([0-9]+)\.([0-9]+)$/],
      search: function (uastring) {
        var monstrosity = contains$1(uastring, 'edge/') && contains$1(uastring, 'chrome') && contains$1(uastring, 'safari') && contains$1(uastring, 'applewebkit');
        return monstrosity;
      }
    },
    {
      name: 'Chrome',
      versionRegexes: [
        /.*?chrome\/([0-9]+)\.([0-9]+).*/,
        normalVersionRegex
      ],
      search: function (uastring) {
        return contains$1(uastring, 'chrome') && !contains$1(uastring, 'chromeframe');
      }
    },
    {
      name: 'IE',
      versionRegexes: [
        /.*?msie\ ?([0-9]+)\.([0-9]+).*/,
        /.*?rv:([0-9]+)\.([0-9]+).*/
      ],
      search: function (uastring) {
        return contains$1(uastring, 'msie') || contains$1(uastring, 'trident');
      }
    },
    {
      name: 'Opera',
      versionRegexes: [
        normalVersionRegex,
        /.*?opera\/([0-9]+)\.([0-9]+).*/
      ],
      search: checkContains('opera')
    },
    {
      name: 'Firefox',
      versionRegexes: [/.*?firefox\/\ ?([0-9]+)\.([0-9]+).*/],
      search: checkContains('firefox')
    },
    {
      name: 'Safari',
      versionRegexes: [
        normalVersionRegex,
        /.*?cpu os ([0-9]+)_([0-9]+).*/
      ],
      search: function (uastring) {
        return (contains$1(uastring, 'safari') || contains$1(uastring, 'mobile/')) && contains$1(uastring, 'applewebkit');
      }
    }
  ];
  var oses = [
    {
      name: 'Windows',
      search: checkContains('win'),
      versionRegexes: [/.*?windows\ nt\ ?([0-9]+)\.([0-9]+).*/]
    },
    {
      name: 'iOS',
      search: function (uastring) {
        return contains$1(uastring, 'iphone') || contains$1(uastring, 'ipad');
      },
      versionRegexes: [
        /.*?version\/\ ?([0-9]+)\.([0-9]+).*/,
        /.*cpu os ([0-9]+)_([0-9]+).*/,
        /.*cpu iphone os ([0-9]+)_([0-9]+).*/
      ]
    },
    {
      name: 'Android',
      search: checkContains('android'),
      versionRegexes: [/.*?android\ ?([0-9]+)\.([0-9]+).*/]
    },
    {
      name: 'OSX',
      search: checkContains('os x'),
      versionRegexes: [/.*?os\ x\ ?([0-9]+)_([0-9]+).*/]
    },
    {
      name: 'Linux',
      search: checkContains('linux'),
      versionRegexes: []
    },
    {
      name: 'Solaris',
      search: checkContains('sunos'),
      versionRegexes: []
    },
    {
      name: 'FreeBSD',
      search: checkContains('freebsd'),
      versionRegexes: []
    }
  ];
  var $_epnz1hlxjn69h2wa = {
    browsers: constant(browsers),
    oses: constant(oses)
  };

  var detect$2 = function (userAgent) {
    var browsers = $_epnz1hlxjn69h2wa.browsers();
    var oses = $_epnz1hlxjn69h2wa.oses();
    var browser = $_2it0iklwjn69h2w4.detectBrowser(browsers, userAgent).fold($_16dzpqlsjn69h2vj.unknown, $_16dzpqlsjn69h2vj.nu);
    var os = $_2it0iklwjn69h2w4.detectOs(oses, userAgent).fold($_f4vg9glujn69h2vs.unknown, $_f4vg9glujn69h2vs.nu);
    var deviceType = DeviceType(os, browser, userAgent);
    return {
      browser: browser,
      os: os,
      deviceType: deviceType
    };
  };
  var $_9koetdlrjn69h2v3 = { detect: detect$2 };

  var detect$3 = cached(function () {
    var userAgent = navigator.userAgent;
    return $_9koetdlrjn69h2v3.detect(userAgent);
  });
  var $_k0fj2lpjn69h2v3 = { detect: detect$3 };

  var eq = function (e1, e2) {
    return e1.dom() === e2.dom();
  };
  var isEqualNode = function (e1, e2) {
    return e1.dom().isEqualNode(e2.dom());
  };
  var member = function (element, elements) {
    return exists(elements, curry(eq, element));
  };
  var regularContains = function (e1, e2) {
    var d1 = e1.dom(), d2 = e2.dom();
    return d1 === d2 ? false : d1.contains(d2);
  };
  var ieContains = function (e1, e2) {
    return $_bdmyg3lljn69h2un.documentPositionContainedBy(e1.dom(), e2.dom());
  };
  var browser = $_k0fj2lpjn69h2v3.detect().browser;
  var contains$2 = browser.isIE() ? ieContains : regularContains;
  var $_bakwgmlkjn69h2u8 = {
    eq: eq,
    isEqualNode: isEqualNode,
    member: member,
    contains: contains$2,
    is: $_ez7xfelejn69h2sh.is
  };

  var owner = function (element) {
    return Element$$1.fromDom(element.dom().ownerDocument);
  };
  var documentElement = function (element) {
    return Element$$1.fromDom(element.dom().ownerDocument.documentElement);
  };
  var defaultView = function (element) {
    var el = element.dom();
    var defaultView = el.ownerDocument.defaultView;
    return Element$$1.fromDom(defaultView);
  };
  var parent = function (element) {
    var dom = element.dom();
    return Option.from(dom.parentNode).map(Element$$1.fromDom);
  };
  var findIndex$1 = function (element) {
    return parent(element).bind(function (p) {
      var kin = children(p);
      return findIndex(kin, function (elem) {
        return $_bakwgmlkjn69h2u8.eq(element, elem);
      });
    });
  };
  var parents = function (element, isRoot) {
    var stop = isFunction(isRoot) ? isRoot : constant(false);
    var dom = element.dom();
    var ret = [];
    while (dom.parentNode !== null && dom.parentNode !== undefined) {
      var rawParent = dom.parentNode;
      var parent = Element$$1.fromDom(rawParent);
      ret.push(parent);
      if (stop(parent) === true)
        break;
      else
        dom = rawParent;
    }
    return ret;
  };
  var siblings = function (element) {
    var filterSelf = function (elements) {
      return filter(elements, function (x) {
        return !$_bakwgmlkjn69h2u8.eq(element, x);
      });
    };
    return parent(element).map(children).map(filterSelf).getOr([]);
  };
  var offsetParent = function (element) {
    var dom = element.dom();
    return Option.from(dom.offsetParent).map(Element$$1.fromDom);
  };
  var prevSibling = function (element) {
    var dom = element.dom();
    return Option.from(dom.previousSibling).map(Element$$1.fromDom);
  };
  var nextSibling = function (element) {
    var dom = element.dom();
    return Option.from(dom.nextSibling).map(Element$$1.fromDom);
  };
  var prevSiblings = function (element) {
    return reverse($_a3pskhljjn69h2u8.toArray(element, prevSibling));
  };
  var nextSiblings = function (element) {
    return $_a3pskhljjn69h2u8.toArray(element, nextSibling);
  };
  var children = function (element) {
    var dom = element.dom();
    return map(dom.childNodes, Element$$1.fromDom);
  };
  var child = function (element, index) {
    var children = element.dom().childNodes;
    return Option.from(children[index]).map(Element$$1.fromDom);
  };
  var firstChild = function (element) {
    return child(element, 0);
  };
  var lastChild = function (element) {
    return child(element, element.dom().childNodes.length - 1);
  };
  var childNodesCount = function (element) {
    return element.dom().childNodes.length;
  };
  var hasChildNodes = function (element) {
    return element.dom().hasChildNodes();
  };
  var spot = Immutable('element', 'offset');
  var leaf = function (element, offset) {
    var cs = children(element);
    return cs.length > 0 && offset < cs.length ? spot(cs[offset], 0) : spot(element, offset);
  };
  var $_g3g38plijn69h2tc = {
    owner: owner,
    defaultView: defaultView,
    documentElement: documentElement,
    parent: parent,
    findIndex: findIndex$1,
    parents: parents,
    siblings: siblings,
    prevSibling: prevSibling,
    offsetParent: offsetParent,
    prevSiblings: prevSiblings,
    nextSibling: nextSibling,
    nextSiblings: nextSiblings,
    children: children,
    child: child,
    firstChild: firstChild,
    lastChild: lastChild,
    childNodesCount: childNodesCount,
    hasChildNodes: hasChildNodes,
    leaf: leaf
  };

  var firstLayer = function (scope, selector) {
    return filterFirstLayer(scope, selector, constant(true));
  };
  var filterFirstLayer = function (scope, selector, predicate) {
    return bind($_g3g38plijn69h2tc.children(scope), function (x) {
      return $_ez7xfelejn69h2sh.is(x, selector) ? predicate(x) ? [x] : [] : filterFirstLayer(x, selector, predicate);
    });
  };
  var $_4fjp11ldjn69h2s4 = {
    firstLayer: firstLayer,
    filterFirstLayer: filterFirstLayer
  };

  var name = function (element) {
    var r = element.dom().nodeName;
    return r.toLowerCase();
  };
  var type = function (element) {
    return element.dom().nodeType;
  };
  var value = function (element) {
    return element.dom().nodeValue;
  };
  var isType$1 = function (t) {
    return function (element) {
      return type(element) === t;
    };
  };
  var isComment = function (element) {
    return type(element) === $_b0rko3lhjn69h2tc.COMMENT || name(element) === '#comment';
  };
  var isElement = isType$1($_b0rko3lhjn69h2tc.ELEMENT);
  var isText = isType$1($_b0rko3lhjn69h2tc.TEXT);
  var isDocument = isType$1($_b0rko3lhjn69h2tc.DOCUMENT);
  var $_5f9i72m2jn69h2wv = {
    name: name,
    type: type,
    value: value,
    isElement: isElement,
    isText: isText,
    isDocument: isDocument,
    isComment: isComment
  };

  var rawSet = function (dom, key, value) {
    if (isString(value) || isBoolean(value) || isNumber(value)) {
      dom.setAttribute(key, value + '');
    } else {
      console.error('Invalid call to Attr.set. Key ', key, ':: Value ', value, ':: Element ', dom);
      throw new Error('Attribute value was not simple');
    }
  };
  var set = function (element, key, value) {
    rawSet(element.dom(), key, value);
  };
  var setAll = function (element, attrs) {
    var dom = element.dom();
    each$1(attrs, function (v, k) {
      rawSet(dom, k, v);
    });
  };
  var get$1 = function (element, key) {
    var v = element.dom().getAttribute(key);
    return v === null ? undefined : v;
  };
  var has$1 = function (element, key) {
    var dom = element.dom();
    return dom && dom.hasAttribute ? dom.hasAttribute(key) : false;
  };
  var remove = function (element, key) {
    element.dom().removeAttribute(key);
  };
  var hasNone = function (element) {
    var attrs = element.dom().attributes;
    return attrs === undefined || attrs === null || attrs.length === 0;
  };
  var clone = function (element) {
    return foldl(element.dom().attributes, function (acc, attr) {
      acc[attr.name] = attr.value;
      return acc;
    }, {});
  };
  var transferOne = function (source, destination, attr) {
    if (has$1(source, attr) && !has$1(destination, attr))
      set(destination, attr, get$1(source, attr));
  };
  var transfer = function (source, destination, attrs) {
    if (!$_5f9i72m2jn69h2wv.isElement(source) || !$_5f9i72m2jn69h2wv.isElement(destination))
      return;
    each(attrs, function (attr) {
      transferOne(source, destination, attr);
    });
  };
  var $_567jlzm1jn69h2wf = {
    clone: clone,
    set: set,
    setAll: setAll,
    get: get$1,
    has: has$1,
    remove: remove,
    hasNone: hasNone,
    transfer: transfer
  };

  var inBody = function (element) {
    var dom = $_5f9i72m2jn69h2wv.isText(element) ? element.dom().parentNode : element.dom();
    return dom !== undefined && dom !== null && dom.ownerDocument.body.contains(dom);
  };
  var body = cached(function () {
    return getBody(Element$$1.fromDom(document));
  });
  var getBody = function (doc) {
    var body = doc.dom().body;
    if (body === null || body === undefined)
      throw 'Body is not available yet';
    return Element$$1.fromDom(body);
  };
  var $_f5xfqwm5jn69h2xa = {
    body: body,
    getBody: getBody,
    inBody: inBody
  };

  var all$1 = function (predicate) {
    return descendants($_f5xfqwm5jn69h2xa.body(), predicate);
  };
  var ancestors = function (scope, predicate, isRoot) {
    return filter($_g3g38plijn69h2tc.parents(scope, isRoot), predicate);
  };
  var siblings$1 = function (scope, predicate) {
    return filter($_g3g38plijn69h2tc.siblings(scope), predicate);
  };
  var children$1 = function (scope, predicate) {
    return filter($_g3g38plijn69h2tc.children(scope), predicate);
  };
  var descendants = function (scope, predicate) {
    var result = [];
    each($_g3g38plijn69h2tc.children(scope), function (x) {
      if (predicate(x)) {
        result = result.concat([x]);
      }
      result = result.concat(descendants(x, predicate));
    });
    return result;
  };
  var $_4iaj27m4jn69h2xa = {
    all: all$1,
    ancestors: ancestors,
    siblings: siblings$1,
    children: children$1,
    descendants: descendants
  };

  var all$2 = function (selector) {
    return $_ez7xfelejn69h2sh.all(selector);
  };
  var ancestors$1 = function (scope, selector, isRoot) {
    return $_4iaj27m4jn69h2xa.ancestors(scope, function (e) {
      return $_ez7xfelejn69h2sh.is(e, selector);
    }, isRoot);
  };
  var siblings$2 = function (scope, selector) {
    return $_4iaj27m4jn69h2xa.siblings(scope, function (e) {
      return $_ez7xfelejn69h2sh.is(e, selector);
    });
  };
  var children$2 = function (scope, selector) {
    return $_4iaj27m4jn69h2xa.children(scope, function (e) {
      return $_ez7xfelejn69h2sh.is(e, selector);
    });
  };
  var descendants$1 = function (scope, selector) {
    return $_ez7xfelejn69h2sh.all(selector, scope);
  };
  var $_yn4aam3jn69h2wv = {
    all: all$2,
    ancestors: ancestors$1,
    siblings: siblings$2,
    children: children$2,
    descendants: descendants$1
  };

  function ClosestOrAncestor (is, ancestor, scope, a, isRoot) {
    return is(scope, a) ? Option.some(scope) : isFunction(isRoot) && isRoot(scope) ? Option.none() : ancestor(scope, a, isRoot);
  }

  var first$1 = function (predicate) {
    return descendant($_f5xfqwm5jn69h2xa.body(), predicate);
  };
  var ancestor = function (scope, predicate, isRoot) {
    var element = scope.dom();
    var stop = isFunction(isRoot) ? isRoot : constant(false);
    while (element.parentNode) {
      element = element.parentNode;
      var el = Element$$1.fromDom(element);
      if (predicate(el))
        return Option.some(el);
      else if (stop(el))
        break;
    }
    return Option.none();
  };
  var closest = function (scope, predicate, isRoot) {
    var is = function (scope) {
      return predicate(scope);
    };
    return ClosestOrAncestor(is, ancestor, scope, predicate, isRoot);
  };
  var sibling = function (scope, predicate) {
    var element = scope.dom();
    if (!element.parentNode)
      return Option.none();
    return child$1(Element$$1.fromDom(element.parentNode), function (x) {
      return !$_bakwgmlkjn69h2u8.eq(scope, x) && predicate(x);
    });
  };
  var child$1 = function (scope, predicate) {
    var result = find(scope.dom().childNodes, compose(predicate, Element$$1.fromDom));
    return result.map(Element$$1.fromDom);
  };
  var descendant = function (scope, predicate) {
    var descend = function (node) {
      for (var i = 0; i < node.childNodes.length; i++) {
        if (predicate(Element$$1.fromDom(node.childNodes[i])))
          return Option.some(Element$$1.fromDom(node.childNodes[i]));
        var res = descend(node.childNodes[i]);
        if (res.isSome())
          return res;
      }
      return Option.none();
    };
    return descend(scope.dom());
  };
  var $_3cgeam7jn69h2xq = {
    first: first$1,
    ancestor: ancestor,
    closest: closest,
    sibling: sibling,
    child: child$1,
    descendant: descendant
  };

  var first$2 = function (selector) {
    return $_ez7xfelejn69h2sh.one(selector);
  };
  var ancestor$1 = function (scope, selector, isRoot) {
    return $_3cgeam7jn69h2xq.ancestor(scope, function (e) {
      return $_ez7xfelejn69h2sh.is(e, selector);
    }, isRoot);
  };
  var sibling$1 = function (scope, selector) {
    return $_3cgeam7jn69h2xq.sibling(scope, function (e) {
      return $_ez7xfelejn69h2sh.is(e, selector);
    });
  };
  var child$2 = function (scope, selector) {
    return $_3cgeam7jn69h2xq.child(scope, function (e) {
      return $_ez7xfelejn69h2sh.is(e, selector);
    });
  };
  var descendant$1 = function (scope, selector) {
    return $_ez7xfelejn69h2sh.one(selector, scope);
  };
  var closest$1 = function (scope, selector, isRoot) {
    return ClosestOrAncestor($_ez7xfelejn69h2sh.is, ancestor$1, scope, selector, isRoot);
  };
  var $_72t5xvm6jn69h2xa = {
    first: first$2,
    ancestor: ancestor$1,
    sibling: sibling$1,
    child: child$2,
    descendant: descendant$1,
    closest: closest$1
  };

  var lookup = function (tags, element, _isRoot) {
    var isRoot = _isRoot !== undefined ? _isRoot : constant(false);
    if (isRoot(element))
      return Option.none();
    if (contains(tags, $_5f9i72m2jn69h2wv.name(element)))
      return Option.some(element);
    var isRootOrUpperTable = function (element) {
      return $_ez7xfelejn69h2sh.is(element, 'table') || isRoot(element);
    };
    return $_72t5xvm6jn69h2xa.ancestor(element, tags.join(','), isRootOrUpperTable);
  };
  var cell = function (element, isRoot) {
    return lookup([
      'td',
      'th'
    ], element, isRoot);
  };
  var cells = function (ancestor) {
    return $_4fjp11ldjn69h2s4.firstLayer(ancestor, 'th,td');
  };
  var notCell = function (element, isRoot) {
    return lookup([
      'caption',
      'tr',
      'tbody',
      'tfoot',
      'thead'
    ], element, isRoot);
  };
  var neighbours = function (selector, element) {
    return $_g3g38plijn69h2tc.parent(element).map(function (parent) {
      return $_yn4aam3jn69h2wv.children(parent, selector);
    });
  };
  var neighbourCells = curry(neighbours, 'th,td');
  var neighbourRows = curry(neighbours, 'tr');
  var firstCell = function (ancestor) {
    return $_72t5xvm6jn69h2xa.descendant(ancestor, 'th,td');
  };
  var table = function (element, isRoot) {
    return $_72t5xvm6jn69h2xa.closest(element, 'table', isRoot);
  };
  var row = function (element, isRoot) {
    return lookup(['tr'], element, isRoot);
  };
  var rows = function (ancestor) {
    return $_4fjp11ldjn69h2s4.firstLayer(ancestor, 'tr');
  };
  var attr = function (element, property) {
    return parseInt($_567jlzm1jn69h2wf.get(element, property), 10);
  };
  var grid$1 = function (element, rowProp, colProp) {
    var rows = attr(element, rowProp);
    var cols = attr(element, colProp);
    return $_dbc0gblbjn69h2qy.grid(rows, cols);
  };
  var $_2j92l5lcjn69h2r3 = {
    cell: cell,
    firstCell: firstCell,
    cells: cells,
    neighbourCells: neighbourCells,
    table: table,
    row: row,
    rows: rows,
    notCell: notCell,
    neighbourRows: neighbourRows,
    attr: attr,
    grid: grid$1
  };

  var fromTable = function (table) {
    var rows = $_2j92l5lcjn69h2r3.rows(table);
    return map(rows, function (row) {
      var element = row;
      var parent = $_g3g38plijn69h2tc.parent(element);
      var parentSection = parent.map(function (parent) {
        var parentName = $_5f9i72m2jn69h2wv.name(parent);
        return parentName === 'tfoot' || parentName === 'thead' || parentName === 'tbody' ? parentName : 'tbody';
      }).getOr('tbody');
      var cells = map($_2j92l5lcjn69h2r3.cells(row), function (cell) {
        var rowspan = $_567jlzm1jn69h2wf.has(cell, 'rowspan') ? parseInt($_567jlzm1jn69h2wf.get(cell, 'rowspan'), 10) : 1;
        var colspan = $_567jlzm1jn69h2wf.has(cell, 'colspan') ? parseInt($_567jlzm1jn69h2wf.get(cell, 'colspan'), 10) : 1;
        return $_dbc0gblbjn69h2qy.detail(cell, rowspan, colspan);
      });
      return $_dbc0gblbjn69h2qy.rowdata(element, cells, parentSection);
    });
  };
  var fromPastedRows = function (rows, example) {
    return map(rows, function (row) {
      var cells = map($_2j92l5lcjn69h2r3.cells(row), function (cell) {
        var rowspan = $_567jlzm1jn69h2wf.has(cell, 'rowspan') ? parseInt($_567jlzm1jn69h2wf.get(cell, 'rowspan'), 10) : 1;
        var colspan = $_567jlzm1jn69h2wf.has(cell, 'colspan') ? parseInt($_567jlzm1jn69h2wf.get(cell, 'colspan'), 10) : 1;
        return $_dbc0gblbjn69h2qy.detail(cell, rowspan, colspan);
      });
      return $_dbc0gblbjn69h2qy.rowdata(row, cells, example.section());
    });
  };
  var $_94vxyjlajn69h2qb = {
    fromTable: fromTable,
    fromPastedRows: fromPastedRows
  };

  var key = function (row, column) {
    return row + ',' + column;
  };
  var getAt = function (warehouse, row, column) {
    var raw = warehouse.access()[key(row, column)];
    return raw !== undefined ? Option.some(raw) : Option.none();
  };
  var findItem = function (warehouse, item, comparator) {
    var filtered = filterItems(warehouse, function (detail) {
      return comparator(item, detail.element());
    });
    return filtered.length > 0 ? Option.some(filtered[0]) : Option.none();
  };
  var filterItems = function (warehouse, predicate) {
    var all = bind(warehouse.all(), function (r) {
      return r.cells();
    });
    return filter(all, predicate);
  };
  var generate = function (list) {
    var access = {};
    var cells = [];
    var maxRows = list.length;
    var maxColumns = 0;
    each(list, function (details, r) {
      var currentRow = [];
      each(details.cells(), function (detail, c) {
        var start = 0;
        while (access[key(r, start)] !== undefined) {
          start++;
        }
        var current = $_dbc0gblbjn69h2qy.extended(detail.element(), detail.rowspan(), detail.colspan(), r, start);
        for (var i = 0; i < detail.colspan(); i++) {
          for (var j = 0; j < detail.rowspan(); j++) {
            var cr = r + j;
            var cc = start + i;
            var newpos = key(cr, cc);
            access[newpos] = current;
            maxColumns = Math.max(maxColumns, cc + 1);
          }
        }
        currentRow.push(current);
      });
      cells.push($_dbc0gblbjn69h2qy.rowdata(details.element(), currentRow, details.section()));
    });
    var grid = $_dbc0gblbjn69h2qy.grid(maxRows, maxColumns);
    return {
      grid: constant(grid),
      access: constant(access),
      all: constant(cells)
    };
  };
  var justCells = function (warehouse) {
    var rows = map(warehouse.all(), function (w) {
      return w.cells();
    });
    return flatten(rows);
  };
  var $_bvuq36m9jn69h2zb = {
    generate: generate,
    getAt: getAt,
    findItem: findItem,
    filterItems: filterItems,
    justCells: justCells
  };

  var isSupported = function (dom) {
    return dom.style !== undefined;
  };
  var $_7lzvi2mbjn69h306 = { isSupported: isSupported };

  var internalSet = function (dom, property, value) {
    if (!isString(value)) {
      console.error('Invalid call to CSS.set. Property ', property, ':: Value ', value, ':: Element ', dom);
      throw new Error('CSS value must be a string: ' + value);
    }
    if ($_7lzvi2mbjn69h306.isSupported(dom))
      dom.style.setProperty(property, value);
  };
  var internalRemove = function (dom, property) {
    if ($_7lzvi2mbjn69h306.isSupported(dom))
      dom.style.removeProperty(property);
  };
  var set$1 = function (element, property, value) {
    var dom = element.dom();
    internalSet(dom, property, value);
  };
  var setAll$1 = function (element, css) {
    var dom = element.dom();
    each$1(css, function (v, k) {
      internalSet(dom, k, v);
    });
  };
  var setOptions = function (element, css) {
    var dom = element.dom();
    each$1(css, function (v, k) {
      v.fold(function () {
        internalRemove(dom, k);
      }, function (value) {
        internalSet(dom, k, value);
      });
    });
  };
  var get$2 = function (element, property) {
    var dom = element.dom();
    var styles = window.getComputedStyle(dom);
    var r = styles.getPropertyValue(property);
    var v = r === '' && !$_f5xfqwm5jn69h2xa.inBody(element) ? getUnsafeProperty(dom, property) : r;
    return v === null ? undefined : v;
  };
  var getUnsafeProperty = function (dom, property) {
    return $_7lzvi2mbjn69h306.isSupported(dom) ? dom.style.getPropertyValue(property) : '';
  };
  var getRaw = function (element, property) {
    var dom = element.dom();
    var raw = getUnsafeProperty(dom, property);
    return Option.from(raw).filter(function (r) {
      return r.length > 0;
    });
  };
  var getAllRaw = function (element) {
    var css = {};
    var dom = element.dom();
    if ($_7lzvi2mbjn69h306.isSupported(dom)) {
      for (var i = 0; i < dom.style.length; i++) {
        var ruleName = dom.style.item(i);
        css[ruleName] = dom.style[ruleName];
      }
    }
    return css;
  };
  var isValidValue = function (tag, property, value) {
    var element = Element$$1.fromTag(tag);
    set$1(element, property, value);
    var style = getRaw(element, property);
    return style.isSome();
  };
  var remove$1 = function (element, property) {
    var dom = element.dom();
    internalRemove(dom, property);
    if ($_567jlzm1jn69h2wf.has(element, 'style') && trim($_567jlzm1jn69h2wf.get(element, 'style')) === '') {
      $_567jlzm1jn69h2wf.remove(element, 'style');
    }
  };
  var preserve = function (element, f) {
    var oldStyles = $_567jlzm1jn69h2wf.get(element, 'style');
    var result = f(element);
    var restore = oldStyles === undefined ? $_567jlzm1jn69h2wf.remove : $_567jlzm1jn69h2wf.set;
    restore(element, 'style', oldStyles);
    return result;
  };
  var copy = function (source, target) {
    var sourceDom = source.dom();
    var targetDom = target.dom();
    if ($_7lzvi2mbjn69h306.isSupported(sourceDom) && $_7lzvi2mbjn69h306.isSupported(targetDom)) {
      targetDom.style.cssText = sourceDom.style.cssText;
    }
  };
  var reflow = function (e) {
    return e.dom().offsetWidth;
  };
  var transferOne$1 = function (source, destination, style) {
    getRaw(source, style).each(function (value) {
      if (getRaw(destination, style).isNone())
        set$1(destination, style, value);
    });
  };
  var transfer$1 = function (source, destination, styles) {
    if (!$_5f9i72m2jn69h2wv.isElement(source) || !$_5f9i72m2jn69h2wv.isElement(destination))
      return;
    each(styles, function (style) {
      transferOne$1(source, destination, style);
    });
  };
  var $_6q24dgmajn69h2zq = {
    copy: copy,
    set: set$1,
    preserve: preserve,
    setAll: setAll$1,
    setOptions: setOptions,
    remove: remove$1,
    get: get$2,
    getRaw: getRaw,
    getAllRaw: getAllRaw,
    isValidValue: isValidValue,
    reflow: reflow,
    transfer: transfer$1
  };

  var before = function (marker, element) {
    var parent = $_g3g38plijn69h2tc.parent(marker);
    parent.each(function (v) {
      v.dom().insertBefore(element.dom(), marker.dom());
    });
  };
  var after = function (marker, element) {
    var sibling = $_g3g38plijn69h2tc.nextSibling(marker);
    sibling.fold(function () {
      var parent = $_g3g38plijn69h2tc.parent(marker);
      parent.each(function (v) {
        append(v, element);
      });
    }, function (v) {
      before(v, element);
    });
  };
  var prepend = function (parent, element) {
    var firstChild = $_g3g38plijn69h2tc.firstChild(parent);
    firstChild.fold(function () {
      append(parent, element);
    }, function (v) {
      parent.dom().insertBefore(element.dom(), v.dom());
    });
  };
  var append = function (parent, element) {
    parent.dom().appendChild(element.dom());
  };
  var appendAt = function (parent, element, index) {
    $_g3g38plijn69h2tc.child(parent, index).fold(function () {
      append(parent, element);
    }, function (v) {
      before(v, element);
    });
  };
  var wrap = function (element, wrapper) {
    before(element, wrapper);
    append(wrapper, element);
  };
  var $_6szxhjmcjn69h306 = {
    before: before,
    after: after,
    prepend: prepend,
    append: append,
    appendAt: appendAt,
    wrap: wrap
  };

  var before$1 = function (marker, elements) {
    each(elements, function (x) {
      $_6szxhjmcjn69h306.before(marker, x);
    });
  };
  var after$1 = function (marker, elements) {
    each(elements, function (x, i) {
      var e = i === 0 ? marker : elements[i - 1];
      $_6szxhjmcjn69h306.after(e, x);
    });
  };
  var prepend$1 = function (parent, elements) {
    each(elements.slice().reverse(), function (x) {
      $_6szxhjmcjn69h306.prepend(parent, x);
    });
  };
  var append$1 = function (parent, elements) {
    each(elements, function (x) {
      $_6szxhjmcjn69h306.append(parent, x);
    });
  };
  var $_cys2y3mejn69h30m = {
    before: before$1,
    after: after$1,
    prepend: prepend$1,
    append: append$1
  };

  var empty = function (element) {
    element.dom().textContent = '';
    each($_g3g38plijn69h2tc.children(element), function (rogue) {
      remove$2(rogue);
    });
  };
  var remove$2 = function (element) {
    var dom = element.dom();
    if (dom.parentNode !== null)
      dom.parentNode.removeChild(dom);
  };
  var unwrap = function (wrapper) {
    var children = $_g3g38plijn69h2tc.children(wrapper);
    if (children.length > 0)
      $_cys2y3mejn69h30m.before(wrapper, children);
    remove$2(wrapper);
  };
  var $_69icwdmdjn69h306 = {
    empty: empty,
    remove: remove$2,
    unwrap: unwrap
  };

  var stats = Immutable('minRow', 'minCol', 'maxRow', 'maxCol');
  var findSelectedStats = function (house, isSelected) {
    var totalColumns = house.grid().columns();
    var totalRows = house.grid().rows();
    var minRow = totalRows;
    var minCol = totalColumns;
    var maxRow = 0;
    var maxCol = 0;
    each$1(house.access(), function (detail) {
      if (isSelected(detail)) {
        var startRow = detail.row();
        var endRow = startRow + detail.rowspan() - 1;
        var startCol = detail.column();
        var endCol = startCol + detail.colspan() - 1;
        if (startRow < minRow)
          minRow = startRow;
        else if (endRow > maxRow)
          maxRow = endRow;
        if (startCol < minCol)
          minCol = startCol;
        else if (endCol > maxCol)
          maxCol = endCol;
      }
    });
    return stats(minRow, minCol, maxRow, maxCol);
  };
  var makeCell = function (list, seenSelected, rowIndex) {
    var row = list[rowIndex].element();
    var td = Element$$1.fromTag('td');
    $_6szxhjmcjn69h306.append(td, Element$$1.fromTag('br'));
    var f = seenSelected ? $_6szxhjmcjn69h306.append : $_6szxhjmcjn69h306.prepend;
    f(row, td);
  };
  var fillInGaps = function (list, house, stats, isSelected) {
    var totalColumns = house.grid().columns();
    var totalRows = house.grid().rows();
    for (var i = 0; i < totalRows; i++) {
      var seenSelected = false;
      for (var j = 0; j < totalColumns; j++) {
        if (!(i < stats.minRow() || i > stats.maxRow() || j < stats.minCol() || j > stats.maxCol())) {
          var needCell = $_bvuq36m9jn69h2zb.getAt(house, i, j).filter(isSelected).isNone();
          if (needCell)
            makeCell(list, seenSelected, i);
          else
            seenSelected = true;
        }
      }
    }
  };
  var clean = function (table, stats) {
    var emptyRows = filter($_4fjp11ldjn69h2s4.firstLayer(table, 'tr'), function (row) {
      return row.dom().childElementCount === 0;
    });
    each(emptyRows, $_69icwdmdjn69h306.remove);
    if (stats.minCol() === stats.maxCol() || stats.minRow() === stats.maxRow()) {
      each($_4fjp11ldjn69h2s4.firstLayer(table, 'th,td'), function (cell) {
        $_567jlzm1jn69h2wf.remove(cell, 'rowspan');
        $_567jlzm1jn69h2wf.remove(cell, 'colspan');
      });
    }
    $_567jlzm1jn69h2wf.remove(table, 'width');
    $_567jlzm1jn69h2wf.remove(table, 'height');
    $_6q24dgmajn69h2zq.remove(table, 'width');
    $_6q24dgmajn69h2zq.remove(table, 'height');
  };
  var extract = function (table, selectedSelector) {
    var isSelected = function (detail) {
      return $_ez7xfelejn69h2sh.is(detail.element(), selectedSelector);
    };
    var list = $_94vxyjlajn69h2qb.fromTable(table);
    var house = $_bvuq36m9jn69h2zb.generate(list);
    var stats = findSelectedStats(house, isSelected);
    var selector = 'th:not(' + selectedSelector + ')' + ',td:not(' + selectedSelector + ')';
    var unselectedCells = $_4fjp11ldjn69h2s4.filterFirstLayer(table, 'th,td', function (cell) {
      return $_ez7xfelejn69h2sh.is(cell, selector);
    });
    each(unselectedCells, $_69icwdmdjn69h306.remove);
    fillInGaps(list, house, stats, isSelected);
    clean(table, stats);
    return table;
  };
  var $_7v97jql4jn69h2op = { extract: extract };

  var clone$1 = function (original, deep) {
    return Element$$1.fromDom(original.dom().cloneNode(deep));
  };
  var shallow = function (original) {
    return clone$1(original, false);
  };
  var deep = function (original) {
    return clone$1(original, true);
  };
  var shallowAs = function (original, tag) {
    var nu = Element$$1.fromTag(tag);
    var attributes = $_567jlzm1jn69h2wf.clone(original);
    $_567jlzm1jn69h2wf.setAll(nu, attributes);
    return nu;
  };
  var copy$1 = function (original, tag) {
    var nu = shallowAs(original, tag);
    var cloneChildren = $_g3g38plijn69h2tc.children(deep(original));
    $_cys2y3mejn69h30m.append(nu, cloneChildren);
    return nu;
  };
  var mutate = function (original, tag) {
    var nu = shallowAs(original, tag);
    $_6szxhjmcjn69h306.before(original, nu);
    var children = $_g3g38plijn69h2tc.children(original);
    $_cys2y3mejn69h30m.append(nu, children);
    $_69icwdmdjn69h306.remove(original);
    return nu;
  };
  var $_9sp4womgjn69h31w = {
    shallow: shallow,
    shallowAs: shallowAs,
    deep: deep,
    copy: copy$1,
    mutate: mutate
  };

  function NodeValue (is, name) {
    var get = function (element) {
      if (!is(element))
        throw new Error('Can only get ' + name + ' value of a ' + name + ' node');
      return getOption(element).getOr('');
    };
    var getOptionIE10 = function (element) {
      try {
        return getOptionSafe(element);
      } catch (e) {
        return Option.none();
      }
    };
    var getOptionSafe = function (element) {
      return is(element) ? Option.from(element.dom().nodeValue) : Option.none();
    };
    var browser = $_k0fj2lpjn69h2v3.detect().browser;
    var getOption = browser.isIE() && browser.version.major === 10 ? getOptionIE10 : getOptionSafe;
    var set = function (element, value) {
      if (!is(element))
        throw new Error('Can only set raw ' + name + ' value of a ' + name + ' node');
      element.dom().nodeValue = value;
    };
    return {
      get: get,
      getOption: getOption,
      set: set
    };
  }

  var api = NodeValue($_5f9i72m2jn69h2wv.isText, 'text');
  var get$3 = function (element) {
    return api.get(element);
  };
  var getOption = function (element) {
    return api.getOption(element);
  };
  var set$2 = function (element, value) {
    api.set(element, value);
  };
  var $_eo2rq0mjjn69h32m = {
    get: get$3,
    getOption: getOption,
    set: set$2
  };

  var getEnd = function (element) {
    return $_5f9i72m2jn69h2wv.name(element) === 'img' ? 1 : $_eo2rq0mjjn69h32m.getOption(element).fold(function () {
      return $_g3g38plijn69h2tc.children(element).length;
    }, function (v) {
      return v.length;
    });
  };
  var isEnd = function (element, offset) {
    return getEnd(element) === offset;
  };
  var isStart = function (element, offset) {
    return offset === 0;
  };
  var NBSP = '\xA0';
  var isTextNodeWithCursorPosition = function (el) {
    return $_eo2rq0mjjn69h32m.getOption(el).filter(function (text) {
      return text.trim().length !== 0 || text.indexOf(NBSP) > -1;
    }).isSome();
  };
  var elementsWithCursorPosition = [
    'img',
    'br'
  ];
  var isCursorPosition = function (elem) {
    var hasCursorPosition = isTextNodeWithCursorPosition(elem);
    return hasCursorPosition || contains(elementsWithCursorPosition, $_5f9i72m2jn69h2wv.name(elem));
  };
  var $_4yut00mijn69h32c = {
    getEnd: getEnd,
    isEnd: isEnd,
    isStart: isStart,
    isCursorPosition: isCursorPosition
  };

  var first$3 = function (element) {
    return $_3cgeam7jn69h2xq.descendant(element, $_4yut00mijn69h32c.isCursorPosition);
  };
  var last$2 = function (element) {
    return descendantRtl(element, $_4yut00mijn69h32c.isCursorPosition);
  };
  var descendantRtl = function (scope, predicate) {
    var descend = function (element) {
      var children = $_g3g38plijn69h2tc.children(element);
      for (var i = children.length - 1; i >= 0; i--) {
        var child = children[i];
        if (predicate(child))
          return Option.some(child);
        var res = descend(child);
        if (res.isSome())
          return res;
      }
      return Option.none();
    };
    return descend(scope);
  };
  var $_c4imwkmhjn69h31w = {
    first: first$3,
    last: last$2
  };

  var cell$1 = function () {
    var td = Element$$1.fromTag('td');
    $_6szxhjmcjn69h306.append(td, Element$$1.fromTag('br'));
    return td;
  };
  var replace = function (cell, tag, attrs) {
    var replica = $_9sp4womgjn69h31w.copy(cell, tag);
    each$1(attrs, function (v, k) {
      if (v === null)
        $_567jlzm1jn69h2wf.remove(replica, k);
      else
        $_567jlzm1jn69h2wf.set(replica, k, v);
    });
    return replica;
  };
  var pasteReplace = function (cellContent) {
    return cellContent;
  };
  var newRow = function (doc) {
    return function () {
      return Element$$1.fromTag('tr', doc.dom());
    };
  };
  var cloneFormats = function (oldCell, newCell, formats) {
    var first = $_c4imwkmhjn69h31w.first(oldCell);
    return first.map(function (firstText) {
      var formatSelector = formats.join(',');
      var parents = $_yn4aam3jn69h2wv.ancestors(firstText, formatSelector, function (element) {
        return $_bakwgmlkjn69h2u8.eq(element, oldCell);
      });
      return foldr(parents, function (last$$1, parent) {
        var clonedFormat = $_9sp4womgjn69h31w.shallow(parent);
        $_567jlzm1jn69h2wf.remove(clonedFormat, 'contenteditable');
        $_6szxhjmcjn69h306.append(last$$1, clonedFormat);
        return clonedFormat;
      }, newCell);
    }).getOr(newCell);
  };
  var cellOperations = function (mutate, doc, formatsToClone) {
    var newCell = function (prev) {
      var doc = $_g3g38plijn69h2tc.owner(prev.element());
      var td = Element$$1.fromTag($_5f9i72m2jn69h2wv.name(prev.element()), doc.dom());
      var formats = formatsToClone.getOr([
        'strong',
        'em',
        'b',
        'i',
        'span',
        'font',
        'h1',
        'h2',
        'h3',
        'h4',
        'h5',
        'h6',
        'p',
        'div'
      ]);
      var lastNode = formats.length > 0 ? cloneFormats(prev.element(), td, formats) : td;
      $_6szxhjmcjn69h306.append(lastNode, Element$$1.fromTag('br'));
      $_6q24dgmajn69h2zq.copy(prev.element(), td);
      $_6q24dgmajn69h2zq.remove(td, 'height');
      if (prev.colspan() !== 1)
        $_6q24dgmajn69h2zq.remove(prev.element(), 'width');
      mutate(prev.element(), td);
      return td;
    };
    return {
      row: newRow(doc),
      cell: newCell,
      replace: replace,
      gap: cell$1
    };
  };
  var paste = function (doc) {
    return {
      row: newRow(doc),
      cell: cell$1,
      replace: pasteReplace,
      gap: cell$1
    };
  };
  var $_8b35ttmfjn69h30m = {
    cellOperations: cellOperations,
    paste: paste
  };

  var fromHtml$1 = function (html, scope) {
    var doc = scope || document;
    var div = doc.createElement('div');
    div.innerHTML = html;
    return $_g3g38plijn69h2tc.children(Element$$1.fromDom(div));
  };
  var fromTags = function (tags, scope) {
    return map(tags, function (x) {
      return Element$$1.fromTag(x, scope);
    });
  };
  var fromText$1 = function (texts, scope) {
    return map(texts, function (x) {
      return Element$$1.fromText(x, scope);
    });
  };
  var fromDom$1 = function (nodes) {
    return map(nodes, Element$$1.fromDom);
  };
  var $_6dzec3mljn69h32x = {
    fromHtml: fromHtml$1,
    fromTags: fromTags,
    fromText: fromText$1,
    fromDom: fromDom$1
  };

  var TagBoundaries = [
    'body',
    'p',
    'div',
    'article',
    'aside',
    'figcaption',
    'figure',
    'footer',
    'header',
    'nav',
    'section',
    'ol',
    'ul',
    'li',
    'table',
    'thead',
    'tbody',
    'tfoot',
    'caption',
    'tr',
    'td',
    'th',
    'h1',
    'h2',
    'h3',
    'h4',
    'h5',
    'h6',
    'blockquote',
    'pre',
    'address'
  ];

  function DomUniverse () {
    var clone = function (element) {
      return Element$$1.fromDom(element.dom().cloneNode(false));
    };
    var isBoundary = function (element) {
      if (!$_5f9i72m2jn69h2wv.isElement(element))
        return false;
      if ($_5f9i72m2jn69h2wv.name(element) === 'body')
        return true;
      return contains(TagBoundaries, $_5f9i72m2jn69h2wv.name(element));
    };
    var isEmptyTag = function (element) {
      if (!$_5f9i72m2jn69h2wv.isElement(element))
        return false;
      return contains([
        'br',
        'img',
        'hr',
        'input'
      ], $_5f9i72m2jn69h2wv.name(element));
    };
    var comparePosition = function (element, other) {
      return element.dom().compareDocumentPosition(other.dom());
    };
    var copyAttributesTo = function (source, destination) {
      var as = $_567jlzm1jn69h2wf.clone(source);
      $_567jlzm1jn69h2wf.setAll(destination, as);
    };
    return {
      up: constant({
        selector: $_72t5xvm6jn69h2xa.ancestor,
        closest: $_72t5xvm6jn69h2xa.closest,
        predicate: $_3cgeam7jn69h2xq.ancestor,
        all: $_g3g38plijn69h2tc.parents
      }),
      down: constant({
        selector: $_yn4aam3jn69h2wv.descendants,
        predicate: $_4iaj27m4jn69h2xa.descendants
      }),
      styles: constant({
        get: $_6q24dgmajn69h2zq.get,
        getRaw: $_6q24dgmajn69h2zq.getRaw,
        set: $_6q24dgmajn69h2zq.set,
        remove: $_6q24dgmajn69h2zq.remove
      }),
      attrs: constant({
        get: $_567jlzm1jn69h2wf.get,
        set: $_567jlzm1jn69h2wf.set,
        remove: $_567jlzm1jn69h2wf.remove,
        copyTo: copyAttributesTo
      }),
      insert: constant({
        before: $_6szxhjmcjn69h306.before,
        after: $_6szxhjmcjn69h306.after,
        afterAll: $_cys2y3mejn69h30m.after,
        append: $_6szxhjmcjn69h306.append,
        appendAll: $_cys2y3mejn69h30m.append,
        prepend: $_6szxhjmcjn69h306.prepend,
        wrap: $_6szxhjmcjn69h306.wrap
      }),
      remove: constant({
        unwrap: $_69icwdmdjn69h306.unwrap,
        remove: $_69icwdmdjn69h306.remove
      }),
      create: constant({
        nu: Element$$1.fromTag,
        clone: clone,
        text: Element$$1.fromText
      }),
      query: constant({
        comparePosition: comparePosition,
        prevSibling: $_g3g38plijn69h2tc.prevSibling,
        nextSibling: $_g3g38plijn69h2tc.nextSibling
      }),
      property: constant({
        children: $_g3g38plijn69h2tc.children,
        name: $_5f9i72m2jn69h2wv.name,
        parent: $_g3g38plijn69h2tc.parent,
        isText: $_5f9i72m2jn69h2wv.isText,
        isComment: $_5f9i72m2jn69h2wv.isComment,
        isElement: $_5f9i72m2jn69h2wv.isElement,
        getText: $_eo2rq0mjjn69h32m.get,
        setText: $_eo2rq0mjjn69h32m.set,
        isBoundary: isBoundary,
        isEmptyTag: isEmptyTag
      }),
      eq: $_bakwgmlkjn69h2u8.eq,
      is: $_bakwgmlkjn69h2u8.is
    };
  }

  var leftRight = Immutable('left', 'right');
  var bisect = function (universe, parent, child) {
    var children = universe.property().children(parent);
    var index = findIndex(children, curry(universe.eq, child));
    return index.map(function (ind) {
      return {
        before: constant(children.slice(0, ind)),
        after: constant(children.slice(ind + 1))
      };
    });
  };
  var breakToRight = function (universe, parent, child) {
    return bisect(universe, parent, child).map(function (parts) {
      var second = universe.create().clone(parent);
      universe.insert().appendAll(second, parts.after());
      universe.insert().after(parent, second);
      return leftRight(parent, second);
    });
  };
  var breakToLeft = function (universe, parent, child) {
    return bisect(universe, parent, child).map(function (parts) {
      var prior = universe.create().clone(parent);
      universe.insert().appendAll(prior, parts.before().concat([child]));
      universe.insert().appendAll(parent, parts.after());
      universe.insert().before(parent, prior);
      return leftRight(prior, parent);
    });
  };
  var breakPath = function (universe, item, isTop, breaker) {
    var result = Immutable('first', 'second', 'splits');
    var next = function (child, group, splits) {
      var fallback = result(child, Option.none(), splits);
      if (isTop(child))
        return result(child, group, splits);
      else {
        return universe.property().parent(child).bind(function (parent) {
          return breaker(universe, parent, child).map(function (breakage) {
            var extra = [{
                first: breakage.left,
                second: breakage.right
              }];
            var nextChild = isTop(parent) ? parent : breakage.left();
            return next(nextChild, Option.some(breakage.right()), splits.concat(extra));
          }).getOr(fallback);
        });
      }
    };
    return next(item, Option.none(), []);
  };
  var $_4vycuymujn69h379 = {
    breakToLeft: breakToLeft,
    breakToRight: breakToRight,
    breakPath: breakPath
  };

  var all$3 = function (universe, look, elements, f) {
    var head$$1 = elements[0];
    var tail = elements.slice(1);
    return f(universe, look, head$$1, tail);
  };
  var oneAll = function (universe, look, elements) {
    return elements.length > 0 ? all$3(universe, look, elements, unsafeOne) : Option.none();
  };
  var unsafeOne = function (universe, look, head$$1, tail) {
    var start = look(universe, head$$1);
    return foldr(tail, function (b, a) {
      var current = look(universe, a);
      return commonElement(universe, b, current);
    }, start);
  };
  var commonElement = function (universe, start, end) {
    return start.bind(function (s) {
      return end.filter(curry(universe.eq, s));
    });
  };
  var $_b9jxycmvjn69h37z = { oneAll: oneAll };

  var eq$1 = function (universe, item) {
    return curry(universe.eq, item);
  };
  var unsafeSubset = function (universe, common, ps1, ps2) {
    var children = universe.property().children(common);
    if (universe.eq(common, ps1[0]))
      return Option.some([ps1[0]]);
    if (universe.eq(common, ps2[0]))
      return Option.some([ps2[0]]);
    var finder = function (ps) {
      var topDown = reverse(ps);
      var index = findIndex(topDown, eq$1(universe, common)).getOr(-1);
      var item = index < topDown.length - 1 ? topDown[index + 1] : topDown[index];
      return findIndex(children, eq$1(universe, item));
    };
    var startIndex = finder(ps1);
    var endIndex = finder(ps2);
    return startIndex.bind(function (sIndex) {
      return endIndex.map(function (eIndex) {
        var first = Math.min(sIndex, eIndex);
        var last$$1 = Math.max(sIndex, eIndex);
        return children.slice(first, last$$1 + 1);
      });
    });
  };
  var ancestors$2 = function (universe, start, end, _isRoot) {
    var isRoot = _isRoot !== undefined ? _isRoot : constant(false);
    var ps1 = [start].concat(universe.up().all(start));
    var ps2 = [end].concat(universe.up().all(end));
    var prune = function (path) {
      var index = findIndex(path, isRoot);
      return index.fold(function () {
        return path;
      }, function (ind) {
        return path.slice(0, ind + 1);
      });
    };
    var pruned1 = prune(ps1);
    var pruned2 = prune(ps2);
    var shared = find(pruned1, function (x) {
      return exists(pruned2, eq$1(universe, x));
    });
    return {
      firstpath: constant(pruned1),
      secondpath: constant(pruned2),
      shared: constant(shared)
    };
  };
  var subset = function (universe, start, end) {
    var ancs = ancestors$2(universe, start, end);
    return ancs.shared().bind(function (shared) {
      return unsafeSubset(universe, shared, ancs.firstpath(), ancs.secondpath());
    });
  };
  var $_revgamwjn69h38b = {
    subset: subset,
    ancestors: ancestors$2
  };

  var sharedOne = function (universe, look, elements) {
    return $_b9jxycmvjn69h37z.oneAll(universe, look, elements);
  };
  var subset$1 = function (universe, start, finish) {
    return $_revgamwjn69h38b.subset(universe, start, finish);
  };
  var ancestors$3 = function (universe, start, finish, _isRoot) {
    return $_revgamwjn69h38b.ancestors(universe, start, finish, _isRoot);
  };
  var breakToLeft$1 = function (universe, parent, child) {
    return $_4vycuymujn69h379.breakToLeft(universe, parent, child);
  };
  var breakToRight$1 = function (universe, parent, child) {
    return $_4vycuymujn69h379.breakToRight(universe, parent, child);
  };
  var breakPath$1 = function (universe, child, isTop, breaker) {
    return $_4vycuymujn69h379.breakPath(universe, child, isTop, breaker);
  };
  var $_9iniymtjn69h379 = {
    sharedOne: sharedOne,
    subset: subset$1,
    ancestors: ancestors$3,
    breakToLeft: breakToLeft$1,
    breakToRight: breakToRight$1,
    breakPath: breakPath$1
  };

  var universe = DomUniverse();
  var sharedOne$1 = function (look, elements) {
    return $_9iniymtjn69h379.sharedOne(universe, function (universe, element) {
      return look(element);
    }, elements);
  };
  var subset$2 = function (start, finish) {
    return $_9iniymtjn69h379.subset(universe, start, finish);
  };
  var ancestors$4 = function (start, finish, _isRoot) {
    return $_9iniymtjn69h379.ancestors(universe, start, finish, _isRoot);
  };
  var breakToLeft$2 = function (parent, child) {
    return $_9iniymtjn69h379.breakToLeft(universe, parent, child);
  };
  var breakToRight$2 = function (parent, child) {
    return $_9iniymtjn69h379.breakToRight(universe, parent, child);
  };
  var breakPath$2 = function (child, isTop, breaker) {
    return $_9iniymtjn69h379.breakPath(universe, child, isTop, function (u, p, c) {
      return breaker(p, c);
    });
  };
  var $_491cfnmqjn69h35i = {
    sharedOne: sharedOne$1,
    subset: subset$2,
    ancestors: ancestors$4,
    breakToLeft: breakToLeft$2,
    breakToRight: breakToRight$2,
    breakPath: breakPath$2
  };

  var inSelection = function (bounds, detail) {
    var leftEdge = detail.column();
    var rightEdge = detail.column() + detail.colspan() - 1;
    var topEdge = detail.row();
    var bottomEdge = detail.row() + detail.rowspan() - 1;
    return leftEdge <= bounds.finishCol() && rightEdge >= bounds.startCol() && (topEdge <= bounds.finishRow() && bottomEdge >= bounds.startRow());
  };
  var isWithin = function (bounds, detail) {
    return detail.column() >= bounds.startCol() && detail.column() + detail.colspan() - 1 <= bounds.finishCol() && detail.row() >= bounds.startRow() && detail.row() + detail.rowspan() - 1 <= bounds.finishRow();
  };
  var isRectangular = function (warehouse, bounds) {
    var isRect = true;
    var detailIsWithin = curry(isWithin, bounds);
    for (var i = bounds.startRow(); i <= bounds.finishRow(); i++) {
      for (var j = bounds.startCol(); j <= bounds.finishCol(); j++) {
        isRect = isRect && $_bvuq36m9jn69h2zb.getAt(warehouse, i, j).exists(detailIsWithin);
      }
    }
    return isRect ? Option.some(bounds) : Option.none();
  };
  var $_vtsolmzjn69h38x = {
    inSelection: inSelection,
    isWithin: isWithin,
    isRectangular: isRectangular
  };

  var getBounds = function (detailA, detailB) {
    return $_dbc0gblbjn69h2qy.bounds(Math.min(detailA.row(), detailB.row()), Math.min(detailA.column(), detailB.column()), Math.max(detailA.row() + detailA.rowspan() - 1, detailB.row() + detailB.rowspan() - 1), Math.max(detailA.column() + detailA.colspan() - 1, detailB.column() + detailB.colspan() - 1));
  };
  var getAnyBox = function (warehouse, startCell, finishCell) {
    var startCoords = $_bvuq36m9jn69h2zb.findItem(warehouse, startCell, $_bakwgmlkjn69h2u8.eq);
    var finishCoords = $_bvuq36m9jn69h2zb.findItem(warehouse, finishCell, $_bakwgmlkjn69h2u8.eq);
    return startCoords.bind(function (sc) {
      return finishCoords.map(function (fc) {
        return getBounds(sc, fc);
      });
    });
  };
  var getBox = function (warehouse, startCell, finishCell) {
    return getAnyBox(warehouse, startCell, finishCell).bind(function (bounds) {
      return $_vtsolmzjn69h38x.isRectangular(warehouse, bounds);
    });
  };
  var $_vtb41n0jn69h39c = {
    getAnyBox: getAnyBox,
    getBox: getBox
  };

  var moveBy = function (warehouse, cell, row, column) {
    return $_bvuq36m9jn69h2zb.findItem(warehouse, cell, $_bakwgmlkjn69h2u8.eq).bind(function (detail) {
      var startRow = row > 0 ? detail.row() + detail.rowspan() - 1 : detail.row();
      var startCol = column > 0 ? detail.column() + detail.colspan() - 1 : detail.column();
      var dest = $_bvuq36m9jn69h2zb.getAt(warehouse, startRow + row, startCol + column);
      return dest.map(function (d) {
        return d.element();
      });
    });
  };
  var intercepts = function (warehouse, start, finish) {
    return $_vtb41n0jn69h39c.getAnyBox(warehouse, start, finish).map(function (bounds) {
      var inside = $_bvuq36m9jn69h2zb.filterItems(warehouse, curry($_vtsolmzjn69h38x.inSelection, bounds));
      return map(inside, function (detail) {
        return detail.element();
      });
    });
  };
  var parentCell = function (warehouse, innerCell) {
    var isContainedBy = function (c1, c2) {
      return $_bakwgmlkjn69h2u8.contains(c2, c1);
    };
    return $_bvuq36m9jn69h2zb.findItem(warehouse, innerCell, isContainedBy).bind(function (detail) {
      return detail.element();
    });
  };
  var $_5o5nsomyjn69h38h = {
    moveBy: moveBy,
    intercepts: intercepts,
    parentCell: parentCell
  };

  var moveBy$1 = function (cell, deltaRow, deltaColumn) {
    return $_2j92l5lcjn69h2r3.table(cell).bind(function (table) {
      var warehouse = getWarehouse(table);
      return $_5o5nsomyjn69h38h.moveBy(warehouse, cell, deltaRow, deltaColumn);
    });
  };
  var intercepts$1 = function (table, first, last) {
    var warehouse = getWarehouse(table);
    return $_5o5nsomyjn69h38h.intercepts(warehouse, first, last);
  };
  var nestedIntercepts = function (table, first, firstTable, last, lastTable) {
    var warehouse = getWarehouse(table);
    var startCell = $_bakwgmlkjn69h2u8.eq(table, firstTable) ? first : $_5o5nsomyjn69h38h.parentCell(warehouse, first);
    var lastCell = $_bakwgmlkjn69h2u8.eq(table, lastTable) ? last : $_5o5nsomyjn69h38h.parentCell(warehouse, last);
    return $_5o5nsomyjn69h38h.intercepts(warehouse, startCell, lastCell);
  };
  var getBox$1 = function (table, first, last) {
    var warehouse = getWarehouse(table);
    return $_vtb41n0jn69h39c.getBox(warehouse, first, last);
  };
  var getWarehouse = function (table) {
    var list = $_94vxyjlajn69h2qb.fromTable(table);
    return $_bvuq36m9jn69h2zb.generate(list);
  };
  var $_3zs6bkmxjn69h38h = {
    moveBy: moveBy$1,
    intercepts: intercepts$1,
    nestedIntercepts: nestedIntercepts,
    getBox: getBox$1
  };

  var lookupTable = function (container, isRoot) {
    return $_72t5xvm6jn69h2xa.ancestor(container, 'table');
  };
  var identified = MixedBag([
    'boxes',
    'start',
    'finish'
  ], []);
  var identify = function (start, finish, isRoot) {
    var getIsRoot = function (rootTable) {
      return function (element) {
        return isRoot(element) || $_bakwgmlkjn69h2u8.eq(element, rootTable);
      };
    };
    if ($_bakwgmlkjn69h2u8.eq(start, finish)) {
      return Option.some(identified({
        boxes: Option.some([start]),
        start: start,
        finish: finish
      }));
    } else {
      return lookupTable(start, isRoot).bind(function (startTable) {
        return lookupTable(finish, isRoot).bind(function (finishTable) {
          if ($_bakwgmlkjn69h2u8.eq(startTable, finishTable)) {
            return Option.some(identified({
              boxes: $_3zs6bkmxjn69h38h.intercepts(startTable, start, finish),
              start: start,
              finish: finish
            }));
          } else if ($_bakwgmlkjn69h2u8.contains(startTable, finishTable)) {
            var ancestorCells = $_yn4aam3jn69h2wv.ancestors(finish, 'td,th', getIsRoot(startTable));
            var finishCell = ancestorCells.length > 0 ? ancestorCells[ancestorCells.length - 1] : finish;
            return Option.some(identified({
              boxes: $_3zs6bkmxjn69h38h.nestedIntercepts(startTable, start, startTable, finish, finishTable),
              start: start,
              finish: finishCell
            }));
          } else if ($_bakwgmlkjn69h2u8.contains(finishTable, startTable)) {
            var ancestorCells = $_yn4aam3jn69h2wv.ancestors(start, 'td,th', getIsRoot(finishTable));
            var startCell = ancestorCells.length > 0 ? ancestorCells[ancestorCells.length - 1] : start;
            return Option.some(identified({
              boxes: $_3zs6bkmxjn69h38h.nestedIntercepts(finishTable, start, startTable, finish, finishTable),
              start: start,
              finish: startCell
            }));
          } else {
            return $_491cfnmqjn69h35i.ancestors(start, finish).shared().bind(function (lca) {
              return $_72t5xvm6jn69h2xa.closest(lca, 'table', isRoot).bind(function (lcaTable) {
                var finishAncestorCells = $_yn4aam3jn69h2wv.ancestors(finish, 'td,th', getIsRoot(lcaTable));
                var finishCell = finishAncestorCells.length > 0 ? finishAncestorCells[finishAncestorCells.length - 1] : finish;
                var startAncestorCells = $_yn4aam3jn69h2wv.ancestors(start, 'td,th', getIsRoot(lcaTable));
                var startCell = startAncestorCells.length > 0 ? startAncestorCells[startAncestorCells.length - 1] : start;
                return Option.some(identified({
                  boxes: $_3zs6bkmxjn69h38h.nestedIntercepts(lcaTable, start, startTable, finish, finishTable),
                  start: startCell,
                  finish: finishCell
                }));
              });
            });
          }
        });
      });
    }
  };
  var retrieve = function (container, selector) {
    var sels = $_yn4aam3jn69h2wv.descendants(container, selector);
    return sels.length > 0 ? Option.some(sels) : Option.none();
  };
  var getLast = function (boxes, lastSelectedSelector) {
    return find(boxes, function (box) {
      return $_ez7xfelejn69h2sh.is(box, lastSelectedSelector);
    });
  };
  var getEdges = function (container, firstSelectedSelector, lastSelectedSelector) {
    return $_72t5xvm6jn69h2xa.descendant(container, firstSelectedSelector).bind(function (first) {
      return $_72t5xvm6jn69h2xa.descendant(container, lastSelectedSelector).bind(function (last$$1) {
        return $_491cfnmqjn69h35i.sharedOne(lookupTable, [
          first,
          last$$1
        ]).map(function (tbl) {
          return {
            first: constant(first),
            last: constant(last$$1),
            table: constant(tbl)
          };
        });
      });
    });
  };
  var expandTo = function (finish, firstSelectedSelector) {
    return $_72t5xvm6jn69h2xa.ancestor(finish, 'table').bind(function (table) {
      return $_72t5xvm6jn69h2xa.descendant(table, firstSelectedSelector).bind(function (start) {
        return identify(start, finish).bind(function (identified) {
          return identified.boxes().map(function (boxes) {
            return {
              boxes: constant(boxes),
              start: constant(identified.start()),
              finish: constant(identified.finish())
            };
          });
        });
      });
    });
  };
  var shiftSelection = function (boxes, deltaRow, deltaColumn, firstSelectedSelector, lastSelectedSelector) {
    return getLast(boxes, lastSelectedSelector).bind(function (last$$1) {
      return $_3zs6bkmxjn69h38h.moveBy(last$$1, deltaRow, deltaColumn).bind(function (finish) {
        return expandTo(finish, firstSelectedSelector);
      });
    });
  };
  var $_f993ojmpjn69h348 = {
    identify: identify,
    retrieve: retrieve,
    shiftSelection: shiftSelection,
    getEdges: getEdges
  };

  var retrieve$1 = function (container, selector) {
    return $_f993ojmpjn69h348.retrieve(container, selector);
  };
  var retrieveBox = function (container, firstSelectedSelector, lastSelectedSelector) {
    return $_f993ojmpjn69h348.getEdges(container, firstSelectedSelector, lastSelectedSelector).bind(function (edges) {
      var isRoot = function (ancestor) {
        return $_bakwgmlkjn69h2u8.eq(container, ancestor);
      };
      var firstAncestor = $_72t5xvm6jn69h2xa.ancestor(edges.first(), 'thead,tfoot,tbody,table', isRoot);
      var lastAncestor = $_72t5xvm6jn69h2xa.ancestor(edges.last(), 'thead,tfoot,tbody,table', isRoot);
      return firstAncestor.bind(function (fA) {
        return lastAncestor.bind(function (lA) {
          return $_bakwgmlkjn69h2u8.eq(fA, lA) ? $_3zs6bkmxjn69h38h.getBox(edges.table(), edges.first(), edges.last()) : Option.none();
        });
      });
    });
  };
  var $_omj7fmojn69h33s = {
    retrieve: retrieve$1,
    retrieveBox: retrieveBox
  };

  var selected = 'data-mce-selected';
  var selectedSelector = 'td[' + selected + '],th[' + selected + ']';
  var attributeSelector = '[' + selected + ']';
  var firstSelected = 'data-mce-first-selected';
  var firstSelectedSelector = 'td[' + firstSelected + '],th[' + firstSelected + ']';
  var lastSelected = 'data-mce-last-selected';
  var lastSelectedSelector = 'td[' + lastSelected + '],th[' + lastSelected + ']';
  var $_g5o9f4n1jn69h39s = {
    selected: constant(selected),
    selectedSelector: constant(selectedSelector),
    attributeSelector: constant(attributeSelector),
    firstSelected: constant(firstSelected),
    firstSelectedSelector: constant(firstSelectedSelector),
    lastSelected: constant(lastSelected),
    lastSelectedSelector: constant(lastSelectedSelector)
  };

  var generate$1 = function (cases) {
    if (!isArray(cases)) {
      throw new Error('cases must be an array');
    }
    if (cases.length === 0) {
      throw new Error('there must be at least one case');
    }
    var constructors = [];
    var adt = {};
    each(cases, function (acase, count) {
      var keys$$1 = keys(acase);
      if (keys$$1.length !== 1) {
        throw new Error('one and only one name per case');
      }
      var key = keys$$1[0];
      var value = acase[key];
      if (adt[key] !== undefined) {
        throw new Error('duplicate key detected:' + key);
      } else if (key === 'cata') {
        throw new Error('cannot have a case named cata (sorry)');
      } else if (!isArray(value)) {
        throw new Error('case arguments must be an array');
      }
      constructors.push(key);
      adt[key] = function () {
        var argLength = arguments.length;
        if (argLength !== value.length) {
          throw new Error('Wrong number of arguments to case ' + key + '. Expected ' + value.length + ' (' + value + '), got ' + argLength);
        }
        var args = new Array(argLength);
        for (var i = 0; i < args.length; i++)
          args[i] = arguments[i];
        var match = function (branches) {
          var branchKeys = keys(branches);
          if (constructors.length !== branchKeys.length) {
            throw new Error('Wrong number of arguments to match. Expected: ' + constructors.join(',') + '\nActual: ' + branchKeys.join(','));
          }
          var allReqd = forall(constructors, function (reqKey) {
            return contains(branchKeys, reqKey);
          });
          if (!allReqd)
            throw new Error('Not all branches were specified when using match. Specified: ' + branchKeys.join(', ') + '\nRequired: ' + constructors.join(', '));
          return branches[key].apply(null, args);
        };
        return {
          fold: function () {
            if (arguments.length !== cases.length) {
              throw new Error('Wrong number of arguments to fold. Expected ' + cases.length + ', got ' + arguments.length);
            }
            var target = arguments[count];
            return target.apply(null, args);
          },
          match: match,
          log: function (label) {
            console.log(label, {
              constructors: constructors,
              constructor: key,
              params: args
            });
          }
        };
      };
    });
    return adt;
  };
  var Adt = { generate: generate$1 };

  var type$1 = Adt.generate([
    { none: [] },
    { multiple: ['elements'] },
    { single: ['selection'] }
  ]);
  var cata = function (subject, onNone, onMultiple, onSingle) {
    return subject.fold(onNone, onMultiple, onSingle);
  };
  var $_85mzexn2jn69h39s = {
    cata: cata,
    none: type$1.none,
    multiple: type$1.multiple,
    single: type$1.single
  };

  var selection = function (cell, selections) {
    return $_85mzexn2jn69h39s.cata(selections.get(), constant([]), identity, constant([cell]));
  };
  var unmergable = function (cell, selections) {
    var hasSpan = function (elem) {
      return $_567jlzm1jn69h2wf.has(elem, 'rowspan') && parseInt($_567jlzm1jn69h2wf.get(elem, 'rowspan'), 10) > 1 || $_567jlzm1jn69h2wf.has(elem, 'colspan') && parseInt($_567jlzm1jn69h2wf.get(elem, 'colspan'), 10) > 1;
    };
    var candidates = selection(cell, selections);
    return candidates.length > 0 && forall(candidates, hasSpan) ? Option.some(candidates) : Option.none();
  };
  var mergable = function (table, selections) {
    return $_85mzexn2jn69h39s.cata(selections.get(), Option.none, function (cells, _env) {
      if (cells.length === 0) {
        return Option.none();
      }
      return $_omj7fmojn69h33s.retrieveBox(table, $_g5o9f4n1jn69h39s.firstSelectedSelector(), $_g5o9f4n1jn69h39s.lastSelectedSelector()).bind(function (bounds) {
        return cells.length > 1 ? Option.some({
          bounds: constant(bounds),
          cells: constant(cells)
        }) : Option.none();
      });
    }, Option.none);
  };
  var $_8slyghmnjn69h33c = {
    mergable: mergable,
    unmergable: unmergable,
    selection: selection
  };

  var noMenu = function (cell) {
    return {
      element: constant(cell),
      mergable: Option.none,
      unmergable: Option.none,
      selection: constant([cell])
    };
  };
  var forMenu = function (selections, table, cell) {
    return {
      element: constant(cell),
      mergable: constant($_8slyghmnjn69h33c.mergable(table, selections)),
      unmergable: constant($_8slyghmnjn69h33c.unmergable(cell, selections)),
      selection: constant($_8slyghmnjn69h33c.selection(cell, selections))
    };
  };
  var notCell$1 = function (element) {
    return noMenu(element);
  };
  var paste$1 = Immutable('element', 'clipboard', 'generators');
  var pasteRows = function (selections, table, cell, clipboard, generators) {
    return {
      element: constant(cell),
      mergable: Option.none,
      unmergable: Option.none,
      selection: constant($_8slyghmnjn69h33c.selection(cell, selections)),
      clipboard: constant(clipboard),
      generators: constant(generators)
    };
  };
  var $_8an0jemmjn69h32x = {
    noMenu: noMenu,
    forMenu: forMenu,
    notCell: notCell$1,
    paste: paste$1,
    pasteRows: pasteRows
  };

  var extractSelected = function (cells) {
    return $_2j92l5lcjn69h2r3.table(cells[0]).map($_9sp4womgjn69h31w.deep).map(function (replica) {
      return [$_7v97jql4jn69h2op.extract(replica, $_g5o9f4n1jn69h39s.attributeSelector())];
    });
  };
  var serializeElement = function (editor, elm) {
    return editor.selection.serializer.serialize(elm.dom(), {});
  };
  var registerEvents = function (editor, selections, actions, cellSelection) {
    editor.on('BeforeGetContent', function (e) {
      var multiCellContext = function (cells) {
        e.preventDefault();
        extractSelected(cells).each(function (elements) {
          e.content = map(elements, function (elm) {
            return serializeElement(editor, elm);
          }).join('');
        });
      };
      if (e.selection === true) {
        $_85mzexn2jn69h39s.cata(selections.get(), noop, multiCellContext, noop);
      }
    });
    editor.on('BeforeSetContent', function (e) {
      if (e.selection === true && e.paste === true) {
        var cellOpt = Option.from(editor.dom.getParent(editor.selection.getStart(), 'th,td'));
        cellOpt.each(function (domCell) {
          var cell = Element$$1.fromDom(domCell);
          var table = $_2j92l5lcjn69h2r3.table(cell);
          table.bind(function (table) {
            var elements = filter($_6dzec3mljn69h32x.fromHtml(e.content), function (content) {
              return $_5f9i72m2jn69h2wv.name(content) !== 'meta';
            });
            if (elements.length === 1 && $_5f9i72m2jn69h2wv.name(elements[0]) === 'table') {
              e.preventDefault();
              var doc = Element$$1.fromDom(editor.getDoc());
              var generators = $_8b35ttmfjn69h30m.paste(doc);
              var targets = $_8an0jemmjn69h32x.paste(cell, elements[0], generators);
              actions.pasteCells(table, targets).each(function (rng) {
                editor.selection.setRng(rng);
                editor.focus();
                cellSelection.clear(table);
              });
            }
          });
        });
      }
    });
  };
  var $_2htigkkzjn69h2mu = { registerEvents: registerEvents };

  function Dimension (name, getOffset) {
    var set = function (element, h) {
      if (!isNumber(h) && !h.match(/^[0-9]+$/))
        throw name + '.set accepts only positive integer values. Value was ' + h;
      var dom = element.dom();
      if ($_7lzvi2mbjn69h306.isSupported(dom))
        dom.style[name] = h + 'px';
    };
    var get = function (element) {
      var r = getOffset(element);
      if (r <= 0 || r === null) {
        var css = $_6q24dgmajn69h2zq.get(element, name);
        return parseFloat(css) || 0;
      }
      return r;
    };
    var getOuter = get;
    var aggregate = function (element, properties) {
      return foldl(properties, function (acc, property) {
        var val = $_6q24dgmajn69h2zq.get(element, property);
        var value = val === undefined ? 0 : parseInt(val, 10);
        return isNaN(value) ? acc : acc + value;
      }, 0);
    };
    var max = function (element, value, properties) {
      var cumulativeInclusions = aggregate(element, properties);
      var absoluteMax = value > cumulativeInclusions ? value - cumulativeInclusions : 0;
      return absoluteMax;
    };
    return {
      set: set,
      get: get,
      getOuter: getOuter,
      aggregate: aggregate,
      max: max
    };
  }

  var api$1 = Dimension('height', function (element) {
    var dom = element.dom();
    return $_f5xfqwm5jn69h2xa.inBody(element) ? dom.getBoundingClientRect().height : dom.offsetHeight;
  });
  var set$3 = function (element, h) {
    api$1.set(element, h);
  };
  var get$4 = function (element) {
    return api$1.get(element);
  };
  var getOuter = function (element) {
    return api$1.getOuter(element);
  };
  var setMax = function (element, value) {
    var inclusions = [
      'margin-top',
      'border-top-width',
      'padding-top',
      'padding-bottom',
      'border-bottom-width',
      'margin-bottom'
    ];
    var absMax = api$1.max(element, value, inclusions);
    $_6q24dgmajn69h2zq.set(element, 'max-height', absMax + 'px');
  };
  var $_8uw1xhn8jn69h3c6 = {
    set: set$3,
    get: get$4,
    getOuter: getOuter,
    setMax: setMax
  };

  var api$2 = Dimension('width', function (element) {
    return element.dom().offsetWidth;
  });
  var set$4 = function (element, h) {
    api$2.set(element, h);
  };
  var get$5 = function (element) {
    return api$2.get(element);
  };
  var getOuter$1 = function (element) {
    return api$2.getOuter(element);
  };
  var setMax$1 = function (element, value) {
    var inclusions = [
      'margin-left',
      'border-left-width',
      'padding-left',
      'padding-right',
      'border-right-width',
      'margin-right'
    ];
    var absMax = api$2.max(element, value, inclusions);
    $_6q24dgmajn69h2zq.set(element, 'max-width', absMax + 'px');
  };
  var $_5fnbfbnajn69h3cs = {
    set: set$4,
    get: get$5,
    getOuter: getOuter$1,
    setMax: setMax$1
  };

  var platform = $_k0fj2lpjn69h2v3.detect();
  var needManualCalc = function () {
    return platform.browser.isIE() || platform.browser.isEdge();
  };
  var toNumber = function (px, fallback) {
    var num = parseFloat(px);
    return isNaN(num) ? fallback : num;
  };
  var getProp = function (elm, name, fallback) {
    return toNumber($_6q24dgmajn69h2zq.get(elm, name), fallback);
  };
  var getCalculatedHeight = function (cell) {
    var paddingTop = getProp(cell, 'padding-top', 0);
    var paddingBottom = getProp(cell, 'padding-bottom', 0);
    var borderTop = getProp(cell, 'border-top-width', 0);
    var borderBottom = getProp(cell, 'border-bottom-width', 0);
    var height = cell.dom().getBoundingClientRect().height;
    var boxSizing = $_6q24dgmajn69h2zq.get(cell, 'box-sizing');
    var borders = borderTop + borderBottom;
    return boxSizing === 'border-box' ? height : height - paddingTop - paddingBottom - borders;
  };
  var getWidth = function (cell) {
    return getProp(cell, 'width', $_5fnbfbnajn69h3cs.get(cell));
  };
  var getHeight = function (cell) {
    return needManualCalc() ? getCalculatedHeight(cell) : getProp(cell, 'height', $_8uw1xhn8jn69h3c6.get(cell));
  };
  var $_agrs5mn7jn69h3bq = {
    getWidth: getWidth,
    getHeight: getHeight
  };

  var genericSizeRegex = /(\d+(\.\d+)?)(\w|%)*/;
  var percentageBasedSizeRegex = /(\d+(\.\d+)?)%/;
  var pixelBasedSizeRegex = /(\d+(\.\d+)?)px|em/;
  var setPixelWidth = function (cell, amount) {
    $_6q24dgmajn69h2zq.set(cell, 'width', amount + 'px');
  };
  var setPercentageWidth = function (cell, amount) {
    $_6q24dgmajn69h2zq.set(cell, 'width', amount + '%');
  };
  var setHeight = function (cell, amount) {
    $_6q24dgmajn69h2zq.set(cell, 'height', amount + 'px');
  };
  var getHeightValue = function (cell) {
    return $_6q24dgmajn69h2zq.getRaw(cell, 'height').getOrThunk(function () {
      return $_agrs5mn7jn69h3bq.getHeight(cell) + 'px';
    });
  };
  var convert = function (cell, number, getter, setter) {
    var newSize = $_2j92l5lcjn69h2r3.table(cell).map(function (table) {
      var total = getter(table);
      return Math.floor(number / 100 * total);
    }).getOr(number);
    setter(cell, newSize);
    return newSize;
  };
  var normalizePixelSize = function (value, cell, getter, setter) {
    var number = parseInt(value, 10);
    return endsWith(value, '%') && $_5f9i72m2jn69h2wv.name(cell) !== 'table' ? convert(cell, number, getter, setter) : number;
  };
  var getTotalHeight = function (cell) {
    var value = getHeightValue(cell);
    if (!value)
      return $_8uw1xhn8jn69h3c6.get(cell);
    return normalizePixelSize(value, cell, $_8uw1xhn8jn69h3c6.get, setHeight);
  };
  var get$6 = function (cell, type, f) {
    var v = f(cell);
    var span = getSpan(cell, type);
    return v / span;
  };
  var getSpan = function (cell, type) {
    return $_567jlzm1jn69h2wf.has(cell, type) ? parseInt($_567jlzm1jn69h2wf.get(cell, type), 10) : 1;
  };
  var getRawWidth = function (element) {
    var cssWidth = $_6q24dgmajn69h2zq.getRaw(element, 'width');
    return cssWidth.fold(function () {
      return Option.from($_567jlzm1jn69h2wf.get(element, 'width'));
    }, function (width) {
      return Option.some(width);
    });
  };
  var normalizePercentageWidth = function (cellWidth, tableSize) {
    return cellWidth / tableSize.pixelWidth() * 100;
  };
  var choosePercentageSize = function (element, width, tableSize) {
    if (percentageBasedSizeRegex.test(width)) {
      var percentMatch = percentageBasedSizeRegex.exec(width);
      return parseFloat(percentMatch[1]);
    } else {
      var intWidth = $_5fnbfbnajn69h3cs.get(element);
      return normalizePercentageWidth(intWidth, tableSize);
    }
  };
  var getPercentageWidth = function (cell, tableSize) {
    var width = getRawWidth(cell);
    return width.fold(function () {
      var intWidth = $_5fnbfbnajn69h3cs.get(cell);
      return normalizePercentageWidth(intWidth, tableSize);
    }, function (width) {
      return choosePercentageSize(cell, width, tableSize);
    });
  };
  var normalizePixelWidth = function (cellWidth, tableSize) {
    return cellWidth / 100 * tableSize.pixelWidth();
  };
  var choosePixelSize = function (element, width, tableSize) {
    if (pixelBasedSizeRegex.test(width)) {
      var pixelMatch = pixelBasedSizeRegex.exec(width);
      return parseInt(pixelMatch[1], 10);
    } else if (percentageBasedSizeRegex.test(width)) {
      var percentMatch = percentageBasedSizeRegex.exec(width);
      var floatWidth = parseFloat(percentMatch[1]);
      return normalizePixelWidth(floatWidth, tableSize);
    } else {
      return $_5fnbfbnajn69h3cs.get(element);
    }
  };
  var getPixelWidth = function (cell, tableSize) {
    var width = getRawWidth(cell);
    return width.fold(function () {
      return $_5fnbfbnajn69h3cs.get(cell);
    }, function (width) {
      return choosePixelSize(cell, width, tableSize);
    });
  };
  var getHeight$1 = function (cell) {
    return get$6(cell, 'rowspan', getTotalHeight);
  };
  var getGenericWidth = function (cell) {
    var width = getRawWidth(cell);
    return width.bind(function (width) {
      if (genericSizeRegex.test(width)) {
        var match = genericSizeRegex.exec(width);
        return Option.some({
          width: constant(match[1]),
          unit: constant(match[3])
        });
      } else {
        return Option.none();
      }
    });
  };
  var setGenericWidth = function (cell, amount, unit) {
    $_6q24dgmajn69h2zq.set(cell, 'width', amount + unit);
  };
  var $_btfkcnn6jn69h3b1 = {
    percentageBasedSizeRegex: constant(percentageBasedSizeRegex),
    pixelBasedSizeRegex: constant(pixelBasedSizeRegex),
    setPixelWidth: setPixelWidth,
    setPercentageWidth: setPercentageWidth,
    setHeight: setHeight,
    getPixelWidth: getPixelWidth,
    getPercentageWidth: getPercentageWidth,
    getGenericWidth: getGenericWidth,
    setGenericWidth: setGenericWidth,
    getHeight: getHeight$1,
    getRawWidth: getRawWidth
  };

  var halve = function (main, other) {
    var width = $_btfkcnn6jn69h3b1.getGenericWidth(main);
    width.each(function (width) {
      var newWidth = width.width() / 2;
      $_btfkcnn6jn69h3b1.setGenericWidth(main, newWidth, width.unit());
      $_btfkcnn6jn69h3b1.setGenericWidth(other, newWidth, width.unit());
    });
  };
  var $_ec4gxsn5jn69h3ay = { halve: halve };

  var attached = function (element, scope) {
    var doc = scope || Element$$1.fromDom(document.documentElement);
    return $_3cgeam7jn69h2xq.ancestor(element, curry($_bakwgmlkjn69h2u8.eq, doc)).isSome();
  };
  var windowOf = function (element) {
    var dom = element.dom();
    if (dom === dom.window && element instanceof Window)
      return element;
    return $_5f9i72m2jn69h2wv.isDocument(element) ? dom.defaultView || dom.parentWindow : null;
  };
  var $_9w0jcsnfjn69h3dm = {
    attached: attached,
    windowOf: windowOf
  };

  var r = function (left, top) {
    var translate = function (x, y) {
      return r(left + x, top + y);
    };
    return {
      left: constant(left),
      top: constant(top),
      translate: translate
    };
  };
  var Position = r;

  var boxPosition = function (dom) {
    var box = dom.getBoundingClientRect();
    return Position(box.left, box.top);
  };
  var firstDefinedOrZero = function (a, b) {
    return a !== undefined ? a : b !== undefined ? b : 0;
  };
  var absolute = function (element) {
    var doc = element.dom().ownerDocument;
    var body = doc.body;
    var win = $_9w0jcsnfjn69h3dm.windowOf(Element$$1.fromDom(doc));
    var html = doc.documentElement;
    var scrollTop = firstDefinedOrZero(win.pageYOffset, html.scrollTop);
    var scrollLeft = firstDefinedOrZero(win.pageXOffset, html.scrollLeft);
    var clientTop = firstDefinedOrZero(html.clientTop, body.clientTop);
    var clientLeft = firstDefinedOrZero(html.clientLeft, body.clientLeft);
    return viewport(element).translate(scrollLeft - clientLeft, scrollTop - clientTop);
  };
  var relative = function (element) {
    var dom = element.dom();
    return Position(dom.offsetLeft, dom.offsetTop);
  };
  var viewport = function (element) {
    var dom = element.dom();
    var doc = dom.ownerDocument;
    var body = doc.body;
    var html = Element$$1.fromDom(doc.documentElement);
    if (body === dom)
      return Position(body.offsetLeft, body.offsetTop);
    if (!$_9w0jcsnfjn69h3dm.attached(element, html))
      return Position(0, 0);
    return boxPosition(dom);
  };
  var $_f0yf06nejn69h3d6 = {
    absolute: absolute,
    relative: relative,
    viewport: viewport
  };

  var rowInfo = Immutable('row', 'y');
  var colInfo = Immutable('col', 'x');
  var rtlEdge = function (cell) {
    var pos = $_f0yf06nejn69h3d6.absolute(cell);
    return pos.left() + $_5fnbfbnajn69h3cs.getOuter(cell);
  };
  var ltrEdge = function (cell) {
    return $_f0yf06nejn69h3d6.absolute(cell).left();
  };
  var getLeftEdge = function (index, cell) {
    return colInfo(index, ltrEdge(cell));
  };
  var getRightEdge = function (index, cell) {
    return colInfo(index, rtlEdge(cell));
  };
  var getTop = function (cell) {
    return $_f0yf06nejn69h3d6.absolute(cell).top();
  };
  var getTopEdge = function (index, cell) {
    return rowInfo(index, getTop(cell));
  };
  var getBottomEdge = function (index, cell) {
    return rowInfo(index, getTop(cell) + $_8uw1xhn8jn69h3c6.getOuter(cell));
  };
  var findPositions = function (getInnerEdge, getOuterEdge, array) {
    if (array.length === 0)
      return [];
    var lines = map(array.slice(1), function (cellOption, index) {
      return cellOption.map(function (cell) {
        return getInnerEdge(index, cell);
      });
    });
    var lastLine = array[array.length - 1].map(function (cell) {
      return getOuterEdge(array.length - 1, cell);
    });
    return lines.concat([lastLine]);
  };
  var negate = function (step, _table) {
    return -step;
  };
  var height = {
    delta: identity,
    positions: curry(findPositions, getTopEdge, getBottomEdge),
    edge: getTop
  };
  var ltr = {
    delta: identity,
    edge: ltrEdge,
    positions: curry(findPositions, getLeftEdge, getRightEdge)
  };
  var rtl = {
    delta: negate,
    edge: rtlEdge,
    positions: curry(findPositions, getRightEdge, getLeftEdge)
  };
  var $_2nobmpndjn69h3cy = {
    height: height,
    rtl: rtl,
    ltr: ltr
  };

  var $_7icorwncjn69h3cw = {
    ltr: $_2nobmpndjn69h3cy.ltr,
    rtl: $_2nobmpndjn69h3cy.rtl
  };

  function TableDirection (directionAt) {
    var auto = function (table) {
      return directionAt(table).isRtl() ? $_7icorwncjn69h3cw.rtl : $_7icorwncjn69h3cw.ltr;
    };
    var delta = function (amount, table) {
      return auto(table).delta(amount, table);
    };
    var positions = function (cols, table) {
      return auto(table).positions(cols, table);
    };
    var edge = function (cell) {
      return auto(cell).edge(cell);
    };
    return {
      delta: delta,
      edge: edge,
      positions: positions
    };
  }

  var getGridSize = function (table) {
    var input = $_94vxyjlajn69h2qb.fromTable(table);
    var warehouse = $_bvuq36m9jn69h2zb.generate(input);
    return warehouse.grid();
  };
  var $_dopgsnhjn69h3dm = { getGridSize: getGridSize };

  var Cell = function (initial) {
    var value = initial;
    var get = function () {
      return value;
    };
    var set = function (v) {
      value = v;
    };
    var clone = function () {
      return Cell(get());
    };
    return {
      get: get,
      set: set,
      clone: clone
    };
  };

  var base = function (handleUnsupported, required) {
    return baseWith(handleUnsupported, required, {
      validate: isFunction,
      label: 'function'
    });
  };
  var baseWith = function (handleUnsupported, required, pred) {
    if (required.length === 0)
      throw new Error('You must specify at least one required field.');
    validateStrArr('required', required);
    checkDupes(required);
    return function (obj) {
      var keys$$1 = keys(obj);
      var allReqd = forall(required, function (req) {
        return contains(keys$$1, req);
      });
      if (!allReqd)
        reqMessage(required, keys$$1);
      handleUnsupported(required, keys$$1);
      var invalidKeys = filter(required, function (key) {
        return !pred.validate(obj[key], key);
      });
      if (invalidKeys.length > 0)
        invalidTypeMessage(invalidKeys, pred.label);
      return obj;
    };
  };
  var handleExact = function (required, keys$$1) {
    var unsupported = filter(keys$$1, function (key) {
      return !contains(required, key);
    });
    if (unsupported.length > 0)
      unsuppMessage(unsupported);
  };
  var exactly = function (required) {
    return base(handleExact, required);
  };

  var elementToData = function (element) {
    var colspan = $_567jlzm1jn69h2wf.has(element, 'colspan') ? parseInt($_567jlzm1jn69h2wf.get(element, 'colspan'), 10) : 1;
    var rowspan = $_567jlzm1jn69h2wf.has(element, 'rowspan') ? parseInt($_567jlzm1jn69h2wf.get(element, 'rowspan'), 10) : 1;
    return {
      element: constant(element),
      colspan: constant(colspan),
      rowspan: constant(rowspan)
    };
  };
  var modification = function (generators, _toData) {
    contract(generators);
    var position = Cell(Option.none());
    var toData = _toData !== undefined ? _toData : elementToData;
    var nu = function (data) {
      return generators.cell(data);
    };
    var nuFrom = function (element) {
      var data = toData(element);
      return nu(data);
    };
    var add = function (element) {
      var replacement = nuFrom(element);
      if (position.get().isNone())
        position.set(Option.some(replacement));
      recent = Option.some({
        item: element,
        replacement: replacement
      });
      return replacement;
    };
    var recent = Option.none();
    var getOrInit = function (element, comparator) {
      return recent.fold(function () {
        return add(element);
      }, function (p) {
        return comparator(element, p.item) ? p.replacement : add(element);
      });
    };
    return {
      getOrInit: getOrInit,
      cursor: position.get
    };
  };
  var transform = function (scope, tag) {
    return function (generators) {
      var position = Cell(Option.none());
      contract(generators);
      var list = [];
      var find$$1 = function (element, comparator) {
        return find(list, function (x) {
          return comparator(x.item, element);
        });
      };
      var makeNew = function (element) {
        var cell = generators.replace(element, tag, { scope: scope });
        list.push({
          item: element,
          sub: cell
        });
        if (position.get().isNone())
          position.set(Option.some(cell));
        return cell;
      };
      var replaceOrInit = function (element, comparator) {
        return find$$1(element, comparator).fold(function () {
          return makeNew(element);
        }, function (p) {
          return comparator(element, p.item) ? p.sub : makeNew(element);
        });
      };
      return {
        replaceOrInit: replaceOrInit,
        cursor: position.get
      };
    };
  };
  var merging = function (generators) {
    contract(generators);
    var position = Cell(Option.none());
    var combine = function (cell) {
      if (position.get().isNone())
        position.set(Option.some(cell));
      return function () {
        var raw = generators.cell({
          element: constant(cell),
          colspan: constant(1),
          rowspan: constant(1)
        });
        $_6q24dgmajn69h2zq.remove(raw, 'width');
        $_6q24dgmajn69h2zq.remove(cell, 'width');
        return raw;
      };
    };
    return {
      combine: combine,
      cursor: position.get
    };
  };
  var contract = exactly([
    'cell',
    'row',
    'replace',
    'gap'
  ]);
  var $_ao1522njjn69h3f3 = {
    modification: modification,
    transform: transform,
    merging: merging
  };

  var blockList = [
    'body',
    'p',
    'div',
    'article',
    'aside',
    'figcaption',
    'figure',
    'footer',
    'header',
    'nav',
    'section',
    'ol',
    'ul',
    'table',
    'thead',
    'tfoot',
    'tbody',
    'caption',
    'tr',
    'td',
    'th',
    'h1',
    'h2',
    'h3',
    'h4',
    'h5',
    'h6',
    'blockquote',
    'pre',
    'address'
  ];
  var isList = function (universe, item) {
    var tagName = universe.property().name(item);
    return contains([
      'ol',
      'ul'
    ], tagName);
  };
  var isBlock = function (universe, item) {
    var tagName = universe.property().name(item);
    return contains(blockList, tagName);
  };
  var isFormatting = function (universe, item) {
    var tagName = universe.property().name(item);
    return contains([
      'address',
      'pre',
      'p',
      'h1',
      'h2',
      'h3',
      'h4',
      'h5',
      'h6'
    ], tagName);
  };
  var isHeading = function (universe, item) {
    var tagName = universe.property().name(item);
    return contains([
      'h1',
      'h2',
      'h3',
      'h4',
      'h5',
      'h6'
    ], tagName);
  };
  var isContainer = function (universe, item) {
    return contains([
      'div',
      'li',
      'td',
      'th',
      'blockquote',
      'body',
      'caption'
    ], universe.property().name(item));
  };
  var isEmptyTag = function (universe, item) {
    return contains([
      'br',
      'img',
      'hr',
      'input'
    ], universe.property().name(item));
  };
  var isFrame = function (universe, item) {
    return universe.property().name(item) === 'iframe';
  };
  var isInline = function (universe, item) {
    return !(isBlock(universe, item) || isEmptyTag(universe, item)) && universe.property().name(item) !== 'li';
  };
  var $_zw3sjnojn69h3ht = {
    isBlock: isBlock,
    isList: isList,
    isFormatting: isFormatting,
    isHeading: isHeading,
    isContainer: isContainer,
    isEmptyTag: isEmptyTag,
    isFrame: isFrame,
    isInline: isInline
  };

  var universe$1 = DomUniverse();
  var isBlock$1 = function (element) {
    return $_zw3sjnojn69h3ht.isBlock(universe$1, element);
  };
  var isList$1 = function (element) {
    return $_zw3sjnojn69h3ht.isList(universe$1, element);
  };
  var isFormatting$1 = function (element) {
    return $_zw3sjnojn69h3ht.isFormatting(universe$1, element);
  };
  var isHeading$1 = function (element) {
    return $_zw3sjnojn69h3ht.isHeading(universe$1, element);
  };
  var isContainer$1 = function (element) {
    return $_zw3sjnojn69h3ht.isContainer(universe$1, element);
  };
  var isEmptyTag$1 = function (element) {
    return $_zw3sjnojn69h3ht.isEmptyTag(universe$1, element);
  };
  var isFrame$1 = function (element) {
    return $_zw3sjnojn69h3ht.isFrame(universe$1, element);
  };
  var isInline$1 = function (element) {
    return $_zw3sjnojn69h3ht.isInline(universe$1, element);
  };
  var $_ae1woxnnjn69h3ht = {
    isBlock: isBlock$1,
    isList: isList$1,
    isFormatting: isFormatting$1,
    isHeading: isHeading$1,
    isContainer: isContainer$1,
    isEmptyTag: isEmptyTag$1,
    isFrame: isFrame$1,
    isInline: isInline$1
  };

  var merge = function (cells) {
    var isBr = function (el) {
      return $_5f9i72m2jn69h2wv.name(el) === 'br';
    };
    var advancedBr = function (children) {
      return forall(children, function (c) {
        return isBr(c) || $_5f9i72m2jn69h2wv.isText(c) && $_eo2rq0mjjn69h32m.get(c).trim().length === 0;
      });
    };
    var isListItem = function (el) {
      return $_5f9i72m2jn69h2wv.name(el) === 'li' || $_3cgeam7jn69h2xq.ancestor(el, $_ae1woxnnjn69h3ht.isList).isSome();
    };
    var siblingIsBlock = function (el) {
      return $_g3g38plijn69h2tc.nextSibling(el).map(function (rightSibling) {
        if ($_ae1woxnnjn69h3ht.isBlock(rightSibling))
          return true;
        if ($_ae1woxnnjn69h3ht.isEmptyTag(rightSibling)) {
          return $_5f9i72m2jn69h2wv.name(rightSibling) === 'img' ? false : true;
        }
      }).getOr(false);
    };
    var markCell = function (cell) {
      return $_c4imwkmhjn69h31w.last(cell).bind(function (rightEdge) {
        var rightSiblingIsBlock = siblingIsBlock(rightEdge);
        return $_g3g38plijn69h2tc.parent(rightEdge).map(function (parent) {
          return rightSiblingIsBlock === true || isListItem(parent) || isBr(rightEdge) || $_ae1woxnnjn69h3ht.isBlock(parent) && !$_bakwgmlkjn69h2u8.eq(cell, parent) ? [] : [Element$$1.fromTag('br')];
        });
      }).getOr([]);
    };
    var markContent = function () {
      var content = bind(cells, function (cell) {
        var children = $_g3g38plijn69h2tc.children(cell);
        return advancedBr(children) ? [] : children.concat(markCell(cell));
      });
      return content.length === 0 ? [Element$$1.fromTag('br')] : content;
    };
    var contents = markContent();
    $_69icwdmdjn69h306.empty(cells[0]);
    $_cys2y3mejn69h30m.append(cells[0], contents);
  };
  var $_58tytinmjn69h3g1 = { merge: merge };

  var hasOwnProperty$1 = Object.prototype.hasOwnProperty;
  var shallow$1 = function (old, nu) {
    return nu;
  };
  var baseMerge = function (merger) {
    return function () {
      var objects = new Array(arguments.length);
      for (var i = 0; i < objects.length; i++)
        objects[i] = arguments[i];
      if (objects.length === 0)
        throw new Error('Can\'t merge zero objects');
      var ret = {};
      for (var j = 0; j < objects.length; j++) {
        var curObject = objects[j];
        for (var key in curObject)
          if (hasOwnProperty$1.call(curObject, key)) {
            ret[key] = merger(ret[key], curObject[key]);
          }
      }
      return ret;
    };
  };

  var merge$1 = baseMerge(shallow$1);

  var cat = function (arr) {
    var r = [];
    var push = function (x) {
      r.push(x);
    };
    for (var i = 0; i < arr.length; i++) {
      arr[i].each(push);
    }
    return r;
  };
  var findMap = function (arr, f) {
    for (var i = 0; i < arr.length; i++) {
      var r = f(arr[i], i);
      if (r.isSome()) {
        return r;
      }
    }
    return Option.none();
  };

  var addCell = function (gridRow, index, cell) {
    var cells = gridRow.cells();
    var before = cells.slice(0, index);
    var after = cells.slice(index);
    var newCells = before.concat([cell]).concat(after);
    return setCells(gridRow, newCells);
  };
  var mutateCell = function (gridRow, index, cell) {
    var cells = gridRow.cells();
    cells[index] = cell;
  };
  var setCells = function (gridRow, cells) {
    return $_dbc0gblbjn69h2qy.rowcells(cells, gridRow.section());
  };
  var mapCells = function (gridRow, f) {
    var cells = gridRow.cells();
    var r = map(cells, f);
    return $_dbc0gblbjn69h2qy.rowcells(r, gridRow.section());
  };
  var getCell = function (gridRow, index) {
    return gridRow.cells()[index];
  };
  var getCellElement = function (gridRow, index) {
    return getCell(gridRow, index).element();
  };
  var cellLength = function (gridRow) {
    return gridRow.cells().length;
  };
  var $_fijup0nujn69h3k7 = {
    addCell: addCell,
    setCells: setCells,
    mutateCell: mutateCell,
    getCell: getCell,
    getCellElement: getCellElement,
    mapCells: mapCells,
    cellLength: cellLength
  };

  var getColumn = function (grid, index) {
    return map(grid, function (row) {
      return $_fijup0nujn69h3k7.getCell(row, index);
    });
  };
  var getRow = function (grid, index) {
    return grid[index];
  };
  var findDiff = function (xs, comp) {
    if (xs.length === 0)
      return 0;
    var first = xs[0];
    var index = findIndex(xs, function (x) {
      return !comp(first.element(), x.element());
    });
    return index.fold(function () {
      return xs.length;
    }, function (ind) {
      return ind;
    });
  };
  var subgrid = function (grid, row, column, comparator) {
    var restOfRow = getRow(grid, row).cells().slice(column);
    var endColIndex = findDiff(restOfRow, comparator);
    var restOfColumn = getColumn(grid, column).slice(row);
    var endRowIndex = findDiff(restOfColumn, comparator);
    return {
      colspan: constant(endColIndex),
      rowspan: constant(endRowIndex)
    };
  };
  var $_fu53qsntjn69h3jr = { subgrid: subgrid };

  var toDetails = function (grid, comparator) {
    var seen = map(grid, function (row, ri) {
      return map(row.cells(), function (col, ci) {
        return false;
      });
    });
    var updateSeen = function (ri, ci, rowspan, colspan) {
      for (var r = ri; r < ri + rowspan; r++) {
        for (var c = ci; c < ci + colspan; c++) {
          seen[r][c] = true;
        }
      }
    };
    return map(grid, function (row, ri) {
      var details = bind(row.cells(), function (cell, ci) {
        if (seen[ri][ci] === false) {
          var result = $_fu53qsntjn69h3jr.subgrid(grid, ri, ci, comparator);
          updateSeen(ri, ci, result.rowspan(), result.colspan());
          return [$_dbc0gblbjn69h2qy.detailnew(cell.element(), result.rowspan(), result.colspan(), cell.isNew())];
        } else {
          return [];
        }
      });
      return $_dbc0gblbjn69h2qy.rowdetails(details, row.section());
    });
  };
  var toGrid = function (warehouse, generators, isNew) {
    var grid = [];
    for (var i = 0; i < warehouse.grid().rows(); i++) {
      var rowCells = [];
      for (var j = 0; j < warehouse.grid().columns(); j++) {
        var element = $_bvuq36m9jn69h2zb.getAt(warehouse, i, j).map(function (item) {
          return $_dbc0gblbjn69h2qy.elementnew(item.element(), isNew);
        }).getOrThunk(function () {
          return $_dbc0gblbjn69h2qy.elementnew(generators.gap(), true);
        });
        rowCells.push(element);
      }
      var row = $_dbc0gblbjn69h2qy.rowcells(rowCells, warehouse.all()[i].section());
      grid.push(row);
    }
    return grid;
  };
  var $_5qp29fnsjn69h3jr = {
    toDetails: toDetails,
    toGrid: toGrid
  };

  var setIfNot = function (element, property, value, ignore) {
    if (value === ignore)
      $_567jlzm1jn69h2wf.remove(element, property);
    else
      $_567jlzm1jn69h2wf.set(element, property, value);
  };
  var render = function (table, grid) {
    var newRows = [];
    var newCells = [];
    var renderSection = function (gridSection, sectionName) {
      var section = $_72t5xvm6jn69h2xa.child(table, sectionName).getOrThunk(function () {
        var tb = Element$$1.fromTag(sectionName, $_g3g38plijn69h2tc.owner(table).dom());
        $_6szxhjmcjn69h306.append(table, tb);
        return tb;
      });
      $_69icwdmdjn69h306.empty(section);
      var rows = map(gridSection, function (row) {
        if (row.isNew()) {
          newRows.push(row.element());
        }
        var tr = row.element();
        $_69icwdmdjn69h306.empty(tr);
        each(row.cells(), function (cell) {
          if (cell.isNew()) {
            newCells.push(cell.element());
          }
          setIfNot(cell.element(), 'colspan', cell.colspan(), 1);
          setIfNot(cell.element(), 'rowspan', cell.rowspan(), 1);
          $_6szxhjmcjn69h306.append(tr, cell.element());
        });
        return tr;
      });
      $_cys2y3mejn69h30m.append(section, rows);
    };
    var removeSection = function (sectionName) {
      $_72t5xvm6jn69h2xa.child(table, sectionName).each($_69icwdmdjn69h306.remove);
    };
    var renderOrRemoveSection = function (gridSection, sectionName) {
      if (gridSection.length > 0) {
        renderSection(gridSection, sectionName);
      } else {
        removeSection(sectionName);
      }
    };
    var headSection = [];
    var bodySection = [];
    var footSection = [];
    each(grid, function (row) {
      switch (row.section()) {
      case 'thead':
        headSection.push(row);
        break;
      case 'tbody':
        bodySection.push(row);
        break;
      case 'tfoot':
        footSection.push(row);
        break;
      }
    });
    renderOrRemoveSection(headSection, 'thead');
    renderOrRemoveSection(bodySection, 'tbody');
    renderOrRemoveSection(footSection, 'tfoot');
    return {
      newRows: constant(newRows),
      newCells: constant(newCells)
    };
  };
  var copy$2 = function (grid) {
    var rows = map(grid, function (row) {
      var tr = $_9sp4womgjn69h31w.shallow(row.element());
      each(row.cells(), function (cell) {
        var clonedCell = $_9sp4womgjn69h31w.deep(cell.element());
        setIfNot(clonedCell, 'colspan', cell.colspan(), 1);
        setIfNot(clonedCell, 'rowspan', cell.rowspan(), 1);
        $_6szxhjmcjn69h306.append(tr, clonedCell);
      });
      return tr;
    });
    return rows;
  };
  var $_72jmzlnvjn69h3kw = {
    render: render,
    copy: copy$2
  };

  var repeat = function (repititions, f) {
    var r = [];
    for (var i = 0; i < repititions; i++) {
      r.push(f(i));
    }
    return r;
  };
  var range$1 = function (start, end) {
    var r = [];
    for (var i = start; i < end; i++) {
      r.push(i);
    }
    return r;
  };
  var unique = function (xs, comparator) {
    var result = [];
    each(xs, function (x, i) {
      if (i < xs.length - 1 && !comparator(x, xs[i + 1])) {
        result.push(x);
      } else if (i === xs.length - 1) {
        result.push(x);
      }
    });
    return result;
  };
  var deduce = function (xs, index) {
    if (index < 0 || index >= xs.length - 1)
      return Option.none();
    var current = xs[index].fold(function () {
      var rest = reverse(xs.slice(0, index));
      return findMap(rest, function (a, i) {
        return a.map(function (aa) {
          return {
            value: aa,
            delta: i + 1
          };
        });
      });
    }, function (c) {
      return Option.some({
        value: c,
        delta: 0
      });
    });
    var next = xs[index + 1].fold(function () {
      var rest = xs.slice(index + 1);
      return findMap(rest, function (a, i) {
        return a.map(function (aa) {
          return {
            value: aa,
            delta: i + 1
          };
        });
      });
    }, function (n) {
      return Option.some({
        value: n,
        delta: 1
      });
    });
    return current.bind(function (c) {
      return next.map(function (n) {
        var extras = n.delta + c.delta;
        return Math.abs(n.value - c.value) / extras;
      });
    });
  };
  var $_2kjjb1nyjn69h3or = {
    repeat: repeat,
    range: range$1,
    unique: unique,
    deduce: deduce
  };

  var columns = function (warehouse) {
    var grid = warehouse.grid();
    var cols = $_2kjjb1nyjn69h3or.range(0, grid.columns());
    var rows = $_2kjjb1nyjn69h3or.range(0, grid.rows());
    return map(cols, function (col) {
      var getBlock = function () {
        return bind(rows, function (r) {
          return $_bvuq36m9jn69h2zb.getAt(warehouse, r, col).filter(function (detail) {
            return detail.column() === col;
          }).fold(constant([]), function (detail) {
            return [detail];
          });
        });
      };
      var isSingle = function (detail) {
        return detail.colspan() === 1;
      };
      var getFallback = function () {
        return $_bvuq36m9jn69h2zb.getAt(warehouse, 0, col);
      };
      return decide(getBlock, isSingle, getFallback);
    });
  };
  var decide = function (getBlock, isSingle, getFallback) {
    var inBlock = getBlock();
    var singleInBlock = find(inBlock, isSingle);
    var detailOption = singleInBlock.orThunk(function () {
      return Option.from(inBlock[0]).orThunk(getFallback);
    });
    return detailOption.map(function (detail) {
      return detail.element();
    });
  };
  var rows$1 = function (warehouse) {
    var grid = warehouse.grid();
    var rows = $_2kjjb1nyjn69h3or.range(0, grid.rows());
    var cols = $_2kjjb1nyjn69h3or.range(0, grid.columns());
    return map(rows, function (row) {
      var getBlock = function () {
        return bind(cols, function (c) {
          return $_bvuq36m9jn69h2zb.getAt(warehouse, row, c).filter(function (detail) {
            return detail.row() === row;
          }).fold(constant([]), function (detail) {
            return [detail];
          });
        });
      };
      var isSingle = function (detail) {
        return detail.rowspan() === 1;
      };
      var getFallback = function () {
        return $_bvuq36m9jn69h2zb.getAt(warehouse, row, 0);
      };
      return decide(getBlock, isSingle, getFallback);
    });
  };
  var $_9jys2cnxjn69h3o0 = {
    columns: columns,
    rows: rows$1
  };

  var col = function (column, x, y, w, h) {
    var blocker = Element$$1.fromTag('div');
    $_6q24dgmajn69h2zq.setAll(blocker, {
      position: 'absolute',
      left: x - w / 2 + 'px',
      top: y + 'px',
      height: h + 'px',
      width: w + 'px'
    });
    $_567jlzm1jn69h2wf.setAll(blocker, {
      'data-column': column,
      'role': 'presentation'
    });
    return blocker;
  };
  var row$1 = function (row, x, y, w, h) {
    var blocker = Element$$1.fromTag('div');
    $_6q24dgmajn69h2zq.setAll(blocker, {
      position: 'absolute',
      left: x + 'px',
      top: y - h / 2 + 'px',
      height: h + 'px',
      width: w + 'px'
    });
    $_567jlzm1jn69h2wf.setAll(blocker, {
      'data-row': row,
      'role': 'presentation'
    });
    return blocker;
  };
  var $_486dnynzjn69h3pj = {
    col: col,
    row: row$1
  };

  var css = function (namespace) {
    var dashNamespace = namespace.replace(/\./g, '-');
    var resolve = function (str) {
      return dashNamespace + '-' + str;
    };
    return { resolve: resolve };
  };

  var styles = css('ephox-snooker');
  var $_9z63sio0jn69h3q2 = { resolve: styles.resolve };

  function Toggler (turnOff, turnOn, initial) {
    var active = initial || false;
    var on = function () {
      turnOn();
      active = true;
    };
    var off = function () {
      turnOff();
      active = false;
    };
    var toggle = function () {
      var f = active ? off : on;
      f();
    };
    var isOn = function () {
      return active;
    };
    return {
      on: on,
      off: off,
      toggle: toggle,
      isOn: isOn
    };
  }

  var read = function (element, attr) {
    var value = $_567jlzm1jn69h2wf.get(element, attr);
    return value === undefined || value === '' ? [] : value.split(' ');
  };
  var add = function (element, attr, id) {
    var old = read(element, attr);
    var nu = old.concat([id]);
    $_567jlzm1jn69h2wf.set(element, attr, nu.join(' '));
    return true;
  };
  var remove$3 = function (element, attr, id) {
    var nu = filter(read(element, attr), function (v) {
      return v !== id;
    });
    if (nu.length > 0)
      $_567jlzm1jn69h2wf.set(element, attr, nu.join(' '));
    else
      $_567jlzm1jn69h2wf.remove(element, attr);
    return false;
  };
  var $_2hx19so5jn69h3qk = {
    read: read,
    add: add,
    remove: remove$3
  };

  var supports = function (element) {
    return element.dom().classList !== undefined;
  };
  var get$7 = function (element) {
    return $_2hx19so5jn69h3qk.read(element, 'class');
  };
  var add$1 = function (element, clazz) {
    return $_2hx19so5jn69h3qk.add(element, 'class', clazz);
  };
  var remove$4 = function (element, clazz) {
    return $_2hx19so5jn69h3qk.remove(element, 'class', clazz);
  };
  var toggle = function (element, clazz) {
    if (contains(get$7(element), clazz)) {
      return remove$4(element, clazz);
    } else {
      return add$1(element, clazz);
    }
  };
  var $_f21cqro4jn69h3qe = {
    get: get$7,
    add: add$1,
    remove: remove$4,
    toggle: toggle,
    supports: supports
  };

  var add$2 = function (element, clazz) {
    if ($_f21cqro4jn69h3qe.supports(element))
      element.dom().classList.add(clazz);
    else
      $_f21cqro4jn69h3qe.add(element, clazz);
  };
  var cleanClass = function (element) {
    var classList = $_f21cqro4jn69h3qe.supports(element) ? element.dom().classList : $_f21cqro4jn69h3qe.get(element);
    if (classList.length === 0) {
      $_567jlzm1jn69h2wf.remove(element, 'class');
    }
  };
  var remove$5 = function (element, clazz) {
    if ($_f21cqro4jn69h3qe.supports(element)) {
      var classList = element.dom().classList;
      classList.remove(clazz);
    } else
      $_f21cqro4jn69h3qe.remove(element, clazz);
    cleanClass(element);
  };
  var toggle$1 = function (element, clazz) {
    return $_f21cqro4jn69h3qe.supports(element) ? element.dom().classList.toggle(clazz) : $_f21cqro4jn69h3qe.toggle(element, clazz);
  };
  var toggler = function (element, clazz) {
    var hasClasslist = $_f21cqro4jn69h3qe.supports(element);
    var classList = element.dom().classList;
    var off = function () {
      if (hasClasslist)
        classList.remove(clazz);
      else
        $_f21cqro4jn69h3qe.remove(element, clazz);
    };
    var on = function () {
      if (hasClasslist)
        classList.add(clazz);
      else
        $_f21cqro4jn69h3qe.add(element, clazz);
    };
    return Toggler(off, on, has$2(element, clazz));
  };
  var has$2 = function (element, clazz) {
    return $_f21cqro4jn69h3qe.supports(element) && element.dom().classList.contains(clazz);
  };
  var $_f2gsm6o2jn69h3q9 = {
    add: add$2,
    remove: remove$5,
    toggle: toggle$1,
    toggler: toggler,
    has: has$2
  };

  var resizeBar = $_9z63sio0jn69h3q2.resolve('resizer-bar');
  var resizeRowBar = $_9z63sio0jn69h3q2.resolve('resizer-rows');
  var resizeColBar = $_9z63sio0jn69h3q2.resolve('resizer-cols');
  var BAR_THICKNESS = 7;
  var clear = function (wire) {
    var previous = $_yn4aam3jn69h2wv.descendants(wire.parent(), '.' + resizeBar);
    each(previous, $_69icwdmdjn69h306.remove);
  };
  var drawBar = function (wire, positions, create) {
    var origin = wire.origin();
    each(positions, function (cpOption, i) {
      cpOption.each(function (cp) {
        var bar = create(origin, cp);
        $_f2gsm6o2jn69h3q9.add(bar, resizeBar);
        $_6szxhjmcjn69h306.append(wire.parent(), bar);
      });
    });
  };
  var refreshCol = function (wire, colPositions, position, tableHeight) {
    drawBar(wire, colPositions, function (origin, cp) {
      var colBar = $_486dnynzjn69h3pj.col(cp.col(), cp.x() - origin.left(), position.top() - origin.top(), BAR_THICKNESS, tableHeight);
      $_f2gsm6o2jn69h3q9.add(colBar, resizeColBar);
      return colBar;
    });
  };
  var refreshRow = function (wire, rowPositions, position, tableWidth) {
    drawBar(wire, rowPositions, function (origin, cp) {
      var rowBar = $_486dnynzjn69h3pj.row(cp.row(), position.left() - origin.left(), cp.y() - origin.top(), tableWidth, BAR_THICKNESS);
      $_f2gsm6o2jn69h3q9.add(rowBar, resizeRowBar);
      return rowBar;
    });
  };
  var refreshGrid = function (wire, table, rows, cols, hdirection, vdirection) {
    var position = $_f0yf06nejn69h3d6.absolute(table);
    var rowPositions = rows.length > 0 ? hdirection.positions(rows, table) : [];
    refreshRow(wire, rowPositions, position, $_5fnbfbnajn69h3cs.getOuter(table));
    var colPositions = cols.length > 0 ? vdirection.positions(cols, table) : [];
    refreshCol(wire, colPositions, position, $_8uw1xhn8jn69h3c6.getOuter(table));
  };
  var refresh = function (wire, table, hdirection, vdirection) {
    clear(wire);
    var list = $_94vxyjlajn69h2qb.fromTable(table);
    var warehouse = $_bvuq36m9jn69h2zb.generate(list);
    var rows = $_9jys2cnxjn69h3o0.rows(warehouse);
    var cols = $_9jys2cnxjn69h3o0.columns(warehouse);
    refreshGrid(wire, table, rows, cols, hdirection, vdirection);
  };
  var each$2 = function (wire, f) {
    var bars = $_yn4aam3jn69h2wv.descendants(wire.parent(), '.' + resizeBar);
    each(bars, f);
  };
  var hide = function (wire) {
    each$2(wire, function (bar) {
      $_6q24dgmajn69h2zq.set(bar, 'display', 'none');
    });
  };
  var show = function (wire) {
    each$2(wire, function (bar) {
      $_6q24dgmajn69h2zq.set(bar, 'display', 'block');
    });
  };
  var isRowBar = function (element) {
    return $_f2gsm6o2jn69h3q9.has(element, resizeRowBar);
  };
  var isColBar = function (element) {
    return $_f2gsm6o2jn69h3q9.has(element, resizeColBar);
  };
  var $_5d3blhnwjn69h3ma = {
    refresh: refresh,
    hide: hide,
    show: show,
    destroy: clear,
    isRowBar: isRowBar,
    isColBar: isColBar
  };

  var fromWarehouse = function (warehouse, generators) {
    return $_5qp29fnsjn69h3jr.toGrid(warehouse, generators, false);
  };
  var deriveRows = function (rendered, generators) {
    var findRow = function (details) {
      var rowOfCells = findMap(details, function (detail) {
        return $_g3g38plijn69h2tc.parent(detail.element()).map(function (row) {
          var isNew = $_g3g38plijn69h2tc.parent(row).isNone();
          return $_dbc0gblbjn69h2qy.elementnew(row, isNew);
        });
      });
      return rowOfCells.getOrThunk(function () {
        return $_dbc0gblbjn69h2qy.elementnew(generators.row(), true);
      });
    };
    return map(rendered, function (details) {
      var row = findRow(details.details());
      return $_dbc0gblbjn69h2qy.rowdatanew(row.element(), details.details(), details.section(), row.isNew());
    });
  };
  var toDetailList = function (grid, generators) {
    var rendered = $_5qp29fnsjn69h3jr.toDetails(grid, $_bakwgmlkjn69h2u8.eq);
    return deriveRows(rendered, generators);
  };
  var findInWarehouse = function (warehouse, element) {
    var all = flatten(map(warehouse.all(), function (r) {
      return r.cells();
    }));
    return find(all, function (e) {
      return $_bakwgmlkjn69h2u8.eq(element, e.element());
    });
  };
  var run = function (operation, extract, adjustment, postAction, genWrappers) {
    return function (wire, table, target, generators, direction) {
      var input = $_94vxyjlajn69h2qb.fromTable(table);
      var warehouse = $_bvuq36m9jn69h2zb.generate(input);
      var output = extract(warehouse, target).map(function (info) {
        var model = fromWarehouse(warehouse, generators);
        var result = operation(model, info, $_bakwgmlkjn69h2u8.eq, genWrappers(generators));
        var grid = toDetailList(result.grid(), generators);
        return {
          grid: constant(grid),
          cursor: result.cursor
        };
      });
      return output.fold(function () {
        return Option.none();
      }, function (out) {
        var newElements = $_72jmzlnvjn69h3kw.render(table, out.grid());
        adjustment(table, out.grid(), direction);
        postAction(table);
        $_5d3blhnwjn69h3ma.refresh(wire, table, $_2nobmpndjn69h3cy.height, direction);
        return Option.some({
          cursor: out.cursor,
          newRows: newElements.newRows,
          newCells: newElements.newCells
        });
      });
    };
  };
  var onCell = function (warehouse, target) {
    return $_2j92l5lcjn69h2r3.cell(target.element()).bind(function (cell) {
      return findInWarehouse(warehouse, cell);
    });
  };
  var onPaste = function (warehouse, target) {
    return $_2j92l5lcjn69h2r3.cell(target.element()).bind(function (cell) {
      return findInWarehouse(warehouse, cell).map(function (details) {
        return merge$1(details, {
          generators: target.generators,
          clipboard: target.clipboard
        });
      });
    });
  };
  var onPasteRows = function (warehouse, target) {
    var details = map(target.selection(), function (cell) {
      return $_2j92l5lcjn69h2r3.cell(cell).bind(function (lc) {
        return findInWarehouse(warehouse, lc);
      });
    });
    var cells = cat(details);
    return cells.length > 0 ? Option.some(merge$1({ cells: cells }, {
      generators: target.generators,
      clipboard: target.clipboard
    })) : Option.none();
  };
  var onMergable = function (warehouse, target) {
    return target.mergable();
  };
  var onUnmergable = function (warehouse, target) {
    return target.unmergable();
  };
  var onCells = function (warehouse, target) {
    var details = map(target.selection(), function (cell) {
      return $_2j92l5lcjn69h2r3.cell(cell).bind(function (lc) {
        return findInWarehouse(warehouse, lc);
      });
    });
    var cells = cat(details);
    return cells.length > 0 ? Option.some(cells) : Option.none();
  };
  var $_8xqe3enpjn69h3i9 = {
    run: run,
    toDetailList: toDetailList,
    onCell: onCell,
    onCells: onCells,
    onPaste: onPaste,
    onPasteRows: onPasteRows,
    onMergable: onMergable,
    onUnmergable: onUnmergable
  };

  var value$1 = function (o) {
    var is = function (v) {
      return o === v;
    };
    var or = function (opt) {
      return value$1(o);
    };
    var orThunk = function (f) {
      return value$1(o);
    };
    var map = function (f) {
      return value$1(f(o));
    };
    var each = function (f) {
      f(o);
    };
    var bind = function (f) {
      return f(o);
    };
    var fold = function (_, onValue) {
      return onValue(o);
    };
    var exists = function (f) {
      return f(o);
    };
    var forall = function (f) {
      return f(o);
    };
    var toOption = function () {
      return Option.some(o);
    };
    return {
      is: is,
      isValue: always,
      isError: never,
      getOr: constant(o),
      getOrThunk: constant(o),
      getOrDie: constant(o),
      or: or,
      orThunk: orThunk,
      fold: fold,
      map: map,
      each: each,
      bind: bind,
      exists: exists,
      forall: forall,
      toOption: toOption
    };
  };
  var error = function (message) {
    var getOrThunk = function (f) {
      return f();
    };
    var getOrDie = function () {
      return die(String(message))();
    };
    var or = function (opt) {
      return opt;
    };
    var orThunk = function (f) {
      return f();
    };
    var map = function (f) {
      return error(message);
    };
    var bind = function (f) {
      return error(message);
    };
    var fold = function (onError, _) {
      return onError(message);
    };
    return {
      is: never,
      isValue: never,
      isError: always,
      getOr: identity,
      getOrThunk: getOrThunk,
      getOrDie: getOrDie,
      or: or,
      orThunk: orThunk,
      fold: fold,
      map: map,
      each: noop,
      bind: bind,
      exists: never,
      forall: always,
      toOption: Option.none
    };
  };
  var Result = {
    value: value$1,
    error: error
  };

  var measure = function (startAddress, gridA, gridB) {
    if (startAddress.row() >= gridA.length || startAddress.column() > $_fijup0nujn69h3k7.cellLength(gridA[0]))
      return Result.error('invalid start address out of table bounds, row: ' + startAddress.row() + ', column: ' + startAddress.column());
    var rowRemainder = gridA.slice(startAddress.row());
    var colRemainder = rowRemainder[0].cells().slice(startAddress.column());
    var colRequired = $_fijup0nujn69h3k7.cellLength(gridB[0]);
    var rowRequired = gridB.length;
    return Result.value({
      rowDelta: constant(rowRemainder.length - rowRequired),
      colDelta: constant(colRemainder.length - colRequired)
    });
  };
  var measureWidth = function (gridA, gridB) {
    var colLengthA = $_fijup0nujn69h3k7.cellLength(gridA[0]);
    var colLengthB = $_fijup0nujn69h3k7.cellLength(gridB[0]);
    return {
      rowDelta: constant(0),
      colDelta: constant(colLengthA - colLengthB)
    };
  };
  var fill = function (cells, generator) {
    return map(cells, function () {
      return $_dbc0gblbjn69h2qy.elementnew(generator.cell(), true);
    });
  };
  var rowFill = function (grid, amount, generator) {
    return grid.concat($_2kjjb1nyjn69h3or.repeat(amount, function (_row) {
      return $_fijup0nujn69h3k7.setCells(grid[grid.length - 1], fill(grid[grid.length - 1].cells(), generator));
    }));
  };
  var colFill = function (grid, amount, generator) {
    return map(grid, function (row) {
      return $_fijup0nujn69h3k7.setCells(row, row.cells().concat(fill($_2kjjb1nyjn69h3or.range(0, amount), generator)));
    });
  };
  var tailor = function (gridA, delta, generator) {
    var fillCols = delta.colDelta() < 0 ? colFill : identity;
    var fillRows = delta.rowDelta() < 0 ? rowFill : identity;
    var modifiedCols = fillCols(gridA, Math.abs(delta.colDelta()), generator);
    var tailoredGrid = fillRows(modifiedCols, Math.abs(delta.rowDelta()), generator);
    return tailoredGrid;
  };
  var $_46kp02o7jn69h3qx = {
    measure: measure,
    measureWidth: measureWidth,
    tailor: tailor
  };

  var merge$2 = function (grid, bounds, comparator, substitution) {
    if (grid.length === 0)
      return grid;
    for (var i = bounds.startRow(); i <= bounds.finishRow(); i++) {
      for (var j = bounds.startCol(); j <= bounds.finishCol(); j++) {
        $_fijup0nujn69h3k7.mutateCell(grid[i], j, $_dbc0gblbjn69h2qy.elementnew(substitution(), false));
      }
    }
    return grid;
  };
  var unmerge = function (grid, target, comparator, substitution) {
    var first = true;
    for (var i = 0; i < grid.length; i++) {
      for (var j = 0; j < $_fijup0nujn69h3k7.cellLength(grid[0]); j++) {
        var current = $_fijup0nujn69h3k7.getCellElement(grid[i], j);
        var isToReplace = comparator(current, target);
        if (isToReplace === true && first === false) {
          $_fijup0nujn69h3k7.mutateCell(grid[i], j, $_dbc0gblbjn69h2qy.elementnew(substitution(), true));
        } else if (isToReplace === true) {
          first = false;
        }
      }
    }
    return grid;
  };
  var uniqueCells = function (row, comparator) {
    return foldl(row, function (rest, cell) {
      return exists(rest, function (currentCell) {
        return comparator(currentCell.element(), cell.element());
      }) ? rest : rest.concat([cell]);
    }, []);
  };
  var splitRows = function (grid, index, comparator, substitution) {
    if (index > 0 && index < grid.length) {
      var rowPrevCells = grid[index - 1].cells();
      var cells = uniqueCells(rowPrevCells, comparator);
      each(cells, function (cell) {
        var replacement = Option.none();
        for (var i = index; i < grid.length; i++) {
          for (var j = 0; j < $_fijup0nujn69h3k7.cellLength(grid[0]); j++) {
            var current = grid[i].cells()[j];
            var isToReplace = comparator(current.element(), cell.element());
            if (isToReplace) {
              if (replacement.isNone()) {
                replacement = Option.some(substitution());
              }
              replacement.each(function (sub) {
                $_fijup0nujn69h3k7.mutateCell(grid[i], j, $_dbc0gblbjn69h2qy.elementnew(sub, true));
              });
            }
          }
        }
      });
    }
    return grid;
  };
  var $_5u6cp5o9jn69h3r2 = {
    merge: merge$2,
    unmerge: unmerge,
    splitRows: splitRows
  };

  var isSpanning = function (grid, row, col, comparator) {
    var candidate = $_fijup0nujn69h3k7.getCell(grid[row], col);
    var matching = curry(comparator, candidate.element());
    var currentRow = grid[row];
    return grid.length > 1 && $_fijup0nujn69h3k7.cellLength(currentRow) > 1 && (col > 0 && matching($_fijup0nujn69h3k7.getCellElement(currentRow, col - 1)) || col < currentRow.length - 1 && matching($_fijup0nujn69h3k7.getCellElement(currentRow, col + 1)) || row > 0 && matching($_fijup0nujn69h3k7.getCellElement(grid[row - 1], col)) || row < grid.length - 1 && matching($_fijup0nujn69h3k7.getCellElement(grid[row + 1], col)));
  };
  var mergeTables = function (startAddress, gridA, gridB, generator, comparator) {
    var startRow = startAddress.row();
    var startCol = startAddress.column();
    var mergeHeight = gridB.length;
    var mergeWidth = $_fijup0nujn69h3k7.cellLength(gridB[0]);
    var endRow = startRow + mergeHeight;
    var endCol = startCol + mergeWidth;
    for (var r = startRow; r < endRow; r++) {
      for (var c = startCol; c < endCol; c++) {
        if (isSpanning(gridA, r, c, comparator)) {
          $_5u6cp5o9jn69h3r2.unmerge(gridA, $_fijup0nujn69h3k7.getCellElement(gridA[r], c), comparator, generator.cell);
        }
        var newCell = $_fijup0nujn69h3k7.getCellElement(gridB[r - startRow], c - startCol);
        var replacement = generator.replace(newCell);
        $_fijup0nujn69h3k7.mutateCell(gridA[r], c, $_dbc0gblbjn69h2qy.elementnew(replacement, true));
      }
    }
    return gridA;
  };
  var merge$3 = function (startAddress, gridA, gridB, generator, comparator) {
    var result = $_46kp02o7jn69h3qx.measure(startAddress, gridA, gridB);
    return result.map(function (delta) {
      var fittedGrid = $_46kp02o7jn69h3qx.tailor(gridA, delta, generator);
      return mergeTables(startAddress, fittedGrid, gridB, generator, comparator);
    });
  };
  var insert = function (index, gridA, gridB, generator, comparator) {
    $_5u6cp5o9jn69h3r2.splitRows(gridA, index, comparator, generator.cell);
    var delta = $_46kp02o7jn69h3qx.measureWidth(gridB, gridA);
    var fittedNewGrid = $_46kp02o7jn69h3qx.tailor(gridB, delta, generator);
    var secondDelta = $_46kp02o7jn69h3qx.measureWidth(gridA, fittedNewGrid);
    var fittedOldGrid = $_46kp02o7jn69h3qx.tailor(gridA, secondDelta, generator);
    return fittedOldGrid.slice(0, index).concat(fittedNewGrid).concat(fittedOldGrid.slice(index, fittedOldGrid.length));
  };
  var $_1qk3n9o6jn69h3qr = {
    merge: merge$3,
    insert: insert
  };

  var insertRowAt = function (grid, index, example, comparator, substitution) {
    var before = grid.slice(0, index);
    var after = grid.slice(index);
    var between = $_fijup0nujn69h3k7.mapCells(grid[example], function (ex, c) {
      var withinSpan = index > 0 && index < grid.length && comparator($_fijup0nujn69h3k7.getCellElement(grid[index - 1], c), $_fijup0nujn69h3k7.getCellElement(grid[index], c));
      var ret = withinSpan ? $_fijup0nujn69h3k7.getCell(grid[index], c) : $_dbc0gblbjn69h2qy.elementnew(substitution(ex.element(), comparator), true);
      return ret;
    });
    return before.concat([between]).concat(after);
  };
  var insertColumnAt = function (grid, index, example, comparator, substitution) {
    return map(grid, function (row) {
      var withinSpan = index > 0 && index < $_fijup0nujn69h3k7.cellLength(row) && comparator($_fijup0nujn69h3k7.getCellElement(row, index - 1), $_fijup0nujn69h3k7.getCellElement(row, index));
      var sub = withinSpan ? $_fijup0nujn69h3k7.getCell(row, index) : $_dbc0gblbjn69h2qy.elementnew(substitution($_fijup0nujn69h3k7.getCellElement(row, example), comparator), true);
      return $_fijup0nujn69h3k7.addCell(row, index, sub);
    });
  };
  var splitCellIntoColumns = function (grid, exampleRow, exampleCol, comparator, substitution) {
    var index = exampleCol + 1;
    return map(grid, function (row, i) {
      var isTargetCell = i === exampleRow;
      var sub = isTargetCell ? $_dbc0gblbjn69h2qy.elementnew(substitution($_fijup0nujn69h3k7.getCellElement(row, exampleCol), comparator), true) : $_fijup0nujn69h3k7.getCell(row, exampleCol);
      return $_fijup0nujn69h3k7.addCell(row, index, sub);
    });
  };
  var splitCellIntoRows = function (grid, exampleRow, exampleCol, comparator, substitution) {
    var index = exampleRow + 1;
    var before = grid.slice(0, index);
    var after = grid.slice(index);
    var between = $_fijup0nujn69h3k7.mapCells(grid[exampleRow], function (ex, i) {
      var isTargetCell = i === exampleCol;
      return isTargetCell ? $_dbc0gblbjn69h2qy.elementnew(substitution(ex.element(), comparator), true) : ex;
    });
    return before.concat([between]).concat(after);
  };
  var deleteColumnsAt = function (grid, start, finish) {
    var rows = map(grid, function (row) {
      var cells = row.cells().slice(0, start).concat(row.cells().slice(finish + 1));
      return $_dbc0gblbjn69h2qy.rowcells(cells, row.section());
    });
    return filter(rows, function (row) {
      return row.cells().length > 0;
    });
  };
  var deleteRowsAt = function (grid, start, finish) {
    return grid.slice(0, start).concat(grid.slice(finish + 1));
  };
  var $_3944mooajn69h3ri = {
    insertRowAt: insertRowAt,
    insertColumnAt: insertColumnAt,
    splitCellIntoColumns: splitCellIntoColumns,
    splitCellIntoRows: splitCellIntoRows,
    deleteRowsAt: deleteRowsAt,
    deleteColumnsAt: deleteColumnsAt
  };

  var replaceIn = function (grid, targets, comparator, substitution) {
    var isTarget = function (cell) {
      return exists(targets, function (target) {
        return comparator(cell.element(), target.element());
      });
    };
    return map(grid, function (row) {
      return $_fijup0nujn69h3k7.mapCells(row, function (cell) {
        return isTarget(cell) ? $_dbc0gblbjn69h2qy.elementnew(substitution(cell.element(), comparator), true) : cell;
      });
    });
  };
  var notStartRow = function (grid, rowIndex, colIndex, comparator) {
    return $_fijup0nujn69h3k7.getCellElement(grid[rowIndex], colIndex) !== undefined && (rowIndex > 0 && comparator($_fijup0nujn69h3k7.getCellElement(grid[rowIndex - 1], colIndex), $_fijup0nujn69h3k7.getCellElement(grid[rowIndex], colIndex)));
  };
  var notStartColumn = function (row, index, comparator) {
    return index > 0 && comparator($_fijup0nujn69h3k7.getCellElement(row, index - 1), $_fijup0nujn69h3k7.getCellElement(row, index));
  };
  var replaceColumn = function (grid, index, comparator, substitution) {
    var targets = bind(grid, function (row, i) {
      var alreadyAdded = notStartRow(grid, i, index, comparator) || notStartColumn(row, index, comparator);
      return alreadyAdded ? [] : [$_fijup0nujn69h3k7.getCell(row, index)];
    });
    return replaceIn(grid, targets, comparator, substitution);
  };
  var replaceRow = function (grid, index, comparator, substitution) {
    var targetRow = grid[index];
    var targets = bind(targetRow.cells(), function (item, i) {
      var alreadyAdded = notStartRow(grid, index, i, comparator) || notStartColumn(targetRow, i, comparator);
      return alreadyAdded ? [] : [item];
    });
    return replaceIn(grid, targets, comparator, substitution);
  };
  var $_ecan4xobjn69h3ri = {
    replaceColumn: replaceColumn,
    replaceRow: replaceRow
  };

  var none$1 = function () {
    return folder(function (n, o, l, m, r) {
      return n();
    });
  };
  var only = function (index) {
    return folder(function (n, o, l, m, r) {
      return o(index);
    });
  };
  var left = function (index, next) {
    return folder(function (n, o, l, m, r) {
      return l(index, next);
    });
  };
  var middle = function (prev, index, next) {
    return folder(function (n, o, l, m, r) {
      return m(prev, index, next);
    });
  };
  var right = function (prev, index) {
    return folder(function (n, o, l, m, r) {
      return r(prev, index);
    });
  };
  var folder = function (fold) {
    return { fold: fold };
  };
  var $_fkahpxoejn69h3sd = {
    none: none$1,
    only: only,
    left: left,
    middle: middle,
    right: right
  };

  var neighbours$1 = function (input, index) {
    if (input.length === 0)
      return $_fkahpxoejn69h3sd.none();
    if (input.length === 1)
      return $_fkahpxoejn69h3sd.only(0);
    if (index === 0)
      return $_fkahpxoejn69h3sd.left(0, 1);
    if (index === input.length - 1)
      return $_fkahpxoejn69h3sd.right(index - 1, index);
    if (index > 0 && index < input.length - 1)
      return $_fkahpxoejn69h3sd.middle(index - 1, index, index + 1);
    return $_fkahpxoejn69h3sd.none();
  };
  var determine = function (input, column, step, tableSize) {
    var result = input.slice(0);
    var context = neighbours$1(input, column);
    var zero = function (array) {
      return map(array, constant(0));
    };
    var onNone = constant(zero(result));
    var onOnly = function (index) {
      return tableSize.singleColumnWidth(result[index], step);
    };
    var onChange = function (index, next) {
      if (step >= 0) {
        var newNext = Math.max(tableSize.minCellWidth(), result[next] - step);
        return zero(result.slice(0, index)).concat([
          step,
          newNext - result[next]
        ]).concat(zero(result.slice(next + 1)));
      } else {
        var newThis = Math.max(tableSize.minCellWidth(), result[index] + step);
        var diffx = result[index] - newThis;
        return zero(result.slice(0, index)).concat([
          newThis - result[index],
          diffx
        ]).concat(zero(result.slice(next + 1)));
      }
    };
    var onLeft = onChange;
    var onMiddle = function (prev, index, next) {
      return onChange(index, next);
    };
    var onRight = function (prev, index) {
      if (step >= 0) {
        return zero(result.slice(0, index)).concat([step]);
      } else {
        var size = Math.max(tableSize.minCellWidth(), result[index] + step);
        return zero(result.slice(0, index)).concat([size - result[index]]);
      }
    };
    return context.fold(onNone, onOnly, onLeft, onMiddle, onRight);
  };
  var $_4hff41odjn69h3ry = { determine: determine };

  var getSpan$1 = function (cell, type) {
    return $_567jlzm1jn69h2wf.has(cell, type) && parseInt($_567jlzm1jn69h2wf.get(cell, type), 10) > 1;
  };
  var hasColspan = function (cell) {
    return getSpan$1(cell, 'colspan');
  };
  var hasRowspan = function (cell) {
    return getSpan$1(cell, 'rowspan');
  };
  var getInt = function (element, property) {
    return parseInt($_6q24dgmajn69h2zq.get(element, property), 10);
  };
  var $_ew0fp2ogjn69h3sd = {
    hasColspan: hasColspan,
    hasRowspan: hasRowspan,
    minWidth: constant(10),
    minHeight: constant(10),
    getInt: getInt
  };

  var getRaw$1 = function (cell, property, getter) {
    return $_6q24dgmajn69h2zq.getRaw(cell, property).fold(function () {
      return getter(cell) + 'px';
    }, function (raw) {
      return raw;
    });
  };
  var getRawW = function (cell) {
    return getRaw$1(cell, 'width', $_btfkcnn6jn69h3b1.getPixelWidth);
  };
  var getRawH = function (cell) {
    return getRaw$1(cell, 'height', $_btfkcnn6jn69h3b1.getHeight);
  };
  var getWidthFrom = function (warehouse, direction, getWidth, fallback, tableSize) {
    var columns = $_9jys2cnxjn69h3o0.columns(warehouse);
    var backups = map(columns, function (cellOption) {
      return cellOption.map(direction.edge);
    });
    return map(columns, function (cellOption, c) {
      var columnCell = cellOption.filter(not($_ew0fp2ogjn69h3sd.hasColspan));
      return columnCell.fold(function () {
        var deduced = $_2kjjb1nyjn69h3or.deduce(backups, c);
        return fallback(deduced);
      }, function (cell) {
        return getWidth(cell, tableSize);
      });
    });
  };
  var getDeduced = function (deduced) {
    return deduced.map(function (d) {
      return d + 'px';
    }).getOr('');
  };
  var getRawWidths = function (warehouse, direction) {
    return getWidthFrom(warehouse, direction, getRawW, getDeduced);
  };
  var getPercentageWidths = function (warehouse, direction, tableSize) {
    return getWidthFrom(warehouse, direction, $_btfkcnn6jn69h3b1.getPercentageWidth, function (deduced) {
      return deduced.fold(function () {
        return tableSize.minCellWidth();
      }, function (cellWidth) {
        return cellWidth / tableSize.pixelWidth() * 100;
      });
    }, tableSize);
  };
  var getPixelWidths = function (warehouse, direction, tableSize) {
    return getWidthFrom(warehouse, direction, $_btfkcnn6jn69h3b1.getPixelWidth, function (deduced) {
      return deduced.getOrThunk(tableSize.minCellWidth);
    }, tableSize);
  };
  var getHeightFrom = function (warehouse, direction, getHeight, fallback) {
    var rows = $_9jys2cnxjn69h3o0.rows(warehouse);
    var backups = map(rows, function (cellOption) {
      return cellOption.map(direction.edge);
    });
    return map(rows, function (cellOption, c) {
      var rowCell = cellOption.filter(not($_ew0fp2ogjn69h3sd.hasRowspan));
      return rowCell.fold(function () {
        var deduced = $_2kjjb1nyjn69h3or.deduce(backups, c);
        return fallback(deduced);
      }, function (cell) {
        return getHeight(cell);
      });
    });
  };
  var getPixelHeights = function (warehouse, direction) {
    return getHeightFrom(warehouse, direction, $_btfkcnn6jn69h3b1.getHeight, function (deduced) {
      return deduced.getOrThunk($_ew0fp2ogjn69h3sd.minHeight);
    });
  };
  var getRawHeights = function (warehouse, direction) {
    return getHeightFrom(warehouse, direction, getRawH, getDeduced);
  };
  var $_772g3gofjn69h3sd = {
    getRawWidths: getRawWidths,
    getPixelWidths: getPixelWidths,
    getPercentageWidths: getPercentageWidths,
    getPixelHeights: getPixelHeights,
    getRawHeights: getRawHeights
  };

  var total = function (start, end, measures) {
    var r = 0;
    for (var i = start; i < end; i++) {
      r += measures[i] !== undefined ? measures[i] : 0;
    }
    return r;
  };
  var recalculateWidth = function (warehouse, widths) {
    var all = $_bvuq36m9jn69h2zb.justCells(warehouse);
    return map(all, function (cell) {
      var width = total(cell.column(), cell.column() + cell.colspan(), widths);
      return {
        element: cell.element,
        width: constant(width),
        colspan: cell.colspan
      };
    });
  };
  var recalculateHeight = function (warehouse, heights) {
    var all = $_bvuq36m9jn69h2zb.justCells(warehouse);
    return map(all, function (cell) {
      var height = total(cell.row(), cell.row() + cell.rowspan(), heights);
      return {
        element: cell.element,
        height: constant(height),
        rowspan: cell.rowspan
      };
    });
  };
  var matchRowHeight = function (warehouse, heights) {
    return map(warehouse.all(), function (row, i) {
      return {
        element: row.element,
        height: constant(heights[i])
      };
    });
  };
  var $_49tpzgohjn69h3st = {
    recalculateWidth: recalculateWidth,
    recalculateHeight: recalculateHeight,
    matchRowHeight: matchRowHeight
  };

  var percentageSize = function (width, element) {
    var floatWidth = parseFloat(width);
    var pixelWidth = $_5fnbfbnajn69h3cs.get(element);
    var getCellDelta = function (delta) {
      return delta / pixelWidth * 100;
    };
    var singleColumnWidth = function (width, _delta) {
      return [100 - width];
    };
    var minCellWidth = function () {
      return $_ew0fp2ogjn69h3sd.minWidth() / pixelWidth * 100;
    };
    var setTableWidth = function (table, _newWidths, delta) {
      var total = floatWidth + delta;
      $_btfkcnn6jn69h3b1.setPercentageWidth(table, total);
    };
    return {
      width: constant(floatWidth),
      pixelWidth: constant(pixelWidth),
      getWidths: $_772g3gofjn69h3sd.getPercentageWidths,
      getCellDelta: getCellDelta,
      singleColumnWidth: singleColumnWidth,
      minCellWidth: minCellWidth,
      setElementWidth: $_btfkcnn6jn69h3b1.setPercentageWidth,
      setTableWidth: setTableWidth
    };
  };
  var pixelSize = function (width) {
    var intWidth = parseInt(width, 10);
    var getCellDelta = identity;
    var singleColumnWidth = function (width, delta) {
      var newNext = Math.max($_ew0fp2ogjn69h3sd.minWidth(), width + delta);
      return [newNext - width];
    };
    var setTableWidth = function (table, newWidths, _delta) {
      var total = foldr(newWidths, function (b, a) {
        return b + a;
      }, 0);
      $_btfkcnn6jn69h3b1.setPixelWidth(table, total);
    };
    return {
      width: constant(intWidth),
      pixelWidth: constant(intWidth),
      getWidths: $_772g3gofjn69h3sd.getPixelWidths,
      getCellDelta: getCellDelta,
      singleColumnWidth: singleColumnWidth,
      minCellWidth: $_ew0fp2ogjn69h3sd.minWidth,
      setElementWidth: $_btfkcnn6jn69h3b1.setPixelWidth,
      setTableWidth: setTableWidth
    };
  };
  var chooseSize = function (element, width) {
    if ($_btfkcnn6jn69h3b1.percentageBasedSizeRegex().test(width)) {
      var percentMatch = $_btfkcnn6jn69h3b1.percentageBasedSizeRegex().exec(width);
      return percentageSize(percentMatch[1], element);
    } else if ($_btfkcnn6jn69h3b1.pixelBasedSizeRegex().test(width)) {
      var pixelMatch = $_btfkcnn6jn69h3b1.pixelBasedSizeRegex().exec(width);
      return pixelSize(pixelMatch[1]);
    } else {
      var fallbackWidth = $_5fnbfbnajn69h3cs.get(element);
      return pixelSize(fallbackWidth);
    }
  };
  var getTableSize = function (element) {
    var width = $_btfkcnn6jn69h3b1.getRawWidth(element);
    return width.fold(function () {
      var fallbackWidth = $_5fnbfbnajn69h3cs.get(element);
      return pixelSize(fallbackWidth);
    }, function (width) {
      return chooseSize(element, width);
    });
  };
  var $_42xlhpoijn69h3t9 = { getTableSize: getTableSize };

  var getWarehouse$1 = function (list) {
    return $_bvuq36m9jn69h2zb.generate(list);
  };
  var sumUp = function (newSize) {
    return foldr(newSize, function (b, a) {
      return b + a;
    }, 0);
  };
  var getTableWarehouse = function (table) {
    var list = $_94vxyjlajn69h2qb.fromTable(table);
    return getWarehouse$1(list);
  };
  var adjustWidth = function (table, delta, index, direction) {
    var tableSize = $_42xlhpoijn69h3t9.getTableSize(table);
    var step = tableSize.getCellDelta(delta);
    var warehouse = getTableWarehouse(table);
    var widths = tableSize.getWidths(warehouse, direction, tableSize);
    var deltas = $_4hff41odjn69h3ry.determine(widths, index, step, tableSize);
    var newWidths = map(deltas, function (dx, i) {
      return dx + widths[i];
    });
    var newSizes = $_49tpzgohjn69h3st.recalculateWidth(warehouse, newWidths);
    each(newSizes, function (cell) {
      tableSize.setElementWidth(cell.element(), cell.width());
    });
    if (index === warehouse.grid().columns() - 1) {
      tableSize.setTableWidth(table, newWidths, step);
    }
  };
  var adjustHeight = function (table, delta, index, direction) {
    var warehouse = getTableWarehouse(table);
    var heights = $_772g3gofjn69h3sd.getPixelHeights(warehouse, direction);
    var newHeights = map(heights, function (dy, i) {
      return index === i ? Math.max(delta + dy, $_ew0fp2ogjn69h3sd.minHeight()) : dy;
    });
    var newCellSizes = $_49tpzgohjn69h3st.recalculateHeight(warehouse, newHeights);
    var newRowSizes = $_49tpzgohjn69h3st.matchRowHeight(warehouse, newHeights);
    each(newRowSizes, function (row) {
      $_btfkcnn6jn69h3b1.setHeight(row.element(), row.height());
    });
    each(newCellSizes, function (cell) {
      $_btfkcnn6jn69h3b1.setHeight(cell.element(), cell.height());
    });
    var total = sumUp(newHeights);
    $_btfkcnn6jn69h3b1.setHeight(table, total);
  };
  var adjustWidthTo = function (table, list, direction) {
    var tableSize = $_42xlhpoijn69h3t9.getTableSize(table);
    var warehouse = getWarehouse$1(list);
    var widths = tableSize.getWidths(warehouse, direction, tableSize);
    var newSizes = $_49tpzgohjn69h3st.recalculateWidth(warehouse, widths);
    each(newSizes, function (cell) {
      tableSize.setElementWidth(cell.element(), cell.width());
    });
    var total = foldr(widths, function (b, a) {
      return a + b;
    }, 0);
    if (newSizes.length > 0) {
      tableSize.setElementWidth(table, total);
    }
  };
  var $_70ius4ocjn69h3ry = {
    adjustWidth: adjustWidth,
    adjustHeight: adjustHeight,
    adjustWidthTo: adjustWidthTo
  };

  var prune = function (table) {
    var cells = $_2j92l5lcjn69h2r3.cells(table);
    if (cells.length === 0)
      $_69icwdmdjn69h306.remove(table);
  };
  var outcome = Immutable('grid', 'cursor');
  var elementFromGrid = function (grid, row, column) {
    return findIn(grid, row, column).orThunk(function () {
      return findIn(grid, 0, 0);
    });
  };
  var findIn = function (grid, row, column) {
    return Option.from(grid[row]).bind(function (r) {
      return Option.from(r.cells()[column]).bind(function (c) {
        return Option.from(c.element());
      });
    });
  };
  var bundle = function (grid, row, column) {
    return outcome(grid, findIn(grid, row, column));
  };
  var uniqueRows = function (details) {
    return foldl(details, function (rest, detail) {
      return exists(rest, function (currentDetail) {
        return currentDetail.row() === detail.row();
      }) ? rest : rest.concat([detail]);
    }, []).sort(function (detailA, detailB) {
      return detailA.row() - detailB.row();
    });
  };
  var uniqueColumns = function (details) {
    return foldl(details, function (rest, detail) {
      return exists(rest, function (currentDetail) {
        return currentDetail.column() === detail.column();
      }) ? rest : rest.concat([detail]);
    }, []).sort(function (detailA, detailB) {
      return detailA.column() - detailB.column();
    });
  };
  var insertRowBefore = function (grid, detail, comparator, genWrappers) {
    var example = detail.row();
    var targetIndex = detail.row();
    var newGrid = $_3944mooajn69h3ri.insertRowAt(grid, targetIndex, example, comparator, genWrappers.getOrInit);
    return bundle(newGrid, targetIndex, detail.column());
  };
  var insertRowsBefore = function (grid, details, comparator, genWrappers) {
    var example = details[0].row();
    var targetIndex = details[0].row();
    var rows = uniqueRows(details);
    var newGrid = foldl(rows, function (newGrid, _row) {
      return $_3944mooajn69h3ri.insertRowAt(newGrid, targetIndex, example, comparator, genWrappers.getOrInit);
    }, grid);
    return bundle(newGrid, targetIndex, details[0].column());
  };
  var insertRowAfter = function (grid, detail, comparator, genWrappers) {
    var example = detail.row();
    var targetIndex = detail.row() + detail.rowspan();
    var newGrid = $_3944mooajn69h3ri.insertRowAt(grid, targetIndex, example, comparator, genWrappers.getOrInit);
    return bundle(newGrid, targetIndex, detail.column());
  };
  var insertRowsAfter = function (grid, details, comparator, genWrappers) {
    var rows = uniqueRows(details);
    var example = rows[rows.length - 1].row();
    var targetIndex = rows[rows.length - 1].row() + rows[rows.length - 1].rowspan();
    var newGrid = foldl(rows, function (newGrid, _row) {
      return $_3944mooajn69h3ri.insertRowAt(newGrid, targetIndex, example, comparator, genWrappers.getOrInit);
    }, grid);
    return bundle(newGrid, targetIndex, details[0].column());
  };
  var insertColumnBefore = function (grid, detail, comparator, genWrappers) {
    var example = detail.column();
    var targetIndex = detail.column();
    var newGrid = $_3944mooajn69h3ri.insertColumnAt(grid, targetIndex, example, comparator, genWrappers.getOrInit);
    return bundle(newGrid, detail.row(), targetIndex);
  };
  var insertColumnsBefore = function (grid, details, comparator, genWrappers) {
    var columns = uniqueColumns(details);
    var example = columns[0].column();
    var targetIndex = columns[0].column();
    var newGrid = foldl(columns, function (newGrid, _row) {
      return $_3944mooajn69h3ri.insertColumnAt(newGrid, targetIndex, example, comparator, genWrappers.getOrInit);
    }, grid);
    return bundle(newGrid, details[0].row(), targetIndex);
  };
  var insertColumnAfter = function (grid, detail, comparator, genWrappers) {
    var example = detail.column();
    var targetIndex = detail.column() + detail.colspan();
    var newGrid = $_3944mooajn69h3ri.insertColumnAt(grid, targetIndex, example, comparator, genWrappers.getOrInit);
    return bundle(newGrid, detail.row(), targetIndex);
  };
  var insertColumnsAfter = function (grid, details, comparator, genWrappers) {
    var example = details[details.length - 1].column();
    var targetIndex = details[details.length - 1].column() + details[details.length - 1].colspan();
    var columns = uniqueColumns(details);
    var newGrid = foldl(columns, function (newGrid, _row) {
      return $_3944mooajn69h3ri.insertColumnAt(newGrid, targetIndex, example, comparator, genWrappers.getOrInit);
    }, grid);
    return bundle(newGrid, details[0].row(), targetIndex);
  };
  var makeRowHeader = function (grid, detail, comparator, genWrappers) {
    var newGrid = $_ecan4xobjn69h3ri.replaceRow(grid, detail.row(), comparator, genWrappers.replaceOrInit);
    return bundle(newGrid, detail.row(), detail.column());
  };
  var makeColumnHeader = function (grid, detail, comparator, genWrappers) {
    var newGrid = $_ecan4xobjn69h3ri.replaceColumn(grid, detail.column(), comparator, genWrappers.replaceOrInit);
    return bundle(newGrid, detail.row(), detail.column());
  };
  var unmakeRowHeader = function (grid, detail, comparator, genWrappers) {
    var newGrid = $_ecan4xobjn69h3ri.replaceRow(grid, detail.row(), comparator, genWrappers.replaceOrInit);
    return bundle(newGrid, detail.row(), detail.column());
  };
  var unmakeColumnHeader = function (grid, detail, comparator, genWrappers) {
    var newGrid = $_ecan4xobjn69h3ri.replaceColumn(grid, detail.column(), comparator, genWrappers.replaceOrInit);
    return bundle(newGrid, detail.row(), detail.column());
  };
  var splitCellIntoColumns$1 = function (grid, detail, comparator, genWrappers) {
    var newGrid = $_3944mooajn69h3ri.splitCellIntoColumns(grid, detail.row(), detail.column(), comparator, genWrappers.getOrInit);
    return bundle(newGrid, detail.row(), detail.column());
  };
  var splitCellIntoRows$1 = function (grid, detail, comparator, genWrappers) {
    var newGrid = $_3944mooajn69h3ri.splitCellIntoRows(grid, detail.row(), detail.column(), comparator, genWrappers.getOrInit);
    return bundle(newGrid, detail.row(), detail.column());
  };
  var eraseColumns = function (grid, details, comparator, _genWrappers) {
    var columns = uniqueColumns(details);
    var newGrid = $_3944mooajn69h3ri.deleteColumnsAt(grid, columns[0].column(), columns[columns.length - 1].column());
    var cursor = elementFromGrid(newGrid, details[0].row(), details[0].column());
    return outcome(newGrid, cursor);
  };
  var eraseRows = function (grid, details, comparator, _genWrappers) {
    var rows = uniqueRows(details);
    var newGrid = $_3944mooajn69h3ri.deleteRowsAt(grid, rows[0].row(), rows[rows.length - 1].row());
    var cursor = elementFromGrid(newGrid, details[0].row(), details[0].column());
    return outcome(newGrid, cursor);
  };
  var mergeCells = function (grid, mergable, comparator, _genWrappers) {
    var cells = mergable.cells();
    $_58tytinmjn69h3g1.merge(cells);
    var newGrid = $_5u6cp5o9jn69h3r2.merge(grid, mergable.bounds(), comparator, constant(cells[0]));
    return outcome(newGrid, Option.from(cells[0]));
  };
  var unmergeCells = function (grid, unmergable, comparator, genWrappers) {
    var newGrid = foldr(unmergable, function (b, cell) {
      return $_5u6cp5o9jn69h3r2.unmerge(b, cell, comparator, genWrappers.combine(cell));
    }, grid);
    return outcome(newGrid, Option.from(unmergable[0]));
  };
  var pasteCells = function (grid, pasteDetails, comparator, genWrappers) {
    var gridify = function (table, generators) {
      var list = $_94vxyjlajn69h2qb.fromTable(table);
      var wh = $_bvuq36m9jn69h2zb.generate(list);
      return $_5qp29fnsjn69h3jr.toGrid(wh, generators, true);
    };
    var gridB = gridify(pasteDetails.clipboard(), pasteDetails.generators());
    var startAddress = $_dbc0gblbjn69h2qy.address(pasteDetails.row(), pasteDetails.column());
    var mergedGrid = $_1qk3n9o6jn69h3qr.merge(startAddress, grid, gridB, pasteDetails.generators(), comparator);
    return mergedGrid.fold(function () {
      return outcome(grid, Option.some(pasteDetails.element()));
    }, function (nuGrid) {
      var cursor = elementFromGrid(nuGrid, pasteDetails.row(), pasteDetails.column());
      return outcome(nuGrid, cursor);
    });
  };
  var gridifyRows = function (rows, generators, example) {
    var pasteDetails = $_94vxyjlajn69h2qb.fromPastedRows(rows, example);
    var wh = $_bvuq36m9jn69h2zb.generate(pasteDetails);
    return $_5qp29fnsjn69h3jr.toGrid(wh, generators, true);
  };
  var pasteRowsBefore = function (grid, pasteDetails, comparator, genWrappers) {
    var example = grid[pasteDetails.cells[0].row()];
    var index = pasteDetails.cells[0].row();
    var gridB = gridifyRows(pasteDetails.clipboard(), pasteDetails.generators(), example);
    var mergedGrid = $_1qk3n9o6jn69h3qr.insert(index, grid, gridB, pasteDetails.generators(), comparator);
    var cursor = elementFromGrid(mergedGrid, pasteDetails.cells[0].row(), pasteDetails.cells[0].column());
    return outcome(mergedGrid, cursor);
  };
  var pasteRowsAfter = function (grid, pasteDetails, comparator, genWrappers) {
    var example = grid[pasteDetails.cells[0].row()];
    var index = pasteDetails.cells[pasteDetails.cells.length - 1].row() + pasteDetails.cells[pasteDetails.cells.length - 1].rowspan();
    var gridB = gridifyRows(pasteDetails.clipboard(), pasteDetails.generators(), example);
    var mergedGrid = $_1qk3n9o6jn69h3qr.insert(index, grid, gridB, pasteDetails.generators(), comparator);
    var cursor = elementFromGrid(mergedGrid, pasteDetails.cells[0].row(), pasteDetails.cells[0].column());
    return outcome(mergedGrid, cursor);
  };
  var resize = $_70ius4ocjn69h3ry.adjustWidthTo;
  var $_3my9k5nijn69h3e1 = {
    insertRowBefore: $_8xqe3enpjn69h3i9.run(insertRowBefore, $_8xqe3enpjn69h3i9.onCell, noop, noop, $_ao1522njjn69h3f3.modification),
    insertRowsBefore: $_8xqe3enpjn69h3i9.run(insertRowsBefore, $_8xqe3enpjn69h3i9.onCells, noop, noop, $_ao1522njjn69h3f3.modification),
    insertRowAfter: $_8xqe3enpjn69h3i9.run(insertRowAfter, $_8xqe3enpjn69h3i9.onCell, noop, noop, $_ao1522njjn69h3f3.modification),
    insertRowsAfter: $_8xqe3enpjn69h3i9.run(insertRowsAfter, $_8xqe3enpjn69h3i9.onCells, noop, noop, $_ao1522njjn69h3f3.modification),
    insertColumnBefore: $_8xqe3enpjn69h3i9.run(insertColumnBefore, $_8xqe3enpjn69h3i9.onCell, resize, noop, $_ao1522njjn69h3f3.modification),
    insertColumnsBefore: $_8xqe3enpjn69h3i9.run(insertColumnsBefore, $_8xqe3enpjn69h3i9.onCells, resize, noop, $_ao1522njjn69h3f3.modification),
    insertColumnAfter: $_8xqe3enpjn69h3i9.run(insertColumnAfter, $_8xqe3enpjn69h3i9.onCell, resize, noop, $_ao1522njjn69h3f3.modification),
    insertColumnsAfter: $_8xqe3enpjn69h3i9.run(insertColumnsAfter, $_8xqe3enpjn69h3i9.onCells, resize, noop, $_ao1522njjn69h3f3.modification),
    splitCellIntoColumns: $_8xqe3enpjn69h3i9.run(splitCellIntoColumns$1, $_8xqe3enpjn69h3i9.onCell, resize, noop, $_ao1522njjn69h3f3.modification),
    splitCellIntoRows: $_8xqe3enpjn69h3i9.run(splitCellIntoRows$1, $_8xqe3enpjn69h3i9.onCell, noop, noop, $_ao1522njjn69h3f3.modification),
    eraseColumns: $_8xqe3enpjn69h3i9.run(eraseColumns, $_8xqe3enpjn69h3i9.onCells, resize, prune, $_ao1522njjn69h3f3.modification),
    eraseRows: $_8xqe3enpjn69h3i9.run(eraseRows, $_8xqe3enpjn69h3i9.onCells, noop, prune, $_ao1522njjn69h3f3.modification),
    makeColumnHeader: $_8xqe3enpjn69h3i9.run(makeColumnHeader, $_8xqe3enpjn69h3i9.onCell, noop, noop, $_ao1522njjn69h3f3.transform('row', 'th')),
    unmakeColumnHeader: $_8xqe3enpjn69h3i9.run(unmakeColumnHeader, $_8xqe3enpjn69h3i9.onCell, noop, noop, $_ao1522njjn69h3f3.transform(null, 'td')),
    makeRowHeader: $_8xqe3enpjn69h3i9.run(makeRowHeader, $_8xqe3enpjn69h3i9.onCell, noop, noop, $_ao1522njjn69h3f3.transform('col', 'th')),
    unmakeRowHeader: $_8xqe3enpjn69h3i9.run(unmakeRowHeader, $_8xqe3enpjn69h3i9.onCell, noop, noop, $_ao1522njjn69h3f3.transform(null, 'td')),
    mergeCells: $_8xqe3enpjn69h3i9.run(mergeCells, $_8xqe3enpjn69h3i9.onMergable, noop, noop, $_ao1522njjn69h3f3.merging),
    unmergeCells: $_8xqe3enpjn69h3i9.run(unmergeCells, $_8xqe3enpjn69h3i9.onUnmergable, resize, noop, $_ao1522njjn69h3f3.merging),
    pasteCells: $_8xqe3enpjn69h3i9.run(pasteCells, $_8xqe3enpjn69h3i9.onPaste, resize, noop, $_ao1522njjn69h3f3.modification),
    pasteRowsBefore: $_8xqe3enpjn69h3i9.run(pasteRowsBefore, $_8xqe3enpjn69h3i9.onPasteRows, noop, noop, $_ao1522njjn69h3f3.modification),
    pasteRowsAfter: $_8xqe3enpjn69h3i9.run(pasteRowsAfter, $_8xqe3enpjn69h3i9.onPasteRows, noop, noop, $_ao1522njjn69h3f3.modification)
  };

  var getBody$1 = function (editor) {
    return Element$$1.fromDom(editor.getBody());
  };
  var getPixelWidth$1 = function (elm) {
    return elm.getBoundingClientRect().width;
  };
  var getPixelHeight = function (elm) {
    return elm.getBoundingClientRect().height;
  };
  var getIsRoot = function (editor) {
    return function (element) {
      return $_bakwgmlkjn69h2u8.eq(element, getBody$1(editor));
    };
  };
  var removePxSuffix = function (size) {
    return size ? size.replace(/px$/, '') : '';
  };
  var addSizeSuffix = function (size) {
    if (/^[0-9]+$/.test(size)) {
      size += 'px';
    }
    return size;
  };
  var removeDataStyle = function (table) {
    var dataStyleCells = $_yn4aam3jn69h2wv.descendants(table, 'td[data-mce-style],th[data-mce-style]');
    $_567jlzm1jn69h2wf.remove(table, 'data-mce-style');
    each(dataStyleCells, function (cell) {
      $_567jlzm1jn69h2wf.remove(cell, 'data-mce-style');
    });
  };

  var onDirection = function (isLtr, isRtl) {
    return function (element) {
      return getDirection(element) === 'rtl' ? isRtl : isLtr;
    };
  };
  var getDirection = function (element) {
    return $_6q24dgmajn69h2zq.get(element, 'direction') === 'rtl' ? 'rtl' : 'ltr';
  };
  var $_dfyubholjn69h3u9 = {
    onDirection: onDirection,
    getDirection: getDirection
  };

  var ltr$1 = { isRtl: constant(false) };
  var rtl$1 = { isRtl: constant(true) };
  var directionAt = function (element) {
    var dir = $_dfyubholjn69h3u9.getDirection(element);
    return dir === 'rtl' ? rtl$1 : ltr$1;
  };
  var $_5imzneokjn69h3to = { directionAt: directionAt };

  var defaultTableToolbar = [
    'tableprops',
    'tabledelete',
    '|',
    'tableinsertrowbefore',
    'tableinsertrowafter',
    'tabledeleterow',
    '|',
    'tableinsertcolbefore',
    'tableinsertcolafter',
    'tabledeletecol'
  ];
  var defaultStyles = {
    'border-collapse': 'collapse',
    'width': '100%'
  };
  var defaultAttributes = { border: '1' };
  var getDefaultAttributes = function (editor) {
    return editor.getParam('table_default_attributes', defaultAttributes, 'object');
  };
  var getDefaultStyles = function (editor) {
    return editor.getParam('table_default_styles', defaultStyles, 'object');
  };
  var hasTableResizeBars = function (editor) {
    return editor.getParam('table_resize_bars', true, 'boolean');
  };
  var hasTabNavigation = function (editor) {
    return editor.getParam('table_tab_navigation', true, 'boolean');
  };
  var hasAdvancedCellTab = function (editor) {
    return editor.getParam('table_cell_advtab', true, 'boolean');
  };
  var hasAdvancedRowTab = function (editor) {
    return editor.getParam('table_row_advtab', true, 'boolean');
  };
  var hasAdvancedTableTab = function (editor) {
    return editor.getParam('table_advtab', true, 'boolean');
  };
  var hasAppearanceOptions = function (editor) {
    return editor.getParam('table_appearance_options', true, 'boolean');
  };
  var hasTableGrid = function (editor) {
    return editor.getParam('table_grid', true, 'boolean');
  };
  var shouldStyleWithCss = function (editor) {
    return editor.getParam('table_style_by_css', false, 'boolean');
  };
  var getCellClassList = function (editor) {
    return editor.getParam('table_cell_class_list', [], 'array');
  };
  var getRowClassList = function (editor) {
    return editor.getParam('table_row_class_list', [], 'array');
  };
  var getTableClassList = function (editor) {
    return editor.getParam('table_class_list', [], 'array');
  };
  var getColorPickerCallback = function (editor) {
    return editor.getParam('color_picker_callback');
  };
  var isPixelsForced = function (editor) {
    return editor.getParam('table_responsive_width') === false;
  };
  var getCloneElements = function (editor) {
    var cloneElements = editor.getParam('table_clone_elements');
    if (isString(cloneElements)) {
      return Option.some(cloneElements.split(/[ ,]/));
    } else if (Array.isArray(cloneElements)) {
      return Option.some(cloneElements);
    } else {
      return Option.none();
    }
  };
  var hasObjectResizing = function (editor) {
    var objectResizing = editor.getParam('object_resizing', true);
    return objectResizing === 'table' || objectResizing;
  };
  var getToolbar = function (editor) {
    var toolbar = editor.getParam('table_toolbar', defaultTableToolbar);
    if (toolbar === '' || toolbar === false) {
      return [];
    } else if (isString(toolbar)) {
      return toolbar.split(/[ ,]/);
    } else if (isArray(toolbar)) {
      return toolbar;
    } else {
      return [];
    }
  };

  var fireNewRow = function (editor, row) {
    return editor.fire('newrow', { node: row });
  };
  var fireNewCell = function (editor, cell) {
    return editor.fire('newcell', { node: cell });
  };
  var fireObjectResizeStart = function (editor, target, width, height) {
    editor.fire('ObjectResizeStart', {
      target: target,
      width: width,
      height: height
    });
  };
  var fireObjectResized = function (editor, target, width, height) {
    editor.fire('ObjectResized', {
      target: target,
      width: width,
      height: height
    });
  };

  var TableActions = function (editor, lazyWire) {
    var isTableBody = function (editor) {
      return $_5f9i72m2jn69h2wv.name(getBody$1(editor)) === 'table';
    };
    var lastRowGuard = function (table) {
      var size = $_dopgsnhjn69h3dm.getGridSize(table);
      return isTableBody(editor) === false || size.rows() > 1;
    };
    var lastColumnGuard = function (table) {
      var size = $_dopgsnhjn69h3dm.getGridSize(table);
      return isTableBody(editor) === false || size.columns() > 1;
    };
    var cloneFormats = getCloneElements(editor);
    var execute = function (operation, guard, mutate, lazyWire) {
      return function (table, target) {
        removeDataStyle(table);
        var wire = lazyWire();
        var doc = Element$$1.fromDom(editor.getDoc());
        var direction = TableDirection($_5imzneokjn69h3to.directionAt);
        var generators = $_8b35ttmfjn69h30m.cellOperations(mutate, doc, cloneFormats);
        return guard(table) ? operation(wire, table, target, generators, direction).bind(function (result) {
          each(result.newRows(), function (row) {
            fireNewRow(editor, row.dom());
          });
          each(result.newCells(), function (cell) {
            fireNewCell(editor, cell.dom());
          });
          return result.cursor().map(function (cell) {
            var rng = editor.dom.createRng();
            rng.setStart(cell.dom(), 0);
            rng.setEnd(cell.dom(), 0);
            return rng;
          });
        }) : Option.none();
      };
    };
    var deleteRow = execute($_3my9k5nijn69h3e1.eraseRows, lastRowGuard, noop, lazyWire);
    var deleteColumn = execute($_3my9k5nijn69h3e1.eraseColumns, lastColumnGuard, noop, lazyWire);
    var insertRowsBefore = execute($_3my9k5nijn69h3e1.insertRowsBefore, always, noop, lazyWire);
    var insertRowsAfter = execute($_3my9k5nijn69h3e1.insertRowsAfter, always, noop, lazyWire);
    var insertColumnsBefore = execute($_3my9k5nijn69h3e1.insertColumnsBefore, always, $_ec4gxsn5jn69h3ay.halve, lazyWire);
    var insertColumnsAfter = execute($_3my9k5nijn69h3e1.insertColumnsAfter, always, $_ec4gxsn5jn69h3ay.halve, lazyWire);
    var mergeCells = execute($_3my9k5nijn69h3e1.mergeCells, always, noop, lazyWire);
    var unmergeCells = execute($_3my9k5nijn69h3e1.unmergeCells, always, noop, lazyWire);
    var pasteRowsBefore = execute($_3my9k5nijn69h3e1.pasteRowsBefore, always, noop, lazyWire);
    var pasteRowsAfter = execute($_3my9k5nijn69h3e1.pasteRowsAfter, always, noop, lazyWire);
    var pasteCells = execute($_3my9k5nijn69h3e1.pasteCells, always, noop, lazyWire);
    return {
      deleteRow: deleteRow,
      deleteColumn: deleteColumn,
      insertRowsBefore: insertRowsBefore,
      insertRowsAfter: insertRowsAfter,
      insertColumnsBefore: insertColumnsBefore,
      insertColumnsAfter: insertColumnsAfter,
      mergeCells: mergeCells,
      unmergeCells: unmergeCells,
      pasteRowsBefore: pasteRowsBefore,
      pasteRowsAfter: pasteRowsAfter,
      pasteCells: pasteCells
    };
  };

  var copyRows = function (table, target, generators) {
    var list = $_94vxyjlajn69h2qb.fromTable(table);
    var house = $_bvuq36m9jn69h2zb.generate(list);
    var details = $_8xqe3enpjn69h3i9.onCells(house, target);
    return details.map(function (selectedCells) {
      var grid = $_5qp29fnsjn69h3jr.toGrid(house, generators, false);
      var slicedGrid = grid.slice(selectedCells[0].row(), selectedCells[selectedCells.length - 1].row() + selectedCells[selectedCells.length - 1].rowspan());
      var slicedDetails = $_8xqe3enpjn69h3i9.toDetailList(slicedGrid, generators);
      return $_72jmzlnvjn69h3kw.copy(slicedDetails);
    });
  };
  var $_fnmlogopjn69h3v4 = { copyRows: copyRows };

  var global$1 = tinymce.util.Tools.resolve('tinymce.util.Tools');

  var getTDTHOverallStyle = function (dom, elm, name) {
    var cells = dom.select('td,th', elm);
    var firstChildStyle;
    var checkChildren = function (firstChildStyle, elms) {
      for (var i = 0; i < elms.length; i++) {
        var currentStyle = dom.getStyle(elms[i], name);
        if (typeof firstChildStyle === 'undefined') {
          firstChildStyle = currentStyle;
        }
        if (firstChildStyle !== currentStyle) {
          return '';
        }
      }
      return firstChildStyle;
    };
    firstChildStyle = checkChildren(firstChildStyle, cells);
    return firstChildStyle;
  };
  var applyAlign = function (editor, elm, name) {
    if (name) {
      editor.formatter.apply('align' + name, {}, elm);
    }
  };
  var applyVAlign = function (editor, elm, name) {
    if (name) {
      editor.formatter.apply('valign' + name, {}, elm);
    }
  };
  var unApplyAlign = function (editor, elm) {
    global$1.each('left center right'.split(' '), function (name) {
      editor.formatter.remove('align' + name, {}, elm);
    });
  };
  var unApplyVAlign = function (editor, elm) {
    global$1.each('top middle bottom'.split(' '), function (name) {
      editor.formatter.remove('valign' + name, {}, elm);
    });
  };
  var $_5fse46osjn69h3vk = {
    applyAlign: applyAlign,
    applyVAlign: applyVAlign,
    unApplyAlign: unApplyAlign,
    unApplyVAlign: unApplyVAlign,
    getTDTHOverallStyle: getTDTHOverallStyle
  };

  var buildListItems = function (inputList, itemCallback, startItems) {
    var appendItems = function (values, output) {
      output = output || [];
      global$1.each(values, function (item) {
        var menuItem = { text: item.text || item.title };
        if (item.menu) {
          menuItem.menu = appendItems(item.menu);
        } else {
          menuItem.value = item.value;
          if (itemCallback) {
            itemCallback(menuItem);
          }
        }
        output.push(menuItem);
      });
      return output;
    };
    return appendItems(inputList, startItems || []);
  };
  function styleFieldHasFocus(e) {
    return e.control.rootControl.find('#style')[0].getEl().isEqualNode(document.activeElement);
  }
  var syncAdvancedStyleFields = function (editor, evt) {
    if (styleFieldHasFocus(evt)) {
      updateAdvancedFields(editor, evt);
    } else {
      updateStyleField(editor, evt);
    }
  };
  var updateStyleField = function (editor, evt) {
    var dom = editor.dom;
    var rootControl = evt.control.rootControl;
    var data = rootControl.toJSON();
    var css = dom.parseStyle(data.style);
    css['border-style'] = data.borderStyle;
    css['border-color'] = data.borderColor;
    css['background-color'] = data.backgroundColor;
    css.width = data.width ? addSizeSuffix(data.width) : '';
    css.height = data.height ? addSizeSuffix(data.height) : '';
    rootControl.find('#style').value(dom.serializeStyle(dom.parseStyle(dom.serializeStyle(css))));
  };
  var updateAdvancedFields = function (editor, evt) {
    var dom = editor.dom;
    var rootControl = evt.control.rootControl;
    var data = rootControl.toJSON();
    var css = dom.parseStyle(data.style);
    rootControl.find('#borderStyle').value(css['border-style'] || '');
    rootControl.find('#borderColor').value(css['border-color'] || '');
    rootControl.find('#backgroundColor').value(css['background-color'] || '');
    rootControl.find('#width').value(css.width || '');
    rootControl.find('#height').value(css.height || '');
  };
  var extractAdvancedStyles = function (dom, elm) {
    var css = dom.parseStyle(dom.getAttrib(elm, 'style'));
    var data = {};
    if (css['border-style']) {
      data.borderStyle = css['border-style'];
    }
    if (css['border-color']) {
      data.borderColor = css['border-color'];
    }
    if (css['background-color']) {
      data.backgroundColor = css['background-color'];
    }
    data.style = dom.serializeStyle(css);
    return data;
  };
  var createStyleForm = function (editor) {
    var createColorPickAction = function () {
      var colorPickerCallback = getColorPickerCallback(editor);
      if (colorPickerCallback) {
        return function (evt) {
          return colorPickerCallback.call(editor, function (value) {
            evt.control.value(value).fire('change');
          }, evt.control.value());
        };
      }
    };
    return {
      title: 'Advanced',
      type: 'form',
      defaults: { onchange: curry(updateStyleField, editor) },
      items: [
        {
          label: 'Style',
          name: 'style',
          type: 'textbox',
          onchange: curry(updateAdvancedFields, editor)
        },
        {
          type: 'form',
          padding: 0,
          formItemDefaults: {
            layout: 'grid',
            alignH: [
              'start',
              'right'
            ]
          },
          defaults: { size: 7 },
          items: [
            {
              label: 'Border style',
              type: 'listbox',
              name: 'borderStyle',
              width: 90,
              onselect: curry(updateStyleField, editor),
              values: [
                {
                  text: 'Select...',
                  value: ''
                },
                {
                  text: 'Solid',
                  value: 'solid'
                },
                {
                  text: 'Dotted',
                  value: 'dotted'
                },
                {
                  text: 'Dashed',
                  value: 'dashed'
                },
                {
                  text: 'Double',
                  value: 'double'
                },
                {
                  text: 'Groove',
                  value: 'groove'
                },
                {
                  text: 'Ridge',
                  value: 'ridge'
                },
                {
                  text: 'Inset',
                  value: 'inset'
                },
                {
                  text: 'Outset',
                  value: 'outset'
                },
                {
                  text: 'None',
                  value: 'none'
                },
                {
                  text: 'Hidden',
                  value: 'hidden'
                }
              ]
            },
            {
              label: 'Border color',
              type: 'colorbox',
              name: 'borderColor',
              onaction: createColorPickAction()
            },
            {
              label: 'Background color',
              type: 'colorbox',
              name: 'backgroundColor',
              onaction: createColorPickAction()
            }
          ]
        }
      ]
    };
  };
  var $_2d9h6botjn69h3vk = {
    createStyleForm: createStyleForm,
    buildListItems: buildListItems,
    updateStyleField: updateStyleField,
    extractAdvancedStyles: extractAdvancedStyles,
    updateAdvancedFields: updateAdvancedFields,
    syncAdvancedStyleFields: syncAdvancedStyleFields
  };

  var updateStyles = function (elm, cssText) {
    delete elm.dataset.mceStyle;
    elm.style.cssText += ';' + cssText;
  };
  var extractDataFromElement = function (editor, elm) {
    var dom = editor.dom;
    var data = {
      width: dom.getStyle(elm, 'width') || dom.getAttrib(elm, 'width'),
      height: dom.getStyle(elm, 'height') || dom.getAttrib(elm, 'height'),
      scope: dom.getAttrib(elm, 'scope'),
      class: dom.getAttrib(elm, 'class'),
      type: elm.nodeName.toLowerCase(),
      style: '',
      align: '',
      valign: ''
    };
    global$1.each('left center right'.split(' '), function (name) {
      if (editor.formatter.matchNode(elm, 'align' + name)) {
        data.align = name;
      }
    });
    global$1.each('top middle bottom'.split(' '), function (name) {
      if (editor.formatter.matchNode(elm, 'valign' + name)) {
        data.valign = name;
      }
    });
    if (hasAdvancedCellTab(editor)) {
      global$1.extend(data, $_2d9h6botjn69h3vk.extractAdvancedStyles(dom, elm));
    }
    return data;
  };
  var onSubmitCellForm = function (editor, cells, evt) {
    var dom = editor.dom;
    var data;
    function setAttrib(elm, name, value) {
      if (cells.length === 1 || value) {
        dom.setAttrib(elm, name, value);
      }
    }
    function setStyle(elm, name, value) {
      if (cells.length === 1 || value) {
        dom.setStyle(elm, name, value);
      }
    }
    if (hasAdvancedCellTab(editor)) {
      $_2d9h6botjn69h3vk.syncAdvancedStyleFields(editor, evt);
    }
    data = evt.control.rootControl.toJSON();
    editor.undoManager.transact(function () {
      global$1.each(cells, function (cellElm) {
        setAttrib(cellElm, 'scope', data.scope);
        if (cells.length === 1) {
          setAttrib(cellElm, 'style', data.style);
        } else {
          updateStyles(cellElm, data.style);
        }
        setAttrib(cellElm, 'class', data.class);
        setStyle(cellElm, 'width', addSizeSuffix(data.width));
        setStyle(cellElm, 'height', addSizeSuffix(data.height));
        if (data.type && cellElm.nodeName.toLowerCase() !== data.type) {
          cellElm = dom.rename(cellElm, data.type);
        }
        if (cells.length === 1) {
          $_5fse46osjn69h3vk.unApplyAlign(editor, cellElm);
          $_5fse46osjn69h3vk.unApplyVAlign(editor, cellElm);
        }
        if (data.align) {
          $_5fse46osjn69h3vk.applyAlign(editor, cellElm, data.align);
        }
        if (data.valign) {
          $_5fse46osjn69h3vk.applyVAlign(editor, cellElm, data.valign);
        }
      });
      editor.focus();
    });
  };
  var open = function (editor) {
    var cellElm, data, classListCtrl, cells = [];
    cells = editor.dom.select('td[data-mce-selected],th[data-mce-selected]');
    cellElm = editor.dom.getParent(editor.selection.getStart(), 'td,th');
    if (!cells.length && cellElm) {
      cells.push(cellElm);
    }
    cellElm = cellElm || cells[0];
    if (!cellElm) {
      return;
    }
    if (cells.length > 1) {
      data = {
        width: '',
        height: '',
        scope: '',
        class: '',
        align: '',
        valign: '',
        style: '',
        type: cellElm.nodeName.toLowerCase()
      };
    } else {
      data = extractDataFromElement(editor, cellElm);
    }
    if (getCellClassList(editor).length > 0) {
      classListCtrl = {
        name: 'class',
        type: 'listbox',
        label: 'Class',
        values: $_2d9h6botjn69h3vk.buildListItems(getCellClassList(editor), function (item) {
          if (item.value) {
            item.textStyle = function () {
              return editor.formatter.getCssText({
                block: 'td',
                classes: [item.value]
              });
            };
          }
        })
      };
    }
    var generalCellForm = {
      type: 'form',
      layout: 'flex',
      direction: 'column',
      labelGapCalc: 'children',
      padding: 0,
      items: [
        {
          type: 'form',
          layout: 'grid',
          columns: 2,
          labelGapCalc: false,
          padding: 0,
          defaults: {
            type: 'textbox',
            maxWidth: 50
          },
          items: [
            {
              label: 'Width',
              name: 'width',
              onchange: curry($_2d9h6botjn69h3vk.updateStyleField, editor)
            },
            {
              label: 'Height',
              name: 'height',
              onchange: curry($_2d9h6botjn69h3vk.updateStyleField, editor)
            },
            {
              label: 'Cell type',
              name: 'type',
              type: 'listbox',
              text: 'None',
              minWidth: 90,
              maxWidth: null,
              values: [
                {
                  text: 'Cell',
                  value: 'td'
                },
                {
                  text: 'Header cell',
                  value: 'th'
                }
              ]
            },
            {
              label: 'Scope',
              name: 'scope',
              type: 'listbox',
              text: 'None',
              minWidth: 90,
              maxWidth: null,
              values: [
                {
                  text: 'None',
                  value: ''
                },
                {
                  text: 'Row',
                  value: 'row'
                },
                {
                  text: 'Column',
                  value: 'col'
                },
                {
                  text: 'Row group',
                  value: 'rowgroup'
                },
                {
                  text: 'Column group',
                  value: 'colgroup'
                }
              ]
            },
            {
              label: 'H Align',
              name: 'align',
              type: 'listbox',
              text: 'None',
              minWidth: 90,
              maxWidth: null,
              values: [
                {
                  text: 'None',
                  value: ''
                },
                {
                  text: 'Left',
                  value: 'left'
                },
                {
                  text: 'Center',
                  value: 'center'
                },
                {
                  text: 'Right',
                  value: 'right'
                }
              ]
            },
            {
              label: 'V Align',
              name: 'valign',
              type: 'listbox',
              text: 'None',
              minWidth: 90,
              maxWidth: null,
              values: [
                {
                  text: 'None',
                  value: ''
                },
                {
                  text: 'Top',
                  value: 'top'
                },
                {
                  text: 'Middle',
                  value: 'middle'
                },
                {
                  text: 'Bottom',
                  value: 'bottom'
                }
              ]
            }
          ]
        },
        classListCtrl
      ]
    };
    if (hasAdvancedCellTab(editor)) {
      editor.windowManager.open({
        title: 'Cell properties',
        bodyType: 'tabpanel',
        data: data,
        body: [
          {
            title: 'General',
            type: 'form',
            items: generalCellForm
          },
          $_2d9h6botjn69h3vk.createStyleForm(editor)
        ],
        onsubmit: curry(onSubmitCellForm, editor, cells)
      });
    } else {
      editor.windowManager.open({
        title: 'Cell properties',
        data: data,
        body: generalCellForm,
        onsubmit: curry(onSubmitCellForm, editor, cells)
      });
    }
  };
  var $_c3p5s3orjn69h3v4 = { open: open };

  var extractDataFromElement$1 = function (editor, elm) {
    var dom = editor.dom;
    var data = {
      height: dom.getStyle(elm, 'height') || dom.getAttrib(elm, 'height'),
      scope: dom.getAttrib(elm, 'scope'),
      class: dom.getAttrib(elm, 'class'),
      align: '',
      style: '',
      type: elm.parentNode.nodeName.toLowerCase()
    };
    global$1.each('left center right'.split(' '), function (name) {
      if (editor.formatter.matchNode(elm, 'align' + name)) {
        data.align = name;
      }
    });
    if (hasAdvancedRowTab(editor)) {
      global$1.extend(data, $_2d9h6botjn69h3vk.extractAdvancedStyles(dom, elm));
    }
    return data;
  };
  var switchRowType = function (dom, rowElm, toType) {
    var tableElm = dom.getParent(rowElm, 'table');
    var oldParentElm = rowElm.parentNode;
    var parentElm = dom.select(toType, tableElm)[0];
    if (!parentElm) {
      parentElm = dom.create(toType);
      if (tableElm.firstChild) {
        if (tableElm.firstChild.nodeName === 'CAPTION') {
          dom.insertAfter(parentElm, tableElm.firstChild);
        } else {
          tableElm.insertBefore(parentElm, tableElm.firstChild);
        }
      } else {
        tableElm.appendChild(parentElm);
      }
    }
    parentElm.appendChild(rowElm);
    if (!oldParentElm.hasChildNodes()) {
      dom.remove(oldParentElm);
    }
  };
  function onSubmitRowForm(editor, rows, oldData, evt) {
    var dom = editor.dom;
    function setAttrib(elm, name, value) {
      if (rows.length === 1 || value) {
        dom.setAttrib(elm, name, value);
      }
    }
    function setStyle(elm, name, value) {
      if (rows.length === 1 || value) {
        dom.setStyle(elm, name, value);
      }
    }
    if (hasAdvancedRowTab(editor)) {
      $_2d9h6botjn69h3vk.syncAdvancedStyleFields(editor, evt);
    }
    var data = evt.control.rootControl.toJSON();
    editor.undoManager.transact(function () {
      global$1.each(rows, function (rowElm) {
        setAttrib(rowElm, 'scope', data.scope);
        setAttrib(rowElm, 'style', data.style);
        setAttrib(rowElm, 'class', data.class);
        setStyle(rowElm, 'height', addSizeSuffix(data.height));
        if (data.type !== rowElm.parentNode.nodeName.toLowerCase()) {
          switchRowType(editor.dom, rowElm, data.type);
        }
        if (data.align !== oldData.align) {
          $_5fse46osjn69h3vk.unApplyAlign(editor, rowElm);
          $_5fse46osjn69h3vk.applyAlign(editor, rowElm, data.align);
        }
      });
      editor.focus();
    });
  }
  var open$1 = function (editor) {
    var dom = editor.dom;
    var tableElm, cellElm, rowElm, classListCtrl, data;
    var rows = [];
    var generalRowForm;
    tableElm = dom.getParent(editor.selection.getStart(), 'table');
    cellElm = dom.getParent(editor.selection.getStart(), 'td,th');
    global$1.each(tableElm.rows, function (row) {
      global$1.each(row.cells, function (cell) {
        if (dom.getAttrib(cell, 'data-mce-selected') || cell === cellElm) {
          rows.push(row);
          return false;
        }
      });
    });
    rowElm = rows[0];
    if (!rowElm) {
      return;
    }
    if (rows.length > 1) {
      data = {
        height: '',
        scope: '',
        style: '',
        class: '',
        align: '',
        type: rowElm.parentNode.nodeName.toLowerCase()
      };
    } else {
      data = extractDataFromElement$1(editor, rowElm);
    }
    if (getRowClassList(editor).length > 0) {
      classListCtrl = {
        name: 'class',
        type: 'listbox',
        label: 'Class',
        values: $_2d9h6botjn69h3vk.buildListItems(getRowClassList(editor), function (item) {
          if (item.value) {
            item.textStyle = function () {
              return editor.formatter.getCssText({
                block: 'tr',
                classes: [item.value]
              });
            };
          }
        })
      };
    }
    generalRowForm = {
      type: 'form',
      columns: 2,
      padding: 0,
      defaults: { type: 'textbox' },
      items: [
        {
          type: 'listbox',
          name: 'type',
          label: 'Row type',
          text: 'Header',
          maxWidth: null,
          values: [
            {
              text: 'Header',
              value: 'thead'
            },
            {
              text: 'Body',
              value: 'tbody'
            },
            {
              text: 'Footer',
              value: 'tfoot'
            }
          ]
        },
        {
          type: 'listbox',
          name: 'align',
          label: 'Alignment',
          text: 'None',
          maxWidth: null,
          values: [
            {
              text: 'None',
              value: ''
            },
            {
              text: 'Left',
              value: 'left'
            },
            {
              text: 'Center',
              value: 'center'
            },
            {
              text: 'Right',
              value: 'right'
            }
          ]
        },
        {
          label: 'Height',
          name: 'height'
        },
        classListCtrl
      ]
    };
    if (hasAdvancedRowTab(editor)) {
      editor.windowManager.open({
        title: 'Row properties',
        data: data,
        bodyType: 'tabpanel',
        body: [
          {
            title: 'General',
            type: 'form',
            items: generalRowForm
          },
          $_2d9h6botjn69h3vk.createStyleForm(editor)
        ],
        onsubmit: curry(onSubmitRowForm, editor, rows, data)
      });
    } else {
      editor.windowManager.open({
        title: 'Row properties',
        data: data,
        body: generalRowForm,
        onsubmit: curry(onSubmitRowForm, editor, rows, data)
      });
    }
  };
  var $_ckixraoujn69h3vk = { open: open$1 };

  var global$2 = tinymce.util.Tools.resolve('tinymce.Env');

  var DefaultRenderOptions = {
    styles: {
      'border-collapse': 'collapse',
      width: '100%'
    },
    attributes: { border: '1' },
    percentages: true
  };
  var makeTable = function () {
    return Element$$1.fromTag('table');
  };
  var tableBody = function () {
    return Element$$1.fromTag('tbody');
  };
  var tableRow = function () {
    return Element$$1.fromTag('tr');
  };
  var tableHeaderCell = function () {
    return Element$$1.fromTag('th');
  };
  var tableCell = function () {
    return Element$$1.fromTag('td');
  };
  var render$1 = function (rows, columns, rowHeaders, columnHeaders, renderOpts) {
    if (renderOpts === void 0) {
      renderOpts = DefaultRenderOptions;
    }
    var table = makeTable();
    $_6q24dgmajn69h2zq.setAll(table, renderOpts.styles);
    $_567jlzm1jn69h2wf.setAll(table, renderOpts.attributes);
    var tbody = tableBody();
    $_6szxhjmcjn69h306.append(table, tbody);
    var trs = [];
    for (var i = 0; i < rows; i++) {
      var tr = tableRow();
      for (var j = 0; j < columns; j++) {
        var td = i < rowHeaders || j < columnHeaders ? tableHeaderCell() : tableCell();
        if (j < columnHeaders) {
          $_567jlzm1jn69h2wf.set(td, 'scope', 'row');
        }
        if (i < rowHeaders) {
          $_567jlzm1jn69h2wf.set(td, 'scope', 'col');
        }
        $_6szxhjmcjn69h306.append(td, Element$$1.fromTag('br'));
        if (renderOpts.percentages) {
          $_6q24dgmajn69h2zq.set(td, 'width', 100 / columns + '%');
        }
        $_6szxhjmcjn69h306.append(tr, td);
      }
      trs.push(tr);
    }
    $_cys2y3mejn69h30m.append(tbody, trs);
    return table;
  };

  var get$8 = function (element) {
    return element.dom().innerHTML;
  };
  var set$5 = function (element, content) {
    var owner = $_g3g38plijn69h2tc.owner(element);
    var docDom = owner.dom();
    var fragment = Element$$1.fromDom(docDom.createDocumentFragment());
    var contentElements = $_6dzec3mljn69h32x.fromHtml(content, docDom);
    $_cys2y3mejn69h30m.append(fragment, contentElements);
    $_69icwdmdjn69h306.empty(element);
    $_6szxhjmcjn69h306.append(element, fragment);
  };
  var getOuter$2 = function (element) {
    var container = Element$$1.fromTag('div');
    var clone = Element$$1.fromDom(element.dom().cloneNode(true));
    $_6szxhjmcjn69h306.append(container, clone);
    return get$8(container);
  };
  var $_cbwcg2p0jn69h3xk = {
    get: get$8,
    set: set$5,
    getOuter: getOuter$2
  };

  var placeCaretInCell = function (editor, cell) {
    editor.selection.select(cell.dom(), true);
    editor.selection.collapse(true);
  };
  var selectFirstCellInTable = function (editor, tableElm) {
    $_72t5xvm6jn69h2xa.descendant(tableElm, 'td,th').each(curry(placeCaretInCell, editor));
  };
  var fireEvents = function (editor, table) {
    each($_yn4aam3jn69h2wv.descendants(table, 'tr'), function (row) {
      fireNewRow(editor, row.dom());
      each($_yn4aam3jn69h2wv.descendants(row, 'th,td'), function (cell) {
        fireNewCell(editor, cell.dom());
      });
    });
  };
  var isPercentage = function (width) {
    return isString(width) && width.indexOf('%') !== -1;
  };
  var insert$1 = function (editor, columns, rows) {
    var defaultStyles = getDefaultStyles(editor);
    var options = {
      styles: defaultStyles,
      attributes: getDefaultAttributes(editor),
      percentages: isPercentage(defaultStyles.width) && !isPixelsForced(editor)
    };
    var table = render$1(rows, columns, 0, 0, options);
    $_567jlzm1jn69h2wf.set(table, 'data-mce-id', '__mce');
    var html = $_cbwcg2p0jn69h3xk.getOuter(table);
    editor.insertContent(html);
    return $_72t5xvm6jn69h2xa.descendant(getBody$1(editor), 'table[data-mce-id="__mce"]').map(function (table) {
      if (isPixelsForced(editor)) {
        $_6q24dgmajn69h2zq.set(table, 'width', $_6q24dgmajn69h2zq.get(table, 'width'));
      }
      $_567jlzm1jn69h2wf.remove(table, 'data-mce-id');
      fireEvents(editor, table);
      selectFirstCellInTable(editor, table);
      return table.dom();
    }).getOr(null);
  };
  var $_2h1qp9oxjn69h3w0 = { insert: insert$1 };

  function styleTDTH(dom, elm, name, value) {
    if (elm.tagName === 'TD' || elm.tagName === 'TH') {
      dom.setStyle(elm, name, value);
    } else {
      if (elm.children) {
        for (var i = 0; i < elm.children.length; i++) {
          styleTDTH(dom, elm.children[i], name, value);
        }
      }
    }
  }
  var extractDataFromElement$2 = function (editor, tableElm) {
    var dom = editor.dom;
    var data = {
      width: dom.getStyle(tableElm, 'width') || dom.getAttrib(tableElm, 'width'),
      height: dom.getStyle(tableElm, 'height') || dom.getAttrib(tableElm, 'height'),
      cellspacing: dom.getStyle(tableElm, 'border-spacing') || dom.getAttrib(tableElm, 'cellspacing'),
      cellpadding: dom.getAttrib(tableElm, 'data-mce-cell-padding') || dom.getAttrib(tableElm, 'cellpadding') || $_5fse46osjn69h3vk.getTDTHOverallStyle(editor.dom, tableElm, 'padding'),
      border: dom.getAttrib(tableElm, 'data-mce-border') || dom.getAttrib(tableElm, 'border') || $_5fse46osjn69h3vk.getTDTHOverallStyle(editor.dom, tableElm, 'border'),
      borderColor: dom.getAttrib(tableElm, 'data-mce-border-color'),
      caption: !!dom.select('caption', tableElm)[0],
      class: dom.getAttrib(tableElm, 'class')
    };
    global$1.each('left center right'.split(' '), function (name) {
      if (editor.formatter.matchNode(tableElm, 'align' + name)) {
        data.align = name;
      }
    });
    if (hasAdvancedTableTab(editor)) {
      global$1.extend(data, $_2d9h6botjn69h3vk.extractAdvancedStyles(dom, tableElm));
    }
    return data;
  };
  var applyDataToElement = function (editor, tableElm, data) {
    var dom = editor.dom;
    var attrs = {};
    var styles = {};
    attrs.class = data.class;
    styles.height = addSizeSuffix(data.height);
    if (dom.getAttrib(tableElm, 'width') && !shouldStyleWithCss(editor)) {
      attrs.width = removePxSuffix(data.width);
    } else {
      styles.width = addSizeSuffix(data.width);
    }
    if (shouldStyleWithCss(editor)) {
      styles['border-width'] = addSizeSuffix(data.border);
      styles['border-spacing'] = addSizeSuffix(data.cellspacing);
      global$1.extend(attrs, {
        'data-mce-border-color': data.borderColor,
        'data-mce-cell-padding': data.cellpadding,
        'data-mce-border': data.border
      });
    } else {
      global$1.extend(attrs, {
        border: data.border,
        cellpadding: data.cellpadding,
        cellspacing: data.cellspacing
      });
    }
    if (shouldStyleWithCss(editor)) {
      if (tableElm.children) {
        for (var i = 0; i < tableElm.children.length; i++) {
          styleTDTH(dom, tableElm.children[i], {
            'border-width': addSizeSuffix(data.border),
            'border-color': data.borderColor,
            'padding': addSizeSuffix(data.cellpadding)
          });
        }
      }
    }
    if (data.style) {
      global$1.extend(styles, dom.parseStyle(data.style));
    } else {
      styles = global$1.extend({}, dom.parseStyle(dom.getAttrib(tableElm, 'style')), styles);
    }
    attrs.style = dom.serializeStyle(styles);
    dom.setAttribs(tableElm, attrs);
  };
  var onSubmitTableForm = function (editor, tableElm, evt) {
    var dom = editor.dom;
    var captionElm;
    var data;
    if (hasAdvancedTableTab(editor)) {
      $_2d9h6botjn69h3vk.syncAdvancedStyleFields(editor, evt);
    }
    data = evt.control.rootControl.toJSON();
    if (data.class === false) {
      delete data.class;
    }
    editor.undoManager.transact(function () {
      if (!tableElm) {
        tableElm = $_2h1qp9oxjn69h3w0.insert(editor, data.cols || 1, data.rows || 1);
      }
      applyDataToElement(editor, tableElm, data);
      captionElm = dom.select('caption', tableElm)[0];
      if (captionElm && !data.caption) {
        dom.remove(captionElm);
      }
      if (!captionElm && data.caption) {
        captionElm = dom.create('caption');
        captionElm.innerHTML = !global$2.ie ? '<br data-mce-bogus="1"/>' : '\xA0';
        tableElm.insertBefore(captionElm, tableElm.firstChild);
      }
      $_5fse46osjn69h3vk.unApplyAlign(editor, tableElm);
      if (data.align) {
        $_5fse46osjn69h3vk.applyAlign(editor, tableElm, data.align);
      }
      editor.focus();
      editor.addVisual();
    });
  };
  var open$2 = function (editor, isProps) {
    var dom = editor.dom;
    var tableElm, colsCtrl, rowsCtrl, classListCtrl, data = {}, generalTableForm;
    if (isProps === true) {
      tableElm = dom.getParent(editor.selection.getStart(), 'table');
      if (tableElm) {
        data = extractDataFromElement$2(editor, tableElm);
      }
    } else {
      colsCtrl = {
        label: 'Cols',
        name: 'cols'
      };
      rowsCtrl = {
        label: 'Rows',
        name: 'rows'
      };
    }
    if (getTableClassList(editor).length > 0) {
      if (data.class) {
        data.class = data.class.replace(/\s*mce\-item\-table\s*/g, '');
      }
      classListCtrl = {
        name: 'class',
        type: 'listbox',
        label: 'Class',
        values: $_2d9h6botjn69h3vk.buildListItems(getTableClassList(editor), function (item) {
          if (item.value) {
            item.textStyle = function () {
              return editor.formatter.getCssText({
                block: 'table',
                classes: [item.value]
              });
            };
          }
        })
      };
    }
    generalTableForm = {
      type: 'form',
      layout: 'flex',
      direction: 'column',
      labelGapCalc: 'children',
      padding: 0,
      items: [
        {
          type: 'form',
          labelGapCalc: false,
          padding: 0,
          layout: 'grid',
          columns: 2,
          defaults: {
            type: 'textbox',
            maxWidth: 50
          },
          items: hasAppearanceOptions(editor) ? [
            colsCtrl,
            rowsCtrl,
            {
              label: 'Width',
              name: 'width',
              onchange: curry($_2d9h6botjn69h3vk.updateStyleField, editor)
            },
            {
              label: 'Height',
              name: 'height',
              onchange: curry($_2d9h6botjn69h3vk.updateStyleField, editor)
            },
            {
              label: 'Cell spacing',
              name: 'cellspacing'
            },
            {
              label: 'Cell padding',
              name: 'cellpadding'
            },
            {
              label: 'Border',
              name: 'border'
            },
            {
              label: 'Caption',
              name: 'caption',
              type: 'checkbox'
            }
          ] : [
            colsCtrl,
            rowsCtrl,
            {
              label: 'Width',
              name: 'width',
              onchange: curry($_2d9h6botjn69h3vk.updateStyleField, editor)
            },
            {
              label: 'Height',
              name: 'height',
              onchange: curry($_2d9h6botjn69h3vk.updateStyleField, editor)
            }
          ]
        },
        {
          label: 'Alignment',
          name: 'align',
          type: 'listbox',
          text: 'None',
          values: [
            {
              text: 'None',
              value: ''
            },
            {
              text: 'Left',
              value: 'left'
            },
            {
              text: 'Center',
              value: 'center'
            },
            {
              text: 'Right',
              value: 'right'
            }
          ]
        },
        classListCtrl
      ]
    };
    if (hasAdvancedTableTab(editor)) {
      editor.windowManager.open({
        title: 'Table properties',
        data: data,
        bodyType: 'tabpanel',
        body: [
          {
            title: 'General',
            type: 'form',
            items: generalTableForm
          },
          $_2d9h6botjn69h3vk.createStyleForm(editor)
        ],
        onsubmit: curry(onSubmitTableForm, editor, tableElm)
      });
    } else {
      editor.windowManager.open({
        title: 'Table properties',
        data: data,
        body: generalTableForm,
        onsubmit: curry(onSubmitTableForm, editor, tableElm)
      });
    }
  };
  var $_atb2o2ovjn69h3w0 = { open: open$2 };

  var each$3 = global$1.each;
  var registerCommands = function (editor, actions, cellSelection, selections, clipboardRows) {
    var isRoot = getIsRoot(editor);
    var eraseTable = function () {
      var cell = Element$$1.fromDom(editor.dom.getParent(editor.selection.getStart(), 'th,td'));
      var table = $_2j92l5lcjn69h2r3.table(cell, isRoot);
      table.filter(not(isRoot)).each(function (table) {
        var cursor = Element$$1.fromText('');
        $_6szxhjmcjn69h306.after(table, cursor);
        $_69icwdmdjn69h306.remove(table);
        var rng = editor.dom.createRng();
        rng.setStart(cursor.dom(), 0);
        rng.setEnd(cursor.dom(), 0);
        editor.selection.setRng(rng);
      });
    };
    var getSelectionStartCell = function () {
      return Element$$1.fromDom(editor.dom.getParent(editor.selection.getStart(), 'th,td'));
    };
    var getTableFromCell = function (cell) {
      return $_2j92l5lcjn69h2r3.table(cell, isRoot);
    };
    var getSize = function (table) {
      return {
        width: getPixelWidth$1(table.dom()),
        height: getPixelWidth$1(table.dom())
      };
    };
    var resizeChange = function (editor, oldSize, table) {
      var newSize = getSize(table);
      if (oldSize.width !== newSize.width || oldSize.height !== newSize.height) {
        fireObjectResizeStart(editor, table.dom(), oldSize.width, oldSize.height);
        fireObjectResized(editor, table.dom(), newSize.width, newSize.height);
      }
    };
    var actOnSelection = function (execute) {
      var cell = getSelectionStartCell();
      var table = getTableFromCell(cell);
      table.each(function (table) {
        var targets = $_8an0jemmjn69h32x.forMenu(selections, table, cell);
        var beforeSize = getSize(table);
        execute(table, targets).each(function (rng) {
          resizeChange(editor, beforeSize, table);
          editor.selection.setRng(rng);
          editor.focus();
          cellSelection.clear(table);
          removeDataStyle(table);
        });
      });
    };
    var copyRowSelection = function (execute) {
      var cell = getSelectionStartCell();
      var table = getTableFromCell(cell);
      return table.bind(function (table) {
        var doc = Element$$1.fromDom(editor.getDoc());
        var targets = $_8an0jemmjn69h32x.forMenu(selections, table, cell);
        var generators = $_8b35ttmfjn69h30m.cellOperations(noop, doc, Option.none());
        return $_fnmlogopjn69h3v4.copyRows(table, targets, generators);
      });
    };
    var pasteOnSelection = function (execute) {
      clipboardRows.get().each(function (rows) {
        var clonedRows = map(rows, function (row) {
          return $_9sp4womgjn69h31w.deep(row);
        });
        var cell = getSelectionStartCell();
        var table = getTableFromCell(cell);
        table.bind(function (table) {
          var doc = Element$$1.fromDom(editor.getDoc());
          var generators = $_8b35ttmfjn69h30m.paste(doc);
          var targets = $_8an0jemmjn69h32x.pasteRows(selections, table, cell, clonedRows, generators);
          execute(table, targets).each(function (rng) {
            editor.selection.setRng(rng);
            editor.focus();
            cellSelection.clear(table);
          });
        });
      });
    };
    each$3({
      mceTableSplitCells: function () {
        actOnSelection(actions.unmergeCells);
      },
      mceTableMergeCells: function () {
        actOnSelection(actions.mergeCells);
      },
      mceTableInsertRowBefore: function () {
        actOnSelection(actions.insertRowsBefore);
      },
      mceTableInsertRowAfter: function () {
        actOnSelection(actions.insertRowsAfter);
      },
      mceTableInsertColBefore: function () {
        actOnSelection(actions.insertColumnsBefore);
      },
      mceTableInsertColAfter: function () {
        actOnSelection(actions.insertColumnsAfter);
      },
      mceTableDeleteCol: function () {
        actOnSelection(actions.deleteColumn);
      },
      mceTableDeleteRow: function () {
        actOnSelection(actions.deleteRow);
      },
      mceTableCutRow: function (grid) {
        clipboardRows.set(copyRowSelection());
        actOnSelection(actions.deleteRow);
      },
      mceTableCopyRow: function (grid) {
        clipboardRows.set(copyRowSelection());
      },
      mceTablePasteRowBefore: function (grid) {
        pasteOnSelection(actions.pasteRowsBefore);
      },
      mceTablePasteRowAfter: function (grid) {
        pasteOnSelection(actions.pasteRowsAfter);
      },
      mceTableDelete: eraseTable
    }, function (func, name) {
      editor.addCommand(name, func);
    });
    each$3({
      mceInsertTable: curry($_atb2o2ovjn69h3w0.open, editor),
      mceTableProps: curry($_atb2o2ovjn69h3w0.open, editor, true),
      mceTableRowProps: curry($_ckixraoujn69h3vk.open, editor),
      mceTableCellProps: curry($_c3p5s3orjn69h3v4.open, editor)
    }, function (func, name) {
      editor.addCommand(name, function (ui, val) {
        func(val);
      });
    });
  };
  var $_1lgkyqoojn69h3uk = { registerCommands: registerCommands };

  var only$1 = function (element) {
    var parent = Option.from(element.dom().documentElement).map(Element$$1.fromDom).getOr(element);
    return {
      parent: constant(parent),
      view: constant(element),
      origin: constant(Position(0, 0))
    };
  };
  var detached = function (editable, chrome) {
    var origin = curry($_f0yf06nejn69h3d6.absolute, chrome);
    return {
      parent: constant(chrome),
      view: constant(editable),
      origin: origin
    };
  };
  var body$1 = function (editable, chrome) {
    return {
      parent: constant(chrome),
      view: constant(editable),
      origin: constant(Position(0, 0))
    };
  };
  var $_1x9l7dp2jn69h3y7 = {
    only: only$1,
    detached: detached,
    body: body$1
  };

  function Event (fields) {
    var struct = Immutable.apply(null, fields);
    var handlers = [];
    var bind$$1 = function (handler) {
      if (handler === undefined) {
        throw 'Event bind error: undefined handler';
      }
      handlers.push(handler);
    };
    var unbind = function (handler) {
      handlers = filter(handlers, function (h) {
        return h !== handler;
      });
    };
    var trigger = function () {
      var event = struct.apply(null, arguments);
      each(handlers, function (handler) {
        handler(event);
      });
    };
    return {
      bind: bind$$1,
      unbind: unbind,
      trigger: trigger
    };
  }

  var create = function (typeDefs) {
    var registry = map$1(typeDefs, function (event) {
      return {
        bind: event.bind,
        unbind: event.unbind
      };
    });
    var trigger = map$1(typeDefs, function (event) {
      return event.trigger;
    });
    return {
      registry: registry,
      trigger: trigger
    };
  };
  var $_8o7k3yp5jn69h3zc = { create: create };

  var mode = exactly([
    'compare',
    'extract',
    'mutate',
    'sink'
  ]);
  var sink = exactly([
    'element',
    'start',
    'stop',
    'destroy'
  ]);
  var api$3 = exactly([
    'forceDrop',
    'drop',
    'move',
    'delayDrop'
  ]);
  var $_486g4pp9jn69h412 = {
    mode: mode,
    sink: sink,
    api: api$3
  };

  var styles$1 = css('ephox-dragster');
  var $_b548aypbjn69h41y = { resolve: styles$1.resolve };

  function Blocker (options) {
    var settings = merge$1({ 'layerClass': $_b548aypbjn69h41y.resolve('blocker') }, options);
    var div = Element$$1.fromTag('div');
    $_567jlzm1jn69h2wf.set(div, 'role', 'presentation');
    $_6q24dgmajn69h2zq.setAll(div, {
      position: 'fixed',
      left: '0px',
      top: '0px',
      width: '100%',
      height: '100%'
    });
    $_f2gsm6o2jn69h3q9.add(div, $_b548aypbjn69h41y.resolve('blocker'));
    $_f2gsm6o2jn69h3q9.add(div, settings.layerClass);
    var element = function () {
      return div;
    };
    var destroy = function () {
      $_69icwdmdjn69h306.remove(div);
    };
    return {
      element: element,
      destroy: destroy
    };
  }

  var mkEvent = function (target, x, y, stop, prevent, kill, raw) {
    return {
      'target': constant(target),
      'x': constant(x),
      'y': constant(y),
      'stop': stop,
      'prevent': prevent,
      'kill': kill,
      'raw': constant(raw)
    };
  };
  var handle = function (filter, handler) {
    return function (rawEvent) {
      if (!filter(rawEvent))
        return;
      var target = Element$$1.fromDom(rawEvent.target);
      var stop = function () {
        rawEvent.stopPropagation();
      };
      var prevent = function () {
        rawEvent.preventDefault();
      };
      var kill = compose(prevent, stop);
      var evt = mkEvent(target, rawEvent.clientX, rawEvent.clientY, stop, prevent, kill, rawEvent);
      handler(evt);
    };
  };
  var binder = function (element, event, filter, handler, useCapture) {
    var wrapped = handle(filter, handler);
    element.dom().addEventListener(event, wrapped, useCapture);
    return { unbind: curry(unbind, element, event, wrapped, useCapture) };
  };
  var bind$1 = function (element, event, filter, handler) {
    return binder(element, event, filter, handler, false);
  };
  var capture = function (element, event, filter, handler) {
    return binder(element, event, filter, handler, true);
  };
  var unbind = function (element, event, handler, useCapture) {
    element.dom().removeEventListener(event, handler, useCapture);
  };
  var $_3z1ivbpdjn69h42d = {
    bind: bind$1,
    capture: capture
  };

  var filter$1 = constant(true);
  var bind$2 = function (element, event, handler) {
    return $_3z1ivbpdjn69h42d.bind(element, event, filter$1, handler);
  };
  var capture$1 = function (element, event, handler) {
    return $_3z1ivbpdjn69h42d.capture(element, event, filter$1, handler);
  };
  var $_4w3whwpcjn69h41y = {
    bind: bind$2,
    capture: capture$1
  };

  var compare = function (old, nu) {
    return Position(nu.left() - old.left(), nu.top() - old.top());
  };
  var extract$1 = function (event) {
    return Option.some(Position(event.x(), event.y()));
  };
  var mutate$1 = function (mutation, info) {
    mutation.mutate(info.left(), info.top());
  };
  var sink$1 = function (dragApi, settings) {
    var blocker = Blocker(settings);
    var mdown = $_4w3whwpcjn69h41y.bind(blocker.element(), 'mousedown', dragApi.forceDrop);
    var mup = $_4w3whwpcjn69h41y.bind(blocker.element(), 'mouseup', dragApi.drop);
    var mmove = $_4w3whwpcjn69h41y.bind(blocker.element(), 'mousemove', dragApi.move);
    var mout = $_4w3whwpcjn69h41y.bind(blocker.element(), 'mouseout', dragApi.delayDrop);
    var destroy = function () {
      blocker.destroy();
      mup.unbind();
      mmove.unbind();
      mout.unbind();
      mdown.unbind();
    };
    var start = function (parent) {
      $_6szxhjmcjn69h306.append(parent, blocker.element());
    };
    var stop = function () {
      $_69icwdmdjn69h306.remove(blocker.element());
    };
    return $_486g4pp9jn69h412.sink({
      element: blocker.element,
      start: start,
      stop: stop,
      destroy: destroy
    });
  };
  var MouseDrag = $_486g4pp9jn69h412.mode({
    compare: compare,
    extract: extract$1,
    sink: sink$1,
    mutate: mutate$1
  });

  function InDrag () {
    var previous = Option.none();
    var reset = function () {
      previous = Option.none();
    };
    var update = function (mode, nu) {
      var result = previous.map(function (old) {
        return mode.compare(old, nu);
      });
      previous = Option.some(nu);
      return result;
    };
    var onEvent = function (event, mode) {
      var dataOption = mode.extract(event);
      dataOption.each(function (data) {
        var offset = update(mode, data);
        offset.each(function (d) {
          events.trigger.move(d);
        });
      });
    };
    var events = $_8o7k3yp5jn69h3zc.create({ move: Event(['info']) });
    return {
      onEvent: onEvent,
      reset: reset,
      events: events.registry
    };
  }

  function NoDrag (anchor) {
    var onEvent = function (event, mode) {
    };
    return {
      onEvent: onEvent,
      reset: noop
    };
  }

  function Movement () {
    var noDragState = NoDrag();
    var inDragState = InDrag();
    var dragState = noDragState;
    var on = function () {
      dragState.reset();
      dragState = inDragState;
    };
    var off = function () {
      dragState.reset();
      dragState = noDragState;
    };
    var onEvent = function (event, mode) {
      dragState.onEvent(event, mode);
    };
    var isOn = function () {
      return dragState === inDragState;
    };
    return {
      on: on,
      off: off,
      isOn: isOn,
      onEvent: onEvent,
      events: inDragState.events
    };
  }

  var last$3 = function (fn, rate) {
    var timer = null;
    var cancel = function () {
      if (timer !== null) {
        clearTimeout(timer);
        timer = null;
      }
    };
    var throttle = function () {
      var args = [];
      for (var _i = 0; _i < arguments.length; _i++) {
        args[_i] = arguments[_i];
      }
      if (timer !== null)
        clearTimeout(timer);
      timer = setTimeout(function () {
        fn.apply(null, args);
        timer = null;
      }, rate);
    };
    return {
      cancel: cancel,
      throttle: throttle
    };
  };

  var setup = function (mutation, mode, settings) {
    var active = false;
    var events = $_8o7k3yp5jn69h3zc.create({
      start: Event([]),
      stop: Event([])
    });
    var movement = Movement();
    var drop = function () {
      sink.stop();
      if (movement.isOn()) {
        movement.off();
        events.trigger.stop();
      }
    };
    var throttledDrop = last$3(drop, 200);
    var go = function (parent) {
      sink.start(parent);
      movement.on();
      events.trigger.start();
    };
    var mousemove = function (event, ui) {
      throttledDrop.cancel();
      movement.onEvent(event, mode);
    };
    movement.events.move.bind(function (event) {
      mode.mutate(mutation, event.info());
    });
    var on = function () {
      active = true;
    };
    var off = function () {
      active = false;
    };
    var runIfActive = function (f) {
      return function () {
        var args = Array.prototype.slice.call(arguments, 0);
        if (active) {
          return f.apply(null, args);
        }
      };
    };
    var sink = mode.sink($_486g4pp9jn69h412.api({
      forceDrop: drop,
      drop: runIfActive(drop),
      move: runIfActive(mousemove),
      delayDrop: runIfActive(throttledDrop.throttle)
    }), settings);
    var destroy = function () {
      sink.destroy();
    };
    return {
      element: sink.element,
      go: go,
      on: on,
      off: off,
      destroy: destroy,
      events: events.registry
    };
  };
  var $_6se3kjpejn69h42d = { setup: setup };

  var transform$1 = function (mutation, options) {
    var settings = options !== undefined ? options : {};
    var mode = settings.mode !== undefined ? settings.mode : MouseDrag;
    return $_6se3kjpejn69h42d.setup(mutation, mode, options);
  };
  var $_ddn6i5p7jn69h40n = { transform: transform$1 };

  function Mutation () {
    var events = $_8o7k3yp5jn69h3zc.create({
      'drag': Event([
        'xDelta',
        'yDelta'
      ])
    });
    var mutate = function (x, y) {
      events.trigger.drag(x, y);
    };
    return {
      mutate: mutate,
      events: events.registry
    };
  }

  function BarMutation () {
    var events = $_8o7k3yp5jn69h3zc.create({
      drag: Event([
        'xDelta',
        'yDelta',
        'target'
      ])
    });
    var target = Option.none();
    var delegate = Mutation();
    delegate.events.drag.bind(function (event) {
      target.each(function (t) {
        events.trigger.drag(event.xDelta(), event.yDelta(), t);
      });
    });
    var assign = function (t) {
      target = Option.some(t);
    };
    var get = function () {
      return target;
    };
    return {
      assign: assign,
      get: get,
      mutate: delegate.mutate,
      events: events.registry
    };
  }

  var any = function (selector) {
    return $_72t5xvm6jn69h2xa.first(selector).isSome();
  };
  var ancestor$2 = function (scope, selector, isRoot) {
    return $_72t5xvm6jn69h2xa.ancestor(scope, selector, isRoot).isSome();
  };
  var sibling$2 = function (scope, selector) {
    return $_72t5xvm6jn69h2xa.sibling(scope, selector).isSome();
  };
  var child$3 = function (scope, selector) {
    return $_72t5xvm6jn69h2xa.child(scope, selector).isSome();
  };
  var descendant$2 = function (scope, selector) {
    return $_72t5xvm6jn69h2xa.descendant(scope, selector).isSome();
  };
  var closest$2 = function (scope, selector, isRoot) {
    return $_72t5xvm6jn69h2xa.closest(scope, selector, isRoot).isSome();
  };
  var $_85i4gxpljn69h442 = {
    any: any,
    ancestor: ancestor$2,
    sibling: sibling$2,
    child: child$3,
    descendant: descendant$2,
    closest: closest$2
  };

  var resizeBarDragging = $_9z63sio0jn69h3q2.resolve('resizer-bar-dragging');
  function BarManager (wire, direction, hdirection) {
    var mutation = BarMutation();
    var resizing = $_ddn6i5p7jn69h40n.transform(mutation, {});
    var hoverTable = Option.none();
    var getResizer = function (element, type) {
      return Option.from($_567jlzm1jn69h2wf.get(element, type));
    };
    mutation.events.drag.bind(function (event) {
      getResizer(event.target(), 'data-row').each(function (_dataRow) {
        var currentRow = $_ew0fp2ogjn69h3sd.getInt(event.target(), 'top');
        $_6q24dgmajn69h2zq.set(event.target(), 'top', currentRow + event.yDelta() + 'px');
      });
      getResizer(event.target(), 'data-column').each(function (_dataCol) {
        var currentCol = $_ew0fp2ogjn69h3sd.getInt(event.target(), 'left');
        $_6q24dgmajn69h2zq.set(event.target(), 'left', currentCol + event.xDelta() + 'px');
      });
    });
    var getDelta = function (target, direction) {
      var newX = $_ew0fp2ogjn69h3sd.getInt(target, direction);
      var oldX = parseInt($_567jlzm1jn69h2wf.get(target, 'data-initial-' + direction), 10);
      return newX - oldX;
    };
    resizing.events.stop.bind(function () {
      mutation.get().each(function (target) {
        hoverTable.each(function (table) {
          getResizer(target, 'data-row').each(function (row) {
            var delta = getDelta(target, 'top');
            $_567jlzm1jn69h2wf.remove(target, 'data-initial-top');
            events.trigger.adjustHeight(table, delta, parseInt(row, 10));
          });
          getResizer(target, 'data-column').each(function (column) {
            var delta = getDelta(target, 'left');
            $_567jlzm1jn69h2wf.remove(target, 'data-initial-left');
            events.trigger.adjustWidth(table, delta, parseInt(column, 10));
          });
          $_5d3blhnwjn69h3ma.refresh(wire, table, hdirection, direction);
        });
      });
    });
    var handler = function (target, direction) {
      events.trigger.startAdjust();
      mutation.assign(target);
      $_567jlzm1jn69h2wf.set(target, 'data-initial-' + direction, parseInt($_6q24dgmajn69h2zq.get(target, direction), 10));
      $_f2gsm6o2jn69h3q9.add(target, resizeBarDragging);
      $_6q24dgmajn69h2zq.set(target, 'opacity', '0.2');
      resizing.go(wire.parent());
    };
    var mousedown = $_4w3whwpcjn69h41y.bind(wire.parent(), 'mousedown', function (event) {
      if ($_5d3blhnwjn69h3ma.isRowBar(event.target()))
        handler(event.target(), 'top');
      if ($_5d3blhnwjn69h3ma.isColBar(event.target()))
        handler(event.target(), 'left');
    });
    var isRoot = function (e) {
      return $_bakwgmlkjn69h2u8.eq(e, wire.view());
    };
    var mouseover = $_4w3whwpcjn69h41y.bind(wire.view(), 'mouseover', function (event) {
      if ($_5f9i72m2jn69h2wv.name(event.target()) === 'table' || $_85i4gxpljn69h442.closest(event.target(), 'table', isRoot)) {
        hoverTable = $_5f9i72m2jn69h2wv.name(event.target()) === 'table' ? Option.some(event.target()) : $_72t5xvm6jn69h2xa.ancestor(event.target(), 'table', isRoot);
        hoverTable.each(function (ht) {
          $_5d3blhnwjn69h3ma.refresh(wire, ht, hdirection, direction);
        });
      } else if ($_f5xfqwm5jn69h2xa.inBody(event.target())) {
        $_5d3blhnwjn69h3ma.destroy(wire);
      }
    });
    var destroy = function () {
      mousedown.unbind();
      mouseover.unbind();
      resizing.destroy();
      $_5d3blhnwjn69h3ma.destroy(wire);
    };
    var refresh = function (tbl) {
      $_5d3blhnwjn69h3ma.refresh(wire, tbl, hdirection, direction);
    };
    var events = $_8o7k3yp5jn69h3zc.create({
      adjustHeight: Event([
        'table',
        'delta',
        'row'
      ]),
      adjustWidth: Event([
        'table',
        'delta',
        'column'
      ]),
      startAdjust: Event([])
    });
    return {
      destroy: destroy,
      refresh: refresh,
      on: resizing.on,
      off: resizing.off,
      hideBars: curry($_5d3blhnwjn69h3ma.hide, wire),
      showBars: curry($_5d3blhnwjn69h3ma.show, wire),
      events: events.registry
    };
  }

  function TableResize (wire, vdirection) {
    var hdirection = $_2nobmpndjn69h3cy.height;
    var manager = BarManager(wire, vdirection, hdirection);
    var events = $_8o7k3yp5jn69h3zc.create({
      beforeResize: Event(['table']),
      afterResize: Event(['table']),
      startDrag: Event([])
    });
    manager.events.adjustHeight.bind(function (event) {
      events.trigger.beforeResize(event.table());
      var delta = hdirection.delta(event.delta(), event.table());
      $_70ius4ocjn69h3ry.adjustHeight(event.table(), delta, event.row(), hdirection);
      events.trigger.afterResize(event.table());
    });
    manager.events.startAdjust.bind(function (event) {
      events.trigger.startDrag();
    });
    manager.events.adjustWidth.bind(function (event) {
      events.trigger.beforeResize(event.table());
      var delta = vdirection.delta(event.delta(), event.table());
      $_70ius4ocjn69h3ry.adjustWidth(event.table(), delta, event.column(), vdirection);
      events.trigger.afterResize(event.table());
    });
    return {
      on: manager.on,
      off: manager.off,
      hideBars: manager.hideBars,
      showBars: manager.showBars,
      destroy: manager.destroy,
      events: events.registry
    };
  }

  var createContainer = function () {
    var container = Element$$1.fromTag('div');
    $_6q24dgmajn69h2zq.setAll(container, {
      position: 'static',
      height: '0',
      width: '0',
      padding: '0',
      margin: '0',
      border: '0'
    });
    $_6szxhjmcjn69h306.append($_f5xfqwm5jn69h2xa.body(), container);
    return container;
  };
  var get$9 = function (editor, container) {
    return editor.inline ? $_1x9l7dp2jn69h3y7.body(getBody$1(editor), createContainer()) : $_1x9l7dp2jn69h3y7.only(Element$$1.fromDom(editor.getDoc()));
  };
  var remove$6 = function (editor, wire) {
    if (editor.inline) {
      $_69icwdmdjn69h306.remove(wire.parent());
    }
  };
  var $_3d0kgopmjn69h445 = {
    get: get$9,
    remove: remove$6
  };

  var ResizeHandler = function (editor) {
    var selectionRng = Option.none();
    var resize = Option.none();
    var wire = Option.none();
    var percentageBasedSizeRegex = /(\d+(\.\d+)?)%/;
    var startW, startRawW;
    var isTable = function (elm) {
      return elm.nodeName === 'TABLE';
    };
    var getRawWidth = function (elm) {
      return editor.dom.getStyle(elm, 'width') || editor.dom.getAttrib(elm, 'width');
    };
    var lazyResize = function () {
      return resize;
    };
    var lazyWire = function () {
      return wire.getOr($_1x9l7dp2jn69h3y7.only(Element$$1.fromDom(editor.getBody())));
    };
    var destroy = function () {
      resize.each(function (sz) {
        sz.destroy();
      });
      wire.each(function (w) {
        $_3d0kgopmjn69h445.remove(editor, w);
      });
    };
    editor.on('init', function () {
      var direction = TableDirection($_5imzneokjn69h3to.directionAt);
      var rawWire = $_3d0kgopmjn69h445.get(editor);
      wire = Option.some(rawWire);
      if (hasObjectResizing(editor) && hasTableResizeBars(editor)) {
        var sz = TableResize(rawWire, direction);
        sz.on();
        sz.events.startDrag.bind(function (event) {
          selectionRng = Option.some(editor.selection.getRng());
        });
        sz.events.beforeResize.bind(function (event) {
          var rawTable = event.table().dom();
          fireObjectResizeStart(editor, rawTable, getPixelWidth$1(rawTable), getPixelHeight(rawTable));
        });
        sz.events.afterResize.bind(function (event) {
          var table = event.table();
          var rawTable = table.dom();
          removeDataStyle(table);
          selectionRng.each(function (rng) {
            editor.selection.setRng(rng);
            editor.focus();
          });
          fireObjectResized(editor, rawTable, getPixelWidth$1(rawTable), getPixelHeight(rawTable));
          editor.undoManager.add();
        });
        resize = Option.some(sz);
      }
    });
    editor.on('ObjectResizeStart', function (e) {
      var targetElm = e.target;
      if (isTable(targetElm)) {
        startW = e.width;
        startRawW = getRawWidth(targetElm);
      }
    });
    editor.on('ObjectResized', function (e) {
      var targetElm = e.target;
      if (isTable(targetElm)) {
        var table = targetElm;
        if (percentageBasedSizeRegex.test(startRawW)) {
          var percentW = parseFloat(percentageBasedSizeRegex.exec(startRawW)[1]);
          var targetPercentW = e.width * percentW / startW;
          editor.dom.setStyle(table, 'width', targetPercentW + '%');
        } else {
          var newCellSizes_1 = [];
          global$1.each(table.rows, function (row) {
            global$1.each(row.cells, function (cell) {
              var width = editor.dom.getStyle(cell, 'width', true);
              newCellSizes_1.push({
                cell: cell,
                width: width
              });
            });
          });
          global$1.each(newCellSizes_1, function (newCellSize) {
            editor.dom.setStyle(newCellSize.cell, 'width', newCellSize.width);
            editor.dom.setAttrib(newCellSize.cell, 'width', null);
          });
        }
      }
    });
    return {
      lazyResize: lazyResize,
      lazyWire: lazyWire,
      destroy: destroy
    };
  };

  var none$2 = function (current) {
    return folder$1(function (n, f, m, l) {
      return n(current);
    });
  };
  var first$5 = function (current) {
    return folder$1(function (n, f, m, l) {
      return f(current);
    });
  };
  var middle$1 = function (current, target) {
    return folder$1(function (n, f, m, l) {
      return m(current, target);
    });
  };
  var last$4 = function (current) {
    return folder$1(function (n, f, m, l) {
      return l(current);
    });
  };
  var folder$1 = function (fold) {
    return { fold: fold };
  };
  var $_1ymblxppjn69h45e = {
    none: none$2,
    first: first$5,
    middle: middle$1,
    last: last$4
  };

  var detect$4 = function (current, isRoot) {
    return $_2j92l5lcjn69h2r3.table(current, isRoot).bind(function (table) {
      var all = $_2j92l5lcjn69h2r3.cells(table);
      var index = findIndex(all, function (x) {
        return $_bakwgmlkjn69h2u8.eq(current, x);
      });
      return index.map(function (ind) {
        return {
          index: constant(ind),
          all: constant(all)
        };
      });
    });
  };
  var next = function (current, isRoot) {
    var detection = detect$4(current, isRoot);
    return detection.fold(function () {
      return $_1ymblxppjn69h45e.none(current);
    }, function (info) {
      return info.index() + 1 < info.all().length ? $_1ymblxppjn69h45e.middle(current, info.all()[info.index() + 1]) : $_1ymblxppjn69h45e.last(current);
    });
  };
  var prev = function (current, isRoot) {
    var detection = detect$4(current, isRoot);
    return detection.fold(function () {
      return $_1ymblxppjn69h45e.none();
    }, function (info) {
      return info.index() - 1 >= 0 ? $_1ymblxppjn69h45e.middle(current, info.all()[info.index() - 1]) : $_1ymblxppjn69h45e.first(current);
    });
  };
  var $_yixkepojn69h44z = {
    next: next,
    prev: prev
  };

  var adt = Adt.generate([
    { 'before': ['element'] },
    {
      'on': [
        'element',
        'offset'
      ]
    },
    { after: ['element'] }
  ]);
  var cata$1 = function (subject, onBefore, onOn, onAfter) {
    return subject.fold(onBefore, onOn, onAfter);
  };
  var getStart = function (situ) {
    return situ.fold(identity, identity, identity);
  };
  var $_499da6prjn69h45u = {
    before: adt.before,
    on: adt.on,
    after: adt.after,
    cata: cata$1,
    getStart: getStart
  };

  var type$2 = Adt.generate([
    { domRange: ['rng'] },
    {
      relative: [
        'startSitu',
        'finishSitu'
      ]
    },
    {
      exact: [
        'start',
        'soffset',
        'finish',
        'foffset'
      ]
    }
  ]);
  var range$2 = Immutable('start', 'soffset', 'finish', 'foffset');
  var exactFromRange = function (simRange) {
    return type$2.exact(simRange.start(), simRange.soffset(), simRange.finish(), simRange.foffset());
  };
  var getStart$1 = function (selection) {
    return selection.match({
      domRange: function (rng) {
        return Element$$1.fromDom(rng.startContainer);
      },
      relative: function (startSitu, finishSitu) {
        return $_499da6prjn69h45u.getStart(startSitu);
      },
      exact: function (start, soffset, finish, foffset) {
        return start;
      }
    });
  };
  var getWin = function (selection) {
    var start = getStart$1(selection);
    return $_g3g38plijn69h2tc.defaultView(start);
  };
  var $_bozl9jpqjn69h45e = {
    domRange: type$2.domRange,
    relative: type$2.relative,
    exact: type$2.exact,
    exactFromRange: exactFromRange,
    range: range$2,
    getWin: getWin
  };

  var makeRange = function (start, soffset, finish, foffset) {
    var doc = $_g3g38plijn69h2tc.owner(start);
    var rng = doc.dom().createRange();
    rng.setStart(start.dom(), soffset);
    rng.setEnd(finish.dom(), foffset);
    return rng;
  };
  var commonAncestorContainer = function (start, soffset, finish, foffset) {
    var r = makeRange(start, soffset, finish, foffset);
    return Element$$1.fromDom(r.commonAncestorContainer);
  };
  var after$2 = function (start, soffset, finish, foffset) {
    var r = makeRange(start, soffset, finish, foffset);
    var same = $_bakwgmlkjn69h2u8.eq(start, finish) && soffset === foffset;
    return r.collapsed && !same;
  };
  var $_xo7uuptjn69h46f = {
    after: after$2,
    commonAncestorContainer: commonAncestorContainer
  };

  var fromElements = function (elements, scope) {
    var doc = scope || document;
    var fragment = doc.createDocumentFragment();
    each(elements, function (element) {
      fragment.appendChild(element.dom());
    });
    return Element$$1.fromDom(fragment);
  };
  var $_28siovpujn69h46i = { fromElements: fromElements };

  var selectNodeContents = function (win, element) {
    var rng = win.document.createRange();
    selectNodeContentsUsing(rng, element);
    return rng;
  };
  var selectNodeContentsUsing = function (rng, element) {
    rng.selectNodeContents(element.dom());
  };
  var isWithin$1 = function (outerRange, innerRange) {
    return innerRange.compareBoundaryPoints(outerRange.END_TO_START, outerRange) < 1 && innerRange.compareBoundaryPoints(outerRange.START_TO_END, outerRange) > -1;
  };
  var create$1 = function (win) {
    return win.document.createRange();
  };
  var setStart = function (rng, situ) {
    situ.fold(function (e) {
      rng.setStartBefore(e.dom());
    }, function (e, o) {
      rng.setStart(e.dom(), o);
    }, function (e) {
      rng.setStartAfter(e.dom());
    });
  };
  var setFinish = function (rng, situ) {
    situ.fold(function (e) {
      rng.setEndBefore(e.dom());
    }, function (e, o) {
      rng.setEnd(e.dom(), o);
    }, function (e) {
      rng.setEndAfter(e.dom());
    });
  };
  var replaceWith = function (rng, fragment) {
    deleteContents(rng);
    rng.insertNode(fragment.dom());
  };
  var relativeToNative = function (win, startSitu, finishSitu) {
    var range = win.document.createRange();
    setStart(range, startSitu);
    setFinish(range, finishSitu);
    return range;
  };
  var exactToNative = function (win, start, soffset, finish, foffset) {
    var rng = win.document.createRange();
    rng.setStart(start.dom(), soffset);
    rng.setEnd(finish.dom(), foffset);
    return rng;
  };
  var deleteContents = function (rng) {
    rng.deleteContents();
  };
  var cloneFragment = function (rng) {
    var fragment = rng.cloneContents();
    return Element$$1.fromDom(fragment);
  };
  var toRect = function (rect) {
    return {
      left: constant(rect.left),
      top: constant(rect.top),
      right: constant(rect.right),
      bottom: constant(rect.bottom),
      width: constant(rect.width),
      height: constant(rect.height)
    };
  };
  var getFirstRect = function (rng) {
    var rects = rng.getClientRects();
    var rect = rects.length > 0 ? rects[0] : rng.getBoundingClientRect();
    return rect.width > 0 || rect.height > 0 ? Option.some(rect).map(toRect) : Option.none();
  };
  var getBounds$1 = function (rng) {
    var rect = rng.getBoundingClientRect();
    return rect.width > 0 || rect.height > 0 ? Option.some(rect).map(toRect) : Option.none();
  };
  var toString = function (rng) {
    return rng.toString();
  };
  var $_7c4ab5pvjn69h46o = {
    create: create$1,
    replaceWith: replaceWith,
    selectNodeContents: selectNodeContents,
    selectNodeContentsUsing: selectNodeContentsUsing,
    relativeToNative: relativeToNative,
    exactToNative: exactToNative,
    deleteContents: deleteContents,
    cloneFragment: cloneFragment,
    getFirstRect: getFirstRect,
    getBounds: getBounds$1,
    isWithin: isWithin$1,
    toString: toString
  };

  var adt$1 = Adt.generate([
    {
      ltr: [
        'start',
        'soffset',
        'finish',
        'foffset'
      ]
    },
    {
      rtl: [
        'start',
        'soffset',
        'finish',
        'foffset'
      ]
    }
  ]);
  var fromRange = function (win, type, range) {
    return type(Element$$1.fromDom(range.startContainer), range.startOffset, Element$$1.fromDom(range.endContainer), range.endOffset);
  };
  var getRanges = function (win, selection) {
    return selection.match({
      domRange: function (rng) {
        return {
          ltr: constant(rng),
          rtl: Option.none
        };
      },
      relative: function (startSitu, finishSitu) {
        return {
          ltr: cached(function () {
            return $_7c4ab5pvjn69h46o.relativeToNative(win, startSitu, finishSitu);
          }),
          rtl: cached(function () {
            return Option.some($_7c4ab5pvjn69h46o.relativeToNative(win, finishSitu, startSitu));
          })
        };
      },
      exact: function (start, soffset, finish, foffset) {
        return {
          ltr: cached(function () {
            return $_7c4ab5pvjn69h46o.exactToNative(win, start, soffset, finish, foffset);
          }),
          rtl: cached(function () {
            return Option.some($_7c4ab5pvjn69h46o.exactToNative(win, finish, foffset, start, soffset));
          })
        };
      }
    });
  };
  var doDiagnose = function (win, ranges) {
    var rng = ranges.ltr();
    if (rng.collapsed) {
      var reversed = ranges.rtl().filter(function (rev) {
        return rev.collapsed === false;
      });
      return reversed.map(function (rev) {
        return adt$1.rtl(Element$$1.fromDom(rev.endContainer), rev.endOffset, Element$$1.fromDom(rev.startContainer), rev.startOffset);
      }).getOrThunk(function () {
        return fromRange(win, adt$1.ltr, rng);
      });
    } else {
      return fromRange(win, adt$1.ltr, rng);
    }
  };
  var diagnose = function (win, selection) {
    var ranges = getRanges(win, selection);
    return doDiagnose(win, ranges);
  };
  var asLtrRange = function (win, selection) {
    var diagnosis = diagnose(win, selection);
    return diagnosis.match({
      ltr: function (start, soffset, finish, foffset) {
        var rng = win.document.createRange();
        rng.setStart(start.dom(), soffset);
        rng.setEnd(finish.dom(), foffset);
        return rng;
      },
      rtl: function (start, soffset, finish, foffset) {
        var rng = win.document.createRange();
        rng.setStart(finish.dom(), foffset);
        rng.setEnd(start.dom(), soffset);
        return rng;
      }
    });
  };
  var $_ff9v9hpwjn69h46v = {
    ltr: adt$1.ltr,
    rtl: adt$1.rtl,
    diagnose: diagnose,
    asLtrRange: asLtrRange
  };

  var searchForPoint = function (rectForOffset, x, y, maxX, length) {
    if (length === 0)
      return 0;
    else if (x === maxX)
      return length - 1;
    var xDelta = maxX;
    for (var i = 1; i < length; i++) {
      var rect = rectForOffset(i);
      var curDeltaX = Math.abs(x - rect.left);
      if (y <= rect.bottom) {
        if (y < rect.top || curDeltaX > xDelta) {
          return i - 1;
        } else {
          xDelta = curDeltaX;
        }
      }
    }
    return 0;
  };
  var inRect = function (rect, x, y) {
    return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
  };
  var $_gatx2wpzjn69h47q = {
    inRect: inRect,
    searchForPoint: searchForPoint
  };

  var locateOffset = function (doc, textnode, x, y, rect) {
    var rangeForOffset = function (offset) {
      var r = doc.dom().createRange();
      r.setStart(textnode.dom(), offset);
      r.collapse(true);
      return r;
    };
    var rectForOffset = function (offset) {
      var r = rangeForOffset(offset);
      return r.getBoundingClientRect();
    };
    var length = $_eo2rq0mjjn69h32m.get(textnode).length;
    var offset = $_gatx2wpzjn69h47q.searchForPoint(rectForOffset, x, y, rect.right, length);
    return rangeForOffset(offset);
  };
  var locate = function (doc, node, x, y) {
    var r = doc.dom().createRange();
    r.selectNode(node.dom());
    var rects = r.getClientRects();
    var foundRect = findMap(rects, function (rect) {
      return $_gatx2wpzjn69h47q.inRect(rect, x, y) ? Option.some(rect) : Option.none();
    });
    return foundRect.map(function (rect) {
      return locateOffset(doc, node, x, y, rect);
    });
  };
  var $_1qfz4cq0jn69h47q = { locate: locate };

  var searchInChildren = function (doc, node, x, y) {
    var r = doc.dom().createRange();
    var nodes = $_g3g38plijn69h2tc.children(node);
    return findMap(nodes, function (n) {
      r.selectNode(n.dom());
      return $_gatx2wpzjn69h47q.inRect(r.getBoundingClientRect(), x, y) ? locateNode(doc, n, x, y) : Option.none();
    });
  };
  var locateNode = function (doc, node, x, y) {
    var locator = $_5f9i72m2jn69h2wv.isText(node) ? $_1qfz4cq0jn69h47q.locate : searchInChildren;
    return locator(doc, node, x, y);
  };
  var locate$1 = function (doc, node, x, y) {
    var r = doc.dom().createRange();
    r.selectNode(node.dom());
    var rect = r.getBoundingClientRect();
    var boundedX = Math.max(rect.left, Math.min(rect.right, x));
    var boundedY = Math.max(rect.top, Math.min(rect.bottom, y));
    return locateNode(doc, node, boundedX, boundedY);
  };
  var $_jyok8pyjn69h47a = { locate: locate$1 };

  var COLLAPSE_TO_LEFT = true;
  var COLLAPSE_TO_RIGHT = false;
  var getCollapseDirection = function (rect, x) {
    return x - rect.left < rect.right - x ? COLLAPSE_TO_LEFT : COLLAPSE_TO_RIGHT;
  };
  var createCollapsedNode = function (doc, target, collapseDirection) {
    var r = doc.dom().createRange();
    r.selectNode(target.dom());
    r.collapse(collapseDirection);
    return r;
  };
  var locateInElement = function (doc, node, x) {
    var cursorRange = doc.dom().createRange();
    cursorRange.selectNode(node.dom());
    var rect = cursorRange.getBoundingClientRect();
    var collapseDirection = getCollapseDirection(rect, x);
    var f = collapseDirection === COLLAPSE_TO_LEFT ? $_c4imwkmhjn69h31w.first : $_c4imwkmhjn69h31w.last;
    return f(node).map(function (target) {
      return createCollapsedNode(doc, target, collapseDirection);
    });
  };
  var locateInEmpty = function (doc, node, x) {
    var rect = node.dom().getBoundingClientRect();
    var collapseDirection = getCollapseDirection(rect, x);
    return Option.some(createCollapsedNode(doc, node, collapseDirection));
  };
  var search = function (doc, node, x) {
    var f = $_g3g38plijn69h2tc.children(node).length === 0 ? locateInEmpty : locateInElement;
    return f(doc, node, x);
  };
  var $_5s2ihsq1jn69h485 = { search: search };

  var caretPositionFromPoint = function (doc, x, y) {
    return Option.from(doc.dom().caretPositionFromPoint(x, y)).bind(function (pos) {
      if (pos.offsetNode === null)
        return Option.none();
      var r = doc.dom().createRange();
      r.setStart(pos.offsetNode, pos.offset);
      r.collapse();
      return Option.some(r);
    });
  };
  var caretRangeFromPoint = function (doc, x, y) {
    return Option.from(doc.dom().caretRangeFromPoint(x, y));
  };
  var searchTextNodes = function (doc, node, x, y) {
    var r = doc.dom().createRange();
    r.selectNode(node.dom());
    var rect = r.getBoundingClientRect();
    var boundedX = Math.max(rect.left, Math.min(rect.right, x));
    var boundedY = Math.max(rect.top, Math.min(rect.bottom, y));
    return $_jyok8pyjn69h47a.locate(doc, node, boundedX, boundedY);
  };
  var searchFromPoint = function (doc, x, y) {
    return Element$$1.fromPoint(doc, x, y).bind(function (elem) {
      var fallback = function () {
        return $_5s2ihsq1jn69h485.search(doc, elem, x);
      };
      return $_g3g38plijn69h2tc.children(elem).length === 0 ? fallback() : searchTextNodes(doc, elem, x, y).orThunk(fallback);
    });
  };
  var availableSearch = document.caretPositionFromPoint ? caretPositionFromPoint : document.caretRangeFromPoint ? caretRangeFromPoint : searchFromPoint;
  var fromPoint$1 = function (win, x, y) {
    var doc = Element$$1.fromDom(win.document);
    return availableSearch(doc, x, y).map(function (rng) {
      return $_bozl9jpqjn69h45e.range(Element$$1.fromDom(rng.startContainer), rng.startOffset, Element$$1.fromDom(rng.endContainer), rng.endOffset);
    });
  };
  var $_2fmkulpxjn69h47a = { fromPoint: fromPoint$1 };

  var withinContainer = function (win, ancestor, outerRange, selector) {
    var innerRange = $_7c4ab5pvjn69h46o.create(win);
    var self = $_ez7xfelejn69h2sh.is(ancestor, selector) ? [ancestor] : [];
    var elements = self.concat($_yn4aam3jn69h2wv.descendants(ancestor, selector));
    return filter(elements, function (elem) {
      $_7c4ab5pvjn69h46o.selectNodeContentsUsing(innerRange, elem);
      return $_7c4ab5pvjn69h46o.isWithin(outerRange, innerRange);
    });
  };
  var find$3 = function (win, selection, selector) {
    var outerRange = $_ff9v9hpwjn69h46v.asLtrRange(win, selection);
    var ancestor = Element$$1.fromDom(outerRange.commonAncestorContainer);
    return $_5f9i72m2jn69h2wv.isElement(ancestor) ? withinContainer(win, ancestor, outerRange, selector) : [];
  };
  var $_ehtbncq2jn69h485 = { find: find$3 };

  var beforeSpecial = function (element, offset) {
    var name = $_5f9i72m2jn69h2wv.name(element);
    if ('input' === name)
      return $_499da6prjn69h45u.after(element);
    else if (!contains([
        'br',
        'img'
      ], name))
      return $_499da6prjn69h45u.on(element, offset);
    else
      return offset === 0 ? $_499da6prjn69h45u.before(element) : $_499da6prjn69h45u.after(element);
  };
  var preprocessRelative = function (startSitu, finishSitu) {
    var start = startSitu.fold($_499da6prjn69h45u.before, beforeSpecial, $_499da6prjn69h45u.after);
    var finish = finishSitu.fold($_499da6prjn69h45u.before, beforeSpecial, $_499da6prjn69h45u.after);
    return $_bozl9jpqjn69h45e.relative(start, finish);
  };
  var preprocessExact = function (start, soffset, finish, foffset) {
    var startSitu = beforeSpecial(start, soffset);
    var finishSitu = beforeSpecial(finish, foffset);
    return $_bozl9jpqjn69h45e.relative(startSitu, finishSitu);
  };
  var preprocess = function (selection) {
    return selection.match({
      domRange: function (rng) {
        var start = Element$$1.fromDom(rng.startContainer);
        var finish = Element$$1.fromDom(rng.endContainer);
        return preprocessExact(start, rng.startOffset, finish, rng.endOffset);
      },
      relative: preprocessRelative,
      exact: preprocessExact
    });
  };
  var $_eor3d4q3jn69h485 = {
    beforeSpecial: beforeSpecial,
    preprocess: preprocess,
    preprocessRelative: preprocessRelative,
    preprocessExact: preprocessExact
  };

  var doSetNativeRange = function (win, rng) {
    Option.from(win.getSelection()).each(function (selection) {
      selection.removeAllRanges();
      selection.addRange(rng);
    });
  };
  var doSetRange = function (win, start, soffset, finish, foffset) {
    var rng = $_7c4ab5pvjn69h46o.exactToNative(win, start, soffset, finish, foffset);
    doSetNativeRange(win, rng);
  };
  var findWithin = function (win, selection, selector) {
    return $_ehtbncq2jn69h485.find(win, selection, selector);
  };
  var setLegacyRtlRange = function (win, selection, start, soffset, finish, foffset) {
    selection.collapse(start.dom(), soffset);
    selection.extend(finish.dom(), foffset);
  };
  var setRangeFromRelative = function (win, relative) {
    return $_ff9v9hpwjn69h46v.diagnose(win, relative).match({
      ltr: function (start, soffset, finish, foffset) {
        doSetRange(win, start, soffset, finish, foffset);
      },
      rtl: function (start, soffset, finish, foffset) {
        var selection = win.getSelection();
        if (selection.setBaseAndExtent) {
          selection.setBaseAndExtent(start.dom(), soffset, finish.dom(), foffset);
        } else if (selection.extend) {
          try {
            setLegacyRtlRange(win, selection, start, soffset, finish, foffset);
          } catch (e) {
            doSetRange(win, finish, foffset, start, soffset);
          }
        } else {
          doSetRange(win, finish, foffset, start, soffset);
        }
      }
    });
  };
  var setExact = function (win, start, soffset, finish, foffset) {
    var relative = $_eor3d4q3jn69h485.preprocessExact(start, soffset, finish, foffset);
    setRangeFromRelative(win, relative);
  };
  var setRelative = function (win, startSitu, finishSitu) {
    var relative = $_eor3d4q3jn69h485.preprocessRelative(startSitu, finishSitu);
    setRangeFromRelative(win, relative);
  };
  var toNative = function (selection) {
    var win = $_bozl9jpqjn69h45e.getWin(selection).dom();
    var getDomRange = function (start, soffset, finish, foffset) {
      return $_7c4ab5pvjn69h46o.exactToNative(win, start, soffset, finish, foffset);
    };
    var filtered = $_eor3d4q3jn69h485.preprocess(selection);
    return $_ff9v9hpwjn69h46v.diagnose(win, filtered).match({
      ltr: getDomRange,
      rtl: getDomRange
    });
  };
  var readRange = function (selection) {
    if (selection.rangeCount > 0) {
      var firstRng = selection.getRangeAt(0);
      var lastRng = selection.getRangeAt(selection.rangeCount - 1);
      return Option.some($_bozl9jpqjn69h45e.range(Element$$1.fromDom(firstRng.startContainer), firstRng.startOffset, Element$$1.fromDom(lastRng.endContainer), lastRng.endOffset));
    } else {
      return Option.none();
    }
  };
  var doGetExact = function (selection) {
    var anchorNode = Element$$1.fromDom(selection.anchorNode);
    var focusNode = Element$$1.fromDom(selection.focusNode);
    return $_xo7uuptjn69h46f.after(anchorNode, selection.anchorOffset, focusNode, selection.focusOffset) ? Option.some($_bozl9jpqjn69h45e.range(Element$$1.fromDom(selection.anchorNode), selection.anchorOffset, Element$$1.fromDom(selection.focusNode), selection.focusOffset)) : readRange(selection);
  };
  var setToElement = function (win, element) {
    var rng = $_7c4ab5pvjn69h46o.selectNodeContents(win, element);
    doSetNativeRange(win, rng);
  };
  var forElement = function (win, element) {
    var rng = $_7c4ab5pvjn69h46o.selectNodeContents(win, element);
    return $_bozl9jpqjn69h45e.range(Element$$1.fromDom(rng.startContainer), rng.startOffset, Element$$1.fromDom(rng.endContainer), rng.endOffset);
  };
  var getExact = function (win) {
    return Option.from(win.getSelection()).filter(function (sel) {
      return sel.rangeCount > 0;
    }).bind(doGetExact);
  };
  var get$10 = function (win) {
    return getExact(win).map(function (range) {
      return $_bozl9jpqjn69h45e.exact(range.start(), range.soffset(), range.finish(), range.foffset());
    });
  };
  var getFirstRect$1 = function (win, selection) {
    var rng = $_ff9v9hpwjn69h46v.asLtrRange(win, selection);
    return $_7c4ab5pvjn69h46o.getFirstRect(rng);
  };
  var getBounds$2 = function (win, selection) {
    var rng = $_ff9v9hpwjn69h46v.asLtrRange(win, selection);
    return $_7c4ab5pvjn69h46o.getBounds(rng);
  };
  var getAtPoint = function (win, x, y) {
    return $_2fmkulpxjn69h47a.fromPoint(win, x, y);
  };
  var getAsString = function (win, selection) {
    var rng = $_ff9v9hpwjn69h46v.asLtrRange(win, selection);
    return $_7c4ab5pvjn69h46o.toString(rng);
  };
  var clear$1 = function (win) {
    var selection = win.getSelection();
    selection.removeAllRanges();
  };
  var clone$2 = function (win, selection) {
    var rng = $_ff9v9hpwjn69h46v.asLtrRange(win, selection);
    return $_7c4ab5pvjn69h46o.cloneFragment(rng);
  };
  var replace$1 = function (win, selection, elements) {
    var rng = $_ff9v9hpwjn69h46v.asLtrRange(win, selection);
    var fragment = $_28siovpujn69h46i.fromElements(elements, win.document);
    $_7c4ab5pvjn69h46o.replaceWith(rng, fragment);
  };
  var deleteAt = function (win, selection) {
    var rng = $_ff9v9hpwjn69h46v.asLtrRange(win, selection);
    $_7c4ab5pvjn69h46o.deleteContents(rng);
  };
  var isCollapsed = function (start, soffset, finish, foffset) {
    return $_bakwgmlkjn69h2u8.eq(start, finish) && soffset === foffset;
  };
  var $_3x8t55psjn69h45u = {
    setExact: setExact,
    getExact: getExact,
    get: get$10,
    setRelative: setRelative,
    toNative: toNative,
    setToElement: setToElement,
    clear: clear$1,
    clone: clone$2,
    replace: replace$1,
    deleteAt: deleteAt,
    forElement: forElement,
    getFirstRect: getFirstRect$1,
    getBounds: getBounds$2,
    getAtPoint: getAtPoint,
    findWithin: findWithin,
    getAsString: getAsString,
    isCollapsed: isCollapsed
  };

  var global$3 = tinymce.util.Tools.resolve('tinymce.util.VK');

  var forward = function (editor, isRoot, cell, lazyWire) {
    return go(editor, isRoot, $_yixkepojn69h44z.next(cell), lazyWire);
  };
  var backward = function (editor, isRoot, cell, lazyWire) {
    return go(editor, isRoot, $_yixkepojn69h44z.prev(cell), lazyWire);
  };
  var getCellFirstCursorPosition = function (editor, cell) {
    var selection = $_bozl9jpqjn69h45e.exact(cell, 0, cell, 0);
    return $_3x8t55psjn69h45u.toNative(selection);
  };
  var getNewRowCursorPosition = function (editor, table) {
    var rows = $_yn4aam3jn69h2wv.descendants(table, 'tr');
    return last(rows).bind(function (last$$1) {
      return $_72t5xvm6jn69h2xa.descendant(last$$1, 'td,th').map(function (first) {
        return getCellFirstCursorPosition(editor, first);
      });
    });
  };
  var go = function (editor, isRoot, cell, actions, lazyWire) {
    return cell.fold(Option.none, Option.none, function (current, next) {
      return $_c4imwkmhjn69h31w.first(next).map(function (cell) {
        return getCellFirstCursorPosition(editor, cell);
      });
    }, function (current) {
      return $_2j92l5lcjn69h2r3.table(current, isRoot).bind(function (table) {
        var targets = $_8an0jemmjn69h32x.noMenu(current);
        editor.undoManager.transact(function () {
          actions.insertRowsAfter(table, targets);
        });
        return getNewRowCursorPosition(editor, table);
      });
    });
  };
  var rootElements = [
    'table',
    'li',
    'dl'
  ];
  var handle$1 = function (event, editor, actions, lazyWire) {
    if (event.keyCode === global$3.TAB) {
      var body_1 = getBody$1(editor);
      var isRoot_1 = function (element) {
        var name = $_5f9i72m2jn69h2wv.name(element);
        return $_bakwgmlkjn69h2u8.eq(element, body_1) || contains(rootElements, name);
      };
      var rng = editor.selection.getRng();
      if (rng.collapsed) {
        var start = Element$$1.fromDom(rng.startContainer);
        $_2j92l5lcjn69h2r3.cell(start, isRoot_1).each(function (cell) {
          event.preventDefault();
          var navigation = event.shiftKey ? backward : forward;
          var rng = navigation(editor, isRoot_1, cell, actions, lazyWire);
          rng.each(function (range$$1) {
            editor.selection.setRng(range$$1);
          });
        });
      }
    }
  };
  var $_15ikhnpnjn69h44l = { handle: handle$1 };

  var response = Immutable('selection', 'kill');
  var $_4aw2ufq7jn69h49w = { response: response };

  var isKey = function (key) {
    return function (keycode) {
      return keycode === key;
    };
  };
  var isUp = isKey(38);
  var isDown = isKey(40);
  var isNavigation = function (keycode) {
    return keycode >= 37 && keycode <= 40;
  };
  var $_5wviwwq8jn69h49w = {
    ltr: {
      isBackward: isKey(37),
      isForward: isKey(39)
    },
    rtl: {
      isBackward: isKey(39),
      isForward: isKey(37)
    },
    isUp: isUp,
    isDown: isDown,
    isNavigation: isNavigation
  };

  var convertToRange = function (win, selection) {
    var rng = $_ff9v9hpwjn69h46v.asLtrRange(win, selection);
    return {
      start: constant(Element$$1.fromDom(rng.startContainer)),
      soffset: constant(rng.startOffset),
      finish: constant(Element$$1.fromDom(rng.endContainer)),
      foffset: constant(rng.endOffset)
    };
  };
  var makeSitus = function (start, soffset, finish, foffset) {
    return {
      start: constant($_499da6prjn69h45u.on(start, soffset)),
      finish: constant($_499da6prjn69h45u.on(finish, foffset))
    };
  };
  var $_cp6ndnqajn69h4ax = {
    convertToRange: convertToRange,
    makeSitus: makeSitus
  };

  var isSafari = $_k0fj2lpjn69h2v3.detect().browser.isSafari();
  var get$11 = function (_doc) {
    var doc = _doc !== undefined ? _doc.dom() : document;
    var x = doc.body.scrollLeft || doc.documentElement.scrollLeft;
    var y = doc.body.scrollTop || doc.documentElement.scrollTop;
    return Position(x, y);
  };
  var to = function (x, y, _doc) {
    var doc = _doc !== undefined ? _doc.dom() : document;
    var win = doc.defaultView;
    win.scrollTo(x, y);
  };
  var by = function (x, y, _doc) {
    var doc = _doc !== undefined ? _doc.dom() : document;
    var win = doc.defaultView;
    win.scrollBy(x, y);
  };
  var setToElement$1 = function (win, element) {
    var pos = $_f0yf06nejn69h3d6.absolute(element);
    var doc = Element$$1.fromDom(win.document);
    to(pos.left(), pos.top(), doc);
  };
  var preserve$1 = function (doc, f) {
    var before = get$11(doc);
    f();
    var after = get$11(doc);
    if (before.top() !== after.top() || before.left() !== after.left()) {
      to(before.left(), before.top(), doc);
    }
  };
  var capture$2 = function (doc) {
    var previous = Option.none();
    var save = function () {
      previous = Option.some(get$11(doc));
    };
    var restore = function () {
      previous.each(function (p) {
        to(p.left(), p.top(), doc);
      });
    };
    save();
    return {
      save: save,
      restore: restore
    };
  };
  var intoView = function (element, alignToTop) {
    if (isSafari && isFunction(element.dom().scrollIntoViewIfNeeded)) {
      element.dom().scrollIntoViewIfNeeded(false);
    } else {
      element.dom().scrollIntoView(alignToTop);
    }
  };
  var intoViewIfNeeded = function (element, container) {
    var containerBox = container.dom().getBoundingClientRect();
    var elementBox = element.dom().getBoundingClientRect();
    if (elementBox.top < containerBox.top) {
      intoView(element, true);
    } else if (elementBox.bottom > containerBox.bottom) {
      intoView(element, false);
    }
  };
  var scrollBarWidth = function () {
    var scrollDiv = Element$$1.fromHtml('<div style="width: 100px; height: 100px; overflow: scroll; position: absolute; top: -9999px;"></div>');
    $_6szxhjmcjn69h306.after($_f5xfqwm5jn69h2xa.body(), scrollDiv);
    var w = scrollDiv.dom().offsetWidth - scrollDiv.dom().clientWidth;
    $_69icwdmdjn69h306.remove(scrollDiv);
    return w;
  };
  var $_4xawzxqbjn69h4az = {
    get: get$11,
    to: to,
    by: by,
    preserve: preserve$1,
    capture: capture$2,
    intoView: intoView,
    intoViewIfNeeded: intoViewIfNeeded,
    setToElement: setToElement$1,
    scrollBarWidth: scrollBarWidth
  };

  function WindowBridge (win) {
    var elementFromPoint = function (x, y) {
      return Element$$1.fromPoint(Element$$1.fromDom(win.document), x, y);
    };
    var getRect = function (element) {
      return element.dom().getBoundingClientRect();
    };
    var getRangedRect = function (start, soffset, finish, foffset) {
      var sel = $_bozl9jpqjn69h45e.exact(start, soffset, finish, foffset);
      return $_3x8t55psjn69h45u.getFirstRect(win, sel).map(function (structRect) {
        return map$1(structRect, apply);
      });
    };
    var getSelection = function () {
      return $_3x8t55psjn69h45u.get(win).map(function (exactAdt) {
        return $_cp6ndnqajn69h4ax.convertToRange(win, exactAdt);
      });
    };
    var fromSitus = function (situs) {
      var relative = $_bozl9jpqjn69h45e.relative(situs.start(), situs.finish());
      return $_cp6ndnqajn69h4ax.convertToRange(win, relative);
    };
    var situsFromPoint = function (x, y) {
      return $_3x8t55psjn69h45u.getAtPoint(win, x, y).map(function (exact) {
        return {
          start: constant($_499da6prjn69h45u.on(exact.start(), exact.soffset())),
          finish: constant($_499da6prjn69h45u.on(exact.finish(), exact.foffset()))
        };
      });
    };
    var clearSelection = function () {
      $_3x8t55psjn69h45u.clear(win);
    };
    var selectContents = function (element) {
      $_3x8t55psjn69h45u.setToElement(win, element);
    };
    var setSelection = function (sel) {
      $_3x8t55psjn69h45u.setExact(win, sel.start(), sel.soffset(), sel.finish(), sel.foffset());
    };
    var setRelativeSelection = function (start, finish) {
      $_3x8t55psjn69h45u.setRelative(win, start, finish);
    };
    var getInnerHeight = function () {
      return win.innerHeight;
    };
    var getScrollY = function () {
      var pos = $_4xawzxqbjn69h4az.get(Element$$1.fromDom(win.document));
      return pos.top();
    };
    var scrollBy = function (x, y) {
      $_4xawzxqbjn69h4az.by(x, y, Element$$1.fromDom(win.document));
    };
    return {
      elementFromPoint: elementFromPoint,
      getRect: getRect,
      getRangedRect: getRangedRect,
      getSelection: getSelection,
      fromSitus: fromSitus,
      situsFromPoint: situsFromPoint,
      clearSelection: clearSelection,
      setSelection: setSelection,
      setRelativeSelection: setRelativeSelection,
      selectContents: selectContents,
      getInnerHeight: getInnerHeight,
      getScrollY: getScrollY,
      scrollBy: scrollBy
    };
  }

  var sync = function (container, isRoot, start, soffset, finish, foffset, selectRange) {
    if (!($_bakwgmlkjn69h2u8.eq(start, finish) && soffset === foffset)) {
      return $_72t5xvm6jn69h2xa.closest(start, 'td,th', isRoot).bind(function (s) {
        return $_72t5xvm6jn69h2xa.closest(finish, 'td,th', isRoot).bind(function (f) {
          return detect$5(container, isRoot, s, f, selectRange);
        });
      });
    } else {
      return Option.none();
    }
  };
  var detect$5 = function (container, isRoot, start, finish, selectRange) {
    if (!$_bakwgmlkjn69h2u8.eq(start, finish)) {
      return $_f993ojmpjn69h348.identify(start, finish, isRoot).bind(function (cellSel) {
        var boxes = cellSel.boxes().getOr([]);
        if (boxes.length > 0) {
          selectRange(container, boxes, cellSel.start(), cellSel.finish());
          return Option.some($_4aw2ufq7jn69h49w.response(Option.some($_cp6ndnqajn69h4ax.makeSitus(start, 0, start, $_4yut00mijn69h32c.getEnd(start))), true));
        } else {
          return Option.none();
        }
      });
    } else {
      return Option.none();
    }
  };
  var update = function (rows, columns, container, selected, annotations) {
    var updateSelection = function (newSels) {
      annotations.clear(container);
      annotations.selectRange(container, newSels.boxes(), newSels.start(), newSels.finish());
      return newSels.boxes();
    };
    return $_f993ojmpjn69h348.shiftSelection(selected, rows, columns, annotations.firstSelectedSelector(), annotations.lastSelectedSelector()).map(updateSelection);
  };
  var $_7dlub6qcjn69h4bf = {
    sync: sync,
    detect: detect$5,
    update: update
  };

  var nu$3 = MixedBag([
    'left',
    'top',
    'right',
    'bottom'
  ], []);
  var moveDown = function (caret, amount) {
    return nu$3({
      left: caret.left(),
      top: caret.top() + amount,
      right: caret.right(),
      bottom: caret.bottom() + amount
    });
  };
  var moveUp = function (caret, amount) {
    return nu$3({
      left: caret.left(),
      top: caret.top() - amount,
      right: caret.right(),
      bottom: caret.bottom() - amount
    });
  };
  var moveBottomTo = function (caret, bottom) {
    var height = caret.bottom() - caret.top();
    return nu$3({
      left: caret.left(),
      top: bottom - height,
      right: caret.right(),
      bottom: bottom
    });
  };
  var moveTopTo = function (caret, top) {
    var height = caret.bottom() - caret.top();
    return nu$3({
      left: caret.left(),
      top: top,
      right: caret.right(),
      bottom: top + height
    });
  };
  var translate = function (caret, xDelta, yDelta) {
    return nu$3({
      left: caret.left() + xDelta,
      top: caret.top() + yDelta,
      right: caret.right() + xDelta,
      bottom: caret.bottom() + yDelta
    });
  };
  var getTop$1 = function (caret) {
    return caret.top();
  };
  var getBottom = function (caret) {
    return caret.bottom();
  };
  var toString$1 = function (caret) {
    return '(' + caret.left() + ', ' + caret.top() + ') -> (' + caret.right() + ', ' + caret.bottom() + ')';
  };
  var $_74euxgqfjn69h4dl = {
    nu: nu$3,
    moveUp: moveUp,
    moveDown: moveDown,
    moveBottomTo: moveBottomTo,
    moveTopTo: moveTopTo,
    getTop: getTop$1,
    getBottom: getBottom,
    translate: translate,
    toString: toString$1
  };

  var getPartialBox = function (bridge, element, offset) {
    if (offset >= 0 && offset < $_4yut00mijn69h32c.getEnd(element))
      return bridge.getRangedRect(element, offset, element, offset + 1);
    else if (offset > 0)
      return bridge.getRangedRect(element, offset - 1, element, offset);
    return Option.none();
  };
  var toCaret = function (rect) {
    return $_74euxgqfjn69h4dl.nu({
      left: rect.left,
      top: rect.top,
      right: rect.right,
      bottom: rect.bottom
    });
  };
  var getElemBox = function (bridge, element) {
    return Option.some(bridge.getRect(element));
  };
  var getBoxAt = function (bridge, element, offset) {
    if ($_5f9i72m2jn69h2wv.isElement(element))
      return getElemBox(bridge, element).map(toCaret);
    else if ($_5f9i72m2jn69h2wv.isText(element))
      return getPartialBox(bridge, element, offset).map(toCaret);
    else
      return Option.none();
  };
  var getEntireBox = function (bridge, element) {
    if ($_5f9i72m2jn69h2wv.isElement(element))
      return getElemBox(bridge, element).map(toCaret);
    else if ($_5f9i72m2jn69h2wv.isText(element))
      return bridge.getRangedRect(element, 0, element, $_4yut00mijn69h32c.getEnd(element)).map(toCaret);
    else
      return Option.none();
  };
  var $_fa64liqgjn69h4dl = {
    getBoxAt: getBoxAt,
    getEntireBox: getEntireBox
  };

  var traverse = Immutable('item', 'mode');
  var backtrack = function (universe, item, direction, _transition) {
    var transition = _transition !== undefined ? _transition : sidestep;
    return universe.property().parent(item).map(function (p) {
      return traverse(p, transition);
    });
  };
  var sidestep = function (universe, item, direction, _transition) {
    var transition = _transition !== undefined ? _transition : advance;
    return direction.sibling(universe, item).map(function (p) {
      return traverse(p, transition);
    });
  };
  var advance = function (universe, item, direction, _transition) {
    var transition = _transition !== undefined ? _transition : advance;
    var children = universe.property().children(item);
    var result = direction.first(children);
    return result.map(function (r) {
      return traverse(r, transition);
    });
  };
  var successors = [
    {
      current: backtrack,
      next: sidestep,
      fallback: Option.none()
    },
    {
      current: sidestep,
      next: advance,
      fallback: Option.some(backtrack)
    },
    {
      current: advance,
      next: advance,
      fallback: Option.some(sidestep)
    }
  ];
  var go$1 = function (universe, item, mode, direction, rules) {
    var rules = rules !== undefined ? rules : successors;
    var ruleOpt = find(rules, function (succ) {
      return succ.current === mode;
    });
    return ruleOpt.bind(function (rule) {
      return rule.current(universe, item, direction, rule.next).orThunk(function () {
        return rule.fallback.bind(function (fb) {
          return go$1(universe, item, fb, direction);
        });
      });
    });
  };
  var $_5v6x2iqljn69h4fj = {
    backtrack: backtrack,
    sidestep: sidestep,
    advance: advance,
    go: go$1
  };

  var left$1 = function () {
    var sibling = function (universe, item) {
      return universe.query().prevSibling(item);
    };
    var first = function (children) {
      return children.length > 0 ? Option.some(children[children.length - 1]) : Option.none();
    };
    return {
      sibling: sibling,
      first: first
    };
  };
  var right$1 = function () {
    var sibling = function (universe, item) {
      return universe.query().nextSibling(item);
    };
    var first = function (children) {
      return children.length > 0 ? Option.some(children[0]) : Option.none();
    };
    return {
      sibling: sibling,
      first: first
    };
  };
  var $_wmum5qmjn69h4fl = {
    left: left$1,
    right: right$1
  };

  var hone = function (universe, item, predicate, mode, direction, isRoot) {
    var next = $_5v6x2iqljn69h4fj.go(universe, item, mode, direction);
    return next.bind(function (n) {
      if (isRoot(n.item()))
        return Option.none();
      else
        return predicate(n.item()) ? Option.some(n.item()) : hone(universe, n.item(), predicate, n.mode(), direction, isRoot);
    });
  };
  var left$2 = function (universe, item, predicate, isRoot) {
    return hone(universe, item, predicate, $_5v6x2iqljn69h4fj.sidestep, $_wmum5qmjn69h4fl.left(), isRoot);
  };
  var right$2 = function (universe, item, predicate, isRoot) {
    return hone(universe, item, predicate, $_5v6x2iqljn69h4fj.sidestep, $_wmum5qmjn69h4fl.right(), isRoot);
  };
  var $_1sdpkqqkjn69h4fe = {
    left: left$2,
    right: right$2
  };

  var isLeaf = function (universe, element) {
    return universe.property().children(element).length === 0;
  };
  var before$2 = function (universe, item, isRoot) {
    return seekLeft(universe, item, curry(isLeaf, universe), isRoot);
  };
  var after$3 = function (universe, item, isRoot) {
    return seekRight(universe, item, curry(isLeaf, universe), isRoot);
  };
  var seekLeft = function (universe, item, predicate, isRoot) {
    return $_1sdpkqqkjn69h4fe.left(universe, item, predicate, isRoot);
  };
  var seekRight = function (universe, item, predicate, isRoot) {
    return $_1sdpkqqkjn69h4fe.right(universe, item, predicate, isRoot);
  };
  var walkers = function () {
    return {
      left: $_wmum5qmjn69h4fl.left,
      right: $_wmum5qmjn69h4fl.right
    };
  };
  var walk = function (universe, item, mode, direction, _rules) {
    return $_5v6x2iqljn69h4fj.go(universe, item, mode, direction, _rules);
  };
  var $_fmu57gqjjn69h4f9 = {
    before: before$2,
    after: after$3,
    seekLeft: seekLeft,
    seekRight: seekRight,
    walkers: walkers,
    walk: walk,
    backtrack: $_5v6x2iqljn69h4fj.backtrack,
    sidestep: $_5v6x2iqljn69h4fj.sidestep,
    advance: $_5v6x2iqljn69h4fj.advance
  };

  var universe$2 = DomUniverse();
  var gather = function (element, prune, transform) {
    return $_fmu57gqjjn69h4f9.gather(universe$2, element, prune, transform);
  };
  var before$3 = function (element, isRoot) {
    return $_fmu57gqjjn69h4f9.before(universe$2, element, isRoot);
  };
  var after$4 = function (element, isRoot) {
    return $_fmu57gqjjn69h4f9.after(universe$2, element, isRoot);
  };
  var seekLeft$1 = function (element, predicate, isRoot) {
    return $_fmu57gqjjn69h4f9.seekLeft(universe$2, element, predicate, isRoot);
  };
  var seekRight$1 = function (element, predicate, isRoot) {
    return $_fmu57gqjjn69h4f9.seekRight(universe$2, element, predicate, isRoot);
  };
  var walkers$1 = function () {
    return $_fmu57gqjjn69h4f9.walkers();
  };
  var walk$1 = function (item, mode, direction, _rules) {
    return $_fmu57gqjjn69h4f9.walk(universe$2, item, mode, direction, _rules);
  };
  var $_4qiao1qijn69h4f2 = {
    gather: gather,
    before: before$3,
    after: after$4,
    seekLeft: seekLeft$1,
    seekRight: seekRight$1,
    walkers: walkers$1,
    walk: walk$1
  };

  var JUMP_SIZE = 5;
  var NUM_RETRIES = 100;
  var adt$2 = Adt.generate([
    { 'none': [] },
    { 'retry': ['caret'] }
  ]);
  var isOutside = function (caret, box) {
    return caret.left() < box.left() || Math.abs(box.right() - caret.left()) < 1 || caret.left() > box.right();
  };
  var inOutsideBlock = function (bridge, element, caret) {
    return $_3cgeam7jn69h2xq.closest(element, $_ae1woxnnjn69h3ht.isBlock).fold(constant(false), function (cell) {
      return $_fa64liqgjn69h4dl.getEntireBox(bridge, cell).exists(function (box) {
        return isOutside(caret, box);
      });
    });
  };
  var adjustDown = function (bridge, element, guessBox, original, caret) {
    var lowerCaret = $_74euxgqfjn69h4dl.moveDown(caret, JUMP_SIZE);
    if (Math.abs(guessBox.bottom() - original.bottom()) < 1)
      return adt$2.retry(lowerCaret);
    else if (guessBox.top() > caret.bottom())
      return adt$2.retry(lowerCaret);
    else if (guessBox.top() === caret.bottom())
      return adt$2.retry($_74euxgqfjn69h4dl.moveDown(caret, 1));
    else
      return inOutsideBlock(bridge, element, caret) ? adt$2.retry($_74euxgqfjn69h4dl.translate(lowerCaret, JUMP_SIZE, 0)) : adt$2.none();
  };
  var adjustUp = function (bridge, element, guessBox, original, caret) {
    var higherCaret = $_74euxgqfjn69h4dl.moveUp(caret, JUMP_SIZE);
    if (Math.abs(guessBox.top() - original.top()) < 1)
      return adt$2.retry(higherCaret);
    else if (guessBox.bottom() < caret.top())
      return adt$2.retry(higherCaret);
    else if (guessBox.bottom() === caret.top())
      return adt$2.retry($_74euxgqfjn69h4dl.moveUp(caret, 1));
    else
      return inOutsideBlock(bridge, element, caret) ? adt$2.retry($_74euxgqfjn69h4dl.translate(higherCaret, JUMP_SIZE, 0)) : adt$2.none();
  };
  var upMovement = {
    point: $_74euxgqfjn69h4dl.getTop,
    adjuster: adjustUp,
    move: $_74euxgqfjn69h4dl.moveUp,
    gather: $_4qiao1qijn69h4f2.before
  };
  var downMovement = {
    point: $_74euxgqfjn69h4dl.getBottom,
    adjuster: adjustDown,
    move: $_74euxgqfjn69h4dl.moveDown,
    gather: $_4qiao1qijn69h4f2.after
  };
  var isAtTable = function (bridge, x, y) {
    return bridge.elementFromPoint(x, y).filter(function (elm) {
      return $_5f9i72m2jn69h2wv.name(elm) === 'table';
    }).isSome();
  };
  var adjustForTable = function (bridge, movement, original, caret, numRetries) {
    return adjustTil(bridge, movement, original, movement.move(caret, JUMP_SIZE), numRetries);
  };
  var adjustTil = function (bridge, movement, original, caret, numRetries) {
    if (numRetries === 0)
      return Option.some(caret);
    if (isAtTable(bridge, caret.left(), movement.point(caret)))
      return adjustForTable(bridge, movement, original, caret, numRetries - 1);
    return bridge.situsFromPoint(caret.left(), movement.point(caret)).bind(function (guess) {
      return guess.start().fold(Option.none, function (element, offset) {
        return $_fa64liqgjn69h4dl.getEntireBox(bridge, element, offset).bind(function (guessBox) {
          return movement.adjuster(bridge, element, guessBox, original, caret).fold(Option.none, function (newCaret) {
            return adjustTil(bridge, movement, original, newCaret, numRetries - 1);
          });
        }).orThunk(function () {
          return Option.some(caret);
        });
      }, Option.none);
    });
  };
  var ieTryDown = function (bridge, caret) {
    return bridge.situsFromPoint(caret.left(), caret.bottom() + JUMP_SIZE);
  };
  var ieTryUp = function (bridge, caret) {
    return bridge.situsFromPoint(caret.left(), caret.top() - JUMP_SIZE);
  };
  var checkScroll = function (movement, adjusted, bridge) {
    if (movement.point(adjusted) > bridge.getInnerHeight())
      return Option.some(movement.point(adjusted) - bridge.getInnerHeight());
    else if (movement.point(adjusted) < 0)
      return Option.some(-movement.point(adjusted));
    else
      return Option.none();
  };
  var retry = function (movement, bridge, caret) {
    var moved = movement.move(caret, JUMP_SIZE);
    var adjusted = adjustTil(bridge, movement, caret, moved, NUM_RETRIES).getOr(moved);
    return checkScroll(movement, adjusted, bridge).fold(function () {
      return bridge.situsFromPoint(adjusted.left(), movement.point(adjusted));
    }, function (delta) {
      bridge.scrollBy(0, delta);
      return bridge.situsFromPoint(adjusted.left(), movement.point(adjusted) - delta);
    });
  };
  var $_3lvgelqhjn69h4e0 = {
    tryUp: curry(retry, upMovement),
    tryDown: curry(retry, downMovement),
    ieTryUp: ieTryUp,
    ieTryDown: ieTryDown,
    getJumpSize: constant(JUMP_SIZE)
  };

  var adt$3 = Adt.generate([
    { 'none': ['message'] },
    { 'success': [] },
    { 'failedUp': ['cell'] },
    { 'failedDown': ['cell'] }
  ]);
  var isOverlapping = function (bridge, before, after) {
    var beforeBounds = bridge.getRect(before);
    var afterBounds = bridge.getRect(after);
    return afterBounds.right > beforeBounds.left && afterBounds.left < beforeBounds.right;
  };
  var verify = function (bridge, before, beforeOffset, after, afterOffset, failure, isRoot) {
    return $_72t5xvm6jn69h2xa.closest(after, 'td,th', isRoot).bind(function (afterCell) {
      return $_72t5xvm6jn69h2xa.closest(before, 'td,th', isRoot).map(function (beforeCell) {
        if (!$_bakwgmlkjn69h2u8.eq(afterCell, beforeCell)) {
          return $_491cfnmqjn69h35i.sharedOne(isRow, [
            afterCell,
            beforeCell
          ]).fold(function () {
            return isOverlapping(bridge, beforeCell, afterCell) ? adt$3.success() : failure(beforeCell);
          }, function (sharedRow) {
            return failure(beforeCell);
          });
        } else {
          return $_bakwgmlkjn69h2u8.eq(after, afterCell) && $_4yut00mijn69h32c.getEnd(afterCell) === afterOffset ? failure(beforeCell) : adt$3.none('in same cell');
        }
      });
    }).getOr(adt$3.none('default'));
  };
  var isRow = function (elem) {
    return $_72t5xvm6jn69h2xa.closest(elem, 'tr');
  };
  var cata$2 = function (subject, onNone, onSuccess, onFailedUp, onFailedDown) {
    return subject.fold(onNone, onSuccess, onFailedUp, onFailedDown);
  };
  var $_fstzbwqnjn69h4fl = {
    verify: verify,
    cata: cata$2,
    adt: adt$3
  };

  var point = Immutable('element', 'offset');
  var delta = Immutable('element', 'deltaOffset');
  var range$3 = Immutable('element', 'start', 'finish');
  var points = Immutable('begin', 'end');
  var text = Immutable('element', 'text');
  var $_61j15aqpjn69h4hc = {
    point: point,
    delta: delta,
    range: range$3,
    points: points,
    text: text
  };

  var inAncestor = Immutable('ancestor', 'descendants', 'element', 'index');
  var inParent = Immutable('parent', 'children', 'element', 'index');
  var childOf = function (element, ancestor) {
    return $_3cgeam7jn69h2xq.closest(element, function (elem) {
      return $_g3g38plijn69h2tc.parent(elem).exists(function (parent) {
        return $_bakwgmlkjn69h2u8.eq(parent, ancestor);
      });
    });
  };
  var indexInParent = function (element) {
    return $_g3g38plijn69h2tc.parent(element).bind(function (parent) {
      var children = $_g3g38plijn69h2tc.children(parent);
      return indexOf$1(children, element).map(function (index) {
        return inParent(parent, children, element, index);
      });
    });
  };
  var indexOf$1 = function (elements, element) {
    return findIndex(elements, curry($_bakwgmlkjn69h2u8.eq, element));
  };
  var selectorsInParent = function (element, selector) {
    return $_g3g38plijn69h2tc.parent(element).bind(function (parent) {
      var children = $_yn4aam3jn69h2wv.children(parent, selector);
      return indexOf$1(children, element).map(function (index) {
        return inParent(parent, children, element, index);
      });
    });
  };
  var descendantsInAncestor = function (element, ancestorSelector, descendantSelector) {
    return $_72t5xvm6jn69h2xa.closest(element, ancestorSelector).bind(function (ancestor) {
      var descendants = $_yn4aam3jn69h2wv.descendants(ancestor, descendantSelector);
      return indexOf$1(descendants, element).map(function (index) {
        return inAncestor(ancestor, descendants, element, index);
      });
    });
  };
  var $_41s4rjqqjn69h4hs = {
    childOf: childOf,
    indexOf: indexOf$1,
    indexInParent: indexInParent,
    selectorsInParent: selectorsInParent,
    descendantsInAncestor: descendantsInAncestor
  };

  var isBr = function (elem) {
    return $_5f9i72m2jn69h2wv.name(elem) === 'br';
  };
  var gatherer = function (cand, gather, isRoot) {
    return gather(cand, isRoot).bind(function (target) {
      return $_5f9i72m2jn69h2wv.isText(target) && $_eo2rq0mjjn69h32m.get(target).trim().length === 0 ? gatherer(target, gather, isRoot) : Option.some(target);
    });
  };
  var handleBr = function (isRoot, element, direction) {
    return direction.traverse(element).orThunk(function () {
      return gatherer(element, direction.gather, isRoot);
    }).map(direction.relative);
  };
  var findBr = function (element, offset) {
    return $_g3g38plijn69h2tc.child(element, offset).filter(isBr).orThunk(function () {
      return $_g3g38plijn69h2tc.child(element, offset - 1).filter(isBr);
    });
  };
  var handleParent = function (isRoot, element, offset, direction) {
    return findBr(element, offset).bind(function (br) {
      return direction.traverse(br).fold(function () {
        return gatherer(br, direction.gather, isRoot).map(direction.relative);
      }, function (adjacent) {
        return $_41s4rjqqjn69h4hs.indexInParent(adjacent).map(function (info) {
          return $_499da6prjn69h45u.on(info.parent(), info.index());
        });
      });
    });
  };
  var tryBr = function (isRoot, element, offset, direction) {
    var target = isBr(element) ? handleBr(isRoot, element, direction) : handleParent(isRoot, element, offset, direction);
    return target.map(function (tgt) {
      return {
        start: constant(tgt),
        finish: constant(tgt)
      };
    });
  };
  var process = function (analysis) {
    return $_fstzbwqnjn69h4fl.cata(analysis, function (message) {
      return Option.none();
    }, function () {
      return Option.none();
    }, function (cell) {
      return Option.some($_61j15aqpjn69h4hc.point(cell, 0));
    }, function (cell) {
      return Option.some($_61j15aqpjn69h4hc.point(cell, $_4yut00mijn69h32c.getEnd(cell)));
    });
  };
  var $_a83bxuqojn69h4gl = {
    tryBr: tryBr,
    process: process
  };

  var MAX_RETRIES = 20;
  var platform$1 = $_k0fj2lpjn69h2v3.detect();
  var findSpot = function (bridge, isRoot, direction) {
    return bridge.getSelection().bind(function (sel) {
      return $_a83bxuqojn69h4gl.tryBr(isRoot, sel.finish(), sel.foffset(), direction).fold(function () {
        return Option.some($_61j15aqpjn69h4hc.point(sel.finish(), sel.foffset()));
      }, function (brNeighbour) {
        var range = bridge.fromSitus(brNeighbour);
        var analysis = $_fstzbwqnjn69h4fl.verify(bridge, sel.finish(), sel.foffset(), range.finish(), range.foffset(), direction.failure, isRoot);
        return $_a83bxuqojn69h4gl.process(analysis);
      });
    });
  };
  var scan = function (bridge, isRoot, element, offset, direction, numRetries) {
    if (numRetries === 0)
      return Option.none();
    return tryCursor(bridge, isRoot, element, offset, direction).bind(function (situs) {
      var range = bridge.fromSitus(situs);
      var analysis = $_fstzbwqnjn69h4fl.verify(bridge, element, offset, range.finish(), range.foffset(), direction.failure, isRoot);
      return $_fstzbwqnjn69h4fl.cata(analysis, function () {
        return Option.none();
      }, function () {
        return Option.some(situs);
      }, function (cell) {
        if ($_bakwgmlkjn69h2u8.eq(element, cell) && offset === 0)
          return tryAgain(bridge, element, offset, $_74euxgqfjn69h4dl.moveUp, direction);
        else
          return scan(bridge, isRoot, cell, 0, direction, numRetries - 1);
      }, function (cell) {
        if ($_bakwgmlkjn69h2u8.eq(element, cell) && offset === $_4yut00mijn69h32c.getEnd(cell))
          return tryAgain(bridge, element, offset, $_74euxgqfjn69h4dl.moveDown, direction);
        else
          return scan(bridge, isRoot, cell, $_4yut00mijn69h32c.getEnd(cell), direction, numRetries - 1);
      });
    });
  };
  var tryAgain = function (bridge, element, offset, move, direction) {
    return $_fa64liqgjn69h4dl.getBoxAt(bridge, element, offset).bind(function (box) {
      return tryAt(bridge, direction, move(box, $_3lvgelqhjn69h4e0.getJumpSize()));
    });
  };
  var tryAt = function (bridge, direction, box) {
    if (platform$1.browser.isChrome() || platform$1.browser.isSafari() || platform$1.browser.isFirefox() || platform$1.browser.isEdge())
      return direction.otherRetry(bridge, box);
    else if (platform$1.browser.isIE())
      return direction.ieRetry(bridge, box);
    else
      return Option.none();
  };
  var tryCursor = function (bridge, isRoot, element, offset, direction) {
    return $_fa64liqgjn69h4dl.getBoxAt(bridge, element, offset).bind(function (box) {
      return tryAt(bridge, direction, box);
    });
  };
  var handle$2 = function (bridge, isRoot, direction) {
    return findSpot(bridge, isRoot, direction).bind(function (spot) {
      return scan(bridge, isRoot, spot.element(), spot.offset(), direction, MAX_RETRIES).map(bridge.fromSitus);
    });
  };
  var $_46cep7qejn69h4d5 = { handle: handle$2 };

  var any$1 = function (predicate) {
    return $_3cgeam7jn69h2xq.first(predicate).isSome();
  };
  var ancestor$3 = function (scope, predicate, isRoot) {
    return $_3cgeam7jn69h2xq.ancestor(scope, predicate, isRoot).isSome();
  };
  var closest$3 = function (scope, predicate, isRoot) {
    return $_3cgeam7jn69h2xq.closest(scope, predicate, isRoot).isSome();
  };
  var sibling$3 = function (scope, predicate) {
    return $_3cgeam7jn69h2xq.sibling(scope, predicate).isSome();
  };
  var child$4 = function (scope, predicate) {
    return $_3cgeam7jn69h2xq.child(scope, predicate).isSome();
  };
  var descendant$3 = function (scope, predicate) {
    return $_3cgeam7jn69h2xq.descendant(scope, predicate).isSome();
  };
  var $_dps9vcqrjn69h4hs = {
    any: any$1,
    ancestor: ancestor$3,
    closest: closest$3,
    sibling: sibling$3,
    child: child$4,
    descendant: descendant$3
  };

  var detection = $_k0fj2lpjn69h2v3.detect();
  var inSameTable = function (elem, table) {
    return $_dps9vcqrjn69h4hs.ancestor(elem, function (e) {
      return $_g3g38plijn69h2tc.parent(e).exists(function (p) {
        return $_bakwgmlkjn69h2u8.eq(p, table);
      });
    });
  };

  var simulate = function (bridge, isRoot, direction, initial, anchor) {
    return $_72t5xvm6jn69h2xa.closest(initial, 'td,th', isRoot).bind(function (start) {
      return $_72t5xvm6jn69h2xa.closest(start, 'table', isRoot).bind(function (table) {
        if (!inSameTable(anchor, table))
          return Option.none();
        return $_46cep7qejn69h4d5.handle(bridge, isRoot, direction).bind(function (range) {
          return $_72t5xvm6jn69h2xa.closest(range.finish(), 'td,th', isRoot).map(function (finish) {
            return {
              start: constant(start),
              finish: constant(finish),
              range: constant(range)
            };
          });
        });
      });
    });
  };
  var navigate = function (bridge, isRoot, direction, initial, anchor, precheck) {
    if (detection.browser.isIE()) {
      return Option.none();
    } else {
      return precheck(initial, isRoot).orThunk(function () {
        return simulate(bridge, isRoot, direction, initial, anchor).map(function (info) {
          var range = info.range();
          return $_4aw2ufq7jn69h49w.response(Option.some($_cp6ndnqajn69h4ax.makeSitus(range.start(), range.soffset(), range.finish(), range.foffset())), true);
        });
      });
    }
  };
  var firstUpCheck = function (initial, isRoot) {
    return $_72t5xvm6jn69h2xa.closest(initial, 'tr', isRoot).bind(function (startRow) {
      return $_72t5xvm6jn69h2xa.closest(startRow, 'table', isRoot).bind(function (table) {
        var rows = $_yn4aam3jn69h2wv.descendants(table, 'tr');
        if ($_bakwgmlkjn69h2u8.eq(startRow, rows[0])) {
          return $_4qiao1qijn69h4f2.seekLeft(table, function (element) {
            return $_c4imwkmhjn69h31w.last(element).isSome();
          }, isRoot).map(function (last) {
            var lastOffset = $_4yut00mijn69h32c.getEnd(last);
            return $_4aw2ufq7jn69h49w.response(Option.some($_cp6ndnqajn69h4ax.makeSitus(last, lastOffset, last, lastOffset)), true);
          });
        } else {
          return Option.none();
        }
      });
    });
  };
  var lastDownCheck = function (initial, isRoot) {
    return $_72t5xvm6jn69h2xa.closest(initial, 'tr', isRoot).bind(function (startRow) {
      return $_72t5xvm6jn69h2xa.closest(startRow, 'table', isRoot).bind(function (table) {
        var rows = $_yn4aam3jn69h2wv.descendants(table, 'tr');
        if ($_bakwgmlkjn69h2u8.eq(startRow, rows[rows.length - 1])) {
          return $_4qiao1qijn69h4f2.seekRight(table, function (element) {
            return $_c4imwkmhjn69h31w.first(element).isSome();
          }, isRoot).map(function (first) {
            return $_4aw2ufq7jn69h49w.response(Option.some($_cp6ndnqajn69h4ax.makeSitus(first, 0, first, 0)), true);
          });
        } else {
          return Option.none();
        }
      });
    });
  };
  var select = function (bridge, container, isRoot, direction, initial, anchor, selectRange) {
    return simulate(bridge, isRoot, direction, initial, anchor).bind(function (info) {
      return $_7dlub6qcjn69h4bf.detect(container, isRoot, info.start(), info.finish(), selectRange);
    });
  };
  var $_6o8eobqdjn69h4bu = {
    navigate: navigate,
    select: select,
    firstUpCheck: firstUpCheck,
    lastDownCheck: lastDownCheck
  };

  var findCell = function (target, isRoot) {
    return $_72t5xvm6jn69h2xa.closest(target, 'td,th', isRoot);
  };
  function MouseSelection (bridge, container, isRoot, annotations) {
    var cursor = Option.none();
    var clearState = function () {
      cursor = Option.none();
    };
    var mousedown = function (event) {
      annotations.clear(container);
      cursor = findCell(event.target(), isRoot);
    };
    var mouseover = function (event) {
      cursor.each(function (start) {
        annotations.clear(container);
        findCell(event.target(), isRoot).each(function (finish) {
          $_f993ojmpjn69h348.identify(start, finish, isRoot).each(function (cellSel) {
            var boxes = cellSel.boxes().getOr([]);
            if (boxes.length > 1 || boxes.length === 1 && !$_bakwgmlkjn69h2u8.eq(start, finish)) {
              annotations.selectRange(container, boxes, cellSel.start(), cellSel.finish());
              bridge.selectContents(finish);
            }
          });
        });
      });
    };
    var mouseup = function () {
      cursor.each(clearState);
    };
    return {
      mousedown: mousedown,
      mouseover: mouseover,
      mouseup: mouseup
    };
  }

  var $_gixj1cqtjn69h4j0 = {
    down: {
      traverse: $_g3g38plijn69h2tc.nextSibling,
      gather: $_4qiao1qijn69h4f2.after,
      relative: $_499da6prjn69h45u.before,
      otherRetry: $_3lvgelqhjn69h4e0.tryDown,
      ieRetry: $_3lvgelqhjn69h4e0.ieTryDown,
      failure: $_fstzbwqnjn69h4fl.adt.failedDown
    },
    up: {
      traverse: $_g3g38plijn69h2tc.prevSibling,
      gather: $_4qiao1qijn69h4f2.before,
      relative: $_499da6prjn69h45u.before,
      otherRetry: $_3lvgelqhjn69h4e0.tryUp,
      ieRetry: $_3lvgelqhjn69h4e0.ieTryUp,
      failure: $_fstzbwqnjn69h4fl.adt.failedUp
    }
  };

  var rc = Immutable('rows', 'cols');
  var mouse = function (win, container, isRoot, annotations) {
    var bridge = WindowBridge(win);
    var handlers = MouseSelection(bridge, container, isRoot, annotations);
    return {
      mousedown: handlers.mousedown,
      mouseover: handlers.mouseover,
      mouseup: handlers.mouseup
    };
  };
  var keyboard = function (win, container, isRoot, annotations) {
    var bridge = WindowBridge(win);
    var clearToNavigate = function () {
      annotations.clear(container);
      return Option.none();
    };
    var keydown = function (event, start, soffset, finish, foffset, direction) {
      var keycode = event.raw().which;
      var shiftKey = event.raw().shiftKey === true;
      var handler = $_f993ojmpjn69h348.retrieve(container, annotations.selectedSelector()).fold(function () {
        if ($_5wviwwq8jn69h49w.isDown(keycode) && shiftKey) {
          return curry($_6o8eobqdjn69h4bu.select, bridge, container, isRoot, $_gixj1cqtjn69h4j0.down, finish, start, annotations.selectRange);
        } else if ($_5wviwwq8jn69h49w.isUp(keycode) && shiftKey) {
          return curry($_6o8eobqdjn69h4bu.select, bridge, container, isRoot, $_gixj1cqtjn69h4j0.up, finish, start, annotations.selectRange);
        } else if ($_5wviwwq8jn69h49w.isDown(keycode)) {
          return curry($_6o8eobqdjn69h4bu.navigate, bridge, isRoot, $_gixj1cqtjn69h4j0.down, finish, start, $_6o8eobqdjn69h4bu.lastDownCheck);
        } else if ($_5wviwwq8jn69h49w.isUp(keycode)) {
          return curry($_6o8eobqdjn69h4bu.navigate, bridge, isRoot, $_gixj1cqtjn69h4j0.up, finish, start, $_6o8eobqdjn69h4bu.firstUpCheck);
        } else {
          return Option.none;
        }
      }, function (selected) {
        var update = function (attempts) {
          return function () {
            var navigation = findMap(attempts, function (delta) {
              return $_7dlub6qcjn69h4bf.update(delta.rows(), delta.cols(), container, selected, annotations);
            });
            return navigation.fold(function () {
              return $_f993ojmpjn69h348.getEdges(container, annotations.firstSelectedSelector(), annotations.lastSelectedSelector()).map(function (edges) {
                var relative = $_5wviwwq8jn69h49w.isDown(keycode) || direction.isForward(keycode) ? $_499da6prjn69h45u.after : $_499da6prjn69h45u.before;
                bridge.setRelativeSelection($_499da6prjn69h45u.on(edges.first(), 0), relative(edges.table()));
                annotations.clear(container);
                return $_4aw2ufq7jn69h49w.response(Option.none(), true);
              });
            }, function (_) {
              return Option.some($_4aw2ufq7jn69h49w.response(Option.none(), true));
            });
          };
        };
        if ($_5wviwwq8jn69h49w.isDown(keycode) && shiftKey)
          return update([rc(+1, 0)]);
        else if ($_5wviwwq8jn69h49w.isUp(keycode) && shiftKey)
          return update([rc(-1, 0)]);
        else if (direction.isBackward(keycode) && shiftKey)
          return update([
            rc(0, -1),
            rc(-1, 0)
          ]);
        else if (direction.isForward(keycode) && shiftKey)
          return update([
            rc(0, +1),
            rc(+1, 0)
          ]);
        else if ($_5wviwwq8jn69h49w.isNavigation(keycode) && shiftKey === false)
          return clearToNavigate;
        else
          return Option.none;
      });
      return handler();
    };
    var keyup = function (event, start, soffset, finish, foffset) {
      return $_f993ojmpjn69h348.retrieve(container, annotations.selectedSelector()).fold(function () {
        var keycode = event.raw().which;
        var shiftKey = event.raw().shiftKey === true;
        if (shiftKey === false)
          return Option.none();
        if ($_5wviwwq8jn69h49w.isNavigation(keycode))
          return $_7dlub6qcjn69h4bf.sync(container, isRoot, start, soffset, finish, foffset, annotations.selectRange);
        else
          return Option.none();
      }, Option.none);
    };
    return {
      keydown: keydown,
      keyup: keyup
    };
  };
  var $_cp34uaq6jn69h49g = {
    mouse: mouse,
    keyboard: keyboard
  };

  var add$3 = function (element, classes) {
    each(classes, function (x) {
      $_f2gsm6o2jn69h3q9.add(element, x);
    });
  };
  var remove$7 = function (element, classes) {
    each(classes, function (x) {
      $_f2gsm6o2jn69h3q9.remove(element, x);
    });
  };
  var toggle$2 = function (element, classes) {
    each(classes, function (x) {
      $_f2gsm6o2jn69h3q9.toggle(element, x);
    });
  };
  var hasAll = function (element, classes) {
    return forall(classes, function (clazz) {
      return $_f2gsm6o2jn69h3q9.has(element, clazz);
    });
  };
  var hasAny = function (element, classes) {
    return exists(classes, function (clazz) {
      return $_f2gsm6o2jn69h3q9.has(element, clazz);
    });
  };
  var getNative = function (element) {
    var classList = element.dom().classList;
    var r = new Array(classList.length);
    for (var i = 0; i < classList.length; i++) {
      r[i] = classList.item(i);
    }
    return r;
  };
  var get$12 = function (element) {
    return $_f21cqro4jn69h3qe.supports(element) ? getNative(element) : $_f21cqro4jn69h3qe.get(element);
  };
  var $_5bviepqwjn69h4k6 = {
    add: add$3,
    remove: remove$7,
    toggle: toggle$2,
    hasAll: hasAll,
    hasAny: hasAny,
    get: get$12
  };

  var addClass = function (clazz) {
    return function (element) {
      $_f2gsm6o2jn69h3q9.add(element, clazz);
    };
  };
  var removeClass = function (clazz) {
    return function (element) {
      $_f2gsm6o2jn69h3q9.remove(element, clazz);
    };
  };
  var removeClasses = function (classes) {
    return function (element) {
      $_5bviepqwjn69h4k6.remove(element, classes);
    };
  };
  var hasClass = function (clazz) {
    return function (element) {
      return $_f2gsm6o2jn69h3q9.has(element, clazz);
    };
  };
  var $_cw4vvgqvjn69h4jr = {
    addClass: addClass,
    removeClass: removeClass,
    removeClasses: removeClasses,
    hasClass: hasClass
  };

  var byClass = function (ephemera) {
    var addSelectionClass = $_cw4vvgqvjn69h4jr.addClass(ephemera.selected());
    var removeSelectionClasses = $_cw4vvgqvjn69h4jr.removeClasses([
      ephemera.selected(),
      ephemera.lastSelected(),
      ephemera.firstSelected()
    ]);
    var clear = function (container) {
      var sels = $_yn4aam3jn69h2wv.descendants(container, ephemera.selectedSelector());
      each(sels, removeSelectionClasses);
    };
    var selectRange = function (container, cells, start, finish) {
      clear(container);
      each(cells, addSelectionClass);
      $_f2gsm6o2jn69h3q9.add(start, ephemera.firstSelected());
      $_f2gsm6o2jn69h3q9.add(finish, ephemera.lastSelected());
    };
    return {
      clear: clear,
      selectRange: selectRange,
      selectedSelector: ephemera.selectedSelector,
      firstSelectedSelector: ephemera.firstSelectedSelector,
      lastSelectedSelector: ephemera.lastSelectedSelector
    };
  };
  var byAttr = function (ephemera) {
    var removeSelectionAttributes = function (element) {
      $_567jlzm1jn69h2wf.remove(element, ephemera.selected());
      $_567jlzm1jn69h2wf.remove(element, ephemera.firstSelected());
      $_567jlzm1jn69h2wf.remove(element, ephemera.lastSelected());
    };
    var addSelectionAttribute = function (element) {
      $_567jlzm1jn69h2wf.set(element, ephemera.selected(), '1');
    };
    var clear = function (container) {
      var sels = $_yn4aam3jn69h2wv.descendants(container, ephemera.selectedSelector());
      each(sels, removeSelectionAttributes);
    };
    var selectRange = function (container, cells, start, finish) {
      clear(container);
      each(cells, addSelectionAttribute);
      $_567jlzm1jn69h2wf.set(start, ephemera.firstSelected(), '1');
      $_567jlzm1jn69h2wf.set(finish, ephemera.lastSelected(), '1');
    };
    return {
      clear: clear,
      selectRange: selectRange,
      selectedSelector: ephemera.selectedSelector,
      firstSelectedSelector: ephemera.firstSelectedSelector,
      lastSelectedSelector: ephemera.lastSelectedSelector
    };
  };
  var $_a5ybmcqujn69h4jb = {
    byClass: byClass,
    byAttr: byAttr
  };

  var hasInternalTarget = function (e) {
    return $_f2gsm6o2jn69h3q9.has(Element$$1.fromDom(e.target), 'ephox-snooker-resizer-bar') === false;
  };
  function CellSelection$1 (editor, lazyResize) {
    var handlerStruct = MixedBag([
      'mousedown',
      'mouseover',
      'mouseup',
      'keyup',
      'keydown'
    ], []);
    var handlers = Option.none();
    var annotations = $_a5ybmcqujn69h4jb.byAttr($_g5o9f4n1jn69h39s);
    editor.on('init', function (e) {
      var win = editor.getWin();
      var body = getBody$1(editor);
      var isRoot = getIsRoot(editor);
      var syncSelection = function () {
        var sel = editor.selection;
        var start = Element$$1.fromDom(sel.getStart());
        var end = Element$$1.fromDom(sel.getEnd());
        var shared = $_491cfnmqjn69h35i.sharedOne($_2j92l5lcjn69h2r3.table, [
          start,
          end
        ]);
        shared.fold(function () {
          annotations.clear(body);
        }, noop);
      };
      var mouseHandlers = $_cp34uaq6jn69h49g.mouse(win, body, isRoot, annotations);
      var keyHandlers = $_cp34uaq6jn69h49g.keyboard(win, body, isRoot, annotations);
      var hasShiftKey = function (event) {
        return event.raw().shiftKey === true;
      };
      var handleResponse = function (event, response) {
        if (!hasShiftKey(event)) {
          return;
        }
        if (response.kill()) {
          event.kill();
        }
        response.selection().each(function (ns) {
          var relative = $_bozl9jpqjn69h45e.relative(ns.start(), ns.finish());
          var rng = $_ff9v9hpwjn69h46v.asLtrRange(win, relative);
          editor.selection.setRng(rng);
        });
      };
      var keyup = function (event) {
        var wrappedEvent = wrapEvent(event);
        if (wrappedEvent.raw().shiftKey && $_5wviwwq8jn69h49w.isNavigation(wrappedEvent.raw().which)) {
          var rng = editor.selection.getRng();
          var start = Element$$1.fromDom(rng.startContainer);
          var end = Element$$1.fromDom(rng.endContainer);
          keyHandlers.keyup(wrappedEvent, start, rng.startOffset, end, rng.endOffset).each(function (response) {
            handleResponse(wrappedEvent, response);
          });
        }
      };
      var keydown = function (event) {
        var wrappedEvent = wrapEvent(event);
        lazyResize().each(function (resize) {
          resize.hideBars();
        });
        var rng = editor.selection.getRng();
        var startContainer = Element$$1.fromDom(editor.selection.getStart());
        var start = Element$$1.fromDom(rng.startContainer);
        var end = Element$$1.fromDom(rng.endContainer);
        var direction = $_5imzneokjn69h3to.directionAt(startContainer).isRtl() ? $_5wviwwq8jn69h49w.rtl : $_5wviwwq8jn69h49w.ltr;
        keyHandlers.keydown(wrappedEvent, start, rng.startOffset, end, rng.endOffset, direction).each(function (response) {
          handleResponse(wrappedEvent, response);
        });
        lazyResize().each(function (resize) {
          resize.showBars();
        });
      };
      var isMouseEvent = function (event) {
        return event.hasOwnProperty('x') && event.hasOwnProperty('y');
      };
      var wrapEvent = function (event) {
        var target = Element$$1.fromDom(event.target);
        var stop = function () {
          event.stopPropagation();
        };
        var prevent = function () {
          event.preventDefault();
        };
        var kill = compose(prevent, stop);
        return {
          target: constant(target),
          x: constant(isMouseEvent(event) ? event.x : null),
          y: constant(isMouseEvent(event) ? event.y : null),
          stop: stop,
          prevent: prevent,
          kill: kill,
          raw: constant(event)
        };
      };
      var isLeftMouse = function (raw) {
        return raw.button === 0;
      };
      var isLeftButtonPressed = function (raw) {
        if (raw.buttons === undefined) {
          return true;
        }
        return (raw.buttons & 1) !== 0;
      };
      var mouseDown = function (e) {
        if (isLeftMouse(e) && hasInternalTarget(e)) {
          mouseHandlers.mousedown(wrapEvent(e));
        }
      };
      var mouseOver = function (e) {
        if (isLeftButtonPressed(e) && hasInternalTarget(e)) {
          mouseHandlers.mouseover(wrapEvent(e));
        }
      };
      var mouseUp = function (e) {
        if (isLeftMouse(e) && hasInternalTarget(e)) {
          mouseHandlers.mouseup(wrapEvent(e));
        }
      };
      editor.on('mousedown', mouseDown);
      editor.on('mouseover', mouseOver);
      editor.on('mouseup', mouseUp);
      editor.on('keyup', keyup);
      editor.on('keydown', keydown);
      editor.on('nodechange', syncSelection);
      handlers = Option.some(handlerStruct({
        mousedown: mouseDown,
        mouseover: mouseOver,
        mouseup: mouseUp,
        keyup: keyup,
        keydown: keydown
      }));
    });
    var destroy = function () {
      handlers.each(function (handlers) {
      });
    };
    return {
      clear: annotations.clear,
      destroy: destroy
    };
  }

  var Selections = function (editor) {
    var get = function () {
      var body = getBody$1(editor);
      return $_omj7fmojn69h33s.retrieve(body, $_g5o9f4n1jn69h39s.selectedSelector()).fold(function () {
        if (editor.selection.getStart() === undefined) {
          return $_85mzexn2jn69h39s.none();
        } else {
          return $_85mzexn2jn69h39s.single(editor.selection);
        }
      }, function (cells) {
        return $_85mzexn2jn69h39s.multiple(cells);
      });
    };
    return { get: get };
  };

  var each$4 = global$1.each;
  var addButtons = function (editor) {
    var menuItems = [];
    each$4('inserttable tableprops deletetable | cell row column'.split(' '), function (name) {
      if (name === '|') {
        menuItems.push({ text: '-' });
      } else {
        menuItems.push(editor.menuItems[name]);
      }
    });
    editor.addButton('table', {
      type: 'menubutton',
      title: 'Table',
      menu: menuItems
    });
    function cmd(command) {
      return function () {
        editor.execCommand(command);
      };
    }
    editor.addButton('tableprops', {
      title: 'Table properties',
      onclick: cmd('mceTableProps'),
      icon: 'table'
    });
    editor.addButton('tabledelete', {
      title: 'Delete table',
      onclick: cmd('mceTableDelete')
    });
    editor.addButton('tablecellprops', {
      title: 'Cell properties',
      onclick: cmd('mceTableCellProps')
    });
    editor.addButton('tablemergecells', {
      title: 'Merge cells',
      onclick: cmd('mceTableMergeCells')
    });
    editor.addButton('tablesplitcells', {
      title: 'Split cell',
      onclick: cmd('mceTableSplitCells')
    });
    editor.addButton('tableinsertrowbefore', {
      title: 'Insert row before',
      onclick: cmd('mceTableInsertRowBefore')
    });
    editor.addButton('tableinsertrowafter', {
      title: 'Insert row after',
      onclick: cmd('mceTableInsertRowAfter')
    });
    editor.addButton('tabledeleterow', {
      title: 'Delete row',
      onclick: cmd('mceTableDeleteRow')
    });
    editor.addButton('tablerowprops', {
      title: 'Row properties',
      onclick: cmd('mceTableRowProps')
    });
    editor.addButton('tablecutrow', {
      title: 'Cut row',
      onclick: cmd('mceTableCutRow')
    });
    editor.addButton('tablecopyrow', {
      title: 'Copy row',
      onclick: cmd('mceTableCopyRow')
    });
    editor.addButton('tablepasterowbefore', {
      title: 'Paste row before',
      onclick: cmd('mceTablePasteRowBefore')
    });
    editor.addButton('tablepasterowafter', {
      title: 'Paste row after',
      onclick: cmd('mceTablePasteRowAfter')
    });
    editor.addButton('tableinsertcolbefore', {
      title: 'Insert column before',
      onclick: cmd('mceTableInsertColBefore')
    });
    editor.addButton('tableinsertcolafter', {
      title: 'Insert column after',
      onclick: cmd('mceTableInsertColAfter')
    });
    editor.addButton('tabledeletecol', {
      title: 'Delete column',
      onclick: cmd('mceTableDeleteCol')
    });
  };
  var addToolbars = function (editor) {
    var isTable = function (table) {
      var selectorMatched = editor.dom.is(table, 'table') && editor.getBody().contains(table);
      return selectorMatched;
    };
    var toolbar = getToolbar(editor);
    if (toolbar.length > 0) {
      editor.addContextToolbar(isTable, toolbar.join(' '));
    }
  };
  var $_g9vmalqyjn69h4km = {
    addButtons: addButtons,
    addToolbars: addToolbars
  };

  var addMenuItems = function (editor, selections) {
    var targets = Option.none();
    var tableCtrls = [];
    var cellCtrls = [];
    var mergeCtrls = [];
    var unmergeCtrls = [];
    var noTargetDisable = function (ctrl) {
      ctrl.disabled(true);
    };
    var ctrlEnable = function (ctrl) {
      ctrl.disabled(false);
    };
    var pushTable = function () {
      var self = this;
      tableCtrls.push(self);
      targets.fold(function () {
        noTargetDisable(self);
      }, function (targets) {
        ctrlEnable(self);
      });
    };
    var pushCell = function () {
      var self = this;
      cellCtrls.push(self);
      targets.fold(function () {
        noTargetDisable(self);
      }, function (targets) {
        ctrlEnable(self);
      });
    };
    var pushMerge = function () {
      var self = this;
      mergeCtrls.push(self);
      targets.fold(function () {
        noTargetDisable(self);
      }, function (targets) {
        self.disabled(targets.mergable().isNone());
      });
    };
    var pushUnmerge = function () {
      var self = this;
      unmergeCtrls.push(self);
      targets.fold(function () {
        noTargetDisable(self);
      }, function (targets) {
        self.disabled(targets.unmergable().isNone());
      });
    };
    var setDisabledCtrls = function () {
      targets.fold(function () {
        each(tableCtrls, noTargetDisable);
        each(cellCtrls, noTargetDisable);
        each(mergeCtrls, noTargetDisable);
        each(unmergeCtrls, noTargetDisable);
      }, function (targets) {
        each(tableCtrls, ctrlEnable);
        each(cellCtrls, ctrlEnable);
        each(mergeCtrls, function (mergeCtrl) {
          mergeCtrl.disabled(targets.mergable().isNone());
        });
        each(unmergeCtrls, function (unmergeCtrl) {
          unmergeCtrl.disabled(targets.unmergable().isNone());
        });
      });
    };
    editor.on('init', function () {
      editor.on('nodechange', function (e) {
        var cellOpt = Option.from(editor.dom.getParent(editor.selection.getStart(), 'th,td'));
        targets = cellOpt.bind(function (cellDom) {
          var cell = Element$$1.fromDom(cellDom);
          var table = $_2j92l5lcjn69h2r3.table(cell);
          return table.map(function (table) {
            return $_8an0jemmjn69h32x.forMenu(selections, table, cell);
          });
        });
        setDisabledCtrls();
      });
    });
    var generateTableGrid = function () {
      var html = '';
      html = '<table role="grid" class="mce-grid mce-grid-border" aria-readonly="true">';
      for (var y = 0; y < 10; y++) {
        html += '<tr>';
        for (var x = 0; x < 10; x++) {
          html += '<td role="gridcell" tabindex="-1"><a id="mcegrid' + (y * 10 + x) + '" href="#" ' + 'data-mce-x="' + x + '" data-mce-y="' + y + '"></a></td>';
        }
        html += '</tr>';
      }
      html += '</table>';
      html += '<div class="mce-text-center" role="presentation">1 x 1</div>';
      return html;
    };
    var selectGrid = function (editor, tx, ty, control) {
      var table = control.getEl().getElementsByTagName('table')[0];
      var x, y, focusCell, cell, active;
      var rtl = control.isRtl() || control.parent().rel === 'tl-tr';
      table.nextSibling.innerHTML = tx + 1 + ' x ' + (ty + 1);
      if (rtl) {
        tx = 9 - tx;
      }
      for (y = 0; y < 10; y++) {
        for (x = 0; x < 10; x++) {
          cell = table.rows[y].childNodes[x].firstChild;
          active = (rtl ? x >= tx : x <= tx) && y <= ty;
          editor.dom.toggleClass(cell, 'mce-active', active);
          if (active) {
            focusCell = cell;
          }
        }
      }
      return focusCell.parentNode;
    };
    var insertTable = hasTableGrid(editor) === false ? {
      text: 'Table',
      icon: 'table',
      context: 'table',
      onclick: cmd('mceInsertTable')
    } : {
      text: 'Table',
      icon: 'table',
      context: 'table',
      ariaHideMenu: true,
      onclick: function (e) {
        if (e.aria) {
          this.parent().hideAll();
          e.stopImmediatePropagation();
          editor.execCommand('mceInsertTable');
        }
      },
      onshow: function () {
        selectGrid(editor, 0, 0, this.menu.items()[0]);
      },
      onhide: function () {
        var elements = this.menu.items()[0].getEl().getElementsByTagName('a');
        editor.dom.removeClass(elements, 'mce-active');
        editor.dom.addClass(elements[0], 'mce-active');
      },
      menu: [{
          type: 'container',
          html: generateTableGrid(),
          onPostRender: function () {
            this.lastX = this.lastY = 0;
          },
          onmousemove: function (e) {
            var target = e.target;
            var x, y;
            if (target.tagName.toUpperCase() === 'A') {
              x = parseInt(target.getAttribute('data-mce-x'), 10);
              y = parseInt(target.getAttribute('data-mce-y'), 10);
              if (this.isRtl() || this.parent().rel === 'tl-tr') {
                x = 9 - x;
              }
              if (x !== this.lastX || y !== this.lastY) {
                selectGrid(editor, x, y, e.control);
                this.lastX = x;
                this.lastY = y;
              }
            }
          },
          onclick: function (e) {
            var self = this;
            if (e.target.tagName.toUpperCase() === 'A') {
              e.preventDefault();
              e.stopPropagation();
              self.parent().cancel();
              editor.undoManager.transact(function () {
                $_2h1qp9oxjn69h3w0.insert(editor, self.lastX + 1, self.lastY + 1);
              });
              editor.addVisual();
            }
          }
        }]
    };
    function cmd(command) {
      return function () {
        editor.execCommand(command);
      };
    }
    var tableProperties = {
      text: 'Table properties',
      context: 'table',
      onPostRender: pushTable,
      onclick: cmd('mceTableProps')
    };
    var deleteTable = {
      text: 'Delete table',
      context: 'table',
      onPostRender: pushTable,
      cmd: 'mceTableDelete'
    };
    var row = {
      text: 'Row',
      context: 'table',
      menu: [
        {
          text: 'Insert row before',
          onclick: cmd('mceTableInsertRowBefore'),
          onPostRender: pushCell
        },
        {
          text: 'Insert row after',
          onclick: cmd('mceTableInsertRowAfter'),
          onPostRender: pushCell
        },
        {
          text: 'Delete row',
          onclick: cmd('mceTableDeleteRow'),
          onPostRender: pushCell
        },
        {
          text: 'Row properties',
          onclick: cmd('mceTableRowProps'),
          onPostRender: pushCell
        },
        { text: '-' },
        {
          text: 'Cut row',
          onclick: cmd('mceTableCutRow'),
          onPostRender: pushCell
        },
        {
          text: 'Copy row',
          onclick: cmd('mceTableCopyRow'),
          onPostRender: pushCell
        },
        {
          text: 'Paste row before',
          onclick: cmd('mceTablePasteRowBefore'),
          onPostRender: pushCell
        },
        {
          text: 'Paste row after',
          onclick: cmd('mceTablePasteRowAfter'),
          onPostRender: pushCell
        }
      ]
    };
    var column = {
      text: 'Column',
      context: 'table',
      menu: [
        {
          text: 'Insert column before',
          onclick: cmd('mceTableInsertColBefore'),
          onPostRender: pushCell
        },
        {
          text: 'Insert column after',
          onclick: cmd('mceTableInsertColAfter'),
          onPostRender: pushCell
        },
        {
          text: 'Delete column',
          onclick: cmd('mceTableDeleteCol'),
          onPostRender: pushCell
        }
      ]
    };
    var cell = {
      separator: 'before',
      text: 'Cell',
      context: 'table',
      menu: [
        {
          text: 'Cell properties',
          onclick: cmd('mceTableCellProps'),
          onPostRender: pushCell
        },
        {
          text: 'Merge cells',
          onclick: cmd('mceTableMergeCells'),
          onPostRender: pushMerge
        },
        {
          text: 'Split cell',
          onclick: cmd('mceTableSplitCells'),
          onPostRender: pushUnmerge
        }
      ]
    };
    editor.addMenuItem('inserttable', insertTable);
    editor.addMenuItem('tableprops', tableProperties);
    editor.addMenuItem('deletetable', deleteTable);
    editor.addMenuItem('row', row);
    editor.addMenuItem('column', column);
    editor.addMenuItem('cell', cell);
  };
  var $_92f1snqzjn69h4km = { addMenuItems: addMenuItems };

  var getClipboardRows = function (clipboardRows) {
    return clipboardRows.get().fold(function () {
      return;
    }, function (rows) {
      return map(rows, function (row) {
        return row.dom();
      });
    });
  };
  var setClipboardRows = function (rows, clipboardRows) {
    var sugarRows = map(rows, Element$$1.fromDom);
    clipboardRows.set(Option.from(sugarRows));
  };
  var getApi = function (editor, clipboardRows) {
    return {
      insertTable: function (columns, rows) {
        return $_2h1qp9oxjn69h3w0.insert(editor, columns, rows);
      },
      setClipboardRows: function (rows) {
        return setClipboardRows(rows, clipboardRows);
      },
      getClipboardRows: function () {
        return getClipboardRows(clipboardRows);
      }
    };
  };

  function Plugin(editor) {
    var resizeHandler = ResizeHandler(editor);
    var cellSelection = CellSelection$1(editor, resizeHandler.lazyResize);
    var actions = TableActions(editor, resizeHandler.lazyWire);
    var selections = Selections(editor);
    var clipboardRows = Cell(Option.none());
    $_1lgkyqoojn69h3uk.registerCommands(editor, actions, cellSelection, selections, clipboardRows);
    $_2htigkkzjn69h2mu.registerEvents(editor, selections, actions, cellSelection);
    $_92f1snqzjn69h4km.addMenuItems(editor, selections);
    $_g9vmalqyjn69h4km.addButtons(editor);
    $_g9vmalqyjn69h4km.addToolbars(editor);
    editor.on('PreInit', function () {
      editor.serializer.addTempAttr($_g5o9f4n1jn69h39s.firstSelected());
      editor.serializer.addTempAttr($_g5o9f4n1jn69h39s.lastSelected());
    });
    if (hasTabNavigation(editor)) {
      editor.on('keydown', function (e) {
        $_15ikhnpnjn69h44l.handle(e, editor, actions, resizeHandler.lazyWire);
      });
    }
    editor.on('remove', function () {
      resizeHandler.destroy();
      cellSelection.destroy();
    });
    return getApi(editor, clipboardRows);
  }
  global.add('table', Plugin);
  function Plugin$1 () {
  }

  return Plugin$1;

}());
})();
