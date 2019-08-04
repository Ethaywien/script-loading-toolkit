/**
 * Validate a string is a valid url.
 *
 * @param  {string} src - String to validate.
 * @returns {boolean}
 */
export function isValidSrc(src: string): boolean {
    return /^(?:https?\:)?\/\/\S+\.\S+$/s.test(src);
}