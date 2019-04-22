/**
 * @typedef {Function} Constructor
 * @param  {any[]} ...args
 * @returns {T}
 */
export type Constructor<T = object> = new (...args: any[]) => T;

/**
 * @typedef {Function} AnyFunction
 * @param  {any[]} ...args
 * @returns {T}
 */
export type AnyFunction<T = any> = (...args: any[]) => T;

/**
 * @typedef {Function} Mixin
 */
export type Mixin<T extends AnyFunction> = InstanceType<ReturnType<T>>;