const express = require('express');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');
const { v4: uuidv4 } = require('uuid');

// 文件存放位置，有需要的自行修改，需要和傻妞机器人、中转服务保持一致
const FILE_SERVER_PATH = path.join(__dirname, 'wcf')

const app = express();

app.use(express.json());

const axiosInstance = axios.create({
    timeout: 60000 // 设置请求超时时间为 60 秒
});

// 定义重试次数和间隔时间
const retryConfig = {
    retries: 3, // 重试次数
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

app.post('/download', async (req, res) => {
    const { url } = req.body;

    if (!url) {
        return res.status(400).json({ error: 'URL and filename are required.' });
    }

    try {
        // 解析 URL 并提取文件扩展名
        const parsedUrl = new URL(url);
        const fileExtension = path.extname(parsedUrl.pathname);
        const filename = uuidv4(); // 使用uuid生成唯一文件名

        // 拼接文件名和扩展名
        const completeFilename = `${filename}${fileExtension}`;

        // 创建文件路径
        const filePath = path.join(FILE_SERVER_PATH, completeFilename);

        const response = await axiosInstance({
            method: 'GET',
            url: url,
            responseType: 'stream',
            retry: true
        });

        const writer = fs.createWriteStream(filePath);

        response.data.pipe(writer);

        writer.on('finish', () => {
            const absoluteFilePath = path.resolve(filePath);
            res.status(200).json({ message: 'File downloaded successfully', filePath: absoluteFilePath });
        });


        writer.on('error', (err) => {
            console.error('\nError writing file:', err);
            res.status(500).json({ error: '\nError writing file: ' + err.message });
        });
    } catch (error) {
        if (error.response) {
            console.error('\nError downloading file:', error.response.status, error.response.statusText);
            res.status(500).json({ error: 'Error downloading file: ' + error.response.statusText });
        } else if (error.request) {
            console.error('\nError downloading file: No response received');
            res.status(500).json({ error: 'Error downloading file: No response received' });
        } else {
            console.error('\nError downloading file:', error.message);
            res.status(500).json({ error: 'Error downloading file: ' + error.message });
        }
    }
});

app.delete('/delete', (req, res) => {
    const filePath = req.body.filePath; // 从请求体中获取文件路径

    if (!filePath) {
        return res.status(400).json({ error: 'File path is required.' });
    }
    res.status(200).json({ message: 'File deleted successfully' });

    // 异步延时删除文件
    setTimeout(() => {
        // 删除文件
        fs.unlink(filePath, (err) => {
            if (err) {
                console.error(`\n[${filePath}] Error deleting file: `, err);
            } else {
                console.log(`\n[${filePath}] File deleted successfully`);
            }
        });
    }, 10 * 1000); // 2分钟的毫秒数
});


module.exports = app;