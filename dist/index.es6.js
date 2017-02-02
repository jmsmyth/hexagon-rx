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

  emit (name, evt) {
    const listeners = this.listeners.get(name);
    if (listeners) {
      listeners.forEach(listener => listener(evt));
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
  if (Type === String) return ""
}

function typeFactory (Type) {
  return isPrimitiveType(Type) ?
    (x) => x ? x : defaultForPrimitiveType(Type) :
    (x) => x ? new Type(x) : new Type
}

class Observable extends EventEmitter {}
class Value extends Observable {}
class Collection extends Observable {}

function constant (Type, options = {}) {
  const defaultValue = isFunction(options.default) ? options.default : () => options.default;
  const serializable = !!options.serializable;
  const create = typeFactory(Type);

  return class Constant extends Value {
    constructor (value) {
      super();
      this.value = create(value || defaultValue());
      this.serializable = serializable;
    }

    get () {
      return this.value
    }

    set (value) {
      throw new Error('Constant cannot be changed')
    }

    serialize () {
      return this.value
    }
  }
}

function mutable (Type, options = {}) {
  const defaultValue = isFunction(options.default) ? options.default : () => options.default;
  const serializable = !!options.serializable;
  const create = typeFactory(Type);

  return class Mutable extends Value {
    constructor (value) {
      super();
      this.value = create(value || defaultValue());
      this.serializable = serializable;
    }

    get () {
      return this.value
    }

    set (value) {
      if (this.value !== value) {
        this.value = value;
        this.emit('change', value);
      }
    }

    serialize () {
      return this.value
    }
  }
}


function constantCollection (Type, options = {}) {
  if (!(Type.prototype instanceof RXObject)) {
    throw new Error('Type must be an instance of RXObject - eg created via object()')
  }

  const defaultValue = isFunction(options.default) ? options.default : () => options.default;
  const serializable = !!options.serializable;

  return class ConstantCollection extends Collection {
    constructor (values) {
      super();
      const initialValue = values || defaultValue() || [];
      this.values = initialValue.map(v => new Type(v));
      this.serializable = serializable;
    }

    get () {
      return this.values
    }

    set () {
      throw new Error('A constant collection cannot be changed to')
    }

    add (obj) {
      throw new Error('A constant collection cannot be changed to')
    }

    remove (obj) {
      throw new Error('A constant collection cannot be changed from')
    }

    serialize () {
      return this.values.map(v => v.serialize())
    }
  }
}

function mutableCollection (Type, options = {}) {
  if (!(Type.prototype instanceof RXObject)) {
    throw new Error('Type must be an instance of RXObject - eg created via object()')
  }

  const defaultValue = isFunction(options.default) ? options.default : () => options.default;
  const serializable = !!options.serializable;

  return class MutableCollection extends Collection {
    constructor (values) {
      super();
      this.map = new Map;
      this.listeners = new Map;
      const initialValue = values || defaultValue() || [];
      initialValue.forEach(v => {
        const t = new Type(v);
        const changeListener = (evt) => {
          this.emit('item-change', evt),
          this.emit('change', this);
        };
        t.on('change', changeListener);
        this.map.set(t.id, t);
        this.listeners.set(t.id, changeListener);
      });
      this.serializable = serializable;
    }

    set (values) {
      if (!Array.isArray(values)) {
        throw new Error('The value passed into MutableCollection::set() should be an array')
      }

      if (values.some(x => !(x instanceof Type))) {
        throw new Error('One or more of the values passed to MutableCollection::set() does not have the expected type ' + Type)
      }

      const oldValue = this.get();
      oldValue.forEach(obj => this.listeners.delete(obj.id));
      this.map = new Map;
      values.forEach(v => {
        const changeListener = (evt) => {
          this.emit('item-change', evt);
          this.emit('change', this);
        };
        v.on('change', changeListener);
        this.map.set(v.id, v);
        this.listeners.set(v.id, changeListener);
      });
      this.emit('set', this);
      this.emit('change', this);
    }

    get (id) {
      if (arguments.length > 0) {
        return this.map.get(id)
      } else {
        return Array.from(this.map.values())
      }
    }

    add (value) {
      if (value instanceof Type) {
        if (!this.map.has(value.id)) {
          const changeListener = (evt) => {
            this.emit('item-change', evt);
            this.emit('change', this);
          };
          value.on('change', changeListener);
          this.map.set(value.id, value);
          this.listeners.set(value.id, changeListener);
          this.emit('add', value);
          this.emit('change', this);
        }
      } else {
        throw new Error('The object passed to MutableCollection::add() does not have the expected type ' + Type)
      }
    }

    remove (value) {
      if (value instanceof Type) {
        if (this.map.has(value.id)) {
          const oldValue = this.map.get(value.id);
          oldValue.off('change', this.listeners.get(value.id));
          this.map.delete(value.id);
          this.listeners.delete(value.id);
          this.emit('remove', value);
          this.emit('change', this);
        }
      } else {
        throw new Error('The object passed to MutableCollection::add() does not have the expected type ' + Type)
      }
    }

    serialize () {
      return this.get().map(v => v.serialize())
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

function object (obj) {
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
        this[k].on('change', () => {
          this.emit('change', this);
        });
      });
    }

    serialize() {
      const res = {
        id: this.id
      };
      keys.forEach(k => {
        res[k] = this[k].serialize();
      });
      return res
    }
  }
}

Value.prototype.div = function (cls) {
  const selection = hx.div(cls).text(this.get());
  this.on('change', (evt) => selection.text(evt.value));
  return selection
};

Value.prototype.span = function (cls) {
  const selection = hx.span(cls).text(this.get());
  this.on('change', (evt) => selection.text(evt.value));
  return selection
};

Value.prototype.input = function (cls) {
  const selection = hx.detached('input').class(cls).value(this.get());
  selection.on('blur', (evt) => this.set(selection.value()));
  this.on('change', (evt) => selection.text(evt.value));
  return selection
};

Collection.prototype.div = function (cls, component) {
  const selection = hx.div(cls);
  const components = new Map;

  function add (obj) {
    const comp = component(obj);
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
    .on('add', add)
    .on('remove', remove)
    .on('set', set);

  set(this);

  return selection
};

export { constant, mutable, constantCollection, mutableCollection, object };
