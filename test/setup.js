// eslint-disable-next-line @typescript-eslint/no-var-requires
const express = require('express');

const port = 7357;

module.exports = async () => {
    global.__TEST__ = {
        connections: {}
    };
    // Create a test server to serve our test javascript files
    const app = express();
    app.get('/test-script.js', (req, res) => {
        res.send('window.testScriptLoaded = true');
    });
    app.get('/404', (req, res) => {
        res.status(404).send();
    });
    
    await new Promise(resolve => {
        // @ts-ignore: Global has this now, deal with it.
        global.__TEST__.listener = app.listen(port, () => {
            resolve(); console.log('server up on port', port)
        });
    });

    global.__TEST__.listener.on('connection', function(conn) {
        const key = conn.remoteAddress + ':' + conn.remotePort;
        // @ts-ignore: Global has this now, deal with it.
        global.__TEST__.connections[key] = conn;
        conn.on('close', function() {
            // @ts-ignore: Global has this now, deal with it.
            delete global.__TEST__.connections[key];
        });
    });
};



// export const createServer = async (port: number): Promise<void> => {
//     return new Promise((resolve): void => {
//         // Add default test script source to window
//         listener = app.listen(port, (): void => {resolve(); console.log('server up on port', port)});
//         listener.on('connection', function(conn): void {
//             const key = conn.remoteAddress + ':' + conn.remotePort;
//             connections[key] = conn;
//             conn.on('close', function(): void {
//                 delete connections[key];
//             });
//         });
//     });
// };

// export const destroyServer = async (): Promise<void> => {
//     return new Promise((resolve): void => {
//         for (let key in connections)
//             connections[key].destroy();
//         listener.close((): void => resolve());
//     });
// };