
export default class EventEmitter {
  constructor () {
    this.listeners = new Map
  }

  emit (name, evt) {
    const listeners = this.listeners.get(name)
    if (listeners) {
      listeners.forEach(listener => listener(evt))
    }
    return this
  }

  on (name, f) {
    const listeners = this.listeners.get(name) || new Set
    this.listeners.set(name, listeners)
    listeners.add(f)
    return this
  }

  off (name, f) {
    const listeners = this.listeners.get(name)
    if(listeners) {
      listeners.delete(f)
    }
    return this
  }
}
