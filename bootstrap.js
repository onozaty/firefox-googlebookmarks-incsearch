const Cc = Components.classes;
const Ci = Components.interfaces;

var WindowWatcher  = Cc["@mozilla.org/embedcomp/window-watcher;1"].getService(Ci.nsIWindowWatcher);
var WindowMediator = Cc["@mozilla.org/appshell/window-mediator;1"].getService(Ci.nsIWindowMediator);
var PromptService  = Cc["@mozilla.org/embedcomp/prompt-service;1"].getService(Ci.nsIPromptService);
var PrefService  = Cc["@mozilla.org/preferences-service;1"].getService(Ci.nsIPrefService);

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

  initializeToolbar(aWindow);

  if (aWindow.document.readyState == "complete") {
    resetToolbar(aWindow);
  }

  initializeShortcutKey(aWindow);
  initializeMenu(aWindow);
}

function finalizeWindow(aWindow) {

  removeElement(aWindow, TOOLBAR_BUTTON_ELEMENT_ID);
  removeElement(aWindow, SHORTCUT_KEY_ELEMENT_ID);
  removeElement(aWindow, MENU_ITEM_ELEMENT_ID);
}

function removeElement(aWindow, id) {

  var element = aWindow.document.getElementById(id);
  if (element != null) { 
    element.parentNode.removeChild(element);
  }
}


// toolbar
const TOOLBAR_BUTTON_ELEMENT_ID = "googleBookmarksIncsearchButton";

function initializeToolbar(aWindow) {

  var palette = aWindow.document.getElementById("BrowserToolbarPalette")
                || aWindow.document.getElementById("navigator-toolbox").palette;

  var toolbarbutton = aWindow.document.createElement("toolbarbutton");

  toolbarbutton.setAttribute("id", TOOLBAR_BUTTON_ELEMENT_ID);
  toolbarbutton.setAttribute("label", "Google Bookmarks IncSearch");
  toolbarbutton.setAttribute("tooltiptext", "Google Bookmarks IncSearch");
  toolbarbutton.setAttribute("image", "chrome://googlebookmarks_incsearch/skin/icon-small.png");

  toolbarbutton.addEventListener("command", function() {
    openIncSearch(aWindow);
  }, false);

  palette.appendChild(toolbarbutton);
}

function resetToolbar(aWindow) {

  var navigatorToolbox = aWindow.document.getElementById("navigator-toolbox");
  var toolbars = Array.prototype.slice.call(aWindow.document.getElementsByTagName("toolbar"));

  toolbars.forEach(function (toolbar) {
     if (toolbar.toolbox !== navigatorToolbox) {
       return;
     }

     var curset = toolbar.getAttribute("currentset");
     toolbar.currentSet = curset;
  });
}

// shortcut key
const SHORTCUT_KEY_ELEMENT_ID = "googleBookmarksIncsearchShortcutKey"

function initializeShortcutKey(aWindow) {

  var prefBranch = PrefService.getBranch("extensions.googlebookmarks_incsearch.");

  var modifiers = "accel";
  try {
     modifiers = prefBranch.getCharPref("shortcut.open.modifiers");
  } catch(e) {}

  var key = ":"
  try {
    key = prefBranch.getCharPref("shortcut.open.key");
  } catch(e) {}

  var isDisabledShortcutKey = false;
  try {
    isDisabledShortcutKey = prefBranch.getBoolPref("shortcut.open.disabled");
  } catch(e) {}

  if (!isDisabledShortcutKey) {

    var mainKeyset = aWindow.document.getElementById("mainKeyset");
    var keyElement = aWindow.document.createElement("key");

    keyElement.setAttribute("id", SHORTCUT_KEY_ELEMENT_ID);
    keyElement.setAttribute("key", key);
    keyElement.setAttribute("modifiers", modifiers);
    keyElement.setAttribute("oncommand", "void(0);");

    keyElement.addEventListener("command", function() {
      openIncSearch(aWindow);
    }, false);

    mainKeyset.appendChild(keyElement);
  }
}

// menu
const MENU_ITEM_ELEMENT_ID = "googleBookmarksIncsearchMenuitem"

function initializeMenu(aWindow) {

  var menu = aWindow.document.getElementById("menu_ToolsPopup");

  var menuitem = aWindow.document.createElement("menuitem");

  menuitem.setAttribute("id", MENU_ITEM_ELEMENT_ID);
  menuitem.setAttribute("label", "Google Bookmarks IncSearch");
  menuitem.setAttribute("insertbefore", "sanitizeSeparator");
  menuitem.setAttribute("key", SHORTCUT_KEY_ELEMENT_ID);

  menuitem.addEventListener("command", function() {
    openIncSearch(aWindow);
  }, false);

  menu.appendChild(menuitem);
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
