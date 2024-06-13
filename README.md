# file-server
用于上传文件以及wcf的转发。

## exec cmd
```shell
pm2 start "c:/softwares/file-server/ecosystem.config.js" --name fs
```
其中路径需替换成自己的目录

## description
1. server.js 是启动文件
    给下面两个服务增加了前缀，有需要自行修改。
    有两个版本，可使用pm2的cluster模式，或使用cluster插件，默认使用pm2。
2. file-server.js 是文件服务器，用于上传文件和删除文件
    需要自行定义FILE_SERVER_PATH，默认是当前文件下wcf
3. redirect-server.js 是中转服务。因为傻妞不支持长整数的原因, 用于傻妞和wcf之间接口的forward。
    需要自行修改BOT_SERVER_HOST
