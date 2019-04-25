# Script Loading Toolkit
A browser library for handling asynchronously loading third party script dependencies without race conditions or render blocking. Written in TypeScript. 

## Installation
For EcmaScript and CommonJS module distributions install with NPM (Recommended)

```sh
npm install script-loading-toolkit --save
```

or include the UMD browser distribution directly:

```html
<script src="https://unpkg.com/script-loading-toolkit"></script>
```

**IMPORTANT:** Script Loading Toolkit requires **Promises**. If you wish to support older browsers that do not implement promises then you will need to pollyfill this functionality yourself. You can do so with this [NPM library](https://www.npmjs.com/package/promise-polyfill) or with [Babel](https://babeljs.io/docs/en/babel-polyfill).

## Usage
The script loading toolkit provides three major tools (Script, BasicScript and FunctionQueue) for managing script loading. These can be used directly by newing them up and setting a script src; however their intended use is for extending or mixing into your own classes to create facades or adapters to wrap third party libraries in order decouple your code from a third party interface you do not control and may or may not yet exist in the global scope.

We recommend you use Async/Await when dealing with promises to simplify your code and reduce callback chains, however the below examples will also demonstrate Promise/then callback syntax.

### Direct Usage

#### Script
`Script` can be used to load any script and has an asynchronous queueing API so you can start queueing up functions to be run once it has finished loading.

```js
import { Script } from 'script-loading-toolkit';
// or use scriptToolkit.Script if using the unpkg browser distro.

const acmeLibrary = new Script();
acmeLibrary.src = "http://acme.com/acmelibrary.js";

/** Promise/then **/
acmeLibrary.enqueue(() => {
    // This function will be run when the script has loaded.
    return 'Yay!';
}).then((result) => {
    // The returned value of your function
    console.log(result) // > Yay!
})

acmeLibrary.load().then(() => {
    // The scipt has loaded. Do something here!
}).catch(err => {
    // Oh no it failed to load!
});

/** Async/Await **/
(async () => {
    await acmeLibrary.load();
    // You can also enqueue functions that return promises and those promises will be resolved before returning.
    const result = await acmeLibrary.enqueue(async () => 'Yay!');
    console.log(result); // > Yay!
})();
```

#### BasicScript 
`BasicScript` is a leaner implementation of Script without the asynchronous queueing API. You can use this when you don't need queueing functionality.
```js
import { BasicScript } from 'script-loading-toolkit';

const acmeLibrary = new BasicScript();
acmeLibrary.src = "http://acme.com/acmelibrary.js";

acmeLibrary.load().then(() => {
    // The scipt has loaded. Do something here!
}).catch(err => {
    // Oh no it failed to load!
});
```

#### FunctionQueue
`FunctionQueue` is only the queueing functionality without the script loading functionality. This can be useful for objects that might rely on a third party library being loaded, but you do not want to couple them with the logic to determine when that script should load.

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

// It is safe to call this method even if window.acmeVideo doesn't exist yet. It wont run until we execute the queue.
myVideo.play();

const acmeLibrary = new BasicScript();
acmeVideo.src = "http://acme.com/acme-video-library.js";

acmeLibrary.load().then(() => {
    // Execute the queue because now window.acmeVideo will exist.
    myQueue.execute();
});
```

### As a facade
TODO

### Mixins
TODO