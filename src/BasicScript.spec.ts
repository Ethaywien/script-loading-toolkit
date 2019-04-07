import { mixinBasicScript, BasicScript } from './BasicScript';

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
        it('Can be set to a different string.', (): void => {
            const testBasicScript = new BasicScript();
            expect(testBasicScript.src).toBe('');
            testBasicScript.src = 'test';
            expect(testBasicScript.src).toBe('test');
        });
    });
});