const express = require('express');
const axios = require('axios');
const getRawBody = require('raw-body');
const jsonBigInt = require('json-bigint')({"storeAsString": true});
const logger = require('./logger')
const fs = require('fs');
const path = require('path');

// WCF 服务地址，不带/，一般就是本机地址了
const WCF_SERVER_HOST = 'http://127.0.0.1:10010'
// 机器人地址，不带/
const BOT_SERVER_HOST = 'http://192.168.16.83:8080'

const app = express();

app.use((req, res, next) => {
    getRawBody(req, {
        length: req.headers['content-length'],
        limit: '1mb',
        encoding: 'utf-8'
    }, (err, string) => {
        if (err) return next(err);
        req.text = string;
        next();
    });
});

const axiosInstance = axios.create({
    timeout: 60000 // 设置请求超时时间为 60 秒
});

// 定义重试次数和间隔时间
const retryConfig = {
    retries: 1, // 重试次数
    retryDelay: 10000 // 重试间隔时间（毫秒）
};

// Axios请求的重试逻辑
axiosInstance.interceptors.response.use(null, async (error) => {
    const { config } = error;
    if (!config || !config.retry) return Promise.reject(error);

    config.currentRetry = config.currentRetry || 0;

    if (config.currentRetry >= retryConfig.retries) {
        return Promise.reject(error);
    }

    config.currentRetry++;

    await new Promise(resolve => setTimeout(resolve, retryConfig.retryDelay));

    return axiosInstance(config);
});

app.post('/bot/wx-ferry', async (req, res) => {
    logger.debug('wx ferry callback', req.text)
    try {
        const body = jsonBigInt.parse(req.text);
        axiosInstance({
            method: 'POST',
            url: `${BOT_SERVER_HOST}/bot/wx-ferry`,
            data: body,
            retry: true
        });
        res.send({satus: 0, error: null})
    } catch (e) {
        logger.error('', e);
        res.status(500).send({status: -1, error: '未知错误，请看转发器'});
    }
});

app.post('/bot/redirect', async (req, res) => {
    const {
        method, path: apiPath, data
    } = jsonBigInt.parse(req.text);

    // 对data中的id进行处理
    if (data?.id && typeof data.id === "string") {
        data.id = BigInt(data.id)
    }
    const params = jsonBigInt.stringify(data)
    logger.debug('receive redirect from silly', apiPath, params)
    try {
        const response =  await axiosInstance({
            url: `${WCF_SERVER_HOST}${apiPath.indexOf('/') === 0 ? apiPath : `/${apiPath}`}`,
            method,
            headers: {
                'Content-Type': 'application/json'
            },
            data: params,
            retry: true
        });
        logger.debug('return silly', jsonBigInt.stringify(response.data))
        if (apiPath === '/save-image') {
            const absoluteFilePath = path.resolve(response.data.data)
            logger.debug(`absoluteFilePath: ${absoluteFilePath}`)
            setTimeout(() => {
                // 删除文件
                fs.unlink(absoluteFilePath, (err) => {
                    if (err) {
                        logger.error(`[${absoluteFilePath}] Error deleting file: `, err);
                    } else {
                        logger.debug(`[${absoluteFilePath}] File deleted successfully`);
                    }
                });
            }, 10 * 1000); // 2分钟的毫秒数
        }
        res.send(response.data);
    } catch (error) {
        logger.error(error)
        res.status(500).send({status: -1, error: '未知错误，请看转发器'});
    }

})


module.exports = app;