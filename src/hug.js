/**
 *  Functional wrappers for JS Objects
 *
 *  Features
 *      - Private properties
 *      - Virtual properties
 *      - Splat'd methods (WIP)
 *      - Type hinting (WIP)
 *
 *
 * (c) 2011 - 2012 Valentin Starck (@aijoona)
 * 
 * hug.js may be freely distributed under the MIT license.
 */


/*
	TODO
		fix splat operator
		add type hinting
		add lazy binding
		define fallback to value properties
        define autowrap behavior for object properties
        privileged setter should return privileged proxy, not the public one


	var one = hug(1);

	one; // function
	one(); // 1

	one('set')('myProp', 'value!');
	one('myProp'); // "value!"

	one('set')('+', function($self, another) {
		return $self() + another;
	});
	one('+')(2); // 3

	var number = hug();

	number('set')('+', function($self, $rest) {
		return $self() + $rest('reduce')(function(memo, current) {
			return memo + (typeof current == 'function' ? current() : current)
		});
	});

	var two = number('new')(2);

	two('+', 1, 2, 3, 4); // 12

	list = hug()

	list
		('set')(['add', 'push', '<<'], function($rest) {})
		('set')('remove', function(value) {})
		('set')(['clear', 'empty'], function(value) {})
		('set')(['size', 'length'], function(value) {})

		('set')(['forEach', 'each'], function(iterator, memo) {})
		('set')(['reduce', 'inject', 'foldl'], function(iterator, memo) {})
		('set')(['map', 'collect'], function(iterator) {})
		('set')(['find', 'detect'], function(iterator) {})
		('set')(['filter', 'select'], function(iterator) {})
		('set')(['all', 'every'], function(iterator) {})

	var genres = list('new')

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
            return object('is?', type);
        }

        return false;
    };

    hug.PRIVATE_RE = /private\s*:\s*/;

    // TODO bind wrapped object not the value
    hug.bind = function (initializer) {
        var instance = hug();

        instance('set')('value', initializer);

        return instance;
    };

    hug.NATIVE_MISSING = function __native_missing(name) {
        throw new Error(name + ' not found!');
    };

    hug.NATIVE_VALUE = function __value($self, value) {
        if (value === undefined) {
            return $self('value') ? $self('value') : null;
        }

        $self('set')('private:value', value);
    };

    hug.PRIVILEGED_SETTER = function __set(name, value, modifiers) {
        if (hug.isObject(name)) {
            for (var p in name) {
                if (name.hasOwnProperty(p)) {
                    __set(p, name[p]);
                }
            }

            // TODO this should return the privileged proxy, not the public one
            return this.proxy;
        }

        if (!name) {
            return this.proxy;
        }

        if (!hug.isArray(name)) {
            name = [name];
        }

        name.forEach((function (name) {
            if (hug.PRIVATE_RE.test(name)) {
                this.private[name.replace(hug.PRIVATE_RE, '')] = value;
            } else {
                this[name] = value;
            }
        }).bind(this));

        return this.proxy;
    };

    hug.PUBLIC_SETTER = function __set(name, value, modifiers) {
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
            if (hug.PRIVATE_RE.test(name)) {
                throw new Error('Cannot access private values!');
            } else {
                this[name] = value;
            }
        }).bind(this));

        return this.proxy;
    };

    hug.NATIVE_TO_STRING = function __toString($self) {
        return 'hug@' + $self('id')();
    };

    hug.SPLAT_OPERATOR = '$rest';

    hug.BASE = {
        'value': hug.NATIVE_VALUE,
        'id': function __id($self) {
            return $self('object_id');
        },
        'set': hug.PUBLIC_SETTER,
        'new': function __new($self, value) {
            var instance = create(value, this), proxy;

            proxy = this.proxy;

            instance('set')('parent', function __parent() {
                return proxy;
            });

            if (instance('has?')('init')) {
                instance('init').apply(null, [].slice.call(arguments, 1));
            }

            return instance;
        },
        'bind': function __bind($self, initializer) {
            $self
                ('set')('value', initializer)
        },
        'unbind': function __bind($self, initializer) {
            var currentValue = $self();

            $self
                ('set')('value', hug.NATIVE_VALUE)
                ('value')(currentValue)
        },
        // TODO what about virtual properties?
        // TODO what about private properties?
        'has?': function __has($self, name) {
            return this[name] !== undefined;
        },
        'is?': function __is($self, type) {
            if (!$self('has?')('parent')) {
                return false;
            }

			var current = $self;
			
			if(current('parent')() == type) {
				return true;
			}
				
			while(current && current('has?')('parent')) {
				if(current('parent')() == type) {
					return true;
				}
				
				current = current('parent')();
			}
						
            return false;
        },
        'missing': hug.NATIVE_MISSING,
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
        __slice.call(arguments, 1).forEach(function (current) {
            for (var p in current) {
                if (current.hasOwnProperty(p)) {
                    target[p] = typeof current[p] == 'object' ? deepCopy(current[p]) : current[p];
                }
            }
        }, {});

        return target;
    }

    hug.uid = (function () {
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

        if (this['missing'] !== hug.BASE['missing']) {
            return __exec.call(this, this['missing'], [name]);
        }
    }

    function __get(name) {
        if (name === undefined) {
            return this.proxy('value')();
        }

        if (hug.PRIVATE_RE.test(name)) {
            throw new Error('Cannot access private values!');
        }

        var value = __fetch.call(this, name);

        if (typeof value == 'function') {
            return __exec.call(this, value, [].slice.call(arguments, 1));
        }

        if (value !== undefined) {
            return value;
        }

        __exec.call(this, this['missing'], [name]);
    }

    function __privileged_proxy(name) {
        if (name === undefined) {
            return __get.call(this, name);
        }

        if (name == 'set') {
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

     hug()('set')('typedMethod', function(foo, bar, baz) {
     // ...
     }, { foo: hug.IS.NUMBER, bar: hug.IS.ARRAY })

     hug()('set')('typedMethod', function(Array$foo, MyType$bar, baz) {
     // ...
     })

     */
    function __ensureTypes(fn, types) {
        return fn;
    }

    var Proxy = function __base() {
    };

    Proxy.prototype = hug.BASE;
    Proxy.prototype.constructor = Proxy;

    create = function (value, body) {
        var proxy, proxied;

        proxied = new Proxy;

        merge(proxied, { 'private': {} }, body);

        proxy = function __$proxy(name) {
            return __get.apply(proxied, arguments);
        };

        proxied.proxy = proxy;

        proxied.object_id = hug.uid();
        proxy('value')(value || null);

        proxy.toString = function() {
			return proxy('toString')();
		};

        return proxy;
    };

    hug.create = create;

    global.hug = hug;
})(this);
