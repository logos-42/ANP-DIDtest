/**
 * DID处理库 - 解析和生成自压缩DID
 */
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// 获取当前文件的目录
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 密钥存储目录
const KEYS_DIR = path.join(__dirname, '..', 'keys');

/**
 * Base64URL编码函数
 * @param {string} str 要编码的字符串
 * @returns {string} Base64URL编码后的字符串
 */
export function base64UrlEncode(str) {
  return Buffer.from(str, 'utf-8')
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * Base64URL解码函数
 * @param {string} base64Url Base64URL编码的字符串
 * @returns {string} 解码后的字符串
 */
export function base64UrlDecode(base64Url) {
  // 替换URL安全字符为标准Base64字符
  let base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  
  // 添加填充字符
  while (base64.length % 4) {
    base64 += '=';
  }
  
  // 解码
  return Buffer.from(base64, 'base64').toString('utf-8');
}

/**
 * 生成ECDSA密钥对
 * @returns {Object} 包含公钥和私钥的对象
 */
function generateKeyPair() {
  return crypto.generateKeyPairSync('ec', {
    namedCurve: 'secp256k1',
    publicKeyEncoding: {
      type: 'spki',
      format: 'pem'
    },
    privateKeyEncoding: {
      type: 'pkcs8',
      format: 'pem'
    }
  });
}

/**
 * 对数据进行数字签名
 * @param {string} data 要签名的数据
 * @param {string} privateKey 私钥
 * @returns {string} Base64URL编码的签名
 */
function createSignature(data, privateKey) {
  const sign = crypto.createSign('SHA256');
  sign.update(data);
  sign.end();
  const signature = sign.sign(privateKey);
  return Buffer.from(signature).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/**
 * 生成自压缩DID
 * @param {string} name 智能体名称
 * @returns {Promise<Object>} 包含DID、公钥和私钥的对象
 */
export async function generateDID(name) {
  try {
    // 确保密钥目录存在
    if (!fs.existsSync(KEYS_DIR)) {
      fs.mkdirSync(KEYS_DIR, { recursive: true });
    }

    // 生成密钥对
    const { publicKey, privateKey } = generateKeyPair();
    
    // 提取公钥
    const publicKeyPEM = publicKey.replace(/-----BEGIN PUBLIC KEY-----\n/, '')
      .replace(/\n-----END PUBLIC KEY-----\n?/, '')
      .replace(/\n/g, '');
    
    // 简化公钥表示
    const publicKeyB64 = base64UrlEncode(publicKeyPEM);
    
    // 创建元数据
    const metadata = {
      name: name,
      type: '用户智能体',
      created: new Date().toISOString(),
      version: '1.0.0'
    };
    
    // 序列化元数据
    const metadataStr = JSON.stringify(metadata);
    const metadataB64 = base64UrlEncode(metadataStr);
    
    // 创建端点
    const endpoint = `${process.env.API_BASE_URL || 'https://anptest.vercel.app'}/api/message`;
    const endpointB64 = base64UrlEncode(endpoint);
    
    // 准备签名数据
    const dataToSign = `did:self:ECDSA:${publicKeyB64}:${endpointB64}:${metadataB64}`;
    
    // 创建签名
    const signature = createSignature(dataToSign, privateKey);
    
    // 组装完整DID
    const did = `${dataToSign}:${signature}`;
    
    // 保存密钥到文件
    const keyFileName = `${Date.now()}_${name.replace(/[^a-zA-Z0-9]/g, '_')}`;
    const keyData = {
      did,
      publicKey: publicKeyPEM,
      privateKey,
      metadata
    };
    
    fs.writeFileSync(
      path.join(KEYS_DIR, `${keyFileName}.json`),
      JSON.stringify(keyData, null, 2)
    );
    
    return { did, publicKey: publicKeyPEM, privateKey };
  } catch (error) {
    console.error('生成DID错误:', error);
    throw error;
  }
}

/**
 * 解析自压缩DID
 * @param {string} did 完整的DID字符串
 * @returns {Object|null} 解析结果，包含方法、公钥、端点、元数据等
 */
export function parseDID(did) {
  try {
    // 验证DID格式
    if (!did || typeof did !== 'string') {
      throw new Error('DID必须是字符串');
    }
    
    // 分割DID各部分
    const parts = did.split(':');
    
    // 验证DID基本结构
    if (parts.length < 7 || parts[0] !== 'did' || parts[1] !== 'self') {
      throw new Error('无效的自压缩DID格式');
    }
    
    // 解析各部分数据
    const method = `${parts[0]}:${parts[1]}`;  // did:self
    const algorithm = parts[2];                 // 如ECDSA
    const publicKeyB64 = parts[3];              // 公钥（Base64URL编码）
    const endpointB64 = parts[4];               // 端点（Base64URL编码）
    const metadataB64 = parts[5];               // 元数据（Base64URL编码）
    const signatureB64 = parts[6];              // 签名（Base64URL编码）
    
    // 解码端点和元数据
    const endpoint = base64UrlDecode(endpointB64);
    const metadataStr = base64UrlDecode(metadataB64);
    const metadata = JSON.parse(metadataStr);
    
    // 返回解析结果
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
    console.error('DID解析错误:', error.message);
    return null;
  }
}

/**
 * 验证DID格式是否正确
 * @param {string} did DID字符串
 * @returns {boolean} 是否是有效的DID格式
 */
export function isValidDID(did) {
  return !!parseDID(did);
}

/**
 * 从DID获取端点URL
 * @param {string} did DID字符串
 * @returns {string|null} 端点URL，解析失败返回null
 */
export function getEndpointFromDID(did) {
  const parsed = parseDID(did);
  return parsed ? parsed.endpoint : null;
}

/**
 * 从DID获取元数据
 * @param {string} did DID字符串
 * @returns {Object|null} 元数据对象，解析失败返回null
 */
export function getMetadataFromDID(did) {
  const parsed = parseDID(did);
  return parsed ? parsed.metadata : null;
}