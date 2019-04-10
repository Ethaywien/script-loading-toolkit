import { mocked } from 'ts-jest/utils';
import '../test/globals';
import { mixinBasicScript, BasicScript } from './BasicScript';
import { loadScript } from './utilities/loadScript';

jest.mock('./utilities/loadScript');

const testScriptSrc = window.testScript;
const testFailedScriptSrc = window.testFailedScript;

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

    describe('Properties: ', (): void => {
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
    });

    describe('Methods: ', (): void => {
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
            let testBasicScript: BasicScript;
            beforeEach((): void => {
                testBasicScript = new BasicScript();
                testBasicScript.src = testScriptSrc;
            });
            it('Rejects if the script is disabled.', (): void => {
                testBasicScript.disable();
                expect(testBasicScript.load()).rejects.toThrowError(/disabled script/);
            });
            it('Rejects if no src has been specified.', (): void => {
                testBasicScript.src = '';
                expect(testBasicScript.load()).rejects.toThrowError(/source of/);
            });
            it('Rejects if loading fails.', (): void => {
                testBasicScript.src = testFailedScriptSrc;
                expect(testBasicScript.load()).rejects.toThrowError(/Failed/);
            });
            it('Immediately changes the status to loading.', async (): Promise<void> => {
                const loading = testBasicScript.load();
                expect(testBasicScript.isLoading).toBe(true);
                expect(testBasicScript.isLoaded).toBe(false);
                expect(testBasicScript.isErrored).toBe(false);
                await loading;
            });
            it('Resolves with itself when loading is complete.', async (): Promise<void> => {
                await expect(testBasicScript.load()).resolves.toBe(testBasicScript);
                expect(window.testScriptLoaded).toBe(true);
            });
            it('Changes status to loaded when complete.', async (): Promise<void> => {
                await testBasicScript.load();
                expect(testBasicScript.isLoading).toBe(false);
                expect(testBasicScript.isLoaded).toBe(true);
                expect(testBasicScript.isErrored).toBe(false);
            });
            it('Changes status to errored when loading fails.', async (): Promise<void> => {
                testBasicScript.src = testFailedScriptSrc;
                try {
                    await testBasicScript.load();
                } catch (e) {};
                expect(testBasicScript.isLoading).toBe(false);
                expect(testBasicScript.isLoaded).toBe(false);
                expect(testBasicScript.isErrored).toBe(true);
            });
            it('Concurrent calls will not trigger the script to load multiple times.', async (): Promise<void> => {
                await Promise.all( [
                    testBasicScript.load(),
                    testBasicScript.load()
                ]);
                expect(loadScript).toBeCalledTimes(1);
            });
            it('Resolves and does not try to load again if already loaded.', async (): Promise<void> => {
                await testBasicScript.load();
                expect(loadScript).toBeCalledTimes(1);
                expect(testBasicScript.isLoaded).toBe(true);
                testBasicScript.src = '';
                const loading = testBasicScript.load();
                expect(testBasicScript.isLoading).toBe(false);
                await loading;
                expect(loadScript).toBeCalledTimes(1);
            });
        });
    });

    describe('Lifecycle Methods:', (): void => {
        let testBasicScript: BasicScript;
        let testMockCallback: () => void;
        beforeEach((): void => {
            testBasicScript = new BasicScript();
            testBasicScript.src = testScriptSrc;
            testMockCallback = jest.fn();
        });

        describe('#onEnabled', (): void => {
            it('Can be overridden.', (): void => {
                const testFunc = (): void => {
                    testBasicScript.onEnabled = testMockCallback;
                }
                testBasicScript.src = testScriptSrc;
                expect(testFunc).not.toThrow();
                expect(testBasicScript.onEnabled).toBe(testMockCallback);
            });
            it('Is called every time the script is enabled.', (): void => {
                testBasicScript.onEnabled = testMockCallback;
                testBasicScript.enable();
                expect(testBasicScript.onEnabled).toBeCalledTimes(1);
                testBasicScript.enable();
                expect(testBasicScript.onEnabled).toBeCalledTimes(2);
            });
        });

        describe('#onDisabled', (): void => {
            it('Can be overridden.', (): void => {
                const testFunc = (): void => {
                    testBasicScript.onDisabled = testMockCallback;
                }
                testBasicScript.src = testScriptSrc;
                expect(testFunc).not.toThrow();
                expect(testBasicScript.onDisabled).toBe(testMockCallback);
            });
            it('Is called every time the script is disabled.', (): void => {
                testBasicScript.onDisabled = testMockCallback;
                testBasicScript.disable();
                expect(testBasicScript.onDisabled).toBeCalledTimes(1);
                testBasicScript.disable();
                expect(testBasicScript.onDisabled).toBeCalledTimes(2);
            });
        });

        describe('#onLoading', (): void => {
            it('Can be overridden.', (): void => {
                const testFunc = (): void => {
                    testBasicScript.onDisabled = testMockCallback;
                }
                testBasicScript.src = testScriptSrc;
                expect(testFunc).not.toThrow();
                expect(testBasicScript.onDisabled).toBe(testMockCallback);
            });
            it('Is called when the script starts loading.', async (): Promise<void> => {
                testBasicScript.onLoading = testMockCallback;
                const loading = testBasicScript.load();
                expect(testBasicScript.onLoading).toBeCalledTimes(1);
                await loading;
            });
        });

        describe('#onLoaded', (): void => {
            it('Can be overridden.', (): void => {
                const testFunc = (): void => {
                    testBasicScript.onDisabled = testMockCallback;
                }
                testBasicScript.src = testScriptSrc;
                expect(testFunc).not.toThrow();
                expect(testBasicScript.onDisabled).toBe(testMockCallback);
            });
            it('Is called when the script has loaded.', async (): Promise<void> => {
                testBasicScript.onLoaded = testMockCallback;
                await testBasicScript.load();
                expect(testBasicScript.onLoaded).toBeCalledTimes(1);
            });
        });

        describe('#onErrored', (): void => {
            it('Can be overridden.', (): void => {
                const testFunc = (): void => {
                    testBasicScript.onDisabled = testMockCallback;
                }
                testBasicScript.src = testScriptSrc;
                expect(testFunc).not.toThrow();
                expect(testBasicScript.onDisabled).toBe(testMockCallback);
            });
            it('Is called when the script has failed to load.', async (): Promise<void> => {
                testBasicScript.src = testFailedScriptSrc;
                testBasicScript.onErrored = testMockCallback;
                try {
                    await testBasicScript.load();
                } catch (e) {};
                expect(testBasicScript.onErrored).toBeCalledTimes(1);
            });
        });
    });

});