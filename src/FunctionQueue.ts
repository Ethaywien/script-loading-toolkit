import { Constructor, Mixin } from "./types";
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
 * Initial state for function queues.
 */
export const initialFunctionQueueState: FunctionQueueState = {
    executed: false
};
/** 
 * @typedef {Function} QueuedFunction
 */
export type QueuedFunction = <T extends FunctionQueue>(input: T) => Promise<void>;
/** 
 * @typedef {Function} QueueableFunction
 */
export type QueueableFunction = <T1 extends FunctionQueue, T2>(input: T1) => T2;

/**
 * Mixin for function queueing functionality.
 * 
 * @mixin
 * @param  {TBase} Base - Constructor to extend.
 * @returns {Constructor<FunctionQueue & TBase>} Constructor with mixed in functionality.
 */
export const FunctionQueueMixin = <TBase extends Constructor> (Base: TBase) =>
    class FunctionQueue extends Base {
        /**
         * Custom error namespace.
         * 
         * @protected
         * @property
         * @type {string}
         */
        _errorNamespace: string = 'FunctionQueue';
        /**
         * Array to store enqueued functions.
         * 
         * @protected
         * @property
         * @type {Function[]}
         */
        _queue: QueuedFunction[] = [];
        /**
         * Internal queue state
         * 
         * @protected
         * @property
         * @type {Object}
         */
        _state: FunctionQueueState = { ...initialFunctionQueueState };
        
        /**
         * Has queue execution been completed.
         * @readonly
         * @type {boolean}
         */
        get isExecuted(): boolean {
            return this._state.executed;
        }
        /**
         * Add the given function to the queue.
         * @param {Function} fnc Function to enqueue. Functions will receive the instance of this class as an argument.
         * @returns {Promise<T>} Resolves with the result of fnc when it is run.
         */
        enqueue<T>(fnc: (target: this) => Promise<T>): Promise<T>
        enqueue<T>(fnc: (target: this) => T): Promise<T>
        enqueue<T>(fnc: (target: this) => T | Promise<T>): Promise<T> {
            // If argument is not a function, reject
            if (typeof fnc !== 'function') {
                throw contextualError(`Cannot enqueue input of type "${typeof fnc}", expected a function.`, this._errorNamespace);
            }
            return new Promise(async (resolve): Promise<void> => {
                // Wrap the given function with the resolver.
                const resolver: QueuedFunction = pipeResolver(fnc, resolve) as QueuedFunction;
                // Check if already executed
                if (this.isExecuted) {
                    // Execute the given function immediatly
                    return resolver(this);
                }
                // Add the function to the queue
                this._queue.push(resolver);
            });
        }
        /**
         * Execute all the functions in the queue in order.
         * @returns {Promise<this>}
         */
        async execute(): Promise<this> {
            // Return immediatly if already exected.
            if (this.isExecuted) 
                return this;
                
            // Grab the queue length.
            const queueLength = this._queue.length;
            // For each function in the queue.
            for(let i = 0; i < queueLength; i++) {
                // Remove the function from the queue.
                const fnc: QueuedFunction | undefined = this._queue.shift();
                // Execute the function.
                fnc && fnc(this);
            }
            // Mark the queue as executed
            this._state.executed = true;
            this.onExecuted();

            return this;
        }
        /** Lifecycle callback for queue execution complete. */
        onExecuted(): void { }
    };

export type FunctionQueueMixin = Mixin<typeof FunctionQueueMixin>;

/** Builder for FunctionQueue */
const FunctionQueueBuilder = (Base = class FunctionQueue {}): Constructor<FunctionQueueMixin> => FunctionQueueMixin(Base);

/**
 * Basic script to enqueue functions and batch execute them in order.
 * @class FunctionQueue
 */
export class FunctionQueue extends FunctionQueueBuilder() {}