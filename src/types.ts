/**
 * @typedef {Function} Constructor
 * @param  {any[]} ...args
 * @returns {T}
 */
export type Constructor<T = {}> = new (...args: any[]) => T;