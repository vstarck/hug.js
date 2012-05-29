hug.js
======

Functional wrappers for native objects/values

Standard properties of the instances:
-------------------------------------

- #value
- #id
- #set
- #new
- #bind
- #unbind
- #has?
- #is?
- #missing


A few examples
--------------

Wrapping native values

```javascript
var one = hug(1)

one // function
one() // 1
one('toString') // function
```

Setting properties

```javascript
var one = hug(1)

one('#set')('myProp', 'value!')
one('myProp') // "value!"
```

Checking for properties

```javascript
var subject = hug()

subject('#set')('myProp', 'value!')
subject('#has?')('myProp') // true
subject('#has?')('anotherProp') // false
```

Setting 'methods' (callable properties)

```javascript	
var one = hug(1)

one('#set')('+', function($self, another) {
	return $self() + another;
})
one('+')(2) // 3
```

Using prefix syntax

```javascript	
var one = hug(1)

one('#set')('+', function($self, a, b, c) {
	return $self() + a + b + c;
})
one('+', 2, 3, 4) // 10
```

Seting up virtual properties

```javascript	
var myObj = hug()

myObj('#set')('#missing', function($self, name) {
	return 'Requested: ' + name;
})

myObj('a') // "Requested a"
myObj('foo') // "Requested foo"
```