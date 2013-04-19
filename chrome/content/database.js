// Database
function Database(name, dir) {
  name += '.sqlite';

  var file = Database.getService('@mozilla.org/file/directory_service;1', 'nsIProperties')
               .get('ProfD', Components.interfaces.nsIFile);

  if (dir) {
    file.append(dir);
    if (!file.exists()) {
      file.create(Components.interfaces.nsIFile.DIRECTORY_TYPE, 0755);
    }
  }

  file.append(name);

  this.connection = Database.getService('@mozilla.org/storage/service;1', 'mozIStorageService').openDatabase(file);
}

Database.getService = function(cls, interface) {
  return Components.classes[cls].getService(Components.interfaces[interface]);
}

Database.bindParams = function(statement, params) {

  if (params == null) return;

  // Hash
  if (typeof(params) == 'object' && params.length == null) {
    var paramNames = this.getParamNames(statement);
    for (var name of paramNames) {
      var param = params[name];
      if (typeof(param)=='undefined') continue;

      if (param instanceof Date){
    	  statement.params[name] = param.getTime();
        continue;
      }

      statement.params[name] = param;
    }
    return;
  }

  // Array
  if (typeof(params) == 'string' || params.length == null) {
    params = [].concat(params);
  }

  for (var i = 0, len = statement.parameterCount; i < len; i++) {
    statement.bindUTF8StringParameter(i, params[i]);
  }
}

Database.getParamNames = function(statement) {
  var paramNames = [];
  for (var i=0, len=statement.parameterCount ; i<len ; i++) {
    paramNames.push(statement.getParameterName(i).substr(1));
  }
  return paramNames;
}

Database.getColumnNames = function(statement) {
  var columnNames=[];
  for ( var i = 0, len = statement.columnCount; i < len; i++) {
    columnNames.push(statement.getColumnName(i));
  }
  return columnNames;
}

Database.getRow = function(row, columnNames){
  var result = {};
  for (var name of columnNames) {
    result[name] = row[name];
  }
  return result;
}

Database.DatabaseException = function(db, exception){
  this.code = db.connection.lastError;
  this.message = 'errorCode:' + this.code + '; ' + db.connection.lastErrorString;
  this.original = exception;
}


Database.prototype = {
  createStatement: function(sql) {

    try {
      return this.connection.createStatement(sql);
    } catch(e) {
      this.throwException(e);
    }
  },

  execute: function(sql, params, handler) {
    if (typeof(handler) == 'function') {
      var temp = {};
      temp.process = handler;
      handler = temp;
    }

    var statement = sql.execute ? sql : this.createStatement(sql);
    try{
      Database.bindParams(statement, params);

      if (!handler) {
        statement.execute();
        return;
      }

      var columnNames;
      while (statement.step()) {
        if (!columnNames)
          columnNames = Database.getColumnNames(statement);

        handler.process(statement.row, columnNames);
      }

      return statement;

    } catch(e if e==StopIteration) {
    } catch(e) {
      this.throwException(e);
    } finally {
      if (statement)
        statement.reset();
    }
  },

  throwException: function(exception){
    if (this.connection.lastError != 0) {
      throw new Database.DatabaseException(this, exception);
    } else {
      throw exception;
    }
  },

  transaction: function(handler) {
    var connection = this.connection;
    var error = false;
    connection.beginTransaction();
    try {
      handler();
      connection.commitTransaction();
    } catch(e) {
      error = true;
      this.throwException(e);
    } finally {
      if(error)
        connection.rollbackTransaction();
    }
  }
}

// ResultArrayHandler
function ResultArrayHandler(database, sql) {
  this.database = database;
  this.statement = this.database.createStatement(sql);
}

ResultArrayHandler.prototype = {
  execute: function(params) {
    this.result = [];
    this.database.execute(this.statement, params, this);
    return this.result;
  },

  createRowResult: function(row, columnNames) {
    var result = {};
    for (var i = 0, len = columnNames.length; i < len; i++) {
      result[columnNames[i]] = row[columnNames[i]];
    }
    return result;
  },

  process: function(row, columnNames) {
    this.result.push(Database.getRow(row, columnNames));
  }
}

// UpdateHandler
function UpdateHandler(database, sql) {
  this.database = database;
  this.statement = this.database.createStatement(sql);
}

UpdateHandler.prototype = {
  execute: function(params) {
    if (params && params.constructor == Array) {
      for (var i = 0, len = params.length; i < len; i++) {
        this.database.execute(this.statement, params[i], null);
      }
    } else {
      this.database.execute(this.statement, params, null);
    }
  }
}

