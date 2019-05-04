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
 * Mixin to add Script initialization callbacks to constructors that implement BasicScript and FunctionQueue.
 * 
 * @mixin
 * @param  {TBase} Base - Constructor to extend.
 * @returns {Constructor<ScriptInitializer & TBase>} Constructor with mixed in functionality.
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
         * Executed after the script has loaded.
         *
         * @protected
         * @returns {Promise<void>}
         */
        async _scriptLoaded(): Promise<void> {
            await super._scriptLoaded();
            await this.initialize();
        }

        /**
         * Has script initialization completed.
         * @readonly
         * @type {boolean}
         */
        get isInitialized(): boolean {
            return this._state.initialized;
        }

        /**
         * Executed after the script has loaded. Triggers initialization operations.
         * Overwrite this method to do script specific initialization logic.
         *
         * @returns {Promise<void>}
         */
        async initialize(): Promise<void> {
            if (this.isInitialized) return;
            await this.execute();
            this._state.initialized = true;
            this.onInitialized();
        }

        /** Lifecycle callback for script initialization complete. */
        onInitialized(): void { }
    };
export type ScriptInitializerMixin = Mixin<typeof ScriptInitializerMixin>;

/**
 * Mixin to add Script loading, asynchrounous queueing and initialization functionality to the given constructor.
 * 
 * @mixin
 * @param  {TBase} Base - Constructor to extend.
 * @returns {Constructor<Script & TBase>} Constructor with mixed in functionality.
 */
export const ScriptMixin = <TBase extends Constructor>(Base: TBase) =>
    ScriptInitializerMixin(BasicScriptMixin(FunctionQueueMixin(Base)));

export type ScriptMixin = Mixin<typeof ScriptMixin>;

/** Builder for Script */
export const ScriptBuilder = (Base = class Script {}): Constructor<ScriptMixin> => ScriptMixin(Base);

/**
 * Script loading class with asynchronous queueing API.
 * @class Script
 */
export class Script extends ScriptBuilder() {}