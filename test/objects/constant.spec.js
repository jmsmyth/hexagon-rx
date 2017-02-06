import chai from 'chai'
import EventEmitter from '../../src/event-emitter'
import { constant, Value } from '../../src/objects'

const should = chai.should()

describe('constant', () => {
  it('should be a Value', () => {
    const Constant = constant(Number)
    const instance = new Constant(5)
    instance.should.be.an.instanceof(Value)
  })

  it('should be an EventEmitter', () => {
    const Constant = constant(Number)
    const instance = new Constant(5)
    instance.should.be.an.instanceof(EventEmitter)
  })

  it('should initialise and get a value', () => {
    const Constant = constant(Number)
    const instance = new Constant(5)
    instance.get().should.equal(5)
  })

  it('should initialise to 0', () => {
    const Constant = constant(Number)
    const instance = new Constant(0)
    instance.get().should.equal(0)
  })

  it('should initialise to ""', () => {
    const Constant = constant(String)
    const instance = new Constant("")
    instance.get().should.equal("")
  })

  it('should initialise to the default if provided', () => {
    const Constant = constant(Number, { default: 10 })
    const instance = new Constant()
    instance.get().should.equal(10)
  })

  it('should initialise to the default from a function if provided', () => {
    const Constant = constant(Number, { default: () => 10 })
    const instance = new Constant()
    instance.get().should.equal(10)
  })

  it('should not be able to set a value', () => {
    const Constant = constant(Number)
    const instance = new Constant(5)
    should.throw(() => instance.set(6))
    instance.get().should.equal(5)
  })

  it('should default to something sensible for a String', () => {
    const Constant = constant(String)
    const instance = new Constant()
    instance.get().should.equal("")
  })

  it('should default to something sensible for a Number', () => {
    const Constant = constant(Number)
    const instance = new Constant()
    instance.get().should.equal(0)
  })

  it('should default to something sensible for a Boolean', () => {
    const Constant = constant(Boolean)
    const instance = new Constant()
    instance.get().should.equal(false)
  })

  it('should serialize correctly', () => {
    const Constant = constant(Number)
    const instance = new Constant(5)
    instance.serialize().should.equal(5)
  })

})

export default {}
