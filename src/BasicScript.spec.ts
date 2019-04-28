import { mocked } from 'ts-jest/utils';
import { BasicScriptMixin, BasicScript } from './BasicScript';
import { Script } from  './Script';
import { loadScript } from './utilities/loadScript';
import { testSources } from '../test/globals';

jest.mock('./utilities/loadScript');

const { validSrc, notFoundSrc } = testSources;

afterEach((): void => {
    window.testScriptLoaded = false;
    mocked(loadScript).mockClear();
});

describe('BasicScriptMixin', (): void => {
    it('Adds BasicScript functionality to given constructor.', (): void => {
        class TestClass {
            public static testProp: string = 'test';
        };
        const TestMixinClass = BasicScriptMixin(TestClass);
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
                const testInstance = new BasicScript();
                expect(testInstance.src).toBe('');
            });
            it('Can be overridden.', (): void => {
                const testInstance = new BasicScript();
                testInstance.src = 'test';
                expect(testInstance.src).toBe('test');
            });
        });

        describe('#isEnabled', (): void => {
            it('Defaults to true.', (): void => {
                const testInstance = new BasicScript();
                expect(testInstance.isEnabled).toBe(true);
            });
        });

        describe('#isLoading', (): void => {
            it('Defaults to false.', (): void => {
                const testInstance = new BasicScript();
                expect(testInstance.isLoading).toBe(false);
            });
        });

        describe('#isLoaded', (): void => {
            it('Defaults to false.', (): void => {
                const testInstance = new BasicScript();
                expect(testInstance.isLoaded).toBe(false);
            });
        });

        describe('#isErrored', (): void => {
            it('Defaults to false.', (): void => {
                const testInstance = new BasicScript();
                expect(testInstance.isErrored).toBe(false);
            });
        });

        describe('#hasDependencies', (): void => {
            it('Defaults to false.', (): void => {
                const testInstance = new BasicScript();
                expect(testInstance.hasDependencies).toBe(false);
            });
        });
    });

    describe('Methods: ', (): void => {
        let testInstance: BasicScript;
        beforeEach((): void => {
            testInstance = new BasicScript();
            testInstance.src = validSrc;
        });

        describe('#addDependency()', (): void => {
            it('Throws if given dependency has no load method.', (): void => {
                // @ts-ignore: Suppress TS error of invalid input to ensure testing es5 runtime errors.
                const testFunc = (): void => { testInstance.addDependency({}) };
                expect(testFunc).toThrowError(/Given object has no 'load' method/);
            });
            it('Throws if the load method has already been called.', (): void => {
                const testFunc = (): void => { testInstance.addDependency(new BasicScript()) };
                testInstance.load();
                expect(testFunc).toThrowError(/Script has already started loading/);
            });
            it('Optionally accepts a second boolean argument.', (): void => {
                const testFunc = (): void => { testInstance.addDependency(new BasicScript()) };
                const testFunc2 = (): void => { testInstance.addDependency(new BasicScript(), true) };
                expect(testFunc).not.toThrow();
                expect(testFunc2).not.toThrow();
            });
            it('Will change "hasDependencies" to be true".', (): void => {
                const testInstance2 = new BasicScript();
                testInstance.addDependency(testInstance2);
                expect(testInstance.hasDependencies).toBe(true);
                expect(testInstance2.hasDependencies).toBe(false);
                testInstance2.addDependency(new BasicScript(), true);
                expect(testInstance2.hasDependencies).toBe(true);
            });
            it('Can be chained.', (): void => {
                const testFunc = (): void => { testInstance.addDependency(new BasicScript()).addDependency(new BasicScript()) };
                expect(testFunc).not.toThrow();
            });
            it('Works with Scripts.', (): void => {
                const testFunc = (): void => { testInstance.addDependency(new Script()) };
                expect(testFunc).not.toThrow();
            });
        });

        describe('#disable()', (): void => {
            it('Disables the script.', (): void => {
                testInstance.disable();
                expect(testInstance.isEnabled).toBe(false);
            });
            it('Can be chained.', (): void => {
                expect(testInstance.disable().isEnabled).toBe(false);
            });
        });

        describe('#enable()', (): void => {
            it('Enables the script.', (): void => {
                testInstance.disable();
                testInstance.enable();
                expect(testInstance.isEnabled).toBe(true);
            });
            it('Can be chained.', (): void => {
                testInstance.disable();
                expect(testInstance.enable().isEnabled).toBe(true);
            });
        });

        describe('#load()', (): void => {
            it('Rejects if the script is disabled.', (): void => {
                testInstance.disable();
                expect(testInstance.load()).rejects.toThrowError(/disabled script/);
            });
            it('Rejects if no src has been specified.', (): void => {
                testInstance.src = '';
                expect(testInstance.load()).rejects.toThrowError(/source of/);
            });
            it('Rejects if loading fails.', (): void => {
                testInstance.src = notFoundSrc;
                expect(testInstance.load()).rejects.toThrowError(/Failed/);
            });
            it('Immediately changes the status to loading.', async (): Promise<void> => {
                const loading = testInstance.load();
                expect(testInstance.isLoading).toBe(true);
                expect(testInstance.isLoaded).toBe(false);
                expect(testInstance.isErrored).toBe(false);
                await loading;
            });
            it('Resolves with itself when loading is complete.', async (): Promise<void> => {
                await expect(testInstance.load()).resolves.toBe(testInstance);
                expect(window.testScriptLoaded).toBe(true);
            });
            it('Changes status to loaded when complete.', async (): Promise<void> => {
                await testInstance.load();
                expect(testInstance.isLoading).toBe(false);
                expect(testInstance.isLoaded).toBe(true);
                expect(testInstance.isErrored).toBe(false);
            });
            it('Changes status to errored when loading fails.', async (): Promise<void> => {
                testInstance.src = notFoundSrc;
                try {
                    await testInstance.load();
                } catch (e) {};
                expect(testInstance.isLoading).toBe(false);
                expect(testInstance.isLoaded).toBe(false);
                expect(testInstance.isErrored).toBe(true);
            });
            it('Will not trigger the script to load multiple times if called concurrently.', async (): Promise<void> => {
                await Promise.all( [
                    testInstance.load(),
                    testInstance.load()
                ]);
                expect(loadScript).toBeCalledTimes(1);
            });
            it('Resolves and does not try to load again if already loaded.', async (): Promise<void> => {
                await testInstance.load();
                expect(loadScript).toBeCalledTimes(1);
                expect(testInstance.isLoaded).toBe(true);
                testInstance.src = '';
                const loading = testInstance.load();
                expect(testInstance.isLoading).toBe(false);
                await loading;
                expect(loadScript).toBeCalledTimes(1);
            });
            it('Will trigger loading of added dependencies.', async (): Promise<void> => {
                const testDependency = new BasicScript();
                const testSpy = jest.spyOn(testDependency, 'load');
                testDependency.src = validSrc;
                testInstance.addDependency(testDependency);
                await testInstance.load();
                expect(testSpy).toBeCalledTimes(1);
                expect(loadScript).toBeCalledTimes(2);
            });
        });
    });

    describe('Lifecycle Methods:', (): void => {
        let testInstance: BasicScript;
        let testMockCallback: () => void;
        beforeEach((): void => {
            testInstance = new BasicScript();
            testInstance.src = validSrc;
            testMockCallback = jest.fn();
        });

        describe('#onEnabled', (): void => {
            it('Can be overridden.', (): void => {
                const testFunc = (): void => {
                    testInstance.onEnabled = testMockCallback;
                }
                testInstance.src = validSrc;
                expect(testFunc).not.toThrow();
                expect(testInstance.onEnabled).toBe(testMockCallback);
            });
            it('Is called every time the script is enabled.', (): void => {
                testInstance.onEnabled = testMockCallback;
                testInstance.enable();
                expect(testInstance.onEnabled).toBeCalledTimes(1);
                testInstance.enable();
                expect(testInstance.onEnabled).toBeCalledTimes(2);
            });
        });

        describe('#onDisabled', (): void => {
            it('Can be overridden.', (): void => {
                const testFunc = (): void => {
                    testInstance.onDisabled = testMockCallback;
                }
                testInstance.src = validSrc;
                expect(testFunc).not.toThrow();
                expect(testInstance.onDisabled).toBe(testMockCallback);
            });
            it('Is called every time the script is disabled.', (): void => {
                testInstance.onDisabled = testMockCallback;
                testInstance.disable();
                expect(testInstance.onDisabled).toBeCalledTimes(1);
                testInstance.disable();
                expect(testInstance.onDisabled).toBeCalledTimes(2);
            });
        });

        describe('#onLoading', (): void => {
            it('Can be overridden.', (): void => {
                const testFunc = (): void => {
                    testInstance.onDisabled = testMockCallback;
                }
                testInstance.src = validSrc;
                expect(testFunc).not.toThrow();
                expect(testInstance.onDisabled).toBe(testMockCallback);
            });
            it('Is called when the script starts loading.', async (): Promise<void> => {
                testInstance.onLoading = testMockCallback;
                const loading = testInstance.load();
                expect(testInstance.onLoading).toBeCalledTimes(1);
                await loading;
            });
        });

        describe('#onLoaded', (): void => {
            it('Can be overridden.', (): void => {
                const testFunc = (): void => {
                    testInstance.onDisabled = testMockCallback;
                }
                testInstance.src = validSrc;
                expect(testFunc).not.toThrow();
                expect(testInstance.onDisabled).toBe(testMockCallback);
            });
            it('Is called when the script has loaded.', async (): Promise<void> => {
                testInstance.onLoaded = testMockCallback;
                await testInstance.load();
                expect(testInstance.onLoaded).toBeCalledTimes(1);
            });
        });

        describe('#onErrored', (): void => {
            it('Can be overridden.', (): void => {
                const testFunc = (): void => {
                    testInstance.onDisabled = testMockCallback;
                }
                testInstance.src = validSrc;
                expect(testFunc).not.toThrow();
                expect(testInstance.onDisabled).toBe(testMockCallback);
            });
            it('Is called when the script has failed to load.', async (): Promise<void> => {
                testInstance.src = notFoundSrc;
                testInstance.onErrored = testMockCallback;
                try {
                    await testInstance.load();
                } catch (e) {};
                expect(testInstance.onErrored).toBeCalledTimes(1);
            });
        });
    });
    describe('Dependency Loading: ', (): void => {
        let testInstance: BasicScript;
        let testResolver: Function;
        let testDependency: BasicScript;
        let testPromise: Promise<void>;
        let testSpy: jest.Mock<Promise<BasicScript>>;
        beforeEach((): void => {
            testInstance = new BasicScript();
            testInstance.src = validSrc;
            testDependency = new BasicScript();
            testPromise = new Promise((resolve): void => {
                testResolver = resolve;
            });
            // @ts-ignore: Suppress error on mock load implementation.
            testSpy = jest.spyOn(testDependency, 'load').mockImplementation((): Promise<BasicScript> => testPromise);
        });
        it('May start loading before dependencies without side effects have loaded.', async (done): Promise<void> => {
            testInstance.addDependency(testDependency);
            testInstance.load();
            setTimeout(async (): Promise<void> => {
                expect(testSpy).toBeCalledTimes(1);
                expect(loadScript).toBeCalledWith(validSrc);
                expect(loadScript).toBeCalledTimes(1);
                testResolver();
                await testInstance.load();
                done();
            }, 10);
        });
        it('Will not finish loading until added dependencies have also loaded.', async (done): Promise<void> => {
            testInstance.addDependency(testDependency);
            testInstance.load();
            setTimeout(async (): Promise<void> => {
                expect(testInstance.isLoading).toBe(true);
                expect(testInstance.isLoaded).toBe(false);
                expect(window.testScriptLoaded).toBe(true);
                testResolver();
                setTimeout(async (): Promise<void> => {
                    expect(testInstance.isLoaded).toBe(true);
                    done();
                }, 1);
            }, 10);
        });
        it('Will not begin loading until dependencies with side effect have finished loading.', async (done): Promise<void> => {
            testInstance.addDependency(testDependency, true);
            testInstance.load();
            setTimeout(async (): Promise<void> => {
                expect(loadScript).toBeCalledTimes(0);
                testResolver();
                await testInstance.load();
                expect(loadScript).toBeCalledTimes(1);
                done();
            }, 10);
        });
    });
});