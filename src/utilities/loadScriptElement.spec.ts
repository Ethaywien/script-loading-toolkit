import * as sinon from 'sinon';
import { loadScriptElement } from './loadScriptElement';
import { testSources } from  '../../test/globals';
import { createScriptElement } from './createScriptElement';

const { validSrc, notFoundSrc } = testSources;

describe('loadScriptElement', (): void => {
    let testScript: HTMLScriptElement;
    let documentHeadStub: sinon.SinonStub;
    beforeEach((): void => {
        testScript = createScriptElement(validSrc);
        window.testScriptLoaded = false;
        document.head.innerHTML = '';
        documentHeadStub = sinon.stub(document.head, 'appendChild').callsFake((script: Node): Node => {
            // @ts-ignore: Suprress mock implementation error
            script.onload();
            window.testScriptLoaded = true;
            return script;
        });
    });
    afterEach((): void => {
        documentHeadStub.restore();
    });
    it('Adds the given script tag to the page.', (): void => {
        loadScriptElement(testScript);
        expect(documentHeadStub.args[0][0]).toBe(testScript);
    });
    it('Resolves when the script has loaded.', async (): Promise<void> => {
        await loadScriptElement(testScript);
        expect(window.testScriptLoaded).toBe(true);
    });
    it('Rejects on error.', async (): Promise<void> => {
        documentHeadStub.restore();
        documentHeadStub = sinon.stub(document.head, 'appendChild').callsFake((script: Node): Node => {
            // @ts-ignore: Suprress mock implementation error
            script.onerror(new Error('error'));
            return script;
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