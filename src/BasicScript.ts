import { loadScript } from "./utilities/loadScript";
import { contextualError } from "./utilities/contextualError";
import { Constructor } from "./types";

/** 
 * @typedef {Object} ScriptState
 * @property {boolean} loaded
 * @property {boolean} loading
 * @property {boolean} enabled
 * @property {boolean} errored
 */
interface ScriptState {
    [key: string]: boolean;
    enabled: boolean;
    loaded: boolean;
    loading: boolean; 
    errored: boolean;
};

/**
 * Mixin for basic script functionality without asynchronous queueing.
 * 
 * @mixin
 * @param  {TBase} Base
 * @returns {TBase}
 */
export function mixinBasicScript<TBase extends Constructor>(Base: TBase): TBase {
    return class BasicScript extends Base {

        /**
         * Custom error namespace.
         * 
         * @protected
         * @property
         * @type {string}
         */
        protected _errorNamespace: string = 'BasicScript';

        /**
         * Internal script loading state.
         * 
         * @protected
         * @property
         * @type {ScriptState}
         */
        protected _state: ScriptState = {
            enabled: true,
            loaded: false,
            loading: false,
            errored: false
        };

        /**
         * Script source as a URL string.
         * 
         * @public
         * @property
         * @type {string}
         */
        public src: string = '';

        /**
         * Is the script enabled (disabled scripts will not load).
         *
         * @public
         * @readonly
         * @property
         * @type {boolean}
         */
        public get isEnabled(): boolean {
            return this._state.enabled;
        }

        /**
         * Has the script finished loading.
         *
         * @public
         * @readonly
         * @property
         * @type {boolean}
         */
        public get isLoaded(): boolean {
            return this._state.loaded;
        }

        /**
         * Is the script loading.
         *
         * @public
         * @property
         * @readonly
         * @type {boolean}
         */
        public get isLoading(): boolean {
            return this._state.loading;
        }

        /**
         * Has the script failed to load.
         *
         * @public
         * @property
         * @readonly
         * @type {boolean}
         */
        public get isErrored(): boolean {
            return this._state.errored;
        }

        /**
         * Executed when the script starts loading.
         *
         * @protected
         * @returns {Promise<this>}
         */
        protected async _scriptLoading(): Promise<this> {
            this._state.loading = true;
            this.onLoading();
            return this;
        }

        /**
         * Executed after the script has loaded.
         *
         * @protected
         * @returns {Promise<this>}
         */
        protected async _scriptLoaded(): Promise<this> {
            this._state.loading = false;
            this._state.loaded = true;
            this.onLoaded();
            return this;
        }

        /**
         * Executed after the script has thrown an error while loading.
         *
         * @protected
         * @returns {Promise<this>}
         */
        protected async _scriptError(): Promise<this> {
            this._state.loading = false;
            this._state.errored = true;
            this.onErrored();
            return this;
        
        }

        /**
         * Enable this script to load.
         * 
         * @public
         * @returns this
         */
        public enable(): this {
            this._state.enabled = true;
            this.onEnabled();
            return this;
        }

        /**
         * Disable this script from loading.
         * 
         * @public
         * @returns this
         */
        public disable(): this {
            this._state.enabled = false;
            this.onEnabled();
            return this;
        }

        /**
         * Load the script if it is enabled and not previously loaded.
         *
         * @public
         * @method
         * @returns {Promise<this>}
         */
        public async load(): Promise<this> {
            // If the script is loading or already loaded just return.
            if (this.isLoaded && !this.isLoading) {
                return this;
            }

            // If the script is disabled throw.
            if (!this.isEnabled) {
                throw contextualError(`Could not load disabled script. \n ${this.src}`, this._errorNamespace);
            }

            // Flag the script as loading
            await this._scriptLoading();
            
            try{
                // Load the script
                await loadScript(this.src);
            } catch(err) {
                // Flag the script as errored
                await this._scriptError();
                throw contextualError(`Error loading ${this.src} `, this._errorNamespace, err);
            }

            // Flag the script as loaded
            await this._scriptLoaded();

            return this;
        }

        /**
         * Lifecycle callback for loading enabled.
         * 
         * @public
         */
        public onEnabled(): void { }

        /**
         * Lifecycle callback for loading  disabled.
         * 
         * @public
         */
        public onDisabled(): void { }

        /**
         * Lifecycle callback for loading commenced.
         * 
         * @public
         */
        public onLoading(): void { }

        /**
         * Lifecycle callback for loading complete.
         * 
         * @public
         */
        public onLoaded(): void { }

        /**
         * Lifecycle callback for loading errored.
         * 
         * @public
         */
        public onErrored(): void { }
    };
}

/**
 * Basic script loading class without an asynchronous queueing api.
 * @class BasicScript
 */
export const BasicScript = mixinBasicScript(class{});
