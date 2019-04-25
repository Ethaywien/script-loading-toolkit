# Script Loading Toolkit
A browser library for handling asynchronously loading and interacting with third party script dependencies without race conditions or render blocking. Written in TypeScript. 

## Installation
***TODO, not yet published! watch this space.***

For EcmaScript and CommonJS module distributions install with the package manager of your choice. (Recommended)

```sh
npm install script-loading-toolkit --save
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
`Script` can be used to load any script by url and has an asynchronous queueing API so you can start queueing up functions to be run once it has finished loading:

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
The load method will return a promise that will reject if the script fails to load or resolve with the instance itself once loading is complete.
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

Calling load multiple times will not cause the script to load more than once. Subsequent calls to `.load()` will all return the same promise or resolve immediatly if the script has already loaded.

```js
// These will all return the same promise.
myScript.load();
await myScript.load();

// This will resolve immediatly
myScript.load();
```


#### Queueing
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

#### Direct Usage
You can use script directly without extension by creating an instance and overriding the `src` property.
```js
import { Script } from 'script-loading-toolkit';
// or use scriptToolkit.Script if using the unpkg browser distro.

const acmeScript = new Script();
acmeScript.src = "http://acme.com/acmeScript.js";

/** Promise/then **/
acmeScript.enqueue(() => {
    // This function will be run when the script has loaded.
    return 'Yay!';
}).then((result) => {
    // The returned value of your function
    console.log(result) // > Yay!
});

acmeScript.load().then(() => {
    // The scipt has loaded. Do something here!
}).catch(err => {
    // Oh no it failed to load!
});

/** Async/Await **/
(async () => {
    await acmeScript.load();
    // You can also enqueue functions that return promises and 
    // those promises will be resolved before returning.
    const result = await acmeScript.enqueue(async () => 'Yay!');
    console.log(result); // > Yay!
})();
```

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

### As a facade
TODO

### Mixins
TODO