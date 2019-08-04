import { isValidSrc } from './isValidSrc';

describe('isValidSrc', (): void => {
    it('Acceps a string as an argument', (): void => {
        expect((): boolean => isValidSrc('hello!')).not.toThrow();
    });
    
    it('Returns false if the string is not a valid src.', (): void => {
        expect(isValidSrc('asdf')).toBe(false);
    });
    
    it('Returns false if the string is not a valid src.', (): void => {
        expect(isValidSrc('http//something.com')).toBe(false);
    });

    it('Returns false if the string is not a valid src.', (): void => {
        expect(isValidSrc('http://something')).toBe(false);
    });

    it('Returns true if the string is a valid src with no protocol.', (): void => {
        expect(isValidSrc('//www.google.com')).toBe(true);
    });
    
    it('Returns true if the string is a valid src with http protocol.', (): void => {
        expect(isValidSrc('http://something.com')).toBe(true);
    });
    
    it('Returns true if the string is a valid src with https protocol.', (): void => {
        expect(isValidSrc('http://domain.asdf.co.uk')).toBe(true);
    });
});