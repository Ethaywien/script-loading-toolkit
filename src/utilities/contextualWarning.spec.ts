import * as sinon from 'sinon';
import { contextualWarning } from './contextualWarning';

const testMessage = 'test message';
const testNamespace = 'test namespace';

describe('contextualWarning', (): void => {
    let consoleStub: sinon.SinonStub;
    beforeEach(() => {
        consoleStub = sinon.stub(console, 'warn');
    });
    afterEach(() => {
        consoleStub.restore();
    });
    it('Does not throw.', (): void => {
        expect((): void => contextualWarning(testMessage)).not.toThrow();
    });
    
    it('Logs the given warning message.', (): void => {
        contextualWarning(testMessage);
        expect(consoleStub.called).toBe(true);
    });
    
    it('Prepends the optional namespace argument to the warning message.', (): void => {
        contextualWarning(testMessage, testNamespace);
        expect(consoleStub.calledWith(`${testNamespace} - ${testMessage}`)).toBe(true);
    });
});