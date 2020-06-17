'use strict';

(function(w, d) {
  var u = w.utilities;

  //handle "other" options
  u.doToAll(d.querySelectorAll('.otherOption'), function(t) {
    var inputs = t.querySelectorAll('input'),
      checkbox = inputs[0],
      text = inputs[1];

    if (!checkbox.checked) {
      text.toggleAttribute('required');
      text.setAttribute('disabled', '')
    };

    checkbox.addEventListener('change', function() {
      text.toggleAttribute('required');
      if (this.checked) text.removeAttribute('disabled');
      else text.setAttribute('disabled', '');
    });

    u.doToAll(t.parentElement.children, function(t) {
      if (t.classList.contains('radioButton')) {
        t.querySelector('input').addEventListener('change', function() {
          if (checkbox.checked) text.removeAttribute('disabled');
          else text.setAttribute('disabled', '');
        });
      }
    });
  });

  function handleYesNoChange(buttons, textfields, subfield) {
    if (buttons[0].checked) {
      u.doToAll(textfields, function(t) {
        t.setAttribute('required', true);
        return t.removeAttribute('disabled');
      });
      if (subfield) subfield.style.display = 'block';
    } else {
      u.doToAll(textfields, function(t) {
        t.removeAttribute('required');
        return t.setAttribute('disabled', '');
      });
      if (subfield) subfield.style.display = 'none';
    }
  }

  //handle "yes or no" options
  u.doToAll(d.querySelectorAll('.yesNo'), function(t) {
    var inputs = Array.prototype.slice.call(t.querySelectorAll('input, textarea'), 0),
      buttons = inputs.splice(0, 2),
      subfield = t.querySelector('.subfield'),
      textfields = inputs;

    handleYesNoChange(buttons, textfields, subfield);

    buttons[0].addEventListener('change', function(e) {
      handleYesNoChange(buttons, textfields, subfield);
    });

    buttons[1].addEventListener('change', function(e) {
      handleYesNoChange(buttons, textfields, subfield);
    });
  });
})(window, document);
