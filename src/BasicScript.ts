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
 * Mixin for basic script functionality without asynchronous queueing.
 * 
 * @mixin
 * @param  {TBase} Base - Class to extend
 * @returns {Constructor<BasicScript>} Class with BasicScript mixin functionality
 */
export const BasicScriptMixin = <TBase extends Constructor>(Base: TBase) => 
    class BasicScriptMixin extends Base {

        /**
         * Custom error namespace.
         * 
         * @protected
         * @property
         * @type {string}
         */
        _errorNamespace: string = 'BasicScript';
        /**
         * Array to store dependencies that should load with this script
         * @property
         * @type {BasicScript[]}
         */
        _softDependencies: BasicScript[] = [];
        /**
         * Array to store hard dependencies that should load before this script
         * @property
         * @type {BasicScript[]}
         */
        _hardDependencies: BasicScript[] = [];
        /**
         * Array to store loading promise of dependency scripts
         * @property
         * @type {Promise<BasicScript>[]}
         */
        _loadingDependencies: Promise<BasicScript>[] = [];

        /**
         * Promise to track loading completion on subsequent concurrent calls of 'load'.
         * 
         * @protected
         * @property
         * @type {(Promise<this>?)} Promise that will resolve with this instance when loading is complete.
         */
        _loadingPromise: Promise<this> | null = null;
        /**
         * Internal script loading state.
         * 
         * @protected
         * @property
         * @type {BasicScriptState}
         */
        _state: BasicScriptState = { ...initialBasicScriptState };

        /**
         * True if any hard dependencies have been added.
         * 
         * @protected
         * @property
         * @type {boolean}
         */
        get _hasHardDependencies(): boolean {
            return !!this._hardDependencies.length;
        }
        /**
         * True if any soft dependencies have been added.
         * 
         * @protected
         * @property
         * @type {boolean}
         */
        get _hasSoftDependencies(): boolean {
            return !!this._softDependencies.length;
        }
        /**
         * Trigger dependencies of this script to load and waits for hard dependencies to finish.
         *
         * @protected
         * @returns {Promise<void>}
         */
        async _loadDependencies(): Promise<void> {
            const loader = (dependency: BasicScript): Promise<BasicScript> => dependency.load();
            let loadingHardDependencies: Promise<BasicScript>[] = [];
            
            // Start hard dependencies loading
            if (this._hasHardDependencies) {
                loadingHardDependencies = this._hardDependencies.map(loader);
            }
            // Start soft dependencies loading
            if (this._hasSoftDependencies) {
                this._loadingDependencies = this._softDependencies.map(loader);
            }
            // Wait for hard dependencies to finish
            if (this._hasHardDependencies) {
                await Promise.all(loadingHardDependencies);
            }
        }
        /**
         * Executed when the script starts loading.
         *
         * @protected
         * @returns {Promise<void>}
         */
        async _scriptLoading(): Promise<void> {
            this._state.loading = true;
            this.onLoading();
        }
        /**
         * Executed after the script has loaded.
         *
         * @protected
         * @returns {Promise<void>}
         */
        async _scriptLoaded(): Promise<void> {
            if (this._hasSoftDependencies) {
                await Promise.all(this._loadingDependencies);
            }
            this._state.loading = false;
            this._state.loaded = true;
            this.onLoaded();
        }
        /**
         * Executed after the script has thrown an error while loading.
         *
         * @protected
         * @returns {Promise<void>}
         */
        async _scriptError(): Promise<void> {
            this._state.loading = false;
            this._state.errored = true;
            this.onErrored();
        }

        /**
         * Script source as a URL string.
         * @type {string}
         */
        src: string = '';
        /**
         * Is the script enabled (disabled scripts will not load).
         * @readonly
         * @type {boolean}
         */    
        get isEnabled(): boolean {
            return this._state.enabled;
        }
        /**
         * Has the script finished loading.
         * @readonly
         * @type {boolean}
         */    
        get isLoaded(): boolean {
            return this._state.loaded;
        }
        /**
         * Is the script loading.
         * @readonly
         * @type {boolean}
         */
        get isLoading(): boolean {
            return this._state.loading;
        }
        /**
         * Has the script failed to load.
         * @readonly
         * @type {boolean}
         */
        get isErrored(): boolean {
            return this._state.errored;
        }
        /**
         * Does the script have dependencies.
         * @readonly
         * @type {boolean}
         */
        get hasDependencies(): boolean {
            return this._hasHardDependencies || this._hasSoftDependencies;
        }

        /**
         * Add a dependency script that will be loaded along with this script.
         * @param dependency - The script to load.
         * @param [sideEffects=false] - Flag if the dependency has side effects that must be in place for this script loads.
         * @returns {this}  The instance / itself
         */
        addDependency(dependency: BasicScript, hasSideffects: boolean = false): this {
            // If the script has already loaded throw.
            if (this.isLoaded || this.isLoading) {
                throw contextualError(`Error adding dependency. Script has already started loading.`, this._errorNamespace);
            }
            // If the given dependency is not a script throw.
            if (typeof dependency.load !== 'function') {
                throw contextualError(`Error adding dependency. Given object has no 'load' method.`, this._errorNamespace);
            }
            // If the dependency has side effects:
            if (hasSideffects) {
                // Add as a hard dependency.
                this._hardDependencies.push(dependency);
            } else {
                // Otherwise add as a normal dependency.
                this._softDependencies.push(dependency);
            }
            return this;
        }
        /**
         * Enable this script to load.
         * @returns {this} The instance / itself
         */
        enable(): this {
            this._state.enabled = true;
            this.onEnabled();
            return this;
        }
        /**
         * Disable this script from loading.
         * @returns {this} The instance / itself
         */
        disable(): this {
            this._state.enabled = false;
            this.onDisabled();
            return this;
        }
        /**
         * Load the script if it is enabled and not previously loaded.
         * @returns {Promise<this>} A promise that resolves with the instance once loading is complete or rejects if loading fails.
         */
        async load(): Promise<this> {
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
                        // Start dependencies loading
                        await this._loadDependencies();

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
        /** Lifecycle callback for loading enabled. */
        onEnabled(): void { }
        /** Lifecycle callback for loading  disabled. */
        onDisabled(): void { }
        /** Lifecycle callback for loading commenced. */
        onLoading(): void { }
        /** Lifecycle callback for loading complete. */
        onLoaded(): void { }
        /** Lifecycle callback for loading errored. */
        onErrored(): void { }
    };

export type BasicScriptMixin = Mixin<typeof BasicScriptMixin>;
/**
 * Basic script loading class without an asynchronous queueing api.
 * @class BasicScript
 */
export const BasicScript = BasicScriptMixin(class{});
export type BasicScript = InstanceType<typeof BasicScript>
