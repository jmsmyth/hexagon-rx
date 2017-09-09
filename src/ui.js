import hx from 'hexagon-js'
import { Value, Collection } from './objects'

Value.prototype.div = function (cls) {
  const selection = hx.div(cls).text(this.get())
  this.on('change', (evt) => selection.text(evt))
  return selection
}

Value.prototype.span = function (cls) {
  const selection = hx.span(cls).text(this.get())
  this.on('change', (evt) => selection.text(evt))
  return selection
}

Value.prototype.input = function (cls) {
  const selection = hx.detached('input').class(cls).value(this.get())
  selection.on('blur', (evt) => this.set(selection.value()))
  this.on('change', (evt) => selection.text(evt))
  return selection
}

Collection.prototype.div = function (cls, component) {
  const selection = hx.div(cls)
  const components = new Map()

  function add (obj) {
    const comp = component(obj, this)
    components.set(obj.id, comp)
    selection.add(comp)
  }

  function remove (obj) {
    if (components.has(obj.id)) {
      components.get(obj.id).remove()
      components.delete(obj.id)
    }
  }

  function set (collection) {
    components.clear()
    selection.clear()
    collection.get().forEach(add)
  }

  this
    .on('item-add', add)
    .on('item-remove', remove)
    .on('set', set)

  set(this)

  return selection
}

const originalClassed = hx.Selection.prototype.classed
hx.Selection.prototype.classed = function (cls, include) {

  if (include instanceof Value) {
    const onChange = (inc) => {
      originalClassed.call(this, cls, inc)
    }

    this.nodes.forEach(node => {

      node.__hxrx__ = node.__hxrx__ || {}

      if (node.__hxrx__.classedValue && node.__hxrx__.classedChangeCallback) {
        node.__hxrx__.classedValue.off('change', node.__hxrx__.classedChangeCallback)
      }

      node.__hxrx__.classedValue = include
      node.__hxrx__.classedChangeCallback = onChange

      include.on('change', onChange)
    })

    return originalClassed.call(this, cls, include.get())
  } else {
    return originalClassed.apply(this, arguments)
  }
}

export default {}
