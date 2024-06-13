# file-server
用于上传文件以及wcf的转发。

1. server.js 是启动文件
    给下面两个服务增加了前缀，有需要自行修改
2. file-server.js 是文件服务器，用于上传文件和删除文件
    需要自行定义FILE_SERVER_PATH，默认是当前文件下wcf
3. redirect-server.js 是中转服务。因为傻妞不支持长整数的原因, 用于傻妞和wcf之间接口的forward。
    需要自行修改BOT_SERVER_HOST
