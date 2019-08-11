import { createScriptElement } from './createScriptElement';
import { testSources } from  '../../test/globals';

const { validSrc } = testSources;

describe('createScriptElement', (): void => {
    beforeEach((): void => {
        window.testScriptLoaded = false;
        document.head.innerHTML = '';
    });
    it('Accepts one or zero arguments.', (): void => {
        const testFnc1 = (): HTMLScriptElement =>  createScriptElement(validSrc);
        const testFnc2 = (): HTMLScriptElement =>  createScriptElement();
        expect(testFnc1).not.toThrowError();
        expect(testFnc2).not.toThrowError();
    });
    it('Returns a script element with type of text/javascript.', (): void => {
        const script1 = createScriptElement(validSrc);
        expect(script1).toBeInstanceOf(HTMLScriptElement);
        expect(script1.type).toBe('text/javascript');
    });
    it('Returns an async script element .', async (): Promise<void> => {
        const script1 = createScriptElement(validSrc);
        expect(script1.async).toBe(true);
    });
    it('Returns a script element with the given source .', async (): Promise<void> => {
        const script1 = createScriptElement(validSrc);
        expect(script1.src).toBe(validSrc);
    });
    it('Returns a script element with an empty source if none is supplied.', async (): Promise<void> => {
        const script1 = createScriptElement();
        expect(script1.src).toBe('');
    });
});