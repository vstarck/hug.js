/**
 *  Functional wrappers for JS Objects
 *
 *  Features
 *      - Private properties
 *      - Virtual properties
 *      - Splat'd methods
 *      - Type hinting
 *
 */


/*
	TODO
		fix private set
		fix splat operator
		add type hinting
		add lazy binding
		define fallback to value properties
		define inheritence chain
        define autowrap behavior for object properties


	var one = hug(1);

	one; // function
	one(); // 1

	one('#set')('myProp', 'value!');
	one('myProp'); // "value!"

	one('#set')('+', function($self, another) {
		return $self() + another;
	});
	one('+')(2); // 3

	var number = hug();

	number('#set')('+', function($self, $rest) {
		return $self() + $rest('reduce')(function(memo, current) {
			return memo + (typeof current == 'function' ? current() : current)
		});
	});

	var two = number('#new')(2);

	two('+', 1, 2, 3, 4); // 12


	list = hug()

	list
		('#set')(['add', 'push', '<<'], function($rest) {})
		('#set')('remove', function(value) {})
		('#set')(['clear', 'empty'], function(value) {})
		('#set')(['size', 'length'], function(value) {})

		('#set')(['forEach', 'each'], function(iterator, memo) {})
		('#set')(['reduce', 'inject', 'foldl'], function(iterator, memo) {})
		('#set')(['map', 'collect'], function(iterator) {})
		('#set')(['find', 'detect'], function(iterator) {})
		('#set')(['filter', 'select'], function(iterator) {})
		('#set')(['all', 'every'], function(iterator) {})

	var genres = list('#new')

	genres('<<', 'Pop', 'Rock', 'Metal', 'Progressive')

	genres('size')() // 4

	genres('+', genres)('size')() // 8

	genres
		('each')(function(current) {
			console.log(current)
		})
		('map')(function(current) {
			return current
		})
		('reduce')(function(memo, current) {
			return memo + current
		}, '')

	----------------------------------------------------------------------

	var magicProperties = hug()

	magicProperties('#set')('#missing', function(name) {
		return function() { return 'missing: ' + name }
	});

	magicProperties('foo!')() // "missing: foo!"

	-----------------------------------------------------------------------

	var a = hug()
	var b = a('#new')()
	var c = b('#new')()

	a == b('parent')()
	b == c('parent')()

	var d = c('parent')('parent')()('#new')()

	-----------------------------------------------------------------------

	var a = hug()

	hug('#set')('private:foo')(1) // Error!


*/
;(function (global) {
    var hug = function (prop) {
        if (hug[prop]) {
            if (typeof hug[prop] == 'function' && arguments.length > 1) {
                return hug[prop].apply(null, [].slice.call(arguments, 1));
            }
            return hug[prop];
        }

        return hug.create(prop);
    };

    var __toString = Object.prototype.toString;
    var __slice = [].slice;

    hug.isArray = Array.isArray || function (o) {
        return __toString.call(o) == '[object Array]';
    };

    hug.isObject = function (o) {
        return __toString.call(o) == '[object Object]';
    };

    hug.is = function (object, type) {
        if (typeof object == 'function') {
            return object('#is?', type);
        }

        return false;
    };

    // TODO bind wrapped object not the value
    hug.bind = function (initializer) {
        var instance = hug();

        instance('#set')('#value', initializer);

        return instance;
    };

    hug.NATIVE_MISSING = function __native_missing(name) {
        throw new Error(name + ' not found!');
    };

    hug.NATIVE_VALUE = function __value($self, value) {
        if (value === undefined) {
            return $self('value') ? $self('value') : null;
        }

        $self('#set')('private:value', value);
    };

    hug.PRIVILEGED_SETTER = function __set(name, value, modifiers) {
        if (hug.isObject(name)) {
            for (var p in name) {
                if (name.hasOwnProperty(p)) {
                    __set(p, name[p]);
                }
            }

            return this.proxy;
        }

        if (!name) {
            return this.proxy;
        }

        if (!hug.isArray(name)) {
            name = [name];
        }

        name.forEach((function (name) {
            if (/private\s*:\s*/.test(name)) {
                this.private[name.replace(/private\s*:\s*/, '')] = value;
            } else {
                this[name] = value;
            }
        }).bind(this));

        return this.proxy;
    };

    hug.NATIVE_TO_STRING = function __toString($self) {
        return '' + $self().toString();
    };

    hug.SPLAT_OPERATOR = '$rest';

    // TODO throw away #?
    hug.BASE = {
        '#value': hug.NATIVE_VALUE,
        '#id': function __id($self) {
            return $self('id');
        },
        // TODO implement alias setting
        /*
         hug()('#set')(['+', 'add'], function() {
         // ...
         });
         */
        '#set': function __set(name, value, modifiers) {
            if (hug.isObject(name)) {
                for (var p in name) {
                    if (name.hasOwnProperty(p)) {
                        __set.call(this, p, name[p]);
                    }
                }

                return this.proxy;
            }

            if (!name) {
                return this.proxy;
            }

            if (!hug.isArray(name)) {
                name = [name];
            }

            name.forEach((function (name) {
                if (/private\s*:\s*/.test(name)) {
                    throw new Error('Cannot access private values!');
                } else {
                    this[name] = value;
                }
            }).bind(this));

            return this.proxy;
        },
        '#new': function __new($self, value) {
            var instance = create(value, this), proxy;

            proxy = this.proxy;

            instance('#set')('#parent', function __parent() {
                return proxy;
            });

            if (instance('#has?')('init')) {
                instance('init').apply(null, [].slice.call(arguments, 1));
            }

            return instance;
        },
        '#bind': function __bind($self, initializer) {
            $self
                ('#set')('#value', initializer)
        },
        '#unbind': function __bind($self, initializer) {
            var currentValue = $self();

            $self
                ('#set')('#value', hug.NATIVE_VALUE)
                ('#value')(currentValue)
        },
        // TODO what about virtual properties?
        // TODO what about private properties?
        '#has?': function __has($self, name) {
            return this[name] !== undefined;
        },
        // TODO implement ancestor lookup
        '#is?': function __is($self, type) {
            if (!$self('#has?')('#parent')) {
                return false;
            }

            return $self('#parent')() == type;
        },
        '#missing': hug.NATIVE_MISSING,
        'toString': hug.NATIVE_TO_STRING
    };

    function deepCopy(source) {
        var copy, prop;

        if (!source || typeof source != 'object') {
            return source;
        }

        copy = __toString.call(source) == '[object Array]' ? [] : {};

        for (prop in source) {
            if (source.hasOwnProperty(prop)) {
                copy[prop] = typeof source[prop] == 'object' ? deepCopy(source[prop]) : source[prop];
            }
        }

        return copy;
    }

    // from Prototype.js
    function argumentNames(fn) {
        var names = fn.toString()
            .match(/^[\s\(]*function[^(]*\(([^)]*)\)/)[1]
            .replace(/\/\/.*?[\r\n]|\/\*(?:.|[\r\n])*?\*\//g, '')
            .replace(/\s+/g, '').split(',');

        return names.length == 1 && !names[0] ? [] : names;
    }

    function merge(target) {
        return __slice.call(arguments, 1).forEach(function (current) {
            for (var p in current) {
                if (current.hasOwnProperty(p)) {
                    target[p] = typeof current[p] == 'object' ? deepCopy(current[p]) : current[p];
                }
            }
        }, {});
    }

    var uid = (function () {
        var seed = 0;

        return function uid() {
            return seed++;
        }
    })();

    // TODO rework properties lookup (__fetch / __get)		
    function __fetch(name) {
        if (this[name] !== undefined) {
            return this[name];
        }

        // Extension
        if (this['private'] && this['private'].value && this['private'].value[name]) {
            return this['private'].value[name];
        }

        if (this['#missing'] !== hug.BASE['#missing']) {
            return __exec.call(this, this['#missing'], [name]);
        }

        return undefined;
    }

    function __get(name) {
        if (name === undefined) {
            return this.proxy('#value')();
        }

        if (/private\s*:\s*/.test(name)) {
            throw new Error('Cannot access private values!');
        }

        var value = __fetch.call(this, name);

        if (typeof value == 'function') {
            return __exec.call(this, value, [].slice.call(arguments, 1));
        }

        if (value !== undefined) {
            return value;
        }

        __exec.call(this, this['#missing'], [name]);
    }

    function __privileged_proxy(name) {
        if (name === undefined) {
            return __get.call(this, name);
        }

        if (name == '#set') {
            return hug.PRIVILEGED_SETTER.bind(this);
        }

        name = name.replace('private:', '');

        if (this['private'][name]) {
            if (typeof this['private'][name] === 'function') {
                return __exec.call(this, this['private'][name], [].slice.call(arguments));
            }

            return this['private'][name];
        }

        return __get.call(this, name);
    }

    // TODO do a better implementation
    function __splat(fn, args) {
        if (argumentNames(fn).indexOf(hug.SPLAT_OPERATOR) == -1) {
            return args;
        }

        var from = argumentNames(fn).indexOf(hug.SPLAT_OPERATOR);

        return args.slice(0, from).concat([args.slice(from)]);
    }

    function __exec(fn, args) {
        if (args.length == 0) {
            if (argumentNames(fn)[0] === '$self') {
                return fn.bind(this, __privileged_proxy.bind(this));
            }
            return fn.bind(this);
        }

        if (argumentNames(fn)[0] === '$self') {
            args.unshift(__privileged_proxy.bind(this));
        }

        args = __splat(fn, args);

        return fn.apply(this, args);
    }

    // TODO implement
    /*

     hug()('#set')('typedMethod', function(foo, bar, baz) {
     // ...
     }, { foo: hug.IS.NUMBER, bar: hug.IS.ARRAY })

     hug()('#set')('typedMethod', function(Array$foo, MyType$bar, baz) {
     // ...
     })

     */
    function __ensureTypes(fn, types) {
        return fn;
    }

    var BASE = function __base() {
    };

    BASE.prototype = hug.BASE;

    create = function (value, body) {
        var proxy, proxied;

        proxied = new BASE;

        merge(proxied, { 'private': {} }, body);

        proxy = function __$proxy(name) {
            return __get.apply(proxied, arguments);
        };

        proxied.proxy = proxy;

        proxied.id = uid();
        proxy('#value')(value || null);

        proxy.toString = proxy('toString');
        return proxy;
    };

    hug.create = create;

    global.hug = hug;
})(this);
