[![Build Status](https://travis-ci.org/Ethaywien/script-loading-toolkit.svg?branch=master)](https://travis-ci.org/Ethaywien/script-loading-toolkit)
[![Coverage Status](https://coveralls.io/repos/github/Ethaywien/script-loading-toolkit/badge.svg?branch=master)](https://coveralls.io/github/Ethaywien/script-loading-toolkit?branch=master)

# Script Loading Toolkit
A browser library for handling asynchronously loading and interacting with third party script dependencies without race conditions or render blocking. Written in TypeScript. 

## Installation
For EcmaScript and CommonJS module distributions install with the package manager of your choice. (Recommended)

```sh
# npm
npm install script-loading-toolkit --save
# yarn
yarn add script-loading-toolkit
```

or include the UMD browser distribution directly:

```html
<script src="https://unpkg.com/script-loading-toolkit"></script>
```

**IMPORTANT:** Script Loading Toolkit requires **Promises**. If you wish to support older browsers that do not implement promises then you will need to pollyfill this functionality yourself. You can do so with this [NPM library](https://www.npmjs.com/package/promise-polyfill) or with [Babel](https://babeljs.io/docs/en/babel-polyfill).

## Usage
The script loading toolkit provides three major tools ([`Script`](#script), [`BasicScript`](#basicscript) and [`FunctionQueue`](#functionqueue)) for managing script loading. These can be used directly by newing them up and setting a script src; however their intended use is for extending or [mixing into](#mixins) your own classes to create facades or adapters to wrap third party libraries in order decouple your code from a third party interface you do not control and may or may not yet exist in the global scope.

We recommend you use Async/Await when dealing with promises to simplify your code and reduce callback chains, however the below examples will also demonstrate Promise/then callback syntax.

### Script
The `Script` class can be used to load any script (by setting the `src` attribute to a url) and has an asynchronous queueing API so you can start queueing up functions to be run once it has finished loading:

```js
import { Script } from 'script-loading-toolkit';
// or use scriptToolkit.Script if using the unpkg browser distro.

class AcmeScript extends Script {
    constructor() {
        this.src = "http://acme.com/acmeScript.js";
    }
};
```

#### Loading
```js
Script.load() => Promise<this>
```

The `.load()` method will return a promise that will reject if the script fails to load or resolve with the instance itself once loading is complete.
```js
class AcmeScript extends Script {
    constructor() {
        this.src = "http://acme.com/acmeScript.js";
    }
};

const myScript = new AcmeScript();

/** Promise/then **/
myScript.load().then(() => {
    // The scipt has loaded. Do something here!
}).catch(err => {
    // Oh no it failed to load!
});

/** Async/Await **/
try {
    await acmeScript.load();
} catch(err) {
    // Oh no it failed to load!
}
```

Calling `.load()` multiple times will not cause the script to load more than once. Subsequent calls to `.load()` will all return the same promise or resolve immediatly if the script has already loaded.

```js
// These will all return the same promise.
myScript.load();
await myScript.load();

// This will resolve immediatly
myScript.load();
```

##### Enabling / Disabling loading
```js
Script.disable() => this
```
```js
Script.enable() => this
```
You can disable a script from loading, or re enable it with the `.disable()` and `.enable()` methods.

```js
myScript.disable();
try {
    await myScript.load();
} catch (err) {
    console.log(err); // > Could not load disabled script. 
}
```

#### Queueing
```js
Script.enqueue(fnc: () => T) => Promise<T>
```

You can queue callbacks to run once your script has loaded. When using `.enqueue()` a promise will be returned that will resolve with the return value of the passed function.
```js
class AcmeScript extends Script {
    constructor() {
        this.src = "http://acme.com/acmeScript.js";
    }
};
const myScript = new AcmeScript();

/** Promise/then **/
// The enqueued function will not execute until the script has loaded.
myScript.enqueue(() => "Loaded!").then((result) => {
    // The returned value of your function
    console.log(result) // > Loaded!
});

myScript.load();

/** Async/Await **/
const result = await myScript.enqueue(() => "Loaded!");
console.log(result) // > Loaded!
```

If the callback function returns a promise that promise will be resolved with `.enqueue`.
```js
myScript.load();
const result = await myScript.enqueue(async () => {
    await somethingAsynchronous();
    return "Loaded!"
});
console.log(result) // > Loaded!
```

Once the script has loaded, enqueued callbacks will be executed immediatly.
```js
await myScript.load();
await myScript.enqueue(() => "This will execute straight away.");
```

The `.enqueue()` method is most powerful for use when extending `Script` to create a facade that hides the need for the rest of your code to know whether the script has loaded to begin calling it's methods.

```js
class AcmeScript extends Script {
    constructor() {
        this.src = "http://acme.com/acmeScript.js";
    }

    foo() {
        return this.enqueue(() => window.acmeScript.foo());
    }

    bar() {
        return this.enqueue(() => window.acmeScript.bar());
    }
};

const myScript = new AcmeScript();

// Methods of AcmeScript can be called before it is loaded and they will execute once it has loaded.
myScript.foo();
myScript.bar();
```

#### Initialization
After the script has loaded, executing queued callbacks is triggered by the `initialize()` method. This method is not intended to be used directly, as it is called automatically after script loading finishes. If the script you have loaded requires initialization/configuration before it can be used; you can override the `initialize()` method and add your initialization logic there. Make sure to call `super.initialize()` after your initialization, in order to continue the Script lifecyle's completion.

```js
class AcmeScript extends Script {
    constructor() {
        this.src = "http://acme.com/acmeScript.js";
    }
    
    async initialize() {
        window.acmeScript.configure({accountId: 123456});
        super.initialize(); // Make sure to call the super method after your initialization is complete!
    }
};
```

#### Dependencies
```js
Script.addDependency(dependency: (Script | BasicScript), hasSideEffects?: boolean = false) => this
```

If other scripts are required for a script to function and you don't want to handle loading them separately you can add them as dependencies. By default dependencies will be loaded simultaneously with the dependant script.

```js
class DependencyScript extends Script {
    constructor() {
        this.src = "http://acme.com/someDependency.js";
    }
};
class AcmeScript extends Script {
    constructor() {
        this.src = "http://acme.com/acmeScript.js";
    }
};

const myDependency = new DependencyScript();
const myScript = new AcmeScript();

// 'myScript' and 'myDependency' will start loading simultaneously. 'myScript' will not finsih loading until 'myDependency' has also finished.
myScript.addDependency(myDependency);
await myScript.load();
console.log(myDependency.isLoaded); // > True!
```

If a dependency *MUST* be loaded before it's dependant script (i.e loading it has side effects that must be in place for the dependant to not error), add it with the `hasSideEffects` argument set to `true`.

```js
// 'myScript' will not begin loading until 'myDependency' has finished loading.
myScript.addDependency(myDependency, true);
await myScript.load();
```

#### Properties
The following properties are available on `Script` instances:

| Property         | Type    | Default | Description                                                                 |
| ---------------- | ------- | ------- | --------------------------------------------------------------------------- |
| .src             | string  | `""`    | URL of the script to load, including protocol (//, http://, https://, etc). |
| .isEnabled       | boolean | `true`  | True if loading this script is enabled.                                     |
| .isLoading       | boolean | `false` | True if the script is currently loading.                                    |
| .isLoaded        | boolean | `false` | True if the script has finished loading without error.                      |
| .isErrored       | boolean | `false` | True if the script has failed to load for some reason.                      |
| .isExecuted      | boolean | `false` | True if the script's callback queue has been executed.                      |
| .isInitialized   | boolean | `false` | True if the script has been initialized.                                    |
| .hasDependencies | boolean | `false` | True if dependencies have been added to load with this script.              |

#### Lifecycle Methods

| Method | Description |
| --- | --- |
| onEnabled | Called every time after the `.enable()` method is called. |
| onDisabled | Called every time after the `.disable()` method is called. |
| onLoading | Called the first time `.load()` method is called, if the script is enabled. |
| onLoaded | Called the first time after script loading completes. |
| onErrored | Called if the script fails to load (only if it was enabled). |
| onExecuted | Called the first time after all queued callbacks execute; triggered automatically after loading completes, as part of initialization. |
| onInitialized | Called the first time the `.initialize()` method is called, this happens automatically after loading completes. |

Lifecycle methods are intended for use by overriding them when extending Script.

```js
class AcmeScript extends Script {
    constructor() {
        this.src = "http://acme.com/acmeScript.js";
    }
    // Use lifecycle methods like this:
    onLoaded() {
        console.log('This will excecute when the script finishes loading!');
    }
};

// It is *not* recommended to override lifecycle methods directly:
const myScript = new Script();
myScript.onLoaded = () => console.log("Anti pattern!"); // Don't do this.
```


#### Direct Usage
You can use script directly without extension by creating an instance and overriding the `src` property.
```js
import { Script } from 'script-loading-toolkit';
// or use scriptToolkit.Script if using the unpkg browser distro.

const acmeScript = new Script();
acmeScript.src = "http://acme.com/acmeScript.js";

acmeScript.load();
```


---

### BasicScript 
`BasicScript` is a leaner implementation of Script without the asynchronous queueing API. You can use this when you don't need queueing functionality. This is mainly inteded to give you flexibility when composing your own objects with the provided [Mixin](#mixins) or with extension.
```js
import { BasicScript } from 'script-loading-toolkit';

const acmeScript = new BasicScript();
acmeScript.src = "http://acme.com/acmeScript.js";

acmeScript.load().then(() => {
    // The scipt has loaded. Do something here!
}).catch(err => {
    // Oh no it failed to load!
});
```
#### Properties

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| .src | string | `""` | URL of the script to load, including protocol (//, http://, https://, etc). |
| .isEnabled | boolean | `true` | True if loading this script is enabled. |
| .isLoading | boolean | `false` | True if the script is currently loading. |
| .isLoaded | boolean | `false` | True if the script has finished loading without error. |
| .isErrored | boolean | `false` | True if the script has failed to load for some reason. |
| .hasDependencies | boolean | `false` | True if dependencies have been added to load with this script. |

#### Lifecycle Methods

| Method | Description |
| --- | --- |
| onEnabled | Called every time after the `.enable()` method is called. |
| onDisabled | Called every time after the `.disable()` method is called. |
| onLoading | Called the first time `.load()` method is called, if the script is enabled. |
| onLoaded | Called the first time after script loading completes. |
| onErrored | Called if the script fails to load (only if it was enabled). |



---

### FunctionQueue
`FunctionQueue` is only the queueing functionality from `Script` without the script loading functionality. This can be useful for objects that might rely on a third party library being loaded, but you do not want to couple them with the logic to determine when that script should load.

```js
import { FunctionQueue, BasicScript } from 'script-loading-toolkit';

const myQueue = new FunctionQueue;

const myVideo = {
    id: 123,
    play: () => {
        return myQueue.enqueue(() => window.acmeVideo.play(this.id));
    },
    pause: () => {
        return myQueue.enqueue(() => window.acmeVideo.pause(this.id));
    }
}

// It is safe to call this method even if window.acmeVideo doesn't exist yet.
// It wont run until we execute the queue.
myVideo.play();

const acmeScript = new BasicScript();
acmeVideo.src = "http://acme.com/acme-video-library.js";

acmeScript.load().then(() => {
    // Execute the queue because now window.acmeVideo will exist.
    myQueue.execute();
});
```
#### Properties

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| .isExecuted | boolean | `false` | True if the script's callback queue has been executed. |

#### Lifecycle Methods

| Method | Description |
| --- | --- |
| onEnabled | Called every time after the `.enable()` method is called. |
| onExecuted | Called the first time after all queued callbacks execute; triggered automatically after loading completes, as part of initialization. |



---

### Mixins
The Script Loading Toolkit includes 'Mixin' implementations of each of the above classes to allow you greater flexibility over classic inheritence. The mixin function will add all the functionality of one of the toolkit classes to the given constructor:
```js
import { ScriptMixin } from 'script-loading-toolkit';

class AcmeSuperClass {
    someMethod() {
        console.log('hi!');
    }
}

class AcmeScript extends ScriptMixin(AcmeSuperClass) {
    constructor() {
        this.src = "http://acme.com/acme-video-library.js";
    }
}
const acmeScriptInstance = new AcmeScript();
acmeScriptInstance.someMethod(); // > hi!
acmeScriptInstance.load();
```

| Function | Description |
| --- | --- |
| ScriptMixin | Adds `Script` functionality. |
| FunctionQueueMixin | Adds `FunctionQueue` functionality. |
| BasicScriptMixin | Adds `BasicScript` functionality. |
| ScriptInitializerMixin | This mixin is to be used specifically on constructors/classes that implement both the `FunctionQueue` and `BasicScript` interfaces and adds the initializing functionality from `Script`. |