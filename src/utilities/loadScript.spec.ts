import { loadScript } from './loadScript';
import { testSources } from  '../../test/globals';

const { validSrc, notFoundSrc } = testSources;

describe('loadScript', (): void => {
    beforeEach((): void => {
        window.testScriptLoaded = false;
        document.head.innerHTML = '';
    });
    it('Adds a new script tag with the given source to the page.', (): void => {
        loadScript(validSrc);
        const scripts = document.getElementsByTagName('script');
        expect(scripts.length).toBe(1);
        expect(scripts[0].src).toBe(validSrc);
    });
    it('Adds the script tag with type of text/javascript.', (): void => {
        loadScript(validSrc);
        const scripts = document.getElementsByTagName('script');
        expect(scripts[0].type).toBe('text/javascript');
    });
    it('Resolves when the script has loaded.', async (): Promise<void> => {
        await loadScript(validSrc);
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
            await loadScript(notFoundSrc);
        } catch (err) {
            expect(err).toHaveProperty('message');
            expect(err.message).toMatch('error');
        }
    });
});