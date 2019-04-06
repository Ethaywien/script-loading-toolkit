/**
 * @param  {string} msg - Message to throw
 * @param  {string} [nameSpace] - Namespace to prefix the error with
 * @param  {Error} [err] - Original error to pull message off of for extra context.
 * @returns {Error}
 */
export function contextualError(msg: string, nameSpace?: string, err?: Error): Error
export function contextualError(msg: string, nameSpace?: string): Error
export function contextualError(msg: string, err?: Error): Error
export function contextualError(msg: string, arg2?: string | Error, arg3?: Error): Error {
    const nameSpace: string = arg2 && typeof arg2 === 'string' ? `${arg2} - ` : '';
    let errMsg: string = typeof arg2 === 'object' ? `:\n${arg2.message}` : '';
    if (arg3 && typeof arg3 === 'object') {
        errMsg = `:\n${arg3.message}`
    }
    return new Error(`${nameSpace}${msg}${errMsg}`);
};