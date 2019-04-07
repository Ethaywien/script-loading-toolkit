import * as express from 'express';
import { Server } from 'http';

// Declare globals on the window object for script mocking
declare global {
    interface Window { testScriptLoaded: boolean }
    interface Window { testScript: string }
    interface Window { testFailedScript: string }
    interface Window { app: express.Express }
}

// Add default test script source to window
window.testScript = 'http://localhost:8081/test-script.js';
window.testFailedScript = 'http://localhost:8081/404';

// Create a test server to serve our test javascript files
const app = express();
app.get('/test-script.js', (req: express.Request, res: express.Response): void => {
    res.send('window.testScriptLoaded = true');
});
app.get('/404', (req: express.Request, res: express.Response): void => {
    res.status(404).send();
});
window.app = app;

// Start and stop the server before and after the tests are ran.
let listener: Server;

beforeAll(async (done): Promise<void> => {
    listener = app.listen(8081, (): void => done());
});

afterAll(async (done): Promise<void> => {
    listener.close((): void => done());
});