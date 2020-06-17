var uuid = require('uuid');

var data = [0,1,2,3,4,5];

for (var i = 0; i < data.length; i++) {
    var code = uuid.v1();
    console.log(code);
}