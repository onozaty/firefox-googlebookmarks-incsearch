var Ebi = {};

Ebi.createBuilder = function(tags) {

  var builder = function(target, properties) {
    return new Ebi.Element(target, properties);
  }

  if (tags) {
    for (var i = 0, length = tags.length; i < length; i++) {
      builder[tags[i]] = Ebi.createTagFunction(tags[i]);
    }
  }

  /* Firefox only
  builder.__noSuchMethod__ = function(id, args) {
    return new Ebi.Element(id, args[0]);
  }
  */

  return builder;
};

Ebi.createTagFunction = function(tag) {
  return function(properties) {
    return new Ebi.Element(tag, properties);
  }
};


Ebi.Element = function(target, properties) {

  if (typeof target == 'string') {
    if (target[0] == '#') {
      this.target = document.getElementById(target.substr(1));
    } else {
      this.target = document.createElement(target);
    }
  } else {
    this.target = target
  }

  if (properties) {
    for (var property in properties) {
      this.target[property] = properties[property];
    }
  }
};

Ebi.Element.prototype = {

  append: function(value) {

    if (typeof value == 'string') {
      value = document.createTextNode(value);
    } else if (value instanceof Ebi.Element) {
      value = value.target;
    }

    this.target.appendChild(value);

    return this;
  },

  clear: function() {

    while(this.target.firstChild){
      this.target.removeChild(this.target.firstChild);
    }

    return this;
  }
};

