import { loadScriptElement } from './loadScriptElement';
import { testSources } from  '../../test/globals';
import { createScriptElement } from './createScriptElement';

const { validSrc, notFoundSrc } = testSources;

describe('loadScriptElement', (): void => {
    let testScript: HTMLScriptElement;
    beforeEach((): void => {
        testScript = createScriptElement(validSrc);
        window.testScriptLoaded = false;
        document.head.innerHTML = '';
    });
    it('Adds the given script tag to the page.', (): void => {
        loadScriptElement(testScript);
        const scripts = document.getElementsByTagName('script');
        expect(scripts.length).toBe(1);
        expect(scripts[0]).toBe(testScript);
    });
    it('Resolves when the script has loaded.', async (): Promise<void> => {
        await loadScriptElement(testScript);
        expect(window.testScriptLoaded).toBe(true);
    });
    it('Rejects on error.', async (): Promise<void> => {
        Object.defineProperty(HTMLScriptElement.prototype, 'src', {
            set: function (source: string): string {
                setTimeout((): void => this.onerror(new Error('error')));
                return source;
            }
        });
        expect.assertions(2);
        try {
            testScript = createScriptElement(notFoundSrc);
            await loadScriptElement(testScript);
        } catch (err) {
            expect(err).toHaveProperty('message');
            expect(err.message).toMatch('error');
        }
    });
});