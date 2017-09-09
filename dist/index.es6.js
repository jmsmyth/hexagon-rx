import hx from 'hexagon-js';

function isFunction (x) {
  return typeof x === "function";
}

const alphabet = 'ABCEDEF0123456789'.split('');
const alphabetSize = alphabet.length;
function randomId () {
  let res = '';
  for (let i = 0; i < 32; i++) {
    res += alphabet[Math.floor(Math.random() * alphabetSize)];
  }
  return res
}

class EventEmitter {
  constructor () {
    this.listeners = new Map;
  }

  emit (name, evt, meta) {
    const listeners = this.listeners.get(name);
    if (listeners) {
      listeners.forEach(listener => listener(evt, meta));
    }
    return this
  }

  on (name, f) {
    const listeners = this.listeners.get(name) || new Set;
    this.listeners.set(name, listeners);
    listeners.add(f);
    return this
  }

  off (name, f) {
    const listeners = this.listeners.get(name);
    if(listeners) {
      listeners.delete(f);
    }
    return this
  }
}

function isPrimitiveType (x) {
  return x === Number ||
    x === Boolean ||
    x === String
}

function defaultForPrimitiveType (Type) {
  if (Type === Boolean) return false
  if (Type === Number) return 0
  if (Type === String) return ''
}

function typeFactory (Type) {
  return isPrimitiveType(Type) ?
    (x) => x !== undefined ? x : defaultForPrimitiveType(Type) :
    (x) => x !== undefined ? new Type(x) : new Type()
}

class Observable extends EventEmitter {}
class Value extends Observable {
  map (f) {
    if (f instanceof Value) {
      throw new Error('Mapping over Values is not yet supported')
    } else if (isFunction(f)) {
      return new MappedValue(this, f)
    } else {
      throw new Error('The argument passed to Value::map(f) should be a function or a Value which contains a function')
    }
  }
}
class Collection extends Observable {
  map (f) {
    if (f instanceof Value) {
      throw new Error('Mapping over Values is not yet supported')
    } else if (isFunction(f)) {
      // mapping over a collection turns it into a value
      return new MappedValue(this, f)
    } else {
      throw new Error('The argument passed to Value::map(f) should be a function or a Value which contains a function')
    }
  }
}

class MappedValue extends Value {
  constructor (originalValue, f) {
    super();
    this.originalValue = originalValue;
    this.f = f;
    this.originalValue.on('change', (value, meta) => {
      this.emit('change', this.f(value), meta);
    });
    this.originalValue.on('serializable-change', (value, meta) => {
      this.emit('serializable-change', this.f(value), meta);
    });
  }

  get () {
    return this.f(this.originalValue.get())
  }

  set () {
    throw new Error('A MappedValue cannot be assigned to')
  }

  serialize () {
    return this.f(this.originalValue.serialize())
  }
}

function constant (Type, options = {}) {
  const defaultValue = isFunction(options.default) ? options.default : () => options.default;
  const serializable = options.serializable !== false;
  const create = typeFactory(Type);

  return class Constant extends Value {
    constructor (value) {
      super();
      this.value = create(value !== undefined ? value : defaultValue());
      this.serializable = serializable;
    }

    get () {
      return this.value
    }

    set (value) {
      throw new Error('Constant cannot be changed')
    }

    serialize () {
      if (serializable) {
        return this.value
      } else {
        throw new Error('This object is not serializable')
      }
    }
  }
}

function mutable (Type, options = {}) {
  const defaultValue = isFunction(options.default) ? options.default : () => options.default;
  const serializable = options.serializable !== false;
  const create = typeFactory(Type);

  return class Mutable extends Value {
    constructor (value) {
      super();
      this.value = create(value !== undefined ? value : defaultValue());
      this.serializable = serializable;
    }

    get () {
      return this.value
    }

    set (value, eventMeta) {
      if (this.value !== value) {
        this.value = value;
        this.emit('change', value, eventMeta);
        if (serializable) this.emit('serializable-change', value, eventMeta);
      }
    }

    serialize () {
      if (serializable) {
        return this.value
      } else {
        throw new Error('This object is not serializable')
      }
    }
  }
}

function constantCollection (Type, options = {}) {
  if (!(Type.prototype instanceof RXObject)) {
    throw new Error('Type must be an instance of RXObject - eg created via object()')
  }

  const defaultValue = isFunction(options.default) ? options.default : () => options.default;
  const serializable = options.serializable !== false;

  return class ConstantCollection extends Collection {
    constructor (values) {
      super();
      const initialValue = values || defaultValue() || [];
      this.values = initialValue.map(v => new Type(v));
      this.valuesMap = new Map();
      this.values.forEach(v => {
        this.valuesMap.set(v.id, v);
      });
      this.serializable = serializable;
    }

    get (id) {
      if (arguments.length > 0) {
        return this.valuesMap.get(id)
      } else {
        return this.values
      }
    }

    set () {
      throw new Error('A constant collection cannot be modified')
    }

    add (obj) {
      throw new Error('A constant collection cannot be modified')
    }

    remove (obj) {
      throw new Error('A constant collection cannot be modified')
    }

    serialize () {
      if (serializable) {
        return this.values.map(v => v.serialize())
      } else {
        throw new Error('This object is not serializable')
      }
    }
  }
}

function mutableCollection (Type, options = {}) {
  if (!(Type.prototype instanceof RXObject)) {
    throw new Error('Type must be an instance of RXObject - eg created via object()')
  }

  const defaultValue = isFunction(options.default) ? options.default : () => options.default;
  const serializable = options.serializable !== false;

  return class MutableCollection extends Collection {
    constructor (values) {
      super();
      this.valuesMap = new Map();
      this.listeners = new Map();
      this.serializableListeners = new Map();
      const initialValue = values || defaultValue() || [];
      initialValue.forEach(v => {
        const t = new Type(v);
        const changeListener = (evt, eventMeta) => {
          this.emit('item-change', evt, eventMeta);
          this.emit('change', this.get(), eventMeta);
        };
        t.on('change', changeListener);
        this.valuesMap.set(t.id, t);
        this.listeners.set(t.id, changeListener);

        const serializableChangeListener = (evt, eventMeta) => {
          this.emit('item-serializable-change', evt, eventMeta);
          if (serializable) {
            this.emit('serializable-change', this, eventMeta);
          }
        };
        this.serializableListeners.set(t.id, serializableChangeListener);
        t.on('serializable-change', serializableChangeListener);
      });
      this.serializable = serializable;
    }

    set (values, eventMeta) {
      if (!Array.isArray(values)) {
        throw new Error('The value passed into MutableCollection::set() should be an array')
      }

      if (values.some(x => !(x instanceof Type))) {
        throw new Error('One or more of the values passed to MutableCollection::set() does not have the expected type ' + Type)
      }

      const oldValue = this.get();
      oldValue.forEach(obj => this.listeners.delete(obj.id));
      this.valuesMap = new Map();
      values.forEach(v => {
        const changeListener = (evt, eventMeta) => {
          this.emit('item-change', evt, eventMeta);
          this.emit('change', this.get(), eventMeta);
        };
        v.on('change', changeListener);
        this.valuesMap.set(v.id, v);
        this.listeners.set(v.id, changeListener);

        const serializableChangeListener = (evt, eventMeta) => {
          this.emit('item-serializable-change', evt, eventMeta);
          if (serializable) {
            this.emit('serializable-change', this, eventMeta);
          }
        };
        this.serializableListeners.set(v.id, serializableChangeListener);
        v.on('serializable-change', serializableChangeListener);
      });
      this.emit('set', this.get(), eventMeta);
      this.emit('change', this.get(), eventMeta);

      if (serializable) {
        this.emit('serializable-change', this.get(), eventMeta);
      }
    }

    get (id) {
      if (arguments.length > 0) {
        return this.valuesMap.get(id)
      } else {
        return Array.from(this.valuesMap.values())
      }
    }

    add (value, eventMeta) {
      const newValue = value !== undefined ? value : new Type();

      if (newValue instanceof Type) {
        if (!this.valuesMap.has(newValue.id)) {
          const changeListener = (evt, eventMeta) => {
            this.emit('item-change', evt, eventMeta);
            this.emit('change', this.get(), eventMeta);
          };
          newValue.on('change', changeListener);
          this.valuesMap.set(newValue.id, newValue);
          this.listeners.set(newValue.id, changeListener);
          this.emit('item-add', newValue, eventMeta);
          this.emit('change', this.get(), eventMeta);

          const serializableChangeListener = (evt, eventMeta) => {
            this.emit('item-serializable-change', evt, eventMeta);
            if (serializable) {
              this.emit('serializable-change', this, eventMeta);
            }
          };
          this.serializableListeners.set(newValue.id, serializableChangeListener);
          newValue.on('serializable-change', serializableChangeListener, eventMeta);
          this.emit('serializable-change', this, eventMeta);
        }
      } else {
        throw new Error('The object passed to MutableCollection::add() does not have the expected type ' + Type)
      }
    }

    remove (value, eventMeta) {
      if (value instanceof Type) {
        if (this.valuesMap.has(value.id)) {
          const oldValue = this.valuesMap.get(value.id);
          oldValue.off('change', this.listeners.get(value.id));
          this.valuesMap.delete(value.id);
          this.listeners.delete(value.id);
          this.emit('item-remove', value, eventMeta);
          this.emit('change', this.get(), eventMeta);

          oldValue.off('serializable-change', this.serializableListeners.get(value.id), eventMeta);

          if (serializable) {
            this.emit('serializable-change', this, eventMeta);
          }

          
        }
      } else {
        throw new Error('The object passed to MutableCollection::add() does not have the expected type ' + Type)
      }
    }

    serialize () {
      if (serializable) {
        return this.get().map(v => v.serialize())
      } else {
        throw new Error('This object is not serializable')
      }
    }
  }
}

const reservedKeys = [
  'toString',
  'id',
  'get',
  'set',
  'emit',
  'on',
  'off',
  'serialize'
];

class RXObject extends Observable {}

function object (obj, options = {}) {
  const serializable = options.serializable !== false;
  const keys = Object.keys(obj);

  keys.forEach(k => {
    if (reservedKeys.indexOf(k) > -1) {
      throw new Error(k + 'is a reserved key and cannot be used')
    }
  });

  return class Obj extends RXObject {
    constructor (value = {}) {
      super();
      this.id = value.id !== undefined ? value.id : randomId();
      keys.forEach(k => {
        const Type = isFunction(obj[k]) && !(obj[k].prototype instanceof Observable) ? obj[k]() : obj[k];
        if (k in value) {
          this[k] = new Type(value[k]);
        } else {
          this[k] = new Type();
        }
        this[k].on('change', (v, eventMeta) => {
          this.emit('change', this, eventMeta);
        });

        if (serializable) {
          this[k].on('serializable-change', (v, eventMeta) => {
            this.emit('serializable-change', this, eventMeta);
          });
        }
      });
    }

    serialize () {
      if (serializable) {
        const res = {
          id: this.id
        };
        keys.forEach(k => {
          if (this[k].serializable !== false) {
            res[k] = this[k].serialize();
          }
        });
        return res
      } else {
        throw new Error('This object is not serializable')
      }
    }
  }
}

function oneof (spec) {
  const names = Object.keys(spec);
  const objects = names.map(k => spec[k]);
  const types = new Set(names);
  const prototypeToName = new Map(names.map(name => [spec[name], name]));

  const nameToPrototype = {};
  names.forEach(name => {
    nameToPrototype[name] = spec[name];
  });

  if (objects.some(obj => !(obj.prototype instanceof RXObject))) {
    throw new Error("Non RXObject passed into oneof")
  }

  class OneOf extends RXObject {
    constructor (value) {
      super();

      if (objects.some(obj => value instanceof obj)) {
        this.value = value;
        this.type = prototypeToName.get(value.constructor);
      } else if (types.has(value.type)) {
        this.value = new (objects[value.type])[value.value];
        this.type = value.type;
      } else {
        throw new Error("Wrong type passed into OneOf object")
      }
    }

    serialize () {
      return {
        type: this.type,
        value: this.value.serialize()
      }
    }
  }

  OneOf.types = nameToPrototype;

  return OneOf
}

Value.prototype.div = function (cls) {
  const selection = hx.div(cls).text(this.get());
  this.on('change', (evt) => selection.text(evt));
  return selection
};

Value.prototype.span = function (cls) {
  const selection = hx.span(cls).text(this.get());
  this.on('change', (evt) => selection.text(evt));
  return selection
};

Value.prototype.input = function (cls) {
  const selection = hx.detached('input').class(cls).value(this.get());
  selection.on('blur', (evt) => this.set(selection.value()));
  this.on('change', (evt) => selection.text(evt));
  return selection
};

Collection.prototype.div = function (cls, component) {
  const selection = hx.div(cls);
  const components = new Map();

  function add (obj) {
    const comp = component(obj, this);
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

const originalClassed = hx.Selection.prototype.classed;
hx.Selection.prototype.classed = function (cls, include) {

  if (include instanceof Value) {
    const onChange = (inc) => {
      originalClassed.call(this, cls, inc);
    };

    this.nodes.forEach(node => {

      node.__hxrx__ = node.__hxrx__ || {};

      if (node.__hxrx__.classedValue && node.__hxrx__.classedChangeCallback) {
        node.__hxrx__.classedValue.off('change', node.__hxrx__.classedChangeCallback);
      }

      node.__hxrx__.classedValue = include;
      node.__hxrx__.classedChangeCallback = onChange;

      include.on('change', onChange);
    });

    return originalClassed.call(this, cls, include.get())
  } else {
    return originalClassed.apply(this, arguments)
  }
};

export { constant, mutable, constantCollection, mutableCollection, object, oneof };
