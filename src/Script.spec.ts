import { Script, ScriptMixin, ScriptInitializerMixin, ScriptBuilder } from './Script';
import { BasicScriptMixin } from './BasicScript';
import { FunctionQueueMixin } from './FunctionQueue';
import { testSources } from '../test/globals';

jest.mock('./utilities/loadScriptElement');

const { validSrc, notFoundSrc } = testSources;

describe('ScriptInitializerMixin', (): void => {
    it('Accepts a constructor that implements FunctionQueue and BasicScript.', (): void => {
        const MixedInTestClass = BasicScriptMixin(FunctionQueueMixin(class {}));
        const testFnc = () => ScriptInitializerMixin(MixedInTestClass);
        expect(testFnc).not.toThrowError();
    });
    it('Errors if no constructor is passed.', (): void => {
        // @ts-ignore: Suppress error to test.
        const testFnc = () => ScriptInitializerMixin();
        expect(testFnc).toThrowError();
    });
    it('Adds Script initialization functionality to given constructor.', (): void => {
        class TestClass {
            public static testProp: string = 'test';
        };
        const MixedInTestClass = BasicScriptMixin(FunctionQueueMixin(TestClass));
        const TestMixinClass = ScriptInitializerMixin(MixedInTestClass);
        expect(TestMixinClass.testProp).toBe('test');
        expect(typeof TestMixinClass).toBe('function');
        expect(typeof TestMixinClass.prototype.initialize).toBe('function');
    });
    it('Returned object can be newed.', (): void => {
        const TestMixinClass = ScriptInitializerMixin(BasicScriptMixin(FunctionQueueMixin(class{})));
        const testFnc = () => new TestMixinClass();
        expect(testFnc).not.toThrowError();
    });
});

describe('ScriptMixin', (): void => {
    it('Adds ScriptInitializer, FunctionQueue and BasicScript functionality to given constructor.', (): void => {
        class TestClass {
            public static testProp: string = 'test';
        };
        const TestMixinClass = ScriptMixin(TestClass);
        expect(TestMixinClass.testProp).toBe('test');
        expect(typeof TestMixinClass.prototype.initialize).toBe('function');
        expect(typeof TestMixinClass.prototype.enqueue).toBe('function');
        expect(typeof TestMixinClass.prototype.load).toBe('function');
    });
});

describe('ScriptBuilder', (): void => {
    it('Creates a new Script constructor.', (): void => {
        const TestClass = ScriptBuilder();
        expect(typeof TestClass.prototype.initialize).toBe('function');
        expect(typeof TestClass.prototype.enqueue).toBe('function');
        expect(typeof TestClass.prototype.load).toBe('function');
    });
    it('Can be passed a constructor.', (): void => {
        class TestClass {};
        const testFnc = () => ScriptBuilder(TestClass);
        expect(testFnc).not.toThrowError();
    });
    it('Returned object can be newed.', (): void => {
        const TestMixinClass = ScriptBuilder();
        const testFnc = () => new TestMixinClass();
        expect(testFnc).not.toThrowError();
    });
});

describe('Script', (): void => {
    it('Can be newed.', (): void => {
        const testFunc = (): Script => new Script();
        expect(testFunc).not.toThrow();
        expect(testFunc()).toBeInstanceOf(Script);
    });

    describe('Properties: ', (): void => {
        describe('#isInitialized', (): void => {
            it('Defaults to false.', (): void => {
                const testInstance = new Script();
                expect(testInstance.isInitialized).toBe(false);
            });
        });
    });

    describe('Methods: ', (): void => {
        let testInstance: Script;
        beforeEach((): void => {
            testInstance = new Script();
            testInstance.src = validSrc;
        });
        describe('#initialize()', (): void => {
            it('Changes isInitialized to true.', async (): Promise<void> => {
                await testInstance.initialize();
                expect(testInstance.isInitialized).toBe(true);
            });
            it('Triggers FunctionQueue execution.', async (): Promise<void> => {
                const testSpy = jest.spyOn(testInstance, 'execute');
                await testInstance.initialize();
                expect(testSpy).toBeCalledTimes(1);
            });
            it('Will not trigger FunctionQueue exection multiple times.', async (): Promise<void> => {
                const testSpy = jest.spyOn(testInstance, 'execute');
                await testInstance.initialize();
                expect(testSpy).toBeCalledTimes(1);
                await testInstance.initialize();
                expect(testSpy).toBeCalledTimes(1);
            });
        });
        describe('#load()', (): void => {
            it('Triggers the ".initialize()" method if loading succeeds.', async (): Promise<void> => {
                const testSpy = jest.spyOn(testInstance, 'initialize');
                await testInstance.load();
                expect(testSpy).toBeCalledTimes(1);
                expect(testInstance.isLoaded).toBe(true);
            });
            it('Does not trigger the ".initialize()" method if loading fails.', async (): Promise<void> => {
                const testSpy = jest.spyOn(testInstance, 'initialize');
                testInstance.src = notFoundSrc;
                try {
                    await testInstance.load();
                } catch (e) {}
                expect(testSpy).not.toBeCalled();
                expect(testInstance.isErrored).toBe(true);
                expect(testInstance.isLoaded).toBe(false);
            });
        });
    });

    describe('Lifecycle Methods:', (): void => {
        let testInstance: Script;
        let testMockCallback: () => void;
        beforeEach((): void => {
            testInstance = new Script();
            testMockCallback = jest.fn();
        });

        describe('#onInitialized', (): void => {
            it('Can be overridden.', (): void => {
                const testFunc = (): void => {
                    testInstance.onInitialized = testMockCallback;
                }
                expect(testFunc).not.toThrow();
                expect(testInstance.onInitialized).toBe(testMockCallback);
            });
            it('Is called only the first time the queue is Initialized.', async (): Promise<void> => {
                testInstance.onInitialized = testMockCallback;
                await testInstance.initialize();
                expect(testInstance.onInitialized).toBeCalledTimes(1);
                await testInstance.initialize();
                expect(testInstance.onInitialized).toBeCalledTimes(1);
            });
        });
    });
});