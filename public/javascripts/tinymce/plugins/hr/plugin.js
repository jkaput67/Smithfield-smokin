(function () {
var hr = (function () {
  'use strict';

  var global = tinymce.util.Tools.resolve('tinymce.PluginManager');

  var register = function (editor) {
    editor.addCommand('InsertHorizontalRule', function () {
      editor.execCommand('mceInsertContent', false, '<hr />');
    });
  };
  var $_frzox2cmjn69h0z7 = { register: register };

  var register$1 = function (editor) {
    editor.addButton('hr', {
      icon: 'hr',
      tooltip: 'Horizontal line',
      cmd: 'InsertHorizontalRule'
    });
    editor.addMenuItem('hr', {
      icon: 'hr',
      text: 'Horizontal line',
      cmd: 'InsertHorizontalRule',
      context: 'insert'
    });
  };
  var $_2llsl9cnjn69h0za = { register: register$1 };

  global.add('hr', function (editor) {
    $_frzox2cmjn69h0z7.register(editor);
    $_2llsl9cnjn69h0za.register(editor);
  });
  function Plugin () {
  }

  return Plugin;

}());
})();
