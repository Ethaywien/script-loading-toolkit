import { loadScript } from './loadScript';


const testScript = window.testScript;
const testFailedScript = window.testFailedScript;

describe('loadScript', (): void => {
    beforeEach((): void => {
        window.testScriptLoaded = false;
        document.head.innerHTML = '';
    });
    it('Adds a new script tag with the given source to the page.', (): void => {
        loadScript(testScript);
        const scripts = document.getElementsByTagName('script');
        expect(scripts.length).toBe(1);
        expect(scripts[0].src).toBe(testScript);
    });
    it('Adds the script tag with type of text/javascript.', (): void => {
        loadScript(testScript);
        const scripts = document.getElementsByTagName('script');
        expect(scripts[0].type).toBe('text/javascript');
    });
    it('Resolves when the script has loaded.', async (): Promise<void> => {
        await loadScript(testScript);
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
            await loadScript(testFailedScript);
        } catch (err) {
            expect(err).toHaveProperty('message');
            expect(err.message).toMatch('error');
        }
    });
});