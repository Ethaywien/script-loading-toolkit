import { mocked } from 'ts-jest/utils';
import { mixinBasicScript, BasicScript } from './BasicScript';
import { loadScript } from './utilities/loadScript';

jest.mock('./utilities/loadScript');

const testScriptSrc = window.testScript;

afterEach((): void => {
    window.testScriptLoaded = false;
    mocked(loadScript).mockClear();
});

describe('mixinBasicScript', (): void => {
    it('Adds BasicScript functionality to given constructor.', (): void => {
        class TestClass {
            public static testProp: string = 'test';
        };
        const TestMixinClass = mixinBasicScript(TestClass);
        expect(TestMixinClass.testProp).toBe('test');
        expect(typeof TestMixinClass.prototype.enable).toBe('function');
        expect(typeof TestMixinClass.prototype.disable).toBe('function');
        expect(typeof TestMixinClass.prototype.load).toBe('function');
    });
});

describe('BasicScript', (): void => {
    it('Can be newed.', (): void => {
        const testFunc = (): BasicScript => new BasicScript();
        expect(testFunc).not.toThrow();
        expect(testFunc()).toBeInstanceOf(BasicScript);
    });

    describe('#src', (): void => {
        it('Defaults to an empty string.', (): void => {
            const testBasicScript = new BasicScript();
            expect(testBasicScript.src).toBe('');
        });
        it('Can be overridden.', (): void => {
            const testBasicScript = new BasicScript();
            testBasicScript.src = 'test';
            expect(testBasicScript.src).toBe('test');
        });
    });

    describe('#isEnabled', (): void => {
        it('Defaults to true.', (): void => {
            const testBasicScript = new BasicScript();
            expect(testBasicScript.isEnabled).toBe(true);
        });
    });

    describe('#isLoading', (): void => {
        it('Defaults to false.', (): void => {
            const testBasicScript = new BasicScript();
            expect(testBasicScript.isLoading).toBe(false);
        });
    });

    describe('#isLoaded', (): void => {
        it('Defaults to false.', (): void => {
            const testBasicScript = new BasicScript();
            expect(testBasicScript.isLoaded).toBe(false);
        });
    });

    describe('#isErrored', (): void => {
        it('Defaults to false.', (): void => {
            const testBasicScript = new BasicScript();
            expect(testBasicScript.isErrored).toBe(false);
        });
    });

    describe('#disable()', (): void => {
        it('Disables the script.', (): void => {
            const testBasicScript = new BasicScript();
            testBasicScript.disable();
            expect(testBasicScript.isEnabled).toBe(false);
        });
        it('Can be chained.', (): void => {
            const testBasicScript = new BasicScript();
            expect(testBasicScript.disable().isEnabled).toBe(false);
        });
    });

    describe('#enable()', (): void => {
        it('Enables the script.', (): void => {
            const testBasicScript = new BasicScript();
            testBasicScript.disable();
            testBasicScript.enable();
            expect(testBasicScript.isEnabled).toBe(true);
        });
        it('Can be chained.', (): void => {
            const testBasicScript = new BasicScript();
            testBasicScript.disable();
            expect(testBasicScript.enable().isEnabled).toBe(true);
        });
    });

    describe('#load()', (): void => {
        it('Rejects if the script is disabled.', (): void => {
            const testBasicScript = new BasicScript();
            testBasicScript.disable();
            expect(testBasicScript.load()).rejects.toThrowError(/disabled script/);
        });
        it('Rejects if no src has been specified.', (): void => {
            const testBasicScript = new BasicScript();
            expect(testBasicScript.load()).rejects.toThrowError(/source of/);
        });
        it('Immediately changes the status to loading.', async (): Promise<void> => {
            const testBasicScript = new BasicScript();
            testBasicScript.src = testScriptSrc;
            const loading = testBasicScript.load();
            expect(testBasicScript.isLoading).toBe(true);
            await loading;
        });
        it('Resolves with itself when loading is complete.', async (): Promise<void> => {
            const testBasicScript = new BasicScript();
            testBasicScript.src = testScriptSrc;
            await expect(testBasicScript.load()).resolves.toBe(testBasicScript);
            expect(window.testScriptLoaded).toBe(true);
        });
        it('Changes status to loaded when complete.', async (): Promise<void> => {
            const testBasicScript = new BasicScript();
            testBasicScript.src = testScriptSrc;
            await testBasicScript.load();
            expect(testBasicScript.isLoading).toBe(false);
            expect(testBasicScript.isLoaded).toBe(true);
        });
        it('Concurrent calls will not trigger the script to load multiple times.', async (): Promise<void> => {
            const testBasicScript = new BasicScript();
            testBasicScript.src = testScriptSrc;
            testBasicScript.load();
            await testBasicScript.load();
            expect(loadScript).toBeCalledTimes(1);
        });
    });
});