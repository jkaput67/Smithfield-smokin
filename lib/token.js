"use strict";

var knex = require('knex').knex;

//private methods
function randomString(length, chars) {
    var result = '';
    for (var i = length; i > 0; --i) result += chars[Math.floor(Math.random() * chars.length)];
    return result;
}
var tokenChars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';

function addMinutes(date, minutes) {
    return new Date(date.getTime() + minutes*60000);
}

//Token Class
var Token = class {
  constructor(params) {
    if (params) {
      this.access_token = params.access_token || null;
      this.user_id = params.user_id || null;
      this.tokenExpiration = params.tokenExpiration || null;
      this.expiration = params.expiration || null;
      this.valid = params.valid || true;
    }
  }

  create(next) {
    if (!this.user_id)
      next('user id required');
    else {
      //first expire any existing auth tokens for user
      knex('tokens').where({user_id: this.user_id, valid: true}).update({valid: false})
      .then(() => {
        let newToken = randomString(24, tokenChars); //generate new token
        let expirationDate = addMinutes(new Date(), this.tokenExpiration); //expire in x minutes
        //insert new token
        knex('tokens').insert({access_token: newToken, user_id: this.user_id, expiration: expirationDate.getTime(), valid:true})
        .then((rows) => {
          this.access_token = newToken;
          this.expiration = expirationDate.getTime();
          next (null);
        }).catch((err) => {
          next(err);
        });
      }).catch((err) => {
        next(err);
      });
    }
  }

  fetch(next) {
    //check if token exists and is not expired. Return error if expired
    if (!this.access_token)
      next('access token required');
    else {
      knex.select('user_id', 'expiration').from('tokens')
      .where({access_token: this.access_token, valid: true})
      .andWhere('expiration', '>', Date.now())
      .then((rows) => {
        if (rows && rows.length)
        {
          this.user_id = rows[0].user_id;
          this.expiration = rows[0].expiration || null
          //return without error
          next(null);
        } else {
          next('access token expired');
        }
      });
    }
  }

  save() {
    return 'saved!';
  }

  timeLeft() {
    //get timeleft on expiration date using UTC
    var secondsDiff = -1;
    if (this.expiration)
    {
      var now = Date.now();
      if (now < this.expiration)
      {
        //get time difference in seconds
        secondsDiff = (Date.parse(this.expiration) - Date.parse(now)) / 1000;
      } else {
        secondsDiff = 0;
      }
    }
    return secondsDiff;
  }

};

module.exports = Token;
