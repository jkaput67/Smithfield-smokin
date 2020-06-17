'use strict';

(function(w, d) {
  var u = w.utilities;

  var docUpload = d.getElementById('UploadAdditionalDocumentation');

  docUpload.addEventListener('change', function(e) {
    var reader = new FileReader(),
      fileData = e.target.files[0],
      //isImage = /^image\/(jpe*g|png|gif)$/i.test(imageData.type),
      isUnderMaxSize = fileData.size <= 20000000;

    console.log(fileData);

    var filename = w.prompt('Please add a name for your file:');

    const form = new FormData();
    form.append('file', fileData, fileData.name);

    if (filename && fileData && isUnderMaxSize) {
      fetch('/s3upload', {
        method: 'POST',
        body: form
      })
        .then(res => res.json())
        .then(({ success, id }) => {
          if (!success) return console.error('File not uploaded successfully.');

          document.querySelector('#doc_ids').value = id;
          document.querySelector('#doc_names').value = filename;
        })
        .catch(console.error);
    }
  });

  //bbq contest information toggle
  var bbqinfofields = d.querySelectorAll('#BBQContestInformation [required]'),
    fieldswithplaceholder = d.querySelectorAll(
      '#BBQContestInformation [required][placeholder="*"]'
    );

  function toggleBBQContestInfo() {
    if (d.querySelector('#TypeOfGrant input:checked').value == 'Grant Funding') {
      u.doToAll(bbqinfofields, function(elem) {
        return elem.setAttribute('required', 'required');
      });
      u.doToAll(fieldswithplaceholder, function(elem) {
        return elem.setAttribute('placeholder', '*');
      });
    } else {
      u.doToAll(bbqinfofields, function(elem) {
        return elem.removeAttribute('required');
      });
      u.doToAll(fieldswithplaceholder, function(elem) {
        return elem.removeAttribute('placeholder');
      });
    }
  }

  u.doToAll(d.querySelectorAll('#TypeOfGrant input'), function(elem) {
    return elem.addEventListener('change', toggleBBQContestInfo);
  });

  //form submission
  var $grantform = $('#grantapplication').parsley();

  d.getElementById('SubmitForm').addEventListener('click', function(e) {
    e.preventDefault();

    console.log('submitted');
    u.doToAll(d.querySelectorAll(':disabled'), function(t) {
      return (t.value = null);
    });

    console.log($grantform.validate());

    if ($grantform.validate()) d.getElementById('grantapplication').submit();
  });
})(window, document);
