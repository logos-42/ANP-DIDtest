 // DID杩炴帴鍓嶇搴旂敤鏈嶅姟鍣?
import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { connectToAgent, getAgentInfo } from './lib/agent.js';
import { parseDID, isValidDID } from './lib/did.js';

// 鑾峰彇褰撳墠鏂囦欢鐨勭洰褰?
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 鍒濆鍖朎xpress搴旂敤
const app = express();
const port = process.env.PORT || 3000;

// 涓棿浠?
app.use(cors());
app.use(express.json());
app.use(express.static(join(__dirname, 'public')));

// API璺敱 - 瑙ｆ瀽DID
app.post('/api/parse-did', (req, res) => {
  try {
    const { did } = req.body;
    
    if (!did) {
      return res.status(400).json({ error: '缂哄皯DID鍙傛暟' });
    }
    
    // 瑙ｆ瀽DID
    const parsedDID = parseDID(did);
    
    if (!parsedDID) {
      return res.status(400).json({ error: '鏃犳晥鐨凞ID鏍煎紡' });
    }
    
    // 杩斿洖鏅鸿兘浣撲俊鎭?
    const agentInfo = getAgentInfo(did);
    return res.json({ 
      success: true, 
      agent: agentInfo 
    });
    
  } catch (error) {
    console.error('瑙ｆ瀽DID閿欒:', error);
    return res.status(500).json({ error: '澶勭悊DID鏃跺嚭閿? ' + error.message });
  }
});

// API璺敱 - 鍙戦€佹秷鎭?
app.post('/api/send-message', async (req, res) => {
  try {
    const { did, message, senderDID, chatHistory } = req.body;
    
    if (!did || !message) {
      return res.status(400).json({ error: '缂哄皯蹇呰鍙傛暟' });
    }
    
    // 鍙戦€佹秷鎭?
    const response = await connectToAgent(did, message, senderDID || '', chatHistory || []);
    
    return res.json({
      success: true,
      response
    });
    
  } catch (error) {
    console.error('鍙戦€佹秷鎭敊璇?', error);
    return res.status(500).json({ 
      error: '鍙戦€佹秷鎭椂鍑洪敊: ' + error.message,
      details: error.response ? error.response.data : null
    });
  }
});

// 楠岃瘉DID
app.post('/api/validate-did', (req, res) => {
  try {
    const { did } = req.body;
    
    if (!did) {
      return res.status(400).json({ error: '缂哄皯DID鍙傛暟' });
    }
    
    const valid = isValidDID(did);
    return res.json({ valid });
    
  } catch (error) {
    console.error('楠岃瘉DID閿欒:', error);
    return res.status(500).json({ error: '楠岃瘉DID鏃跺嚭閿? ' + error.message });
  }
});

// 鍚姩鏈嶅姟鍣?
app.listen(port, () => {
  console.log(`DID杩炴帴鍓嶇搴旂敤杩愯鍦?http://localhost:${port}`);
});
