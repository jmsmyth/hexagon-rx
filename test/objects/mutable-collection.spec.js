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
    const instance = new PointList([{ id: 0, x: 5, y: 4 }, { id: 1, x: 3, y: 10 }])
    instance.get().should.eql([
      new Point({ id: 0, x: 5, y: 4 }),
      new Point({ id: 1, x: 3, y: 10 })
    ])
  })

  it('should initialise to the default if provided', () => {
    const PointList = mutableCollection(Point, { default: [{ id: 0, x: 5, y: 4 }, { id: 1, x: 3, y: 10 }] })
    const instance = new PointList()
    instance.get().should.eql([
      new Point({ id: 0, x: 5, y: 4 }),
      new Point({ id: 1, x: 3, y: 10 })
    ])
  })

  it('should initialise to the default from a function if provided', () => {
    const PointList = mutableCollection(Point, { default: () => [{ id: 0, x: 5, y: 4 }, { id: 1, x: 3, y: 10 }] })
    const instance = new PointList()
    instance.get().should.eql([
      new Point({ id: 0, x: 5, y: 4 }),
      new Point({ id: 1, x: 3, y: 10 })
    ])
  })

  it('should be able to get the values', () => {
    const PointList = mutableCollection(Point, { default: () => [{ id: 0, x: 5, y: 4 }, { id: 1, x: 3, y: 10 }] })
    const instance = new PointList()
    instance.get().should.eql([
      new Point({ id: 0, x: 5, y: 4 }),
      new Point({ id: 1, x: 3, y: 10 })
    ])
  })

  it('should be able to get a specific value', () => {
    const PointList = mutableCollection(Point, { default: () => [{ id: 0, x: 5, y: 4 }, { id: 1, x: 3, y: 10 }] })
    const instance = new PointList()
    instance.get(0).should.eql(new Point({ id: 0, x: 5, y: 4 }))
  })

  it('should be able to set the values and should emit events', () => {
    const PointList = mutableCollection(Point)
    const instance = new PointList()
    const p = new Point({ x: 5, y: 10 })
    let evtEmitted = void (0)
    instance.on('change', (evt) => {
      evtEmitted = evt
    })
    instance.set([p])
    instance.get().should.eql([p])
    evtEmitted.should.eql([p])
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
    should.throw(() => instance.set([new AnotherPoint()]))
  })

  it('should be able to add a value and should emit events', () => {
    const PointList = mutableCollection(Point)
    const instance = new PointList()
    const p = new Point({ x: 5, y: 10 })
    let changeEvtEmitted = void (0)
    let addEvtEmitted = void (0)
    instance.on('change', (evt) => {
      changeEvtEmitted = evt
    })
    instance.on('item-add', (evt) => {
      addEvtEmitted = evt
    })
    instance.add(p)
    instance.get().should.eql([p])
    addEvtEmitted.should.eql(p)
    changeEvtEmitted.should.eql([p])
  })

  it('should be able to remove a value and should emit events', () => {
    const PointList = mutableCollection(Point)
    const instance = new PointList()
    const p = new Point({ x: 5, y: 10 })
    let changeEvtEmitted = void (0)
    let removeEvtEmitted = void (0)
    instance.set([p])
    instance.on('change', (evt) => {
      changeEvtEmitted = evt
    })
    instance.on('item-remove', (evt) => {
      removeEvtEmitted = evt
    })
    instance.remove(p)
    instance.get().should.eql([])
    removeEvtEmitted.should.eql(p)
    changeEvtEmitted.should.eql([])
  })

  it('should serialize correctly', () => {
    const PointList = mutableCollection(Point)
    const instance = new PointList([{ id: 0, x: 5, y: 4 }, { id: 1, x: 3, y: 10 }])
    instance.serialize().should.eql([{ id: 0, x: 5, y: 4 }, { id: 1, x: 3, y: 10 }])
  })

  it('should throw an error when trying to serialize an unserializable', () => {
    const PointList = mutableCollection(Point, { serializable: false })
    const instance = new PointList([{ id: 0, x: 5, y: 4 }, { id: 1, x: 3, y: 10 }])
    should.throw(() => instance.serialize())
  })

  it('should map to a new Value', () => {
    const PointList = mutableCollection(Point, { serializable: false })
    const instance = new PointList([{ id: 0, x: 5, y: 4 }, { id: 1, x: 3, y: 10 }])
    instance.map(x => x.length).get().should.equal(2)
  })

  it('should filter to a new Collection', () => {
    const PointList = mutableCollection(Point, { serializable: false })
    const instance = new PointList([{ id: 0, x: 5, y: 4 }, { id: 1, x: 3, y: 10 }])
    instance.filter(d => d.x.get() === 5).get().should.eql([new Point({ id: 0, x: 5, y: 4 })])
  })

  it('should emit an add event when a matching element is added to the underlying Collection', () => {
    const PointList = mutableCollection(Point, { serializable: false })
    const instance = new PointList([{ id: 0, x: 5, y: 4 }, { id: 1, x: 3, y: 10 }])
    const filtered = instance.filter(d => d.x.get() === 5)
    const addedValues = []
    filtered.on('item-add', (value) => {
      addedValues.push(value)
    })
    const p1 = new Point({ id: 3, x: 5, y: 5 })
    const p2 = new Point({ id: 4, x: 6, y: 5 })
    const p3 = new Point({ id: 5, x: 7, y: 5 })
    instance.add(p1)
    instance.add(p2)
    instance.add(p3)
    addedValues.should.eql([p1])
    p3.x.set(5)
    addedValues.should.eql([p1, p3])
  })

  it('should emit a remove event when a matching element is removed from the underlying Collection', () => {
    const PointList = mutableCollection(Point, { serializable: false })
    const instance = new PointList([{ id: 0, x: 5, y: 4 }, { id: 1, x: 5, y: 10 }])
    const filtered = instance.filter(d => d.x.get() === 5)
    const removedValues = []
    filtered.on('item-remove', (value) => {
      removedValues.push(value)
    })
    const [p1, p2] = instance.get()
    instance.remove(p1)
    removedValues.should.eql([p1])
    p2.x.set(4)
    removedValues.should.eql([p1, p2])
    const p3 = new Point({ id: 5, x: 7, y: 5 })
    instance.add(p3)
    p3.x.set(5)
    p3.x.set(4)
    removedValues.should.eql([p1, p2, p3])
  })
})

export default {}
