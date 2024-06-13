module.exports = {
    apps: [
        {
            "name": "fs", // 项目名称
            "cwd": "c:\\softwares\\fs",
            "script": "server.js",
            // "instances": "max",
            // "exec_mode": "cluster",
            "env": {
                "PORT": "3000" // the port on which the app should listen
            }
        },
    ],
};