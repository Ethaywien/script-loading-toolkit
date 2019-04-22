import { Constructor, Mixin } from './types';
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
 * Mixin to add initialization callbacks to classes with BasicScript and FunctionQueue apis.
 * 
 * @mixin
 * @param  {TBase} Base
 * @returns {Constructor<Script>}
 */
export const ScriptInitializerMixin = <TBase extends Constructor<BasicScript & FunctionQueue>>(Base: TBase) =>
    class Script extends Base {
        /**
         * Custom error namespace.
         * 
         * @protected
         * @property
         * @type {string}
         */
        _errorNamespace: string = 'Script';

        /**
         * Internal script state.
         * 
         * @protected
         * @property
         * @type {ScriptState}
         */
        _state: ScriptState = { ...initialScriptState };

        /**
         * Executed after the script has loaded. Triggers initialization operations.
         *
         * @protected
         * @returns {Promise<QueuedScript>}
         */
        async _scriptLoaded(): Promise<void> {
            await super._scriptLoaded();
            //return await this.something();
        }

        get isInitialized(): boolean {
            return this._state.initialized;
        }
    };
export type ScriptInitializerMixin = Mixin<typeof ScriptInitializerMixin>;

export const ScriptMixin = <TBase extends Constructor>(Base: TBase) =>
    ScriptInitializerMixin(BasicScriptMixin(FunctionQueueMixin(Base)));

export type ScriptMixin = Mixin<typeof ScriptMixin>;

/** Builder for Script */
const ScriptBuilder = (Base = class Script {}): Constructor<ScriptMixin> => ScriptMixin(Base);
/**
 * Script loading class with asynchronous queueing api.
 * @class Script
 */
export class Script extends ScriptBuilder() {}