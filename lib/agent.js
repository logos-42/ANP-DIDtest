/**
 * 智能体连接库 - 与基于DID的智能体通信
 */

import axios from 'axios';
import { parseDID } from './did.js';

// 创建axios实例，设置默认值
const api = axios.create({
  timeout: 60000, // 60秒超时
  headers: {
    'Content-Type': 'application/json',
    'User-Agent': 'DID-Connect/1.0.0'
  }
});

// 添加重试逻辑
const MAX_RETRIES = 2;

// 英语学习助手API配置
const ENGLISH_ASSISTANT_API = process.env.ENGLISH_ASSISTANT_API || 'https://api.siliconflow.cn/v1/chat/completions';
const API_KEY = process.env.API_KEY || 'sk-dsayvcknhfsoftyaarputmhlbtdmltzwsmziktxahyhwrhup'; // SiliconFlow API密钥

/**
 * 连接到智能体并发送消息
 * @param {string} did 目标智能体的DID
 * @param {string} message 要发送的消息
 * @param {string} sender_did 发送者的DID（可选）
 * @param {Array} chat_history 聊天历史（可选）
 * @returns {Promise<Object>} 智能体响应
 */
export async function connectToAgent(did, message, sender_did = '', chat_history = [], retryCount = 0) {
  try {
    // 解析DID
    const parsedDID = parseDID(did);
    if (!parsedDID) {
      throw new Error('无法解析DID');
    }
    
    // 获取端点URL
    const endpoint = parsedDID.endpoint;
    if (!endpoint) {
      throw new Error('DID中不包含有效的端点URL');
    }
    
    console.log(`正在连接到智能体: ${parsedDID.metadata.name || '未知'}`);
    console.log(`端点URL: ${endpoint}`);
    
    // 准备请求数据
    const requestData = {
      message,
      sender_did,
      chat_history
    };
    
    // 发送请求
    console.log('正在发送消息...');
    try {
      const response = await api.post(endpoint, requestData);
      return response.data;
    } catch (error) {
      // 如果是超时或网络错误，尝试重试
      if ((error.code === 'ECONNABORTED' || error.code === 'ERR_BAD_RESPONSE' || 
           error.response?.status === 504 || error.response?.status === 503) && 
          retryCount < MAX_RETRIES) {
        
        console.log(`请求失败，正在重试 (${retryCount + 1}/${MAX_RETRIES})...`);
        // 延迟一段时间再重试
        await new Promise(resolve => setTimeout(resolve, 2000)); 
        return connectToAgent(did, message, sender_did, chat_history, retryCount + 1);
      }
      
      throw error;
    }
  } catch (error) {
    console.error('连接智能体失败:', error.message);
    if (error.response) {
      console.error('服务器响应:', error.response.data);
    }
    throw error;
  }
}

/**
 * 获取英语学习助手的响应
 * @param {string} message 用户消息
 * @param {Array} chat_history 聊天历史
 * @param {string} sender_did 发送者DID
 * @returns {Promise<string>} 助手响应
 */
export async function getEnglishAssistantResponse(message, chat_history = [], sender_did = '') {
  try {
    console.log('获取英语学习助手响应...');
    
    // 准备消息历史
    const formattedHistory = chat_history.map(msg => ({
      role: msg.role,
      content: msg.content
    }));
    
    // 添加系统提示信息
    const messages = [
      {
        role: 'system',
        content: '你是一位专业的英语学习助手，擅长英语教学、语法讲解、口语练习和英文写作指导。请用简单易懂的方式进行解释，必要时提供例句。如果用户使用中文提问，你应该用中文回答，但可以适当加入英文解释和例句。如果用户使用英文提问，你应该用英文回答。'
      },
      ...formattedHistory,
      {
        role: 'user',
        content: message
      }
    ];
    
    console.log('正在调用SiliconFlow API...');
    
    // 使用axios.post而不是api.post
    const response = await axios.post(ENGLISH_ASSISTANT_API, {
      model: 'deepseek-ai/DeepSeek-R1-Distill-Qwen-14B',
      messages,
      temperature: 0.7,
      max_tokens: 800,
      top_p: 0.95
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      timeout: 60000 // 60秒超时
    });
    
    if (response.data && response.data.choices && response.data.choices.length > 0) {
      return response.data.choices[0].message.content;
    } else {
      throw new Error('无法获取有效响应');
    }
    
  } catch (error) {
    console.error('获取英语助手响应失败:', error.message);
    if (error.response) {
      console.error('API响应:', error.response.data);
    }
    
    // 发生错误时返回友好提示，而不是崩溃
    return `非常抱歉，我在处理您的请求时遇到了问题：${error.message}。请稍后再试。`;
  }
}

/**
 * 获取智能体信息
 * @param {string} did 智能体DID
 * @returns {Object|null} 智能体信息，包括名称、类型等
 */
export function getAgentInfo(did) {
  const parsedDID = parseDID(did);
  if (!parsedDID) {
    return null;
  }
  
  return {
    name: parsedDID.metadata.name || '未知智能体',
    type: parsedDID.metadata.type || '未知类型',
    endpoint: parsedDID.endpoint,
    created: parsedDID.metadata.created,
    version: parsedDID.metadata.version || '1.0.0'
  };
}