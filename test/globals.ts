// Declare globals on the window object for script mocking

declare global {
    interface Window { testScriptLoaded: boolean }
}

const port = 7357;

export const testSources = {
    // @ts-ignore
    validSrc: `http://localhost:${port}/test-script.js`,
    // @ts-ignore
    notFoundSrc: `http://localhost:${port}/404`
}