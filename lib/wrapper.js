﻿/**
 *
 * ©2018-2019 EdgeVerve Systems Limited (a fully owned Infosys subsidiary),
 * Bangalore, India. All Rights Reserved.
 *
 */

// Author : Atul
const loopback = require('loopback');
const DataSource = loopback.DataSource;
const DataAccessObject = DataSource.DataAccessObject;
const oeutils = require('oe-cloud/lib/common/util.js');
const uuidv4 = require('uuid/v4');
const g = require('strong-globalize')();
const utils = require('./utils');
const EmbedsOne = require('loopback-datasource-juggler/lib/relation-definition').EmbedsOne;
const isMixinEnabled = require('./utils').isMixinEnabled;


module.exports = function (app) {
  var _setup = DataSource.prototype.setup;
  var _updateAttributes = {};
  var _replaceById = {};
  var _upsert = {};
  var _generateContextData = {};
  var _destroyAll = {};
  var _save = {};

  function updateWithWhere(self, model, where, data, options, cb, throwError, caller) {
    self.update(model, where, data, options, function (err, results) {
      if (err) {
        return cb(err);
      }
      var id = oeutils.isInstanceQuery(model, where);
      if (id && typeof results === 'object' && results.count === 0 && throwError === true) {
        if (id) {
          var error = new Error(g.f('No instance with {{id}} %s found for %s', id, model));
          error.code = 'NOT_FOUND';
          error.statusCode = 404;
          return cb(error);
        }
      } else if (id && caller !== 'destroy') {
        return cb(err, data);
      }
      return cb(err, results);
    });
  }

  function convertDestroyToUpdate(fn, model, where, options, cb) {
    if (!isMixinEnabled(model, 'SoftDeleteMixin')) {
      return fn.call(this, model, where, options, cb);
    }
    var data = { _isDeleted: true };
    if (isMixinEnabled(model, 'VersionMixin')) {
      data._version = uuidv4();
    }
    return updateWithWhere(this, model, where, data, options, cb, data._version ? true : false, 'destroy');
  }

  function callWithVersion(fn, model, id, data, options, cb) {
    var Model = loopback.findModel(model);
    if (!isMixinEnabled(model, 'VersionMixin')) {
      var functionName = fn.functionName || fn.name;
      if (functionName === 'updateOrCreate' || functionName === 'save') {
        return fn.call(this, model, data, options, cb);
      }

      return fn.call(this, model, id, data, options, cb);
    }
    var where = {and: []};

    var idField = oeutils.idName(Model);
    var o = {};
    o[idField] = id;
    where.and.push(o, { _version: data._version });
    data._oldVersion = data._version;
    data._version = data._newVersion || uuidv4();

    if (Model.relations) {
      var relations = Model.relations;
      for (var r in Model.relations) {
        if (relations[r].type !== 'embedsOne' && relations[r].type !== 'embedsMany') {
          continue;
        }
        if (!isMixinEnabled(relations[r].modelTo, 'VersionMixin')) {
          continue;
        }
        var keyFrom = relations[r].keyFrom;
        if (!keyFrom || !data[keyFrom]) {
          continue;
        }
        if (relations[r].type === 'embedsOne') {
          data[keyFrom]._version = data._version;
        } else if (data[keyFrom].length) {
          data[keyFrom].forEach(function (item) {
            item._version = data._version;
          });
        }
      }
    }
    return updateWithWhere(this, model, where, data, options, cb, true, 'update');
  }

  // Atul : This function override setup() of DataSource.
  // It uses this function to call updateAttributes, destroyAll etc with version
  DataSource.prototype.setup = function (name) {
    this.on('connected', () => {
      var connector = this.connector;
      if (this.name && !_updateAttributes[this.name] && connector.updateAttributes) {
        _updateAttributes[this.name] = connector.updateAttributes;
        connector.updateAttributes = function (model, id, data, options, cb) {
          var fn = _updateAttributes[this.dataSource.name];
          fn.functionName = 'updateAttributes';
          callWithVersion.call(this, fn, model, id, data, options, cb);
        };
      }


      if (this.name && !_save[this.name] && connector.save) {
        _save[this.name] = connector.save;
        connector.save = function (model, data, options, cb) {
          var fn = _save[this.dataSource.name];
          fn.functionName = 'save';
          if ( !cb && typeof options === 'function' ) {
            cb = options;
            options = {};
          }
          var Model = loopback.findModel(model);
          var idField = oeutils.idName(Model);
          callWithVersion.call(this, fn, model, data[idField], data, options, cb);
        };
      }


      if (this.name && !_destroyAll[this.name]) {
        _destroyAll[this.name] = connector.destroyAll;
        connector.destroyAll = function (model, where, options, cb) {
          var fn = _destroyAll[this.dataSource.name];
          fn.functionName = 'destroyAll';
          convertDestroyToUpdate.call(this, fn, model, where, options, cb);
        };
      }

      if (this.name && !_replaceById[this.name] && connector.replaceById) {
        _replaceById[this.name] = connector.replaceById;
        connector.replaceById = function (model, id, data, options, cb) {
          var fn = _replaceById[this.dataSource.name];
          fn.functionName = 'replaceById';
          callWithVersion.call(this, fn, model, id, data, options, cb);
        };
      }

      if (this.name && !_generateContextData[this.name]) {
        _generateContextData[this.name] = connector.generateContextData = function (context, dbResponse) {
          if (isMixinEnabled(context.Model, 'VersionMixin')) {
            context.data = dbResponse;
          }
          return context;
        };
      }

      if (this.name && !_upsert[this.name] && connector.updateOrCreate) {
        _upsert[this.name] = connector.updateOrCreate;
        connector.updateOrCreate = function (model, data, options, cb) {
          var fn = _upsert[this.dataSource.name];
          fn.functionName = 'updateOrCreate';
          var Model = loopback.findModel(model);
          var idField = oeutils.idName(Model);
          callWithVersion.call(this, fn, model, data[idField], data, options, cb);
        };
      }
    });
    if (_setup) {
      _setup.apply(this, [].slice.call(arguments));
    }
    return;
  };


  var _removeById = DataAccessObject.removeById;
  DataAccessObject.removeById =
    DataAccessObject.destroyById =
    DataAccessObject.deleteById =
    DataAccessObject.deleteById =
  DataAccessObject.deleteWithVersion = function (id, version, options, cb) {
    if (!isMixinEnabled(this, 'VersionMixin')) {
      return _removeById.apply(this, [].slice.call(arguments));
    }
    var Model = this;
    utils.checkIfVersionMatched(Model, id, version, function (err, instance) {
      if (err) {
        return cb(err);
      }
      var idField = oeutils.idName(Model);
      var id = instance[idField];
      var where = { and: [] };
      var o = {};
      o[idField] = id;
      where.and.push(o, { _version: version });
      return Model.destroyAll(where, options, cb);
    });
    return;
  };


  // Atul : Overriding to update version field with parent version
  const _embedUpdate = EmbedsOne.prototype.update;
  EmbedsOne.prototype.update = function (targetModelData, options, cb) {
    if (!isMixinEnabled(this.modelInstance.constructor, 'VersionMixin')) {
      return _embedUpdate.call(this, targetModelData, options, cb);
    }
    this.modelInstance._version = targetModelData._parentVersion || targetModelData._version;
    return _embedUpdate.call(this, targetModelData, options, cb);
  };

  const _embedCreate = EmbedsOne.prototype.create;
  EmbedsOne.prototype.create = function (targetModelData, options, cb) {
    if (!isMixinEnabled(this.modelInstance.constructor, 'VersionMixin')) {
      return _embedCreate.call(this, targetModelData, options, cb);
    }
    this.modelInstance._version = targetModelData._parentVersion || targetModelData._version;
    return _embedCreate.call(this, targetModelData, options, cb);
  };
};
