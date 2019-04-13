import { pipeResolver } from './pipeResolver';



describe('pipeResolver', (): void => {
    let testStart1: (input: string) => number;
    let testEnd1: (input: number) => number;
    beforeEach((): void => {
        testStart1 = jest.fn((input: string): number => input.length);
        testEnd1 = jest.fn((input: number): number => input*2);
    });

    it('Takes two functions and returns one function.', (): void => {
        const testFunc = (): Function => pipeResolver(testStart1, testEnd1);
        expect(testFunc).not.toThrow();
        expect(typeof testFunc()).toBe('function');
    });
    it('Does not execute given functions automatically.', (): void => {
        pipeResolver(testStart1, testEnd1);
        expect(testStart1).not.toBeCalled();
        expect(testEnd1).not.toBeCalled();
    });
    it('Executes given functions on calling the returned function.', async (): Promise<void> => {
        const testFunc = pipeResolver(testStart1, testEnd1);
        await  testFunc('test');
        expect(testStart1).toBeCalledTimes(1);
        expect(testEnd1).toBeCalledTimes(1);
    });
    it('Returned function can be executed multiple times.', async (): Promise<void> => {
        const testFunc = pipeResolver(testStart1, testEnd1);
        await testFunc('test');
        await testFunc('test2');
        expect(testStart1).toBeCalledTimes(2);
        expect(testEnd1).toBeCalledTimes(2);
    });
    it('When the returned function is called, the expected outputs of running the input through both given functions in order is returned.', async (): Promise<void> => {
        const testFunc = pipeResolver(testStart1, testEnd1);
        const testResult1 = await testFunc('test');
        const testResult2 = await testFunc('test2');
        expect(testResult1).toBe(8);
        expect(testResult2).toBe(10);
    });
    it('When the given functions return promises, the output of the returned function is the same.', async (): Promise<void> => {
        const testStartPromise1 = jest.fn(async (input: string): Promise<number> => input.length);
        const testEndPromise1 = jest.fn(async (input: number): Promise<number> => input*2);
        const testInput = '123456';

        const controlFunc = pipeResolver(testStart1, testEnd1);
        const testFunc = pipeResolver(testStartPromise1, testEnd1);
        const testFunc2 = pipeResolver(testStartPromise1, testEndPromise1);
        const testFunc3 = pipeResolver(testStart1, testEndPromise1);

        const controlResult = await controlFunc(testInput);
        const testResult1 = await testFunc(testInput);
        const testResult2 = await testFunc2(testInput);
        const testResult3 = await testFunc3(testInput);
        
        expect(testResult1).toBe(controlResult);
        expect(testResult2).toBe(controlResult);
        expect(testResult3).toBe(controlResult);
    });
});