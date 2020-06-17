"use strict";
/*
Main user CRUD

*/

var knex = require('knex').knex;
//var bcrypt = require('bcrypt');

//reference Role class
var Role = require('../lib/role.js');

//user class
var User = class {
  constructor(params) {
    if (params) {
      this.user_id = params.user_id || null;
      this.firstname = params.firstname || null;
      this.lastname = params.lastname || null;
      this.email = params.email || null;
      this.phone = params.phone || null;
      this.birthdate = params.birthdate || null;
      this.username = params.username || null;
      this.password = params.password || null;
      this.hashed_password = params.hashed_password || null;
      this.roles = params.roles || null;
      this.opt_ins = params.opt_ins || null;
      this.app_id = params.app_id || null;
      this.created_at = params.created_at || null;
      this.updated_at = params.updated_at || null;
      this.facebook_id = params.facebook_id || null;
      this.google_id = params.google_id || null;
      this.twitter_id = params.twitter_id || null;
    }
  }

  get fullname() {
    return this.firstname + ' ' + this.lastname;
  }

  get id() {
    return this.user_id;
  }

  savePassword(next) {
    this._generatePasswordHash((err, hash) => {
      if (err)
        next(err);
      else {
        knex('users').update({password: hash})
        .where({user_id: this.user_id})
        .then((rows) => {
          console.log('updated user password');
          next(null);
        }).catch((err) => {
          next(err);
        });
      }
    });
  }

  save(next) {

    //update user information
    knex('users').update({'email': this.email, 'phone': this.phone, 'firstname': this.firstname, 'lastname': this.lastname, 'birthdate': this.birthdate })
    .where({'user_id': this.user_id})
    .then((rows) => {
      if (!rows)
        next('there was a problem updating the user');
      else {

        //update roles if necessary
        if (this.roles) {
          var newRoles = this.roles.map((r) => {
            if (r.role_id)
              return r.role_id;
          });

          //check difference in roles assigned vs roles provided
          knex('users_roles').select().where({'user_id': this.user_id}).then((rows) => {
            var matchRoles = [];
            var removeRoles = [];
            for (var rr in rows)
            {
              if (newRoles.indexOf(rows[rr].role_id) > -1)
              {
                //matched new role, ignore
                matchRoles.push(rows[rr].role_id);
                newRoles.pop(newRoles.indexOf(rows[rr].role_id));
              } else {
                //didnt match new role, needs to be removed
                removeRoles.push(rows[rr].role_id);
              }
            }

            //remove any roles that arn't included in update roles
            if (removeRoles.length > 0) {
              knex('users_roles').delete().whereIn('role_id', removeRoles).andWhere({'user_id': this.user_id}).then((rows) => {

                //select new roles to make sure they exist, then insert into users_roles
                knex('roles').distinct('role_id').select().whereIn('role_id', newRoles).then((rows) => {
                  //add roles to users_roles
                  var actualRows = [];
                  for (var r in rows) {
                    actualRows.push({'user_id': this.user_id, 'role_id': rows[r].role_id});
                  }

                  //insert new roles that actually exist
                  if (actualRows.length > 1) {
                    knex('users_roles').insert(actualRows).then((rows) => {
                      next(null);
                    });
                  } else {
                    next(null);
                  }
                });

              });
            } else {

              //select new roles to make sure they exist, then insert into users_roles
              knex('roles').distinct('role_id').select().whereIn('role_id', newRoles).then((rows) => {
                //add roles to users_roles
                var actualRows = [];
                for (var r in rows) {
                  actualRows.push({'user_id': this.user_id, 'role_id': rows[r].role_id});
                }

                //insert new roles that actually exist
                if (actualRows.length > 0) {
                  knex('users_roles').insert(actualRows).then((rows) => {
                    next(null);
                  });
                } else {
                  next(null);
                }
              }).catch((err) => {
                next(err);
              });

            }

          });
        } else {
          next(null);
        }
      }
    });
  }

  _getRoles(next) {
    /* updates object itself */
    this.roles = null;
    //get roles and access and assign to user
    knex.select('roles.role_id', 'roles.name', 'roles.is_admin')
    .from('users_roles')
    .innerJoin('roles', 'users_roles.role_id', 'roles.role_id')
    .where({user_id: this.user_id})
    .then((rows) => {
      if (rows.length <= 0) {
        console.log('no roles found');
        next(null);
      } else {
        this.roles = [];
        for (var r in rows)
        {
          let thisRow = rows[r];
          //console.log(thisRow);
          let role = new Role(thisRow);
          this.roles.push(role);
        }
        //now get access for each role
        this._getAccess(0, (err) => {
          if (err)
            next(err);
          else {
            //once done, return
            next(null);
          }
        });
      }
    }).catch((err) => {
      next(err);
    });

  }

  isInRole(role_name, next) {
    /* returns error and true or false */
    if (this.roles) {
      let hasRole = false;
      for (let r in this.roles)
      {
        //console.log(r);
        let currRole = this.roles[r];
        //console.log(currRole.name);
        //console.log(role_name);
        if (currRole.name === role_name)
        {
          //console.log('ahhhh!!!');
          hasRole = true;
          break;
        }
      }
      next(null, hasRole);
    } else {
      //get roles for user and then check if they belong to requested role
      this._getRoles((err) => {
        if (err) {
          next(err, false);
        }
        else {
          this.isInRole(role_name, next);
        }
      });
    }
  }

  _getAccess(index, next) {
    if (this.roles) {
      if (index == 0) //clear access when getting new
        this.access = [];

      this.roles[index].getAccess((err) => {
        if (err)
          next(err);
        else {
          for (let a in this.roles[index].access) {
            this.access.push(this.roles[index].access[a]);
          }

          if (index == this.roles.length -1) {
            //all done, go back
            next(null);
          } else {
            //continue to next role
            this._getAccess(index+1, next);
          }
        }
      });
    } else {
      next('Roles needed to get access');
    }
  }

  hasAccess(access_name, next) {
    /* returns error or true or false (err, bool) */
    if (this.access) {
      let foundAccess = false;
      for (let a in this.access)
      {
        if (this.access[a] == access_name)
        {
          foundAccess = true;
          break;
        }
      }
      next(null, foundAccess);
    } else {
      //get access from roles
      if (this.roles) {
        this._getAccess(0, (err) => {
          if (err)
            next(err, false);
          else {
            this.hasAccess(access_name, next);
          }
        });
      } else {
        //if no roles have been found yet, gather them then try again
        this._getRoles((err) => {
          if (err) //no roles for user
            next(err, false);
          else
            this.hasAccess(access_name, next);
        });
      }
    }
  }

  //private methods
  _checkPassword(password, next) {
    let hashedPassword = this.hashed_password;
    bcrypt.compare(password, hashedPassword, function(err, res){
      //console.log(password, hashedPassword);
      if (res && res == true)
      {
        //password match successful, continue
        next(null);
      } else {
        //fail
        next('username or password does not match');
      }
    })
  }

  _generatePasswordHash(next) {
    if (this.password)
    {
      //create hashed password
      bcrypt.genSalt(10, (err, salt) => {
        bcrypt.hash(this.password, salt, (err, hash) => {
          if (err)
            next(err);
          else {
            next(null, hash);
          }
        }); //end hash
      }); //end salt
    } else {
      next('No password provided');
    }
  }

  create(next) {
    /* updates object iself */
    //if ((this.username && this.password) || this.facebook_id || this.google_id || this.twitter_id)
    if(this.username){
      knex('users')
        .select('*')
        .where({"user_id" : this.username})
        .then((rows) => {
          if (rows.length > 0){
            next('User already exists');
          } 
          /* else {
            //create hashed password
            this._generatePasswordHash((err, hash) => {
              if (err && !this.facebook_id && !this.google_id && !this.twitter_id)
                next(err);
              else {

                var insert = {};
                insert.username = this.username;
                insert.password = hash || null;
                if (this.firstname)
                  insert.firstname = this.firstname;
                if (this.lastname)
                  insert.lastname = this.lastname;
                if (this.email)
                  insert.email = this.email;
                if (this.phone)
                  insert.phone = this.phone;
                if (this.birthdate)
                  insert.birthdate = this.birthdate;
                if (this.facebook_id)
                  insert.facebook_id = this.facebook_id;
                if (this.google_id)
                  insert.google_id = this.google_id;
                if (this.twitter_id)
                  insert.twitter_id = this.twitter_id;

                knex('users').insert(insert)
                .then((rows) => {
                  console.log('created user');
                  this.user_id = rows[0];

                  if (this.opt_ins) {
                    //add opt ins to user
                    var optInserts = [];
                    for (var o in this.opt_ins) {
                      var optInsert = { user_id: this.user_id, opt_in: this.opt_ins[o] };
                      optInserts.push(optInsert);
                    }
                    knex('opt_ins').insert(optInserts).then((rows) => {
                      //inserted opt ins
                    });
                  }

                  //update roles if necessary
                  if (this.roles) {
                    var newRoles = this.roles.map((r) => {
                      if (r.role_id)
                        return r.role_id;
                    });

                    //select new roles to make sure they exist, then insert into users_roles
                    knex('roles').distinct('role_id').select().whereIn('role_id', newRoles).then((rows) => {
                      //add roles to users_roles

                      var actualRows = rows.map((r) => {
                        return {'user_id': this.user_id, 'role_id': r.role_id}
                      });

                      //insert new roles that actually exist
                      if (actualRows.length > 0) {
                        knex('users_roles').insert(actualRows).then((rows) => {
                          next(null);
                        });
                      } else {
                        next(null);
                      }
                    });
                  } else
                    next(null);
                }).catch((err) => {
                  next(err);
                });
              }
            }); //end generate hashed password

          } */
        }) //end user select

    } 
    else {
      next('Needs both username and password or social login to create');
    }
  }

  checkUser(next){
    console.log("Checking " + this.username)
    if(this.username){
      knex('users')
        .select('*')
        .where({"user_id" : this.username})
        .then(function(data){
          if(data.length==0){next("no user")}
          else{next("user exists")}
        });
    }
    else{
      next("No username")
    }
  }


  fetch(next) {
    /* updates object itself */
    let whereClause = {};
    let hasProp = false;
    if (this.user_id) {
      whereClause.user_id = this.user_id;
      hasProp = true;
    } else if (this.email) {
      whereClause.email = this.email;
      hasProp = true;
    } else if (this.phone) {
      whereClause.phone = this.phone;
      hasProp = true;
    } else if (this.birthdate) {
      whereClause.birthdate = this.birthdate;
      hasProp = true;
    } else if (this.facebook_id) {
      whereClause.facebook_id = this.facebook_id;
      hasProp = true;
    } else if (this.google_id) {
      whereClause.google_id = this.google_id;
      hasProp = true;
    } else if (this.twitter_id) {
      whereClause.twitter_id = this.twitter_id;
      hasProp = true;
    }
    if (hasProp == false) {
      next('Unique identifier required (user_id, email, or phone)');
    } else {
      //continue with getting user by unique identifier
      knex.select('username', 'user_id', 'email', 'phone', 'firstname', 'lastname', 'birthdate', 'password').from('users').where(whereClause)
      .then((rows) => {
        if (rows && rows.length > 0) {
          this.username = rows[0].username || null;
          this.user_id = rows[0].user_id || null;
          this.firstname = rows[0].firstname || null;
          this.lastname = rows[0].lastname || null;
          this.email = rows[0].email || null;
          this.phone = rows[0].phone || null;
          this.birthdate = rows[0].birthdate || null;
          this.hashed_password = rows[0].password || null;
          next(null);
        } else {
          next('no available user');
        }
      }).catch((err) => {
        next(err);
      });
    }
  }

  login(next) {
    /*updates object itself*/

    //console.log(this);
    knex.select('username', 'password', 'user_id').from('users').where({
      username: this.username
    }).then((rows) => {
      if (rows && rows.length > 0) {
        //console.log(rows);
        //create new user object with data returned.
        //TODO - Add extra fields
        //console.log(this);
        this.hashed_password = rows[0].password;
        this.user_id = rows[0].user_id;

        let callback = (err, result) => {
          if (err)
            next(err);
          else {
            //user authenticated, continue
            this.password = null;
            this.hashed_password = null;
            next(null);
          }
        };
        //if app id is provided, make sure user belongs to it
        if (this.app_id) {
          knex.select('user_id').from('users_applications').where({
            user_id: this.user_id,
            app_id: this.app_id
          }).then((rows) => {
            if (rows) {
              //console.log(this);
              //user belongs to app, continue
              //continue with password Authentication
              this._checkPassword(this.password, callback);
            }
          }).catch(function(error){
            next(error);
          });
        } else {
          //continue with password Authentication
          this._checkPassword(this.password, callback);
        }
      } else {
        //no user, return error
        next('username or password does not match');
      }
    }).catch(function(error) {
      next(error);
    });
  }

  serialize() {
    var serialObject = {};
    serialObject.user_id = this.user_id || null;
    serialObject.facebook_id = this.facebook_id || null;
    serialObject.google_id = this.google_id || null;
    serialObject.twitter_id = this.twitter_id || null;
    serialObject.firstname = this.firstname  || null;
    serialObject.lastname = this.lastname  || null;
    serialObject.email = this.email  || null;
    serialObject.username = this.username || null;
    serialObject.phone = this.phone || null;
    serialObject.birthdate = this.birthdate || null;
    serialObject.created_at = this.created_at || null;
    serialObject.updated_at = this.updated_at || null;
    serialObject.roles = this.roles || null;

    return serialObject;
  }

};

module.exports = User;
