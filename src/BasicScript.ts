import { loadScript } from "./utilities/loadScript";
import { contextualError } from "./utilities/contextualError";
import { Constructor, Mixin } from "./types";

/** 
 * @typedef {Object} BasicScriptState
 * @property {boolean} loaded
 * @property {boolean} loading
 * @property {boolean} enabled
 * @property {boolean} errored
 */
export interface BasicScriptState {
    [key: string]: boolean;
    enabled: boolean;
    loaded: boolean;
    loading: boolean; 
    errored: boolean;
};

/**
 * Initial state for basic scripts.
 */
export const initialBasicScriptState: BasicScriptState = {
    enabled: true,
    loaded: false,
    loading: false,
    errored: false
};

/** 
 * @typedef {Object} BasicScript
 */
export interface BasicScript {
    /**
     * Script source as a URL string.
     * @type {string}
     */
    src: string;
    /**
     * Is the script enabled (disabled scripts will not load).
     * @readonly
     * @type {boolean}
     */
    readonly isEnabled: boolean;
    /**
     * Has the script finished loading.
     * @readonly
     * @type {boolean}
     */
    readonly isLoading: boolean;
    /**
     * Is the script loading.
     * @readonly
     * @type {boolean}
     */
    readonly isLoaded: boolean;
    /**
     * Has the script failed to load.
     * @readonly
     * @type {boolean}
     */
    readonly isErrored: boolean;
    /**
     * Enable this script to load.
     * @returns {this} The instance / itself
     */
    enable(): this;
    /**
     * Disable this script from loading.
     * @returns {this} The instance / itself
     */
    disable(): this;
    /**
     * Load the script if it is enabled and not previously loaded.
     * @returns {Promise<this>} A promise that resolves with the instance once loading is complete or rejects if loading fails.
     */
    load(): Promise<this>;
    /** Lifecycle callback for loading enabled. */
    onEnabled(): void;
    /** Lifecycle callback for loading  disabled. */
    onDisabled(): void;
    /** Lifecycle callback for loading commenced. */
    onLoading(): void;
    /** Lifecycle callback for loading complete. */
    onLoaded(): void;
    /** Lifecycle callback for loading errored. */
    onErrored(): void;
}

/**
 * Mixin for basic script functionality without asynchronous queueing.
 * 
 * @mixin
 * @param  {TBase} Base
 * @returns {Constructor<BasicScript>}
 */
export const BasicScriptMixin = <TBase extends Constructor>(Base: TBase): Constructor<BasicScript> & TBase =>
    class extends Base implements BasicScript{
        /**
         * Custom error namespace.
         * 
         * @protected
         * @property
         * @type {string}
         */
        protected _errorNamespace: string = 'BasicScript';

        /**
         * Promise to track loading completion on subsequent concurrent calls of 'load'.
         * 
         * @protected
         * @property
         * @type {(Promise<this>?)} Promise that will resolve with this instance when loading is complete.
         */
        protected _loadingPromise: Promise<this> | null = null;

        /**
         * Internal script loading state.
         * 
         * @protected
         * @property
         * @type {BasicScriptState}
         */
        protected _state: BasicScriptState = { ...initialBasicScriptState };

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

        public src: string = '';
        
        public get isEnabled(): boolean {
            return this._state.enabled;
        }

        public get isLoaded(): boolean {
            return this._state.loaded;
        }

        public get isLoading(): boolean {
            return this._state.loading;
        }

        public get isErrored(): boolean {
            return this._state.errored;
        }

        public enable(): this {
            this._state.enabled = true;
            this.onEnabled();
            return this;
        }

        public disable(): this {
            this._state.enabled = false;
            this.onDisabled();
            return this;
        }

        public async load(): Promise<this> {
            // If the script is disabled reject.
            if (!this.isEnabled) {
                throw contextualError(`Could not load disabled script. \n ${this.src}`, this._errorNamespace);
            }

            // If the script has already loaded return straight away.
            if (this.isLoaded) {
                return this;
            }
            
            // If it has no source specified throw.
            if (this.src === '') {
                throw contextualError(`Could not load script with source of ''.`, this._errorNamespace);
            }

            // If the script is loading return the loading promise.
            if (this.isLoading && this._loadingPromise) {
                return this._loadingPromise;
            }

            // If we have not created a promise to track loading status, do so.
            if (!this._loadingPromise) {
                this._loadingPromise = new Promise(async (resolve, reject): Promise<void> => {
                    // Flag the script as loading
                    await this._scriptLoading();
                    
                    try{
                        // Load the script
                        await loadScript(this.src);
                    } catch(err) {
                        // Flag the script as errored
                        await this._scriptError();
                        return reject(contextualError(`Error loading ${this.src} `, this._errorNamespace, err));
                    }

                    // Flag the script as loaded
                    await this._scriptLoaded();

                    return resolve(this);
                });
            }

            return this._loadingPromise;
        }

        public onEnabled(): void { }

        public onDisabled(): void { }

        public onLoading(): void { }

        public onLoaded(): void { }

        public onErrored(): void { }
    };


/**
 * Basic script loading class without an asynchronous queueing api.
 * @class BasicScript
 */
export const BasicScript: {
    new (): BasicScript;
    prototype: BasicScript;
} = BasicScriptMixin(class{});
