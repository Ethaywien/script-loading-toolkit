import { testSources } from  '../../../test/globals';

export const loadScriptElement = jest.fn().mockImplementation((element): Promise<void> => new Promise((resolve, reject): void => {
    if (element.src === testSources.validSrc) {
        setTimeout((): void => {
            window.testScriptLoaded = true;
            resolve();
        }, 1);
    } else {
        reject(new Error('Failed loading'));
    }
}));