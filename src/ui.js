import hx from 'hexagon-js'
import { Value, Collection } from './objects'

Value.prototype.div = function (cls) {
  const selection = hx.div(cls).text(this.get())
  this.on('change', (evt) => selection.text(evt.value))
  return selection
}

Value.prototype.span = function (cls) {
  const selection = hx.span(cls).text(this.get())
  this.on('change', (evt) => selection.text(evt.value))
  return selection
}

Value.prototype.input = function (cls) {
  const selection = hx.detached('input').class(cls).value(this.get())
  selection.on('blur', (evt) => this.set(selection.value()))
  this.on('change', (evt) => selection.text(evt.value))
  return selection
}

Collection.prototype.div = function (cls, component) {
  const selection = hx.div(cls)
  const components = new Map

  function add (obj) {
    const comp = component(obj)
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
    .on('add', add)
    .on('remove', remove)
    .on('set', set)

  set(this)

  return selection
}

export default {}
