import { contextualError } from './contextualError';

const testMessage = 'test message';
const testNamespace = 'test namespace';
const testErrorMsg: Error = new Error('test error');

describe('contextualError', (): void => {
    it('Does not throw the error it creates.', (): void => {
        expect((): Error => contextualError(testMessage)).not.toThrow();
    });
    
    it('Returns a new Error with a message matching the supplied argument.', (): void => {
        const testResult = contextualError(testMessage);
        expect(testResult.message).toBe(testMessage);
    });
    
    it('Prepends the optional namespace argument to the returned error message.', (): void => {
        const testResult = contextualError(testMessage, testNamespace);
        expect(testResult.message).toBe(`${testNamespace} - ${testMessage}`);
    });
    
    it('Appends the message from the optional error argument to the returned error message.', (): void => {
        const testResult = contextualError(testMessage, testNamespace, testErrorMsg);
        expect(testResult.message).toBe(`${testNamespace} - ${testMessage}:\n${testErrorMsg.message}`);
    });
    
    it('When namespace is ommited but error is supplied, the error message is still appended not prepended.', (): void => {
        const testResult = contextualError(testMessage, testErrorMsg);
        expect(testResult.message).toBe(`${testMessage}:\n${testErrorMsg.message}`);
    });
});