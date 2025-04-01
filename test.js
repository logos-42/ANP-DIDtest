 /**
 * 简单测试脚本，直接连接到智能体并发送消息
 */
import { parseDID } from './lib/did.js';
import { connectToAgent } from './lib/agent.js';

// 要连接的DID
const TARGET_DID = 'did:self:ECDSA:9VX4DyKYjUaAYeB3LJwS-waIqnyTCu6srmwkAqbK-bqS6S7_rt6gt5Zk8d5safiW57XfJWVdIr1FSKWEQCPB5A:aHR0cHM6Ly9hbnB0ZXN0LnZlcmNlbC5hcHAvYXBpL21lc3NhZ2U:eyJuYW1lIjoi6ISx5Y-j56eAQUnliqnmiYsiLCJ0eXBlIjoiQ29tZWR5QWdlbnQiLCJjcmVhdGVkIjoiMjAyNS0wNC0wMVQwNzowOTo1MS4xMzFaIiwidmVyc2lvbiI6IjEuMC4wIn0:zBRDXs2SbOT3QUEJFnLBTSj6b-Ju7D9JhOB0zT0ErSXwA0R4utsn39geRAE_YIZ6OOgA1BuAAXfF1C2PBibkLw';

// 解析和打印DID信息
async function testConnection() {
  console.log('==================================');
  console.log('  DID智能体连接测试');
  console.log('==================================');
  console.log();
  
  try {
    // 解析DID
    console.log('解析DID...');
    const didInfo = parseDID(TARGET_DID);
    
    if (!didInfo) {
      console.error('无法解析DID，请检查格式');
      return;
    }
    
    console.log('DID解析成功!');
    console.log('智能体名称:', didInfo.metadata.name);
    console.log('智能体类型:', didInfo.metadata.type);
    console.log('端点URL:', didInfo.endpoint);
    console.log();
    
    // 发送消息
    console.log('发送测试消息...');
    const response = await connectToAgent(TARGET_DID, '你好，我是通过DID连接到你的用户!');
    
    console.log('\n收到回复:');
    console.log(response.response);
    console.log('\n时间戳:', response.timestamp);
    console.log('\n测试完成!');
    
  } catch (error) {
    console.error('测试失败:', error.message);
    if (error.response) {
      console.error('服务器响应:', error.response.data);
    }
  }
}

// 执行测试
testConnection().catch(console.error);