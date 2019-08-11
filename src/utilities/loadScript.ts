/**
 * Promise based script loading function.
 *
 * @param  {string} src - Script source.
 * @returns {Promise<void>}
 */
export function loadScript(src: string): Promise<void> {
    return new Promise((resolve, reject): void => {
        const _script: HTMLScriptElement = document.createElement("script");
        _script.type = "text/javascript";
        _script.src = src;
        _script.async = true;
    
        _script.onload = (): void => resolve();
        _script.onerror = (e): void => reject(e);
    
        document.head.appendChild(_script);
    });
};
