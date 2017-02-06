(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('hexagon-js')) :
	typeof define === 'function' && define.amd ? define(['exports', 'hexagon-js'], factory) :
	(factory((global.rx = global.rx || {}),global.window.hx));
}(this, (function (exports,hx) { 'use strict';

hx = 'default' in hx ? hx['default'] : hx;

function isFunction (x) {
  return typeof x === "function";
}

var alphabet = 'ABCEDEF0123456789'.split('');
var alphabetSize = alphabet.length;
function randomId () {
  var res = '';
  for (var i = 0; i < 32; i++) {
    res += alphabet[Math.floor(Math.random() * alphabetSize)];
  }
  return res
}

var EventEmitter = function EventEmitter () {
  this.listeners = new Map;
};

EventEmitter.prototype.emit = function emit (name, evt) {
  var listeners = this.listeners.get(name);
  if (listeners) {
    listeners.forEach(function (listener) { return listener(evt); });
  }
  return this
};

EventEmitter.prototype.on = function on (name, f) {
  var listeners = this.listeners.get(name) || new Set;
  this.listeners.set(name, listeners);
  listeners.add(f);
  return this
};

EventEmitter.prototype.off = function off (name, f) {
  var listeners = this.listeners.get(name);
  if(listeners) {
    listeners.delete(f);
  }
  return this
};

function isPrimitiveType (x) {
  return x === Number ||
    x === Boolean ||
    x === String
}

function defaultForPrimitiveType (Type) {
  if (Type === Boolean) { return false }
  if (Type === Number) { return 0 }
  if (Type === String) { return '' }
}

function typeFactory (Type) {
  return isPrimitiveType(Type) ?
    function (x) { return x !== undefined ? x : defaultForPrimitiveType(Type); } :
    function (x) { return x !== undefined ? new Type(x) : new Type(); }
}

var Observable = (function (EventEmitter$$1) {
  function Observable () {
    EventEmitter$$1.apply(this, arguments);
  }if ( EventEmitter$$1 ) Observable.__proto__ = EventEmitter$$1;
  Observable.prototype = Object.create( EventEmitter$$1 && EventEmitter$$1.prototype );
  Observable.prototype.constructor = Observable;

  

  return Observable;
}(EventEmitter));
var Value = (function (Observable) {
  function Value () {
    Observable.apply(this, arguments);
  }if ( Observable ) Value.__proto__ = Observable;
  Value.prototype = Object.create( Observable && Observable.prototype );
  Value.prototype.constructor = Value;

  

  return Value;
}(Observable));
var Collection = (function (Observable) {
  function Collection () {
    Observable.apply(this, arguments);
  }if ( Observable ) Collection.__proto__ = Observable;
  Collection.prototype = Object.create( Observable && Observable.prototype );
  Collection.prototype.constructor = Collection;

  

  return Collection;
}(Observable));

function constant (Type, options) {
  if ( options === void 0 ) options = {};

  var defaultValue = isFunction(options.default) ? options.default : function () { return options.default; };
  var serializable = options.serializable !== false;
  var create = typeFactory(Type);

  return (function (Value) {
    function Constant (value) {
      Value.call(this);
      this.value = create(value !== undefined ? value : defaultValue());
      this.serializable = serializable;
    }

    if ( Value ) Constant.__proto__ = Value;
    Constant.prototype = Object.create( Value && Value.prototype );
    Constant.prototype.constructor = Constant;

    Constant.prototype.get = function get () {
      return this.value
    };

    Constant.prototype.set = function set (value) {
      throw new Error('Constant cannot be changed')
    };

    Constant.prototype.serialize = function serialize () {
      if (serializable) {
        return this.value
      } else {
        throw new Error('This object is not serializable')
      }
    };

    return Constant;
  }(Value))
}

function mutable (Type, options) {
  if ( options === void 0 ) options = {};

  var defaultValue = isFunction(options.default) ? options.default : function () { return options.default; };
  var serializable = options.serializable !== false;
  var create = typeFactory(Type);

  return (function (Value) {
    function Mutable (value) {
      Value.call(this);
      this.value = create(value !== undefined ? value : defaultValue());
      this.serializable = serializable;
    }

    if ( Value ) Mutable.__proto__ = Value;
    Mutable.prototype = Object.create( Value && Value.prototype );
    Mutable.prototype.constructor = Mutable;

    Mutable.prototype.get = function get () {
      return this.value
    };

    Mutable.prototype.set = function set (value) {
      if (this.value !== value) {
        this.value = value;
        this.emit('change', value);
        if (serializable) { this.emit('serializable-change', value); }
      }
    };

    Mutable.prototype.serialize = function serialize () {
      if (serializable) {
        return this.value
      } else {
        throw new Error('This object is not serializable')
      }
    };

    return Mutable;
  }(Value))
}

function constantCollection (Type, options) {
  if ( options === void 0 ) options = {};

  if (!(Type.prototype instanceof RXObject)) {
    throw new Error('Type must be an instance of RXObject - eg created via object()')
  }

  var defaultValue = isFunction(options.default) ? options.default : function () { return options.default; };
  var serializable = options.serializable !== false;

  return (function (Collection) {
    function ConstantCollection (values) {
      var this$1 = this;

      Collection.call(this);
      var initialValue = values || defaultValue() || [];
      this.values = initialValue.map(function (v) { return new Type(v); });
      this.map = new Map();
      this.values.forEach(function (v) {
        this$1.map.set(v.id, v);
      });
      this.serializable = serializable;
    }

    if ( Collection ) ConstantCollection.__proto__ = Collection;
    ConstantCollection.prototype = Object.create( Collection && Collection.prototype );
    ConstantCollection.prototype.constructor = ConstantCollection;

    ConstantCollection.prototype.get = function get (id) {
      if (arguments.length > 0) {
        return this.map.get(id)
      } else {
        return this.values
      }
    };

    ConstantCollection.prototype.set = function set () {
      throw new Error('A constant collection cannot be changed to')
    };

    ConstantCollection.prototype.add = function add (obj) {
      throw new Error('A constant collection cannot be changed to')
    };

    ConstantCollection.prototype.remove = function remove (obj) {
      throw new Error('A constant collection cannot be changed from')
    };

    ConstantCollection.prototype.serialize = function serialize () {
      if (serializable) {
        return this.values.map(function (v) { return v.serialize(); })
      } else {
        throw new Error('This object is not serializable')
      }
    };

    return ConstantCollection;
  }(Collection))
}

function mutableCollection (Type, options) {
  if ( options === void 0 ) options = {};

  if (!(Type.prototype instanceof RXObject)) {
    throw new Error('Type must be an instance of RXObject - eg created via object()')
  }

  var defaultValue = isFunction(options.default) ? options.default : function () { return options.default; };
  var serializable = options.serializable !== false;

  return (function (Collection) {
    function MutableCollection (values) {
      var this$1 = this;

      Collection.call(this);
      this.map = new Map();
      this.listeners = new Map();
      this.serializableListeners = new Map();
      var initialValue = values || defaultValue() || [];
      initialValue.forEach(function (v) {
        var t = new Type(v);
        var changeListener = function (evt) {
          this$1.emit('item-change', evt);
          this$1.emit('change', this$1);
        };
        t.on('change', changeListener);
        this$1.map.set(t.id, t);
        this$1.listeners.set(t.id, changeListener);

        if (serializable) {
          var serializableChangeListener = function (evt) {
            this$1.emit('item-serializable-change', evt);
            this$1.emit('serializable-change', this$1);
          };
          this$1.serializableListeners.set(t.id, serializableChangeListener);
          t.on('serializable-change', serializableChangeListener);
        }
      });
      this.serializable = serializable;
    }

    if ( Collection ) MutableCollection.__proto__ = Collection;
    MutableCollection.prototype = Object.create( Collection && Collection.prototype );
    MutableCollection.prototype.constructor = MutableCollection;

    MutableCollection.prototype.set = function set (values) {
      var this$1 = this;

      if (!Array.isArray(values)) {
        throw new Error('The value passed into MutableCollection::set() should be an array')
      }

      if (values.some(function (x) { return !(x instanceof Type); })) {
        throw new Error('One or more of the values passed to MutableCollection::set() does not have the expected type ' + Type)
      }

      var oldValue = this.get();
      oldValue.forEach(function (obj) { return this$1.listeners.delete(obj.id); });
      this.map = new Map();
      values.forEach(function (v) {
        var changeListener = function (evt) {
          this$1.emit('item-change', evt);
          this$1.emit('change', this$1);
        };
        v.on('change', changeListener);
        this$1.map.set(v.id, v);
        this$1.listeners.set(v.id, changeListener);

        if (serializable) {
          var serializableChangeListener = function (evt) {
            this$1.emit('item-serializable-change', evt);
            this$1.emit('serializable-change', this$1);
          };
          this$1.serializableListeners.set(v.id, serializableChangeListener);
          v.on('serializable-change', serializableChangeListener);
        }
      });
      this.emit('set', this);
      this.emit('change', this);

      if (serializable) {
        this.emit('serializable-change', this);
      }
    };

    MutableCollection.prototype.get = function get (id) {
      if (arguments.length > 0) {
        return this.map.get(id)
      } else {
        return Array.from(this.map.values())
      }
    };

    MutableCollection.prototype.add = function add (value) {
      var this$1 = this;

      var newValue = value !== undefined ? value : new Type();

      if (newValue instanceof Type) {
        if (!this.map.has(newValue.id)) {
          var changeListener = function (evt) {
            this$1.emit('item-change', evt);
            this$1.emit('change', this$1);
          };
          newValue.on('change', changeListener);
          this.map.set(newValue.id, newValue);
          this.listeners.set(newValue.id, changeListener);
          this.emit('item-add', newValue);
          this.emit('change', this);

          if (serializable) {
            var serializableChangeListener = function (evt) {
              this$1.emit('item-serializable-change', evt);
              this$1.emit('serializable-change', this$1);
            };
            this.serializableListeners.set(newValue.id, serializableChangeListener);
            newValue.on('serializable-change', serializableChangeListener);
            this.emit('serializable-change', this);
          }
        }
      } else {
        throw new Error('The object passed to MutableCollection::add() does not have the expected type ' + Type)
      }
    };

    MutableCollection.prototype.remove = function remove (value) {
      if (value instanceof Type) {
        if (this.map.has(value.id)) {
          var oldValue = this.map.get(value.id);
          oldValue.off('change', this.listeners.get(value.id));
          this.map.delete(value.id);
          this.listeners.delete(value.id);
          this.emit('item-remove', value);
          this.emit('change', this);

          if (serializable) {
            oldValue.off('serializable-change', this.serializableListeners.get(value.id));
            this.emit('serializable-change', this);
          }

          oldValue;
        }
      } else {
        throw new Error('The object passed to MutableCollection::add() does not have the expected type ' + Type)
      }
    };

    MutableCollection.prototype.serialize = function serialize () {
      if (serializable) {
        return this.get().map(function (v) { return v.serialize(); })
      } else {
        throw new Error('This object is not serializable')
      }
    };

    return MutableCollection;
  }(Collection))
}

var reservedKeys = [
  'toString',
  'id',
  'get',
  'set',
  'emit',
  'on',
  'off',
  'serialize'
];

var RXObject = (function (Observable) {
  function RXObject () {
    Observable.apply(this, arguments);
  }if ( Observable ) RXObject.__proto__ = Observable;
  RXObject.prototype = Object.create( Observable && Observable.prototype );
  RXObject.prototype.constructor = RXObject;

  

  return RXObject;
}(Observable));

function object (obj, options) {
  if ( options === void 0 ) options = {};


  var serializable = options.serializable !== false;
  var keys = Object.keys(obj);

  keys.forEach(function (k) {
    if (reservedKeys.indexOf(k) > -1) {
      throw new Error(k + 'is a reserved key and cannot be used')
    }
  });

  return (function (RXObject) {
    function Obj (value) {
      var this$1 = this;
      if ( value === void 0 ) value = {};

      RXObject.call(this);
      this.id = value.id !== undefined ? value.id : randomId();
      keys.forEach(function (k) {
        var Type = isFunction(obj[k]) && !(obj[k].prototype instanceof Observable) ? obj[k]() : obj[k];
        if (k in value) {
          this$1[k] = new Type(value[k]);
        } else {
          this$1[k] = new Type();
        }
        this$1[k].on('change', function () {
          this$1.emit('change', this$1);
        });

        if (serializable) {
          this$1[k].on('serializable-change', function () {
            this$1.emit('serializable-change', this$1);
          });
        }
      });
    }

    if ( RXObject ) Obj.__proto__ = RXObject;
    Obj.prototype = Object.create( RXObject && RXObject.prototype );
    Obj.prototype.constructor = Obj;

    Obj.prototype.serialize = function serialize () {
      var this$1 = this;

      if (serializable) {
        var res = {
          id: this.id
        };
        keys.forEach(function (k) {
          if (this$1[k].serializable !== false) {
            res[k] = this$1[k].serialize();
          }
        });
        return res
      } else {
        throw new Error('This object is not serializable')
      }
    };

    return Obj;
  }(RXObject))
}

Value.prototype.div = function (cls) {
  var selection = hx.div(cls).text(this.get());
  this.on('change', function (evt) { return selection.text(evt); });
  return selection
};

Value.prototype.span = function (cls) {
  var selection = hx.span(cls).text(this.get());
  this.on('change', function (evt) { return selection.text(evt); });
  return selection
};

Value.prototype.input = function (cls) {
  var this$1 = this;

  var selection = hx.detached('input').class(cls).value(this.get());
  selection.on('blur', function (evt) { return this$1.set(selection.value()); });
  this.on('change', function (evt) { return selection.text(evt); });
  return selection
};

Collection.prototype.div = function (cls, component) {
  var selection = hx.div(cls);
  var components = new Map();

  function add (obj) {
    var comp = component(obj, this);
    components.set(obj.id, comp);
    selection.add(comp);
  }

  function remove (obj) {
    if (components.has(obj.id)) {
      components.get(obj.id).remove();
      components.delete(obj.id);
    }
  }

  function set (collection) {
    components.clear();
    selection.clear();
    collection.get().forEach(add);
  }

  this
    .on('item-add', add)
    .on('item-remove', remove)
    .on('set', set);

  set(this);

  return selection
};

exports.constant = constant;
exports.mutable = mutable;
exports.constantCollection = constantCollection;
exports.mutableCollection = mutableCollection;
exports.object = object;

Object.defineProperty(exports, '__esModule', { value: true });

})));
