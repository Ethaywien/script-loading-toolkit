import { testSources } from  '../../../test/globals';

export const loadScript = jest.fn().mockImplementation((path): Promise<void> => new Promise((resolve, reject): void => {
    if (path === testSources.validSrc) {
        setTimeout((): void => {
            window.testScriptLoaded = true;
            resolve();
        }, 1);
    } else {
        reject(new Error('Failed loading'));
    }
}));