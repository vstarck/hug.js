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


A few (useless) examples
--------------

###Wrapping native values###

```javascript
var one = hug(1)

one // function
one() // 1
one('toString') // function
```

###Setting properties###

```javascript
var one = hug(1)

one('#set')('myProp', 'value!')
one('myProp') // "value!"
```

###Checking for properties###

```javascript
var subject = hug()

subject('#set')('myProp', 'value!')
subject('#has?')('myProp') // true
subject('#has?')('anotherProp') // false
```

###Setting 'methods' (callable properties)###

```javascript	
var one = hug(1)

// $self is a privileged self-reference
one('#set')('+', function($self, another) {
	return $self() + another;
})
one('+')(2) // 3
```

###Using prefix syntax###

```javascript	
var one = hug(1)

one('#set')('+', function($self, a, b, c) {
	return $self() + a + b + c;
})
one('+', 2, 3, 4) // 10
```

###Catching virtual properties###

```javascript	
var myObj = hug()

myObj('#set')('#missing', function($self, name) {
	return 'Requested: ' + name;
})

myObj('a') // "Requested a"
myObj('foo') // "Requested foo"
```

###Spawning instances###

```javascript	
var Color = hug()

Color('#set')('init', function($self, r, g, b) {
	$self
		('#set')('r', r)
		('#set')('g', g)
		('#set')('b', b)
})

Color('#set')('+', function($self, another) {
	return Color('#new')(
		$self('r') + another('r'),
		$self('g') + another('g'),
		$self('b') + another('b')
	)
})

var red = Color('#new')(255, 0, 0)
var blue = Color('#new')(0, 0, 255)

var violet = red('+', blue)

violet('r') // 255
violet('g') // 0
violet('b') // 255
```

