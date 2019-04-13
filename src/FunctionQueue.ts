import { Constructor } from "./types";
import { pipeResolver } from "./utilities/pipeResolver";
import { contextualError } from "./utilities/contextualError";

/** 
 * @typedef {Object} FunctionQueueState
 * @property {boolean} executed
 */
export interface FunctionQueueState {
    [key: string]: boolean;
    executed: boolean;
};

/** 
 * @typedef {Function} ResolverFunc
 */
export type ResolverFunc = <T extends FunctionQueue>(input: T) => Promise<void>;

/** 
 * @typedef {Object} FunctionQueue
 */
export interface FunctionQueue {
    /**
     * Has queue execution been completed.
     * @readonly
     * @type {boolean}
     */
    readonly isExecuted: boolean;
    /**
     * Execute all the functions in the queue in order.
     * @returns {Promise<this>}
     */
    execute(): Promise<this>;
    /**
     * Add the given function to the queue.
     * @param {Function} fnc Function to enqueue. Functions will receive the instance of this class as an argument.
     * @returns {Promise<T>} Resolves with the result of fnc when it is run.
     */
    enqueue<T>(fnc: (target: this) => T): Promise<T>;
    enqueue<T>(fnc: (target: this) => Promise<T>): Promise<T>;
    enqueue<T>(fnc: (target: this) => T | Promise<T>): Promise<T>;
    /** Lifecycle callback for queue execution complete. */
    onExecuted(): void;
}

/**
 * Mixin for function queueing functionality.
 * 
 * @mixin
 * @param  {TBase} Base
 * @returns {Constructor<FunctionQueue>}
 */
export function mixinFunctionQueue<TBase extends Constructor>(Base: TBase): Constructor<FunctionQueue> & TBase {

    return class extends Base implements FunctionQueue{

        /**
         * Custom error namespace.
         * 
         * @protected
         * @property
         * @type {string}
         */
        protected _errorNamespace: string = 'FunctionQueue';

        /**
         * Array to store enqueued functions.
         * 
         * @protected
         * @property
         * @type {Function[]}
         */
        protected _queue: ResolverFunc[] = [];

        /**
         * Internal queue state
         * 
         * @protected
         * @property
         * @type {Object}
         */
        protected _state: FunctionQueueState = {
            executed: false,
        };

        public get isExecuted(): boolean {
            return this._state.executed;
        }

        public enqueue<T>(fnc: (target: this) => Promise<T>): Promise<T>
        public enqueue<T>(fnc: (target: this) => T): Promise<T>
        public enqueue<T>(fnc: (target: this) => T | Promise<T>): Promise<T> {
            return new Promise(async (resolve, reject): Promise<void> => {
                // If argument is not a function, reject
                if (typeof fnc !== 'function') {
                    return reject(contextualError(`Cannot queue input of type ${typeof fnc}, expected function.`, this._errorNamespace));
                }
                // Wrap the given function with the resolver.
                const resolver: ResolverFunc = pipeResolver(fnc, resolve) as ResolverFunc;
                // Check if already executed
                if (this.isExecuted) {
                    // Execute the given function immediatly
                    return resolver(this);
                }
                // Add the function to the queue
                this._queue.push(resolver);
            });
        }

        public async execute(): Promise<this> {
            // Return immediatly if already exected.
            if (this.isExecuted) 
                return this;
                
            // Grab the queue length.
            const queueLength = this._queue.length;
            // For each function in the queue.
            for(let i = 0; i < queueLength; i++) {
                // Remove the function from the queue.
                const fnc: ResolverFunc | undefined = this._queue.shift();
                // Execute the function.
                fnc && fnc(this);
            }
            // Mark the queue as executed
            this._state.executed = true;
            this.onExecuted();

            return this;
        }

        public onExecuted(): void { }
    };
}

/**
 * Basic script to enqueue functions and batch execute them in order.
 * @class FunctionQueue
 */
export const FunctionQueue: {
    new (): FunctionQueue;
    prototype: FunctionQueue;
} = mixinFunctionQueue(class{});
