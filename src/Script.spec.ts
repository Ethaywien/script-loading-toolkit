import { Script, ScriptMixin, ScriptInitializerMixin } from './Script';
import { BasicScriptMixin } from './BasicScript';
import { FunctionQueueMixin } from './FunctionQueue';

describe('ScriptInitializerMixin', (): void => {
    it('Adds Script initialization functionality to given constructor that implements FunctionQueue and BasicScript.', (): void => {
        class TestClass {
            public static testProp: string = 'test';
        };
        const MixedInTestClass = BasicScriptMixin(FunctionQueueMixin(TestClass));
        const TestMixinClass = ScriptInitializerMixin(MixedInTestClass);
        expect(TestMixinClass.testProp).toBe('test');
        expect(typeof TestMixinClass.prototype.initialize).toBe('function');
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