var LoaderBase = function(){};
LoaderBase.prototype = {
  init: function(loadingBox, loadingMessage, database, callback) {
    this.loadingBox  = loadingBox;
    this.loadingMessage = loadingMessage;
    this.database = database;
    this.callback = callback || function() {};

    try {
      this.insertHandler = new UpdateHandler(this.database, this.insertSql);
    } catch(e) {
      this.error(e.message || e);
      throw e;
    }
    this.load();
  },
  insertSql: "INSERT INTO bookmark VALUES(:id, :url, :title, :info, :tags, :time, UPPER(:title||' '||:info||' '||:tags))",
  truncateSql: 'DELETE FROM bookmark',

  load: function() {
    this.dispStart();

    this.bookmarks = [];
    this.total     = null;

    this._load();
  },
  dispStart: function() {
    Glayer.showBox(this.loadingBox);
    this.loadingMessage.textContent = 'Bookmarks Loading...';
  },
  dispLoading: function(count) {
    this.loadingMessage.textContent = 'Bookmarks Loading... ' + count + '/' + this.total;
  },
  dispEnd: function(count) {
    this.loadingBox.style.display = 'none';
    Glayer.showAlert('Finish!!  loaded ' + count + ' bookmarks', {callback: function(){ incsearch.input.focus(); Glayer.hideAlert(); }});
    document.getElementById(Glayer.defaultAlert.okId).focus();

    incsearch.reset();
  },
  error: function(errMsg) {
    this.loadingBox.style.display = 'none';

    var self = this;
    Glayer.showConfirm(
      errMsg, 
      function(result){
        Glayer.hideConfirm();
        if (result) {
          self.dispStart();
          self._load();
        } else {
          incsearch.input.focus();
        }
      },
      {okLabel: 'Retry', cancelLabel: 'cancel'}
    );
    document.getElementById(Glayer.defaultConfirm.cancelId).focus();

    throw errMsg;
  },

  truncate: function() {
    this.database.execute(this.truncateSql);
  },
  insert: function(bookmark) {
    this.insertHandler.execute(bookmark);
  },

  update: function(bookmarks) {

    var self = this;

    var conn = this.database.connection;
    try {
      conn.beginTransaction();
      this.truncate();

      for (var i = 0, len = bookmarks.length; i < len; i++) {
        if (i % 100 == 0) yield i;
        this.insert(bookmarks[i]);
      }

      conn.commitTransaction();
    } catch(e) {
      conn.rollbackTransaction();

      this.error(e.message || e);
      throw e;
    }
  }
}


var Executer = function(generator, interval, func, callback) {
  this.generator = generator;
  this.func = func || function(){};
  this.interval = interval;
  this.callback = callback;

  var self = this;
  this.run = function() {
    try{
      self.func(self.generator.next());
      setTimeout(function(){self.run()}, self.interval);
    } catch (e) {
       if (e instanceof StopIteration) {
         self.callback();
       } else {
         throw e;
       }
    }
  }
};

