"use strict";

var knex = require('knex').knex;

var Access = class {
  constructor(params) {
    this.access_id = params.access_id || null;
    this.name = params.name || null;
  }

  save() {
    return '';
  }

};

module.exports = Access;
