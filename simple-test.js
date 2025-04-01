 /**
 * 简化版测试 - 仅测试DID解析功能
 */

// 要连接的DID
const TARGET_DID = 'did:self:ECDSA:9VX4DyKYjUaAYeB3LJwS-waIqnyTCu6srmwkAqbK-bqS6S7_rt6gt5Zk8d5safiW57XfJWVdIr1FSKWEQCPB5A:aHR0cHM6Ly9hbnB0ZXN0LnZlcmNlbC5hcHAvYXBpL21lc3NhZ2U:eyJuYW1lIjoi6ISx5Y-j56eAQUnliqnmiYsiLCJ0eXBlIjoiQ29tZWR5QWdlbnQiLCJjcmVhdGVkIjoiMjAyNS0wNC0wMVQwNzowOTo1MS4xMzFaIiwidmVyc2lvbiI6IjEuMC4wIn0:zBRDXs2SbOT3QUEJFnLBTSj6b-Ju7D9JhOB0zT0ErSXwA0R4utsn39geRAE_YIZ6OOgA1BuAAXfF1C2PBibkLw';

// 简单的Base64URL解码函数
function base64UrlDecode(base64Url) {
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

// 简单的DID解析函数
function parseDID(did) {
  console.log('开始解析DID...');
  
  try {
    // 验证DID格式
    if (!did || typeof did !== 'string') {
      throw new Error('DID必须是字符串');
    }
    
    console.log('DID长度:', did.length);
    
    // 分割DID各部分
    const parts = did.split(':');
    console.log('DID包含', parts.length, '个部分');
    
    // 验证DID基本结构
    if (parts.length < 7 || parts[0] !== 'did' || parts[1] !== 'self') {
      throw new Error('无效的自压缩DID格式');
    }
    
    // 解析各部分数据
    const method = `${parts[0]}:${parts[1]}`;
    const algorithm = parts[2];
    const publicKeyB64 = parts[3];
    const endpointB64 = parts[4];
    const metadataB64 = parts[5];
    const signatureB64 = parts[6];
    
    console.log('方法:', method);
    console.log('算法:', algorithm);
    console.log('公钥(前20字符):', publicKeyB64.substring(0, 20) + '...');
    console.log('端点Base64(前20字符):', endpointB64.substring(0, 20) + '...');
    
    // 尝试解码端点
    console.log('尝试解码端点...');
    const endpoint = base64UrlDecode(endpointB64);
    console.log('解码后的端点:', endpoint);
    
    // 尝试解码元数据
    console.log('尝试解码元数据...');
    const metadataStr = base64UrlDecode(metadataB64);
    console.log('元数据字符串:', metadataStr);
    
    // 解析JSON
    console.log('尝试解析JSON...');
    const metadata = JSON.parse(metadataStr);
    console.log('解析后的元数据:', metadata);
    
    return {
      did,
      method,
      algorithm,
      publicKey: publicKeyB64,
      endpoint,
      metadata,
      signature: signatureB64
    };
  } catch (error) {
    console.error('DID解析错误:', error);
    return null;
  }
}

// 主函数
function main() {
  console.log('==================================');
  console.log('  简单DID解析测试');
  console.log('==================================');
  console.log();
  
  const result = parseDID(TARGET_DID);
  
  if (result) {
    console.log('\n解析成功! 结果:');
    console.log('智能体名称:', result.metadata.name);
    console.log('端点:', result.endpoint);
  } else {
    console.error('解析失败!');
  }
}

// 执行主函数
main();