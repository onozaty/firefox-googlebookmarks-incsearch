/*
ebi.js v1.0
https://github.com/onozaty/ebi.js

Copyright (c) 2012 onozaty (http://www.enjoyxstudy.com)
Released under an MIT-style license.
*/

var Ebi = (function() {

  // Element class
  var Element = function() {
    this.initialize.apply(this, arguments);
  };

  Element.prototype = {

    clazz: Element,
    parent: null,

    initialize: function(target) {

      if (!target) return; // in extend Element

      if (typeof target === 'string') {
        if (target[0] === '#') {
          // element id
          this.target = document.getElementById(target.substr(1));
        } else {
          // tag name
          this.target = document.createElement(target);
        }
      } else {
        // element object
        this.target = target
      }
    },

    append: function(value) {

      if (typeof value === 'string') {

        this.target.appendChild(
                      document.createTextNode(value));

      } else if (value instanceof Element) {

        this.target.appendChild(value.target);
        value.parent = this;

      } else if (value instanceof Array) {

        for (var i = 0, length = value.length; i < length; i++) {
          this.append(value[i]);
        }

      } else {

        // element
        this.target.appendChild(value);
      }

      return this;
    },

    clear: function() {

      // clear all child element.
      while (this.target.firstChild) {
        this.target.removeChild(this.target.firstChild);
      }

      return this;
    },

    property: function(value1, value2) {

      if (value2 != undefined) {

        // one property
        this.target[value1] = value2;

      } else {

        // properties object
        for (var property in value1) {
          this.target[property] = value1[property];
        }
      }

      return this;
    },

    style: function(value1, value2) {

      if (value2 != undefined) {

        // one property
        this.target.style[value1] = value2;

      } else {

        // properties object
        for (var property in value1) {
          this.target.style[property] = value1[property];
        }
      }

      return this;
    },

    event: function(type, func) {

      addEvent(this.target, type, func);

      return this;
    },

    start: function(target) {

      var startElement = new this.clazz(target);

      // append DOM tree at "end" method call.
      startElement.parent = this;

      return startElement;
    },

    end: function() {
      if (this.parent.target == null) {
        // parent is empty element
        return null;
      }

      return this.parent.append(this);
    }

  };

  // private
  var createTagFunction = function(tag) {
    return function() {
      return this.start(tag);
    }
  };

  var addEvent = (window.addEventListener ?
    function(element, type, func) {
      element.addEventListener(type, func, false);
    } :
    function(element, type, func) {
      element.attachEvent('on' + type, func);
    });

  // public
  return {
    createBuilder: function(tags) {

      var elementClass = Element;

      if (tags) {
        // extend Element class, add tag method.
        elementClass = function() {
          this.initialize.apply(this, arguments);
        };

        elementClass.prototype = new Element();
        elementClass.prototype.clazz = elementClass;

        for (var i = 0, length = tags.length; i < length; i++) {
          elementClass.prototype[tags[i]] = createTagFunction(tags[i]);
        }

        /* Firefox only
        elementClass.__noSuchMethod__ = function(id, args) {
          return start(id, args[0]);
        }
        */
      }

      var emptyElement = new elementClass();

      return function(target) {
        if (target) {
          return new elementClass(target);
        } else {
          return emptyElement;
        }
      };
    },

    createElement: function(target, tags) {
      return this.createBuilder(tags)(target);
    }
  };

}());
