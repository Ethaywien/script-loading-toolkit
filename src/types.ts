/**
 * @typedef {Function} Constructor
 * @param  {any[]} ...args
 * @returns {T}
 */
export type Constructor<T = object> = new (...args: any[]) => T; /* eslint-disable-line */

/**
 * @typedef {Function} AnyFunction
 * @param  {any[]} ...args
 * @returns {T}
 */
// 
export type AnyFunction<T = any> = (...args: any[]) => T; /* eslint-disable-line */

/**
 * @typedef {Function} Mixin
 */
export type Mixin<T extends AnyFunction> = InstanceType<ReturnType<T>>;