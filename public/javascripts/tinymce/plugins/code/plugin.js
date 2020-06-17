(function () {
var code = (function () {
  'use strict';

  var global = tinymce.util.Tools.resolve('tinymce.PluginManager');

  var global$1 = tinymce.util.Tools.resolve('tinymce.dom.DOMUtils');

  var getMinWidth = function (editor) {
    return editor.getParam('code_dialog_width', 600);
  };
  var getMinHeight = function (editor) {
    return editor.getParam('code_dialog_height', Math.min(global$1.DOM.getViewPort().h - 200, 500));
  };
  var $_8iewxca1jn69h0ba = {
    getMinWidth: getMinWidth,
    getMinHeight: getMinHeight
  };

  var setContent = function (editor, html) {
    editor.focus();
    editor.undoManager.transact(function () {
      editor.setContent(html);
    });
    editor.selection.setCursorLocation();
    editor.nodeChanged();
  };
  var getContent = function (editor) {
    return editor.getContent({ source_view: true });
  };
  var $_ag0pcra3jn69h0bd = {
    setContent: setContent,
    getContent: getContent
  };

  var open = function (editor) {
    var minWidth = $_8iewxca1jn69h0ba.getMinWidth(editor);
    var minHeight = $_8iewxca1jn69h0ba.getMinHeight(editor);
    var win = editor.windowManager.open({
      title: 'Source code',
      body: {
        type: 'textbox',
        name: 'code',
        multiline: true,
        minWidth: minWidth,
        minHeight: minHeight,
        spellcheck: false,
        style: 'direction: ltr; text-align: left'
      },
      onSubmit: function (e) {
        $_ag0pcra3jn69h0bd.setContent(editor, e.data.code);
      }
    });
    win.find('#code').value($_ag0pcra3jn69h0bd.getContent(editor));
  };
  var $_3bztsda0jn69h0b8 = { open: open };

  var register = function (editor) {
    editor.addCommand('mceCodeEditor', function () {
      $_3bztsda0jn69h0b8.open(editor);
    });
  };
  var $_7bgrdm9zjn69h0b6 = { register: register };

  var register$1 = function (editor) {
    editor.addButton('code', {
      icon: 'code',
      tooltip: 'Source code',
      onclick: function () {
        $_3bztsda0jn69h0b8.open(editor);
      }
    });
    editor.addMenuItem('code', {
      icon: 'code',
      text: 'Source code',
      onclick: function () {
        $_3bztsda0jn69h0b8.open(editor);
      }
    });
  };
  var $_2nk08ja4jn69h0bf = { register: register$1 };

  global.add('code', function (editor) {
    $_7bgrdm9zjn69h0b6.register(editor);
    $_2nk08ja4jn69h0bf.register(editor);
    return {};
  });
  function Plugin () {
  }

  return Plugin;

}());
})();
