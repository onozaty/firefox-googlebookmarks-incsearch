var DEFAULT_NUMBER_OF_RESULTS = 10;
var DEFAULT_SIZE_OF_INPUT_AREA = 80;
var USER_EXT_JS = "user-extension.js"
var USER_EXT_JS_SAMPLE = "user-extension-sample.js"
var USER_CSS = "user.css"
var USER_CSS_SAMPLE = "user-sample.css"

if (!createTableSql) {
  var createTableSql = "CREATE TABLE bookmark(id INTEGER, url TEXT, title TEXT, info TEXT, tags TEXT, time TEXT, search_text TEXT, PRIMARY KEY(id))";
}

var database = new Database('bookmark', EXTENSION_NAME);

var prefSvc = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService);
var prefBranch = prefSvc.getBranch('extensions.' + EXTENSION_NAME + '.');
var incsearch = null;

window.addEventListener('load', function(){
  var text = document.getElementById('text');
  var viewArea = document.getElementById('viewArea');
  var status = document.getElementById('status');
  var sync = document.getElementById('sync');
  var setting = document.getElementById('setting');
  var help = document.getElementById('help');
  var loadingBox = document.getElementById('loadingBox');
  var loadingImage = document.getElementById('loadingImage');
  var loadingMessage = document.getElementById('loadingMessage');
  var pageLinkTop = document.getElementById('pageLinkTop');
  var pageLinkBottom = document.getElementById('pageLinkBottom');

  var userId = null;
  try {
    userId = prefBranch.getCharPref("userId");
  } catch(e){
  }

  var numberOfResults = DEFAULT_NUMBER_OF_RESULTS;
  try {
    numberOfResults = prefBranch.getIntPref("numberOfResults");
  } catch(e){
  }

  var sizeOfInputArea = DEFAULT_SIZE_OF_INPUT_AREA;
  try {
    sizeOfInputArea = prefBranch.getIntPref("sizeOfInputArea");
  } catch(e){
  }

  text.size = sizeOfInputArea;


  try {
    if (!userId  || !database.connection.tableExists('bookmark')) {
      if (database.connection.tableExists('bookmark')) {
        database.execute("DROP TABLE bookmark");
      }
      database.execute(createTableSql);
    }
  } catch(e) {

    status.textContent = e.message || e;
    loading.style.display = 'none';
    throw e;
  }

  // global
  incsearch = new IncSearch(
                    text,
                    viewArea,
                    {
                      dispMax: numberOfResults,
                      status: status,
                      pageLinkTop: pageLinkTop,
                      pageLinkBottom: pageLinkBottom,
                      database: database,
                      userId: userId
                    }
                  );
  incsearch.input.focus();

  var update = function() {
    incsearch.input.focus();
    new BookmarkLoader(loadingBox, loadingMessage, database);
  };

  sync.addEventListener('click', update, false);

  // settings
  var settingBox = document.getElementById('settingBox');
  var settingSave = document.getElementById('settingSave');
  var settingCancel = document.getElementById('settingCancel');
  var numberOfResultElement = document.getElementById('numberOfResults');
  var sizeOfInputAreaElement = document.getElementById('sizeOfInputArea');

  var openSetting = function() {
    Glayer.showBox(settingBox);
    numberOfResultElement.value = incsearch.dispMax;
    numberOfResultElement.focus();
    sizeOfInputAreaElement.value = text.size;
  };

  var closeSetting = function() {
    Glayer.hideBox(settingBox);
    incsearch.input.focus();
  };

  setting.addEventListener('click', openSetting, false);

  numberOfResultElement.addEventListener(
    'keydown',
    function(event) {
      if (event.keyCode == 13) {
        settingSave.click();
      }
    },
    false);

  sizeOfInputAreaElement.addEventListener(
    'keydown',
    function(event) {
      if (event.keyCode == 13) {
        settingSave.click();
      }
    },
    false);

  settingSave.addEventListener(
    'click',
    function() {
      Glayer.hideBox(settingBox);
      incsearch.dispMax = parseInt(numberOfResultElement.value) || incsearch.dispMax;
      prefBranch.setIntPref('numberOfResults', incsearch.dispMax);
      incsearch.input.size = parseInt(sizeOfInputAreaElement.value) || incsearch.input.size;
      prefBranch.setIntPref('sizeOfInputArea', incsearch.input.size);

      incsearch.reset();
      incsearch.input.focus();
    },
    false);

  settingCancel.addEventListener('click', closeSetting, false);

  // help
  var helpBox = document.getElementById('helpBox');
  var helpClose = document.getElementById('helpClose');

  var openHelp = function() {
    Glayer.showBox(helpBox);
    helpClose.focus();
  };

  var closeHelp = function() {
    Glayer.hideBox(helpBox);
    incsearch.input.focus();
  };

  var hideMsgBox = function() {
    helpBox.style.display = 'none';
    settingBox.style.display = 'none';
    loadingBox.style.display = 'none';

    var confirmBox = document.getElementById('glayer_confirm');
    if (confirmBox) {
      confirmBox.style.display = 'none';
    }
    var alertBox = document.getElementById('glayer_alert');
    if (alertBox) {
      alertBox.style.display = 'none';
    }
  }

  help.addEventListener('click', openHelp, false);
  helpClose.addEventListener('click', closeHelp, false);

  // shortcut
  document.addEventListener(
    'keydown',
    function(event) {
      if (event.ctrlKey) {
        switch(event.keyCode) {
          case 85:  // u (Sync)
            hideMsgBox();
            update();
            IncSearch._stopEvent(event);
            break;
          case 83:  // s (Setting)
            if (settingBox.style.display == '') {
              closeSetting();
            } else {
              hideMsgBox();
              openSetting();
            }
            IncSearch._stopEvent(event);
            break;
          case 191:  // / (Help)
            if (helpBox.style.display == '') {
              closeHelp();
            } else {
              hideMsgBox();
              openHelp();
            }
            IncSearch._stopEvent(event);
            break;
          default:
            break;
        }
      }
    },
    false);


  if (!userId) update();

}, false);

window.addEventListener('unload', function(){
if (database.connection.transactionInProgress) database.connection.rollbackTransaction();
}, false);


(function() {
  function getContents(aURL){
    var ioService = Components.classes["@mozilla.org/network/io-service;1"]
                      .getService(Components.interfaces.nsIIOService);
    var scriptableStream = Components.classes["@mozilla.org/scriptableinputstream;1"]
                             .getService(Components.interfaces.nsIScriptableInputStream);

    var channel = ioService.newChannel(aURL, null, null);
    var input = channel.open();
    scriptableStream.init(input);
    var str = scriptableStream.read(input.available());
    scriptableStream.close();
    input.close();
    return str;
  }

  var ios = Components.classes["@mozilla.org/network/io-service;1"]
                    .getService(Components.interfaces.nsIIOService);
  var fileHandler = ios.getProtocolHandler("file")
                     .QueryInterface(Components.interfaces.nsIFileProtocolHandler);

  // user extension javascript
  var userExtJs = Components.classes["@mozilla.org/file/directory_service;1"]
                     .getService(Components.interfaces.nsIProperties)
                     .get("ProfD", Components.interfaces.nsIFile);

  userExtJs.append(EXTENSION_NAME);
  userExtJs.append(USER_EXT_JS);

  if (!userExtJs.exists()) {
    var foStream = Components.classes["@mozilla.org/network/file-output-stream;1"]
                         .createInstance(Components.interfaces.nsIFileOutputStream);

    foStream.init(userExtJs, 0x02 | 0x08 | 0x20, 0664, 0); // write, create, truncate

    var sample = getContents("chrome://" + EXTENSION_NAME + "/content/" + USER_EXT_JS_SAMPLE);
    foStream.write(sample, sample.length);
    foStream.close();
  }

  var userExtJsURL = fileHandler.getURLSpecFromFile(userExtJs);

  document.write('<script type="text/javascript" src="'+ userExtJsURL +'"><\/script>');

  // user stylesheet
  var userCss = Components.classes["@mozilla.org/file/directory_service;1"]
                     .getService(Components.interfaces.nsIProperties)
                     .get("ProfD", Components.interfaces.nsIFile);

  userCss.append(EXTENSION_NAME);
  userCss.append(USER_CSS);

  if (!userCss.exists()) {
    var foStream = Components.classes["@mozilla.org/network/file-output-stream;1"]
                         .createInstance(Components.interfaces.nsIFileOutputStream);

    foStream.init(userCss, 0x02 | 0x08 | 0x20, 0664, 0); // write, create, truncate

    var sample = getContents("chrome://" + EXTENSION_NAME + "/content/" + USER_CSS_SAMPLE);
    foStream.write(sample, sample.length);
    foStream.close();
  }

  var userCssURL = fileHandler.getURLSpecFromFile(userCss);

  document.write('<link rel="stylesheet" href="' + userCssURL + '" type="text/css" />');
})();
