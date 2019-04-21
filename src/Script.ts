import { Constructor } from './types';
import { FunctionQueue, FunctionQueueMixin, FunctionQueueState, initialFunctionQueueState } from './FunctionQueue';
import { BasicScript, BasicScriptMixin, BasicScriptState, initialBasicScriptState } from './BasicScript';

/** 
 * @typedef {Object} ScriptState
 * @property {boolean} loaded
 * @property {boolean} loading
 * @property {boolean} enabled
 * @property {boolean} errored
 */
export interface ScriptState extends BasicScriptState, FunctionQueueState {
    initialized: boolean;
};

/**
 * Initial state for scripts.
 */
export const initialScriptState: ScriptState = { 
    ...initialBasicScriptState,
    ...initialFunctionQueueState, 
    initialized: false
};

/**
 * @typedef {Object} ScriptInitializer
 */
export interface ScriptInitializer {
    isInitialized: boolean;
}

/** 
 * @typedef {Object} Script
 */
export interface Script extends FunctionQueue, BasicScript, ScriptInitializer {}

/**
 * Mixin to add initialization callbacks to classes with BasicScript and FunctionQueue apis.
 * 
 * @mixin
 * @param  {TBase} Base
 * @returns {Constructor<Script>}
 */
export const ScriptInitializerMixin = <TBase extends Constructor<BasicScript & FunctionQueue>>(Base: TBase): Constructor<ScriptInitializer> & TBase =>
    class extends Base implements ScriptInitializer{
        /**
         * Custom error namespace.
         * 
         * @protected
         * @property
         * @type {string}
         */
        protected _errorNamespace: string = 'Script';

        /**
         * Internal script state.
         * 
         * @protected
         * @property
         * @type {ScriptState}
         */
        protected _state: ScriptState = { ...initialScriptState };

        public get isInitialized(): boolean {
            return this._state.initialized;
        }
    };

export const ScriptMixin = <TBase extends Constructor>(Base: TBase): Constructor<Script> & TBase =>
    ScriptInitializerMixin(BasicScriptMixin(FunctionQueueMixin(Base)));

/**
 * Script loading class with asynchronous queueing api.
 * @class Script
 */
export const Script: {
    new (): Script;
    prototype: Script;
} = ScriptMixin(class{});
