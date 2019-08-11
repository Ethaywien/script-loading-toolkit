/**
 * @param  {string} msg - Message to warn
 * @param  {string} [nameSpace] - Namespace to prefix the warning with
 * @returns {void}
 */
export function contextualWarning(msg: string, nameSpace?: string): void {
    nameSpace = nameSpace ? `${nameSpace} - ` : '';
    console.warn(`${nameSpace}${msg}`);
};