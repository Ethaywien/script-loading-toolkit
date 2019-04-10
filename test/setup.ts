import './globals';
import * as express from 'express';
import { Server } from 'http';

const port = 8083;

// Add default test script source to window
window.testScript = `http://localhost:${port}/test-script.js`;
window.testFailedScript = `http://localhost:${port}/404`;

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
    listener = app.listen(port, (): void => done());
});

afterAll(async (done): Promise<void> => {
    listener.close((): void => done());
});