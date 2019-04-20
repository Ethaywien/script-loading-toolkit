module.exports = async () => {
    await new Promise((resolve) => {
        for (let key in global.__TEST__.connections)
            global.__TEST__.connections[key].destroy();
        global.__TEST__.listener.close(() => resolve());
    });
};