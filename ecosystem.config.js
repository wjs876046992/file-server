module.exports = {
    apps: [
        {
            "name": "bot_fs", // 项目名称
            "script": "server.js",
            "instances": "max",
            "exec_mode": "cluster",
            "env": {
                "PORT": "3000" // the port on which the app should listen
            }
        },
    ],
};