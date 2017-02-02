# hexagon-rx

[wip] Adds reactive powers to hexagon-js

## Example

```
import hx from 'hexagon-js'
import { constant, mutable, constantCollection, mutableCollection, object } from '../src/index' // 'hexagon-rx'

/* Create reactive objects */

const Occupation = object({
  title: mutable(String),
  salary: mutable(Number)
})

const Person = object({
  name: constant(String),
  age: mutable(Number),
  occupation: Occupation,
  // Since Person is self referenced, lazy values can be used via () =>
  children: () => mutableCollection(Person),
  parents: () => constantCollection(Person)
})

const Group = mutableCollection(Person)

/* Define components */

function occupationComponent (occupation) {
  return hx.div('occupation')
    .add(occupation.title.input('occupation-title').attr('placeholder', 'title'))
    .add(occupation.salary.input('occupation-salary').attr('placeholder', 'salary'))
}

function personComponent (person) {
  return hx.div('person')
    .add(person.name.div('person-name'))
    .add(person.age.div('person-age'))
    .add(occupationComponent(person.occupation))
    .add(person.children.div('person-children', personComponent))
    .add(person.parents.div('person-parents', personComponent))
}

/* Create object and use it */

const group = new Group([{
  name: 'Bob',
  age: 35,
  occupation: {
    title: 'Gardener',
    salary: 20000
  },
  children: [],
  parents: []
}])

// Get changes changes made to items in the collection
group.on('item-change', (person) => {
  console.log('person change', person.serialize())
})

// Get changes to the whole collection
group.on('change', (group) => {
  console.log('group change', group.serialize())
})

hx.select('body')
  .add(group.div('group', personComponent)) // any changes to person will be instantly reflected here
  .add(hx.button().text('Add').on('click', () => group.add(new Person)))

```
