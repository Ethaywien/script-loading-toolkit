module.exports = {
    extends: ['plugin:@typescript-eslint/recommended'],
    parser: '@typescript-eslint/parser',
    plugins: ['@typescript-eslint'],
    rules: {
        "@typescript-eslint/explicit-member-accessibility" : "off",
        "@typescript-eslint/explicit-function-return-type" : "off"
    }
}