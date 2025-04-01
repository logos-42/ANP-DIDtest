 /**
 * 调试版测试脚本，包含详细日志输出
 */
import axios from 'axios';

// 要连接的DID
const TARGET_DID = 'did:self:ECDSA:9VX4DyKYjUaAYeB3LJwS-waIqnyTCu6srmwkAqbK-bqS6S7_rt6gt5Zk8d5safiW57XfJWVdIr1FSKWEQCPB5A:aHR0cHM6Ly9hbnB0ZXN0LnZlcmNlbC5hcHAvYXBpL21lc3NhZ2U:eyJuYW1lIjoi6ISx5Y-j56eAQUnliqnmiYsiLCJ0eXBlIjoiQ29tZWR5QWdlbnQiLCJjcmVhdGVkIjoiMjAyNS0wNC0wMVQwNzowOTo1MS4xMzFaIiwidmVyc2lvbiI6IjEuMC4wIn0:zBRDXs2SbOT3QUEJFnLBTSj6b-Ju7D9JhOB0zT0ErSXwA0R4utsn39geRAE_YIZ6OOgA1BuAAXfF1C2PBibkLw';

// 解码Base64URL
function base64UrlDecode(base64Url) {
  console.log('开始解码Base64URL:', base64Url.substring(0, 20) + '...');
  
  try {
    // 替换URL安全字符为标准Base64字符
    let base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    
    // 添加填充字符
    while (base64.length % 4) {
      base64 += '=';
    }
    
    // 解码
    const decoded = Buffer.from(base64, 'base64').toString('utf-8');
    return decoded;
  } catch (error) {
    console.error('Base64URL解码错误:', error);
    return null;
  }
}

// 解析DID
function parseDID(did) {
  console.log('开始解析DID...');
  
  try {
    // 分割DID各部分
    const parts = did.split(':');
    
    // 验证DID基本结构
    if (parts.length < 7 || parts[0] !== 'did' || parts[1] !== 'self') {
      throw new Error('无效的自压缩DID格式');
    }
    
    // 解析各部分数据
    const endpointB64 = parts[4];
    const metadataB64 = parts[5];
    
    // 解码端点和元数据
    const endpoint = base64UrlDecode(endpointB64);
    const metadataStr = base64UrlDecode(metadataB64);
    const metadata = JSON.parse(metadataStr);
    
    return { endpoint, metadata };
  } catch (error) {
    console.error('DID解析错误:', error);
    return null;
  }
}

// 发送请求
async function sendRequest(endpoint, message) {
  console.log('准备发送请求到:', endpoint);
  console.log('消息内容:', message);
  
  try {
    // 构造请求数据
    const requestData = {
      message: message,
      sender_did: '',
      chat_history: []
    };
    
    console.log('请求数据:', JSON.stringify(requestData));
    
    // 设置超时
    const timeoutMS = 30000; // 30秒
    console.log('设置请求超时:', timeoutMS, 'ms');
    
    // 发送请求
    console.log('发送POST请求...');
    const startTime = Date.now();
    
    const response = await axios.post(endpoint, requestData, {
      timeout: timeoutMS,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'DID-Connect-Test/1.0.0'
      }
    });
    
    const endTime = Date.now();
    console.log('请求耗时:', endTime - startTime, 'ms');
    
    // 处理响应
    console.log('响应状态码:', response.status);
    console.log('响应头部:', JSON.stringify(response.headers));
    console.log('响应数据:', JSON.stringify(response.data));
    
    return response.data;
  } catch (error) {
    console.error('发送请求失败:');
    
    if (error.response) {
      // 服务器响应了错误状态码
      console.error('  状态码:', error.response.status);
      console.error('  响应头:', JSON.stringify(error.response.headers));
      console.error('  响应数据:', JSON.stringify(error.response.data));
    } else if (error.request) {
      // 请求发送成功但没有收到响应
      console.error('  没有收到响应，请求详情:', error.request);
    } else {
      // 请求设置时出现问题
      console.error('  错误消息:', error.message);
    }
    
    console.error('  完整错误:', error);
    throw error;
  }
}

// 主函数
async function main() {
  console.log('======================================================');
  console.log('  详细调试 - DID连接测试');
  console.log('======================================================');
  console.log();
  
  try {
    // 解析DID
    const didInfo = parseDID(TARGET_DID);
    
    if (!didInfo) {
      console.error('DID解析失败，无法继续');
      return;
    }
    
    console.log('DID解析成功:');
    console.log('  智能体名称:', didInfo.metadata.name);
    console.log('  端点URL:', didInfo.endpoint);
    console.log();
    
    // 发送消息
    console.log('开始发送测试消息...');
    const response = await sendRequest(
      didInfo.endpoint, 
      '你好，我是通过DID连接到你的用户!'
    );
    
    // 显示回复
    console.log('\n测试完成!');
    console.log('智能体回复:', response.response);
    
  } catch (error) {
    console.error('测试过程中发生错误:', error.message);
  }
}

// 执行主函数
main().catch(error => {
  console.error('未捕获的错误:', error);
});