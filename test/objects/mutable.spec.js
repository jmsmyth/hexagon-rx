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
    instance.on('change', (evt) => {
      evtEmitted = evt
    })
    instance.set(6)
    instance.get().should.equal(6)
    evtEmitted.should.eql(6)
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
})

export default {}
