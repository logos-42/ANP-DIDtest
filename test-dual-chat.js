/**
 * 双窗口聊天功能测试脚本
 * 用于测试英语学习助手API调用
 */

import { getEnglishAssistantResponse } from './lib/agent.js';
import axios from 'axios';

// 直接测试SiliconFlow API
async function testSiliconFlowAPI() {
  try {
    console.log('正在直接测试SiliconFlow API...');
    
    const apiKey = 'sk-dsayvcknhfsoftyaarputmhlbtdmltzwsmziktxahyhwrhup';
    const apiUrl = 'https://siliconflow.net/api/chat';
    
    // 测试问题
    const testQuestion = '你能解释一下英语中的现在完成时是什么意思吗？';
    console.log(`测试问题: ${testQuestion}`);
    
    const messages = [
      {
        role: 'system',
        content: '你是一位专业的英语学习助手，擅长英语教学、语法讲解、口语练习和英文写作指导。请用简单易懂的方式进行解释，必要时提供例句。如果用户使用中文提问，你应该用中文回答，但可以适当加入英文解释和例句。如果用户使用英文提问，你应该用英文回答。'
      },
      {
        role: 'user',
        content: testQuestion
      }
    ];
    
    console.log('发送请求到SiliconFlow API...');
    console.log(JSON.stringify({
      model: 'deepseek-ai/DeepSeek-R1-Distill-Qwen-14B',
      messages,
      temperature: 0.7,
      top_p: 0.95
    }, null, 2));
    
    const response = await axios.post(apiUrl, {
      model: 'deepseek-ai/DeepSeek-R1-Distill-Qwen-14B',
      messages,
      temperature: 0.7,
      top_p: 0.95
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      timeout: 30000 // 30秒超时
    });
    
    console.log('------------------------------------');
    console.log('SiliconFlow API响应状态:', response.status);
    console.log('响应头:', JSON.stringify(response.headers, null, 2));
    
    if (response.data && response.data.choices && response.data.choices.length > 0) {
      console.log('API响应内容:');
      console.log(response.data.choices[0].message.content);
    } else {
      console.log('API响应数据:', JSON.stringify(response.data, null, 2));
    }
    console.log('------------------------------------');
    
  } catch (error) {
    console.error('直接API测试失败:', error.message);
    if (error.response) {
      console.error('错误状态码:', error.response.status);
      console.error('错误响应数据:', JSON.stringify(error.response.data, null, 2));
    } else if (error.request) {
      console.error('未收到响应:', error.request);
    }
  }
}

// 测试通过agent.js调用API
async function testEnglishAssistant() {
  try {
    console.log('开始测试英语学习助手...');
    
    // 测试问题
    const testQuestion = '你能解释一下英语中的现在完成时是什么意思吗？';
    
    console.log(`测试问题: ${testQuestion}`);
    
    // 调用API获取响应
    console.log('调用getEnglishAssistantResponse函数...');
    const response = await getEnglishAssistantResponse(testQuestion);
    
    console.log('------------------------------------');
    console.log('英语学习助手响应:');
    console.log(response);
    console.log('------------------------------------');
    
    console.log('测试完成！');
  } catch (error) {
    console.error('测试失败:', error);
  }
}

// 首先直接测试API
console.log('=== 开始直接测试SiliconFlow API ===');
await testSiliconFlowAPI();

console.log('\n\n=== 开始测试agent.js中的API调用 ===');
await testEnglishAssistant();