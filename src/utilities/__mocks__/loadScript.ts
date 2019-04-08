export const loadScript = jest.fn().mockImplementation((path): Promise<void> => new Promise((resolve, reject): void => {
    if (path === window.testScript) {
        setTimeout((): void => {
            window.testScriptLoaded = true;
            resolve();
        }, 10);
    } else {
        reject(new Error('Failed loading'));
    }
}));