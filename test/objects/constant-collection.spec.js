import chai from 'chai'
import EventEmitter from '../../src/event-emitter'
import { object, mutable, constantCollection, Collection } from '../../src/objects'

const should = chai.should()

describe('constantCollection', () => {
  const Point = object({
    x: mutable(Number),
    y: mutable(Number)
  })

  it('should be a Collection', () => {
    const PointList = constantCollection(Point)
    const instance = new PointList()
    instance.should.be.an.instanceof(Collection)
  })

  it('should be an EventEmitter', () => {
    const PointList = constantCollection(Point)
    const instance = new PointList()
    instance.should.be.an.instanceof(EventEmitter)
  })

  it('should throw an error when anything other than an Object type is used', () => {
    should.throw(() => constantCollection(Number))
  })

  it('should initialise to an empty array', () => {
    const PointList = constantCollection(Point)
    const instance = new PointList()
    instance.get().should.eql([])
  })

  it('should initialise from an array', () => {
    const PointList = constantCollection(Point)
    const instance = new PointList([{id: 0, x: 5, y: 4}, {id: 1, x: 3, y: 10}])
    instance.get().should.eql([
      new Point({id: 0, x: 5, y: 4}),
      new Point({id: 1, x: 3, y: 10})
    ])
  })

  it('should initialise to the default if provided', () => {
    const PointList = constantCollection(Point, { default: [{id: 0, x: 5, y: 4}, {id: 1, x: 3, y: 10}] })
    const instance = new PointList()
    instance.get().should.eql([
      new Point({id: 0, x: 5, y: 4}),
      new Point({id: 1, x: 3, y: 10})
    ])
  })

  it('should initialise to the default from a function if provided', () => {
    const PointList = constantCollection(Point, { default: () => [{id: 0, x: 5, y: 4}, {id: 1, x: 3, y: 10}] })
    const instance = new PointList()
    instance.get().should.eql([
      new Point({id: 0, x: 5, y: 4}),
      new Point({id: 1, x: 3, y: 10})
    ])
  })

  it('should be able to get the values', () => {
    const PointList = constantCollection(Point, { default: () => [{id: 0, x: 5, y: 4}, {id: 1, x: 3, y: 10}] })
    const instance = new PointList()
    instance.get().should.eql([
      new Point({id: 0, x: 5, y: 4}),
      new Point({id: 1, x: 3, y: 10})
    ])
  })

  it('should be able to get a specific value', () => {
    const PointList = constantCollection(Point, { default: () => [{id: 0, x: 5, y: 4}, {id: 1, x: 3, y: 10}] })
    const instance = new PointList()
    instance.get(0).should.eql(new Point({id: 0, x: 5, y: 4}))
  })

  it('should not be able to set the values', () => {
    const PointList = constantCollection(Point)
    const instance = new PointList()
    should.throw(() => instance.set([new Point({x: 5, y: 10})]))
  })

  it('should not be able to add a value', () => {
    const PointList = constantCollection(Point)
    const instance = new PointList()
    should.throw(() => instance.add(new Point({x: 5, y: 10})))
  })

  it('should not be able to remove a value', () => {
    const PointList = constantCollection(Point)
    const instance = new PointList()
    should.throw(() => instance.remove(new Point({x: 5, y: 10})))
  })

  it('should serialize correctly', () => {
    const PointList = constantCollection(Point)
    const instance = new PointList([{id: 0, x: 5, y: 4}, {id: 1, x: 3, y: 10}])
    instance.serialize().should.eql([{id: 0, x: 5, y: 4}, {id: 1, x: 3, y: 10}])
  })

  it('should throw an error when trying to serialize an unserializable', () => {
    const PointList = constantCollection(Point, {serializable: false})
    const instance = new PointList([{id: 0, x: 5, y: 4}, {id: 1, x: 3, y: 10}])
    should.throw(() => instance.serialize())
  })
})

export default {}
