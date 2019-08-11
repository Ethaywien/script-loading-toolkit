/**
 * Takes a html script element and returns a promise that resolves once it has loaded.
 *
 * @param  {HTMLScriptElement} scriptElement - HTML script element to load.
 * @returns {Promise<void>}
 */
export function loadScriptElement(scriptElement: HTMLScriptElement): Promise<void> {
    return new Promise((resolve, reject): void => {
        scriptElement.onload = (): void => resolve();
        scriptElement.onerror = (e): void => reject(e);
    
        document.head.appendChild(scriptElement);
    });
};