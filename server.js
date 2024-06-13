// server.js
const cluster = require('cluster');
const os = require('os');
const numCPUs = os.cpus().length;

const app1 = require('./file-server');
const app2 = require('./redirect-server');


if (cluster.isMaster) {
    console.log(`Master ${process.pid} is running`);

    // Fork workers
    for (let i = 0; i < numCPUs; i++) {
        cluster.fork();
    }

    cluster.on('exit', (worker, code, signal) => {
        console.log(`Worker ${worker.process.pid} died`);
    });
} else {
    const express = require('express');
    const app = express();

    // 挂载 Express 实例
    app.use('/fs', app1);
    app.use('/rs', app2);

    const port = 3000;
    app.listen(port, () => {
        console.log(`Worker ${process.pid} started`);
    });
}
