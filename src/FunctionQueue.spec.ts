import { mixinFunctionQueue, FunctionQueue, QueuedFunction, QueueableFunction } from './FunctionQueue';

describe('mixinFunctionQueue', (): void => {
    it('Adds FunctionQueue functionality to given constructor.', (): void => {
        class TestClass {
            public static testProp: string = 'test';
        };
        const TestMixinClass = mixinFunctionQueue(TestClass);
        expect(TestMixinClass.testProp).toBe('test');
        expect(typeof TestMixinClass.prototype.execute).toBe('function');
        expect(typeof TestMixinClass.prototype.enqueue).toBe('function');
    });
});

describe('FunctionQueue', (): void => {
    it('Can be newed.', (): void => {
        const testFunc = (): FunctionQueue => new FunctionQueue();
        expect(testFunc).not.toThrow();
        expect(testFunc()).toBeInstanceOf(FunctionQueue);
    });

    describe('Properties: ', (): void => {
        describe('#isExecuted', (): void => {
            it('Defaults to false.', (): void => {
                const testInstance = new FunctionQueue();
                expect(testInstance.isExecuted).toBe(false);
            });
        });
    });

    describe('Methods: ', (): void => {
        let testArg1: QueueableFunction;
        let testArg2: QueueableFunction;
        let testPromiseArg1: QueueableFunction;
        let testPromiseArg2: QueueableFunction;
        let testInstance: FunctionQueue;

        beforeEach((): void => {
            testArg1 = jest.fn((): number => 1) as QueueableFunction;
            testArg2 = jest.fn((): string => 'test') as QueueableFunction;
            testPromiseArg1 = jest.fn(async (): Promise<number> => 1) as QueueableFunction;
            testPromiseArg2 = jest.fn(async (): Promise<string> => 'test') as QueueableFunction;
            testInstance = new FunctionQueue();
        });
        describe('#enqueue()', (): void => {
            it('Throws if passed argument is not a function.', async (): Promise<void> => {
                // @ts-ignore: Suppress TS error of invalid input to ensure testing es5 runtime errors.
                const testFunc1 = async (): Promise<void> => { await testInstance.enqueue('test') };
                await expect(testFunc1()).rejects.toThrowError(/Cannot enqueue/);
            });
            it('Accepts a function that returns anything.', (): void => {
                const testFunc1 = (): void => { testInstance.enqueue(testArg1) };
                const testFunc2 = (): void => { testInstance.enqueue(testArg2) };
                const testFunc3 = (): void => { testInstance.enqueue(testPromiseArg1) };
                const testFunc4 = (): void => { testInstance.enqueue(testPromiseArg2) };
                const testFunc5 = (): void => { testInstance.enqueue((): Function[] => [(): void => {}])}
                expect(testFunc1).not.toThrow();
                expect(testFunc2).not.toThrow();
                expect(testFunc3).not.toThrow();
                expect(testFunc4).not.toThrow();
                expect(testFunc5).not.toThrow();
            });
            it('Returns a promise.', async (): Promise<void> => {
                expect(testInstance.enqueue(testArg1)).toBeInstanceOf(Promise);
            });
        });
        describe('#execute()', (): void => {
            it('Returns a promise that resolves with the instance.', async (): Promise<void> => {
                const testPromise = testInstance.execute();
                expect(testPromise).toBeInstanceOf(Promise);
                await expect(testPromise).resolves.toBe(testInstance);
            });
            it('Changes the instance\'s state to executed.', async (): Promise<void> => {
                await testInstance.execute();
                expect(testInstance.isExecuted).toBe(true);
            });
            it('Calls all enqueued functions when executed.', async (): Promise<void> => {
                testInstance.enqueue(testArg1);
                testInstance.enqueue(testArg2);
                await testInstance.execute();
                expect(testArg1).toBeCalledTimes(1);
                expect(testArg2).toBeCalledTimes(1);
            });
            it('Passes enqueued functions the instance when executed.', async (): Promise<void> => {
                testInstance.enqueue(testArg1);
                testInstance.enqueue(testArg2);
                await testInstance.execute();
                expect(testArg1).toBeCalledWith(testInstance);
                expect(testArg2).toBeCalledWith(testInstance);
            });
            it('When executed multiple times, it will not call enqueued functions again.', async (): Promise<void> => {
                testInstance.enqueue(testArg1);
                testInstance.enqueue(testArg2);
                await testInstance.execute();
                await testInstance.execute();
                expect(testArg1).toBeCalledTimes(1);
                expect(testArg2).toBeCalledTimes(1);
            });
            
            it('Resolves promises from enqueued functions on execution, returning their expected values.', async (): Promise<void> => {
                const testPromise1 = testInstance.enqueue(testArg1);
                const testPromise2 = testInstance.enqueue(testArg2);
                const testPromise3 = testInstance.enqueue(testPromiseArg1);
                const testPromise4 = testInstance.enqueue(testPromiseArg2);
                await testInstance.execute();
                await expect(testPromise1).resolves.toBe(1);
                await expect(testPromise2).resolves.toBe('test');
                await expect(testPromise3).resolves.toBe(1);
                await expect(testPromise4).resolves.toBe('test');
            });
            it('When already executed, enqueued functions resolve immediately.', async (): Promise<void> => {
                await testInstance.execute();
                const testPromise1 = testInstance.enqueue(testArg1);
                const testPromise2 = testInstance.enqueue(testArg2);
                await expect(testPromise1).resolves.toBe(1);
                await expect(testPromise2).resolves.toBe('test');
            });
        });
    });

    describe('Lifecycle Methods:', (): void => {
        let testInstance: FunctionQueue;
        let testMockCallback: () => void;
        beforeEach((): void => {
            testInstance = new FunctionQueue();
            testMockCallback = jest.fn();
        });

        describe('#onExecuted', (): void => {
            it('Can be overridden.', (): void => {
                const testFunc = (): void => {
                    testInstance.onExecuted = testMockCallback;
                }
                expect(testFunc).not.toThrow();
                expect(testInstance.onExecuted).toBe(testMockCallback);
            });
            it('Is called only the first time the queue is executed.', async (): Promise<void> => {
                testInstance.onExecuted = testMockCallback;
                await testInstance.execute();
                expect(testInstance.onExecuted).toBeCalledTimes(1);
                await testInstance.execute();
                expect(testInstance.onExecuted).toBeCalledTimes(1);
            });
        });
    });
});