import * as express from 'express';

// Declare globals on the window object for script mocking
declare global {
    interface Window { testScriptLoaded: boolean }
    interface Window { testScript: string }
    interface Window { testFailedScript: string }
    interface Window { app: express.Express }
}