#!/usr/bin/env node

/**
 * DID连接工具 - 命令行程序
 * 用于连接基于自压缩DID的智能体
 */

import readlineSync from 'readline-sync';
import { parseDID, getEndpointFromDID } from './lib/did.js';
import { connectToAgent, getAgentInfo } from './lib/agent.js';

// 默认DID - 可以根据需要更改
const DEFAULT_DID = 'did:self:ECDSA:9VX4DyKYjUaAYeB3LJwS-waIqnyTCu6srmwkAqbK-bqS6S7_rt6gt5Zk8d5safiW57XfJWVdIr1FSKWEQCPB5A:aHR0cHM6Ly9hbnB0ZXN0LnZlcmNlbC5hcHAvYXBpL21lc3NhZ2U:eyJuYW1lIjoi6ISx5Y-j56eAQUnliqnmiYsiLCJ0eXBlIjoiQ29tZWR5QWdlbnQiLCJjcmVhdGVkIjoiMjAyNS0wNC0wMVQwNzowOTo1MS4xMzFaIiwidmVyc2lvbiI6IjEuMC4wIn0:zBRDXs2SbOT3QUEJFnLBTSj6b-Ju7D9JhOB0zT0ErSXwA0R4utsn39geRAE_YIZ6OOgA1BuAAXfF1C2PBibkLw';

// 显示欢迎信息
console.log('==================================');
console.log('  DID智能体连接工具');
console.log('==================================');
console.log();

async function main() {
  try {
    // 提示用户输入DID或使用默认值
    let targetDID = readlineSync.question(`请输入目标智能体DID (直接回车使用默认值):\n`, {
      defaultInput: DEFAULT_DID
    });
    
    console.log('\n正在解析DID...');
    
    // 解析DID
    const didInfo = parseDID(targetDID);
    if (!didInfo) {
      console.error('无法解析DID，请检查格式是否正确');
      return;
    }
    
    // 显示智能体信息
    const agentInfo = getAgentInfo(targetDID);
    console.log('\n成功连接到智能体:');
    console.log(`名称: ${agentInfo.name}`);
    console.log(`类型: ${agentInfo.type}`);
    console.log(`创建时间: ${new Date(agentInfo.created).toLocaleString()}`);
    console.log(`版本: ${agentInfo.version}`);
    console.log(`端点: ${agentInfo.endpoint}`);
    console.log('\n');
    
    // 聊天循环
    let chatHistory = [];
    let continueChatting = true;
    
    while (continueChatting) {
      // 获取用户输入
      const message = readlineSync.question('请输入要发送的消息 (输入"exit"退出):\n');
      
      if (message.toLowerCase() === 'exit') {
        continueChatting = false;
        console.log('再见!');
        break;
      }
      
      try {
        // 发送消息给智能体
        console.log('\n发送消息中...');
        const response = await connectToAgent(targetDID, message, '', chatHistory);
        
        // 更新聊天历史
        chatHistory.push({ role: 'user', content: message });
        chatHistory.push({ role: 'assistant', content: response.response });
        
        // 显示回复
        console.log('\n智能体回复:');
        console.log(response.response);
        console.log('\n');
      } catch (error) {
        console.error(`错误: ${error.message}`);
        console.log('请重试或输入"exit"退出');
      }
    }
  } catch (error) {
    console.error('程序运行错误:', error.message);
  }
}

// 执行主程序
main().catch(console.error);