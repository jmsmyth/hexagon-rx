import { randomId, isFunction } from './utils'
import EventEmitter from './event-emitter'

export function isPrimitiveType (x) {
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
    (x) => x ? x : defaultForPrimitiveType(Type) :
    (x) => x ? new Type(x) : new Type()
}

export class Observable extends EventEmitter {}
export class Value extends Observable {}
export class Collection extends Observable {}

export function constant (Type, options = {}) {
  const defaultValue = isFunction(options.default) ? options.default : () => options.default
  const serializable = options.serializable !== false
  const create = typeFactory(Type)

  return class Constant extends Value {
    constructor (value) {
      super()
      this.value = create(value || defaultValue())
      this.serializable = serializable
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

export function mutable (Type, options = {}) {
  const defaultValue = isFunction(options.default) ? options.default : () => options.default
  const serializable = options.serializable !== false
  const create = typeFactory(Type)

  return class Mutable extends Value {
    constructor (value) {
      super()
      this.value = create(value || defaultValue())
      this.serializable = serializable
    }

    get () {
      return this.value
    }

    set (value) {
      if (this.value !== value) {
        this.value = value
        this.emit('change', value)
        if (serializable) this.emit('serializable-change', value)
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

export function constantCollection (Type, options = {}) {
  if (!(Type.prototype instanceof RXObject)) {
    throw new Error('Type must be an instance of RXObject - eg created via object()')
  }

  const defaultValue = isFunction(options.default) ? options.default : () => options.default
  const serializable = options.serializable !== false

  return class ConstantCollection extends Collection {
    constructor (values) {
      super()
      const initialValue = values || defaultValue() || []
      this.values = initialValue.map(v => new Type(v))
      this.map = new Map()
      this.values.forEach(v => {
        this.map.set(v.id, v)
      })
      this.serializable = serializable
    }

    get (id) {
      if (arguments.length > 0) {
        return this.map.get(id)
      } else {
        return this.values
      }
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
      if (serializable) {
        return this.values.map(v => v.serialize())
      } else {
        throw new Error('This object is not serializable')
      }
    }
  }
}

export function mutableCollection (Type, options = {}) {
  if (!(Type.prototype instanceof RXObject)) {
    throw new Error('Type must be an instance of RXObject - eg created via object()')
  }

  const defaultValue = isFunction(options.default) ? options.default : () => options.default
  const serializable = options.serializable !== false

  return class MutableCollection extends Collection {
    constructor (values) {
      super()
      this.map = new Map()
      this.listeners = new Map()
      this.serializableListeners = new Map()
      const initialValue = values || defaultValue() || []
      initialValue.forEach(v => {
        const t = new Type(v)
        const changeListener = (evt) => {
          this.emit('item-change', evt)
          this.emit('change', this)
        }
        t.on('change', changeListener)
        this.map.set(t.id, t)
        this.listeners.set(t.id, changeListener)

        if (serializable) {
          const serializableChangeListener = (evt) => {
            this.emit('item-serializable-change', evt)
            this.emit('serializable-change', this)
          }
          this.serializableListeners.set(t.id, serializableChangeListener)
          t.on('serializable-change', serializableChangeListener)
        }
      })
      this.serializable = serializable
    }

    set (values) {
      if (!Array.isArray(values)) {
        throw new Error('The value passed into MutableCollection::set() should be an array')
      }

      if (values.some(x => !(x instanceof Type))) {
        throw new Error('One or more of the values passed to MutableCollection::set() does not have the expected type ' + Type)
      }

      const oldValue = this.get()
      oldValue.forEach(obj => this.listeners.delete(obj.id))
      this.map = new Map()
      values.forEach(v => {
        const changeListener = (evt) => {
          this.emit('item-change', evt)
          this.emit('change', this)
        }
        v.on('change', changeListener)
        this.map.set(v.id, v)
        this.listeners.set(v.id, changeListener)

        if (serializable) {
          const serializableChangeListener = (evt) => {
            this.emit('item-serializable-change', evt)
            this.emit('serializable-change', this)
          }
          this.serializableListeners.set(v.id, serializableChangeListener)
          v.on('serializable-change', serializableChangeListener)
        }
      })
      this.emit('set', this)
      this.emit('change', this)

      if (serializable) {
        this.emit('serializable-change', this)
      }
    }

    get (id) {
      if (arguments.length > 0) {
        return this.map.get(id)
      } else {
        return Array.from(this.map.values())
      }
    }

    add (value) {
      const newValue = value !== undefined ? value : new Type()

      if (newValue instanceof Type) {
        if (!this.map.has(newValue.id)) {
          const changeListener = (evt) => {
            this.emit('item-change', evt)
            this.emit('change', this)
          }
          newValue.on('change', changeListener)
          this.map.set(newValue.id, newValue)
          this.listeners.set(newValue.id, changeListener)
          this.emit('item-add', newValue)
          this.emit('change', this)

          if (serializable) {
            const serializableChangeListener = (evt) => {
              this.emit('item-serializable-change', evt)
              this.emit('serializable-change', this)
            }
            this.serializableListeners.set(newValue.id, serializableChangeListener)
            newValue.on('serializable-change', serializableChangeListener)
            this.emit('serializable-change', this)
          }
        }
      } else {
        throw new Error('The object passed to MutableCollection::add() does not have the expected type ' + Type)
      }
    }

    remove (value) {
      if (value instanceof Type) {
        if (this.map.has(value.id)) {
          const oldValue = this.map.get(value.id)
          oldValue.off('change', this.listeners.get(value.id))
          this.map.delete(value.id)
          this.listeners.delete(value.id)
          this.emit('item-remove', value)
          this.emit('change', this)

          if (serializable) {
            oldValue.off('serializable-change', this.serializableListeners.get(value.id))
            this.emit('serializable-change', this)
          }

          oldValue
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
]

export class RXObject extends Observable {}

export function object (obj, options = {}) {

  const serializable = options.serializable !== false
  const keys = Object.keys(obj)

  keys.forEach(k => {
    if (reservedKeys.indexOf(k) > -1) {
      throw new Error(k + 'is a reserved key and cannot be used')
    }
  })

  return class Obj extends RXObject {
    constructor (value = {}) {
      super()
      this.id = value.id !== undefined ? value.id : randomId()
      keys.forEach(k => {
        const Type = isFunction(obj[k]) && !(obj[k].prototype instanceof Observable) ? obj[k]() : obj[k]
        if (k in value) {
          this[k] = new Type(value[k])
        } else {
          this[k] = new Type()
        }
        this[k].on('change', () => {
          this.emit('change', this)
        })

        if (serializable) {
          this[k].on('serializable-change', () => {
            this.emit('serializable-change', this)
          })
        }
      })
    }

    serialize () {
      if (serializable) {
        const res = {
          id: this.id
        }
        keys.forEach(k => {
          if (this[k].serializable !== false) {
            res[k] = this[k].serialize()
          }
        })
        return res
      } else {
        throw new Error('This object is not serializable')
      }
    }
  }
}
