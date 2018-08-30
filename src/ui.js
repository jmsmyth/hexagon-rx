import { div, span, detached, Selection } from 'hexagon-js'
import { Value, Collection } from './objects'

Value.prototype.div = function (cls) {
  const selection = div(cls).text(this.get())
  this.on('change', (evt) => selection.text(evt))
  return selection
}

Value.prototype.span = function (cls) {
  const selection = span(cls).text(this.get())
  this.on('change', (evt) => selection.text(evt))
  return selection
}

Value.prototype.input = function (cls) {
  const selection = detached('input').class(cls).value(this.get())
  selection.on('blur', (evt) => this.set(selection.value()))
  this.on('change', (evt) => selection.text(evt))
  return selection
}

Collection.prototype.div = function (cls, component, options = {}) {
  const selection = div(cls)
  const components = new Map()
  const collection = this

  function add (obj) {
    const comp = component(obj, collection)
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

const originalClassed = Selection.prototype.classed
Selection.prototype.classed = function (cls, include) {
  if (include instanceof Value) {
    const onChange = () => {
      originalClassed.call(this, cls, include.get())
    }

    this.nodes.forEach(node => {
      node.__hxrx__ = node.__hxrx__ || {}
      node.__hxrx__.classedValue = node.__hxrx__.classedValue || {}
      node.__hxrx__.classedChangeCallback = node.__hxrx__.classedChangeCallback || {}

      if (node.__hxrx__.classedValue[cls] && node.__hxrx__.classedChangeCallback[cls]) {
        node.__hxrx__.classedValue[cls].off('change', node.__hxrx__.classedChangeCallback[cls])
      }

      node.__hxrx__.classedValue[cls] = include
      node.__hxrx__.classedChangeCallback[cls] = onChange

      include.on('change', onChange)
    })

    return originalClassed.call(this, cls, include.get())
  } else {
    return originalClassed.apply(this, arguments)
  }
}

export default {}
