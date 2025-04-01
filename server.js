// ... existing code ...
// 智能体互动系统服务器
import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { generateDID, parseDID, isValidDID } from './lib/did.js';
import { connectToAgent, getAgentInfo, getEnglishAssistantResponse } from './lib/agent.js';

// 获取当前文件的目录
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 初始化Express应用
const app = express();
const port = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.static(join(__dirname, 'public')));

// API路由 - 生成DID
app.post('/api/generate-did', async (req, res) => {
  try {
    const { name } = req.body;
    
    // 生成DID
    const { did, publicKey, privateKey } = await generateDID(name || '用户');
    
    return res.json({ 
      success: true, 
      did,
      // 不要在响应中包含私钥
      publicKey
    });
    
  } catch (error) {
    console.error('生成DID错误:', error);
    return res.status(500).json({ error: '生成DID时出错: ' + error.message });
  }
});

// API路由 - 解析DID
app.post('/api/parse-did', (req, res) => {
  try {
    const { did } = req.body;
    
    if (!did) {
      return res.status(400).json({ error: '缺少DID参数' });
    }
    
    // 解析DID
    const parsedDID = parseDID(did);
    
    if (!parsedDID) {
      return res.status(400).json({ error: '无效的DID格式' });
    }
    
    // 返回智能体信息
    const agentInfo = getAgentInfo(did);
    return res.json({ 
      success: true, 
      agent: agentInfo 
    });
    
  } catch (error) {
    console.error('解析DID错误:', error);
    return res.status(500).json({ error: '处理DID时出错: ' + error.message });
  }
});

// API路由 - 发送消息到智能体
app.post('/api/send-message', async (req, res) => {
  try {
    const { did, message, sender_did, chat_history } = req.body;
    
    if (!did || !message) {
      return res.status(400).json({ error: '缺少必要参数' });
    }
    
    // 发送消息
    const response = await connectToAgent(did, message, sender_did || '', chat_history || []);
    
    return res.json({
      success: true,
      response
    });
    
  } catch (error) {
    console.error('发送消息错误:', error);
    return res.status(500).json({ 
      error: '发送消息时出错: ' + error.message,
      details: error.response ? error.response.data : null
    });
  }
});

// API路由 - 英语学习助手
app.post('/api/english-assistant', async (req, res) => {
  try {
    const { message, chat_history, sender_did } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: '缺少消息参数' });
    }
    
    // 获取英语学习助手响应
    const response = await getEnglishAssistantResponse(message, chat_history || [], sender_did || '');
    
    return res.json({
      success: true,
      response
    });
    
  } catch (error) {
    console.error('英语助手错误:', error);
    return res.status(500).json({ error: '获取英语助手响应时出错: ' + error.message });
  }
});

// 验证DID
app.post('/api/validate-did', (req, res) => {
  try {
    const { did } = req.body;
    
    if (!did) {
      return res.status(400).json({ error: '缺少DID参数' });
    }
    
    const valid = isValidDID(did);
    return res.json({ valid });
    
  } catch (error) {
    console.error('验证DID错误:', error);
    return res.status(500).json({ error: '验证DID时出错: ' + error.message });
  }
});

// 启动服务器
app.listen(port, () => {
  console.log(`智能体互动系统运行在 http://localhost:${port}`);
});
