import chai from 'chai'
import EventEmitter from '../../src/event-emitter'
import { mutable, Value } from '../../src/objects'

const should = chai.should()

describe('mutable', () => {
  it('should be a Value', () => {
    const Mutable = mutable(Number)
    const instance = new Mutable(5)
    instance.should.be.an.instanceof(Value)
  })

  it('should be an EventEmitter', () => {
    const Mutable = mutable(Number)
    const instance = new Mutable(5)
    instance.should.be.an.instanceof(EventEmitter)
  })

  it('should initialise and get a value', () => {
    const Mutable = mutable(Number)
    const instance = new Mutable(5)
    instance.get().should.equal(5)
  })

  it('should initialise to 0', () => {
    const Mutable = mutable(Number)
    const instance = new Mutable(0)
    instance.get().should.equal(0)
  })

  it('should initialise to ""', () => {
    const Mutable = mutable(String)
    const instance = new Mutable("")
    instance.get().should.equal("")
  })


  it('should initialise to the default if provided', () => {
    const Mutable = mutable(Number, { default: 10 })
    const instance = new Mutable()
    instance.get().should.equal(10)
  })

  it('should initialise to the default from a function if provided', () => {
    const Mutable = mutable(Number, { default: () => 10 })
    const instance = new Mutable()
    instance.get().should.equal(10)
  })

  it('should be able to set a value and should emit when set', () => {
    const Mutable = mutable(Number)
    const instance = new Mutable(5)
    let evtEmitted = void (0)
    let metaEmitted = void (0)
    instance.on('change', (evt, meta) => {
      evtEmitted = evt
      metaEmitted = meta
    })
    const meta = { cause: 'user' }
    instance.set(6, meta)
    instance.get().should.equal(6)
    evtEmitted.should.eql(6)
    metaEmitted.should.eql(meta)
  })

  it('should emit a serializable-change event', () => {
    const Mutable = mutable(Number)
    const instance = new Mutable(5)
    let evtEmitted = void (0)
    let metaEmitted = void (0)
    instance.on('serializable-change', (evt, meta) => {
      evtEmitted = evt
      metaEmitted = meta
    })
    const meta = { cause: 'user' }
    instance.set(6, meta)
    instance.get().should.equal(6)
    evtEmitted.should.eql(6)
    metaEmitted.should.eql(meta)
  })

  it('should not emit a serializable-change event if the mutable is not serializable', () => {
    const Mutable = mutable(Number, {serializable: false})
    const instance = new Mutable(5)
    let evtEmitted = void (0)
    instance.on('serializable-change', (evt) => {
      evtEmitted = evt
    })
    instance.set(6)
    should.not.exist(evtEmitted)
  })

  it('should not emit a change event the value does not change', () => {
    const Mutable = mutable(Number)
    const instance = new Mutable(5)
    let evtEmitted = void (0)
    instance.on('serializable-change', (evt) => {
      evtEmitted = evt
    })
    instance.set(5)
    should.not.exist(evtEmitted)
  })

  it('should default to something sensible for a String', () => {
    const Mutable = mutable(String)
    const instance = new Mutable()
    instance.get().should.equal("")
  })

  it('should default to something sensible for a Number', () => {
    const Mutable = mutable(Number)
    const instance = new Mutable()
    instance.get().should.equal(0)
  })

  it('should default to something sensible for a Boolean', () => {
    const Mutable = mutable(Boolean)
    const instance = new Mutable()
    instance.get().should.equal(false)
  })

  it('should serialize correctly', () => {
    const Mutable = mutable(Number)
    const instance = new Mutable(5)
    instance.serialize().should.equal(5)
  })

  it('should throw an error when trying to serialize an unserializable', () => {
    const Mutable = mutable(Number, {serializable: false})
    const instance = new Mutable(5)
    should.throw(() => instance.serialize())
  })

  it('should map to a new Value', () => {
    const Mutable = mutable(Number)
    const instance = new Mutable(5)
    instance.map(x => x * 2).get().should.equal(10)
    instance.map(x => x * 2).serialize().should.equal(10)
  })

  it('should not be serializable after mapping if the original value was not serializable', () => {
    const Mutable = mutable(Number, {serializable: false})
    const instance = new Mutable(5)
    instance.map(x => x * 2).get().should.equal(10)
    should.throw(() => instance.map(x => x * 2).serialize())
  })

  it('should emit change events for mapped values', () => {
    const Mutable = mutable(Number)
    const instance = new Mutable(5)
    const mapped = instance.map(x => x * 2)

    let evtEmitted = void (0)
    let metaEmitted = void (0)

    mapped.on('change', (evt, meta) => {
      evtEmitted = evt
      metaEmitted = meta
    })

    const meta = { cause: 'user' }
    instance.set(3, meta)

    evtEmitted.should.eql(6)
    metaEmitted.should.eql(meta)
  })

  it('should emit serializable-change events for mapped values', () => {
    const Mutable = mutable(Number)
    const instance = new Mutable(5)
    const mapped = instance.map(x => x * 2)

    let evtEmitted = void (0)
    let metaEmitted = void (0)

    mapped.on('serializable-change', (evt, meta) => {
      evtEmitted = evt
      metaEmitted = meta
    })

    const meta = { cause: 'user' }
    instance.set(3, meta)

    evtEmitted.should.eql(6)
    metaEmitted.should.eql(meta)
  })

  it('should not emit serializable-change events for mapped values if the original value was not serializable', () => {
    const Mutable = mutable(Number, {serializable: false})
    const instance = new Mutable(5)
    const mapped = instance.map(x => x * 2)

    let called = false
    mapped.on('serializable-change', () => {
      called = true
    })

    instance.set(3)
    called.should.equal(false)
  })

  it('should throw an error when trying to assign to a mapped value', () => {
    const Mutable = mutable(Number)
    const instance = new Mutable(5)
    const mapped = instance.map(x => x * 2)
    should.throw(() => mapped.set(50))
  })
})

export default {}
