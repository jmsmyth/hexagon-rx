import chai from 'chai'
import EventEmitter from '../../src/event-emitter'
import { object, mutable, mutableCollection, Collection } from '../../src/objects'

const should = chai.should()

describe('mutableCollection', () => {
  const Point = object({
    x: mutable(Number),
    y: mutable(Number)
  })

  it('should be a Collection', () => {
    const PointList = mutableCollection(Point)
    const instance = new PointList()
    instance.should.be.an.instanceof(Collection)
  })

  it('should be an EventEmitter', () => {
    const PointList = mutableCollection(Point)
    const instance = new PointList()
    instance.should.be.an.instanceof(EventEmitter)
  })

  it('should throw an error when anything other than an Object type is used', () => {
    should.throw(() => mutableCollection(Number))
  })

  it('should initialise to an empty array', () => {
    const PointList = mutableCollection(Point)
    const instance = new PointList()
    instance.get().should.eql([])
  })

  it('should initialise from an array', () => {
    const PointList = mutableCollection(Point)
    const instance = new PointList([{id: 0, x: 5, y: 4}, {id: 1, x: 3, y: 10}])
    instance.get().should.eql([
      new Point({id: 0, x: 5, y: 4}),
      new Point({id: 1, x: 3, y: 10})
    ])
  })

  it('should initialise to the default if provided', () => {
    const PointList = mutableCollection(Point, { default: [{id: 0, x: 5, y: 4}, {id: 1, x: 3, y: 10}] })
    const instance = new PointList()
    instance.get().should.eql([
      new Point({id: 0, x: 5, y: 4}),
      new Point({id: 1, x: 3, y: 10})
    ])
  })

  it('should initialise to the default from a function if provided', () => {
    const PointList = mutableCollection(Point, { default: () => [{id: 0, x: 5, y: 4}, {id: 1, x: 3, y: 10}] })
    const instance = new PointList()
    instance.get().should.eql([
      new Point({id: 0, x: 5, y: 4}),
      new Point({id: 1, x: 3, y: 10})
    ])
  })

  it('should be able to get the values', () => {
    const PointList = mutableCollection(Point, { default: () => [{id: 0, x: 5, y: 4}, {id: 1, x: 3, y: 10}] })
    const instance = new PointList()
    instance.get().should.eql([
      new Point({id: 0, x: 5, y: 4}),
      new Point({id: 1, x: 3, y: 10})
    ])
  })

  it('should be able to set the values and should emit events', () => {
    const PointList = mutableCollection(Point)
    const instance = new PointList()
    const p = new Point({x: 5, y: 10})
    let evtEmitted = void (0)
    instance.on('change', (evt) => {
      evtEmitted = evt
    })
    instance.set([p])
    instance.get().should.eql([p])
    evtEmitted.should.eql(instance)
  })

  it('should throw an error if set to something other than an array', () => {
    const AnotherPoint = object({})
    const PointList = mutableCollection(Point)
    const instance = new PointList()
    should.throw(() => instance.set('not an array'))
  })

  it('should throw an error if the wrong types are used when setting', () => {
    const AnotherPoint = object({})
    const PointList = mutableCollection(Point)
    const instance = new PointList()
    should.throw(() => instance.set([new AnotherPoint]))
  })

  it('should be able to add a value and should emit events', () => {
    const PointList = mutableCollection(Point)
    const instance = new PointList()
    const p = new Point({x: 5, y: 10})
    let changeEvtEmitted = void (0)
    let addEvtEmitted = void (0)
    instance.on('change', (evt) => {
      changeEvtEmitted = evt
    })
    instance.on('add', (evt) => {
      addEvtEmitted = evt
    })
    instance.add(p)
    instance.get().should.eql([p])
    addEvtEmitted.should.eql(p)
    changeEvtEmitted.should.eql(instance)
  })

  it('should be able to remove a value and should emit events', () => {
    const PointList = mutableCollection(Point)
    const instance = new PointList()
    const p = new Point({x: 5, y: 10})
    let changeEvtEmitted = void (0)
    let removeEvtEmitted = void (0)
    instance.set([p])
    instance.on('change', (evt) => {
      changeEvtEmitted = evt
    })
    instance.on('remove', (evt) => {
      removeEvtEmitted = evt
    })
    instance.remove(p)
    instance.get().should.eql([])
    removeEvtEmitted.should.eql(p)
    changeEvtEmitted.should.eql(instance)
  })

  it('should serialize correctly', () => {
    const PointList = mutableCollection(Point)
    const instance = new PointList([{id: 0, x: 5, y: 4}, {id: 1, x: 3, y: 10}])
    instance.serialize().should.eql([{id: 0, x: 5, y: 4}, {id: 1, x: 3, y: 10}])
  })
})

export default {}
