"use strict";

var knex = require('knex').knex;

//reference Access class
var Access = require('../lib/access.js');

var Role = class {
  constructor(params) {
    this.role_id = params.role_id || null;
    this.name = params.name || null;
    this.access = params.access || null;
    this.is_admin = params.is_admin || null;
  }

  save() {
    return 'saved!';
  }

  getAccess(next) {
    if (this.access)
      next(null);
    else {
      if (this.role_id) {
        knex.select('access.name')
        .from('access')
        .innerJoin('roles_access', 'access.access_id', 'roles_access.access_id')
        .where('roles_access.role_id', '=', this.role_id)
        .then((rows) => {
          this.access = [];
          for (let r in rows)
          {
            this.access.push(rows[r].name);
          }
          next(null);
        });
      } else {
        next('role id required');
      }
    }
  }

  create(next) {
    /* updates object iself */
    if (this.name)
    {
      let isAdmin = this.is_admin ? this.is_admin : 0;
      knex('roles').insert({name: this.name, is_admin: isAdmin})
      .then((rows) => {
        console.log('created role');
        this.access_id = rows[0];
        next(null);
      }).catch((err) => {
        next(err);
      });
    } else {
      next('Needs a name to create role');
    }
  }

  fetch(next) {
    knex.select('roles.role_id', 'roles.name', 'roles.is_admin', 'access.name as access_name', 'access.access_id')
    .from('roles')
    .leftOuterJoin('roles_access', 'roles.role_id', 'roles_access.role_id')
    .leftOuterJoin('access', 'roles_access.access_id', 'access.access_id')
    .where({'roles.role_id': this.role_id})
    .then((rows) => {
      if (rows.length <= 0) {
        next('No role found');
      } else {
        for (var r in rows)
        {
          let thisRow = rows[r];
          if (r == 0)
          {
            this.access = [];
            this.name = thisRow.name;
            this.is_admin = thisRow.is_admin;

            if (thisRow.access_name) {
              let access = new Access({name: thisRow.access_name, access_id: thisRow.access_id});
              this.access.push(access);
            }

          } else {
            if (thisRow.access_name) {
              let access = new Access({name: thisRow.access_name, access_id: thisRow.access_id});
              this.access.push(access);
            }
          }
        }
        //successful
        next(null);
      }
    });
  }

  serialize() {
    var serialObject = {};
    serialObject.role_id = this.role_id || null;
    serialObject.name = this.name  || null;
    serialObject.is_admin = this.is_admin  || null;
    serialObject.access = this.access || null;

    return serialObject;
  }

};

module.exports = Role;
