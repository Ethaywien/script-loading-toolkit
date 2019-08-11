/**
 * Creates a new script element with the provided source.
 *
 * @param  {string} [src] - Script source.
 * @returns {HTMLScriptElement}
 */
export function createScriptElement(src?: string): HTMLScriptElement {
    const _script: HTMLScriptElement = document.createElement('script');
    _script.type = 'text/javascript';
    _script.src = src || '';
    _script.async = true;
    return _script;
}
