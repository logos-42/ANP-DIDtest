 # DID智能体连接工具

这是一个工具，用于连接和测试基于自压缩DID的智能体。该工具可以解析自压缩DID，提取端点URL和元数据，并与智能体进行对话。

## 功能特点

- 解析自压缩DID格式
- 提取智能体元数据和端点URL
- 与智能体进行对话交互
- 支持聊天历史记录
- **新增：Web前端界面**，可直接在浏览器中使用
- **新增：支持Vercel一键部署**

## 安装和使用

### 安装依赖

```bash
cd did-connect
npm install
```

### 启动Web服务

```bash
npm start
```

然后访问 http://localhost:3000 使用Web界面。

### 命令行测试

运行测试脚本：

```bash
npm test
```

或直接：

```bash
node debug-test.js
```

## Web界面使用方法

1. 在浏览器中访问 http://localhost:3000
2. 粘贴智能体DID到输入框
3. 点击"连接"按钮
4. 成功连接后，可在消息框中输入消息与智能体交流
5. 点击发送或按回车键发送消息

## 命令行使用方法

1. 运行debug-test.js进行测试
2. 程序会解析预设的DID并显示智能体信息
3. 自动发送测试消息并接收智能体回复

## 示例DID

示例中使用的脱口秀AI智能体DID:

```
did:self:ECDSA:9VX4DyKYjUaAYeB3LJwS-waIqnyTCu6srmwkAqbK-bqS6S7_rt6gt5Zk8d5safiW57XfJWVdIr1FSKWEQCPB5A:aHR0cHM6Ly9hbnB0ZXN0LnZlcmNlbC5hcHAvYXBpL21lc3NhZ2U:eyJuYW1lIjoi6ISx5Y-j56eAQUnliqnmiYsiLCJ0eXBlIjoiQ29tZWR5QWdlbnQiLCJjcmVhdGVkIjoiMjAyNS0wNC0wMVQwNzowOTo1MS4xMzFaIiwidmVyc2lvbiI6IjEuMC4wIn0:zBRDXs2SbOT3QUEJFnLBTSj6b-Ju7D9JhOB0zT0ErSXwA0R4utsn39geRAE_YIZ6OOgA1BuAAXfF1C2PBibkLw
```

## Vercel部署

1. Fork或克隆此仓库
2. 在Vercel上创建新项目
3. 导入仓库并部署
4. 部署后可以通过Vercel分配的域名访问

## 技术说明

此项目使用了以下技术：

- Node.js
- Express.js (Web服务)
- axios用于HTTP请求
- 自压缩DID技术
- SiliconFlow API接口
- HTML/CSS/JavaScript前端界面