const Cc = Components.classes;
const Ci = Components.interfaces;
var WindowWatcher  = Cc["@mozilla.org/embedcomp/window-watcher;1"].getService(Ci.nsIWindowWatcher);
var WindowMediator = Cc["@mozilla.org/appshell/window-mediator;1"].getService(Ci.nsIWindowMediator);
var PromptService  = Cc["@mozilla.org/embedcomp/prompt-service;1"].getService(Ci.nsIPromptService);

var windowObserver = {
  observe: function (aSubject, aTopic, aData) {

    var win = aSubject.QueryInterface(Components.interfaces.nsIDOMWindow);

    if (aTopic === "domwindowopened") {

      win.addEventListener("DOMContentLoaded", function() {
        win.removeEventListener("DOMContentLoaded", arguments.callee, false);

        if (win.location.href == "chrome://browser/content/browser.xul") {
          initializeWindow(win);
        }
      }, false);
    }
  }
};

function initializeWindow(aWindow) {

  var paletteElem = aWindow.document.getElementById("BrowserToolbarPalette")
                    || aWindow.document.getElementById("navigator-toolbox").palette;

  // Create toolbar item
  var NS = "http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul";
  var toolbarbutton = aWindow.document.createElementNS(NS, "toolbarbutton");

  toolbarbutton.setAttribute("id", "googleBookmarksIncsearchButton");
  toolbarbutton.setAttribute("label", "Google Bookmarks IncSearch");
  toolbarbutton.setAttribute("tooltiptext", "Google Bookmarks IncSearch");
  toolbarbutton.setAttribute("image", "chrome://googlebookmarks_incsearch/skin/icon-small.png");

  toolbarbutton.addEventListener('command', function() {
    openIncSearch(aWindow);
  }, false);

  paletteElem.appendChild(toolbarbutton);
}

function openIncSearch(aWindow) {
  var gBrowser = aWindow.gBrowser;

  var openUrl = 'chrome://googlebookmarks_incsearch/content/view.html';
  var target = null;

  var tabs = gBrowser.tabContainer.childNodes;

  for (var i = 0, len = tabs.length; i < len; i++) {
    if (tabs[i].linkedBrowser.currentURI.spec == openUrl) {
      target = tabs[i];
      break;
    }
  }

  if (!target) {
    gBrowser.selectedTab = gBrowser.addTab(openUrl);
  } else {
    gBrowser.selectedTab = target;
    target.linkedBrowser.contentDocument.getElementById('text').focus();
  }
}


function finalizeWindow(aWindow) {

  var toolbarbutton = aWindow.document.getElementById("googleBookmarksIncsearchButton")

  //PromptService.alert(null, "toolbarbutton", toolbarbutton);

  toolbarbutton.parentNode.removeChild(toolbarbutton);
}


function startup(aData, aReason) {

  var browserWindows = WindowMediator.getEnumerator("navigator:browser");
  while (browserWindows.hasMoreElements()) {
    let win = browserWindows.getNext().QueryInterface(Ci.nsIDOMWindow);
    initializeWindow(win);
  }

  WindowWatcher.registerNotification(windowObserver);
}

function shutdown(aData, aReason) {

  var browserWindows = WindowMediator.getEnumerator("navigator:browser");
  while (browserWindows.hasMoreElements()) {
    let win = browserWindows.getNext().QueryInterface(Ci.nsIDOMWindow);
    finalizeWindow(win);
  }

  WindowWatcher.unregisterNotification(windowObserver);
  windowObserver = null;
  WindowWatcher = null;
}

function install(aData, aReason) {}
function uninstall(aData, aReason) {}
