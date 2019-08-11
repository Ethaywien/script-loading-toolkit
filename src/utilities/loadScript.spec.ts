import * as sinon from 'sinon';
import { loadScript } from './loadScript';
import { testSources } from  '../../test/globals';

const { validSrc, notFoundSrc } = testSources;

describe('loadScript', (): void => {
    let documentHeadStub: sinon.SinonStub;
    beforeEach((): void => {
        window.testScriptLoaded = false;
        document.head.innerHTML = '';
        documentHeadStub = sinon.stub(document.head, 'appendChild').callsFake((script: Node): Node => {
            // @ts-ignore: Suprress mock implementation error
            script.onload();
            window.testScriptLoaded = true;
            return script;
        })
    });
    afterEach((): void => {
        documentHeadStub.restore();
    });
    it('Adds a new script tag with the given source to the page.', (): void => {
        loadScript(validSrc);
        expect(documentHeadStub.args[0][0].src).toBe(validSrc);
    });
    it('Adds the script tag with type of text/javascript.', (): void => {
        loadScript(validSrc);
        expect(documentHeadStub.args[0][0].type).toBe('text/javascript');
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
        documentHeadStub.restore();
        documentHeadStub = sinon.stub(document.head, 'appendChild').callsFake((script: Node): Node => {
            // @ts-ignore: Suprress mock implementation error
            script.onerror(new Error('error'));
            return script;
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