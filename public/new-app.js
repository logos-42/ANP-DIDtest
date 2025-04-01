 // 智能体互动系统前端脚本

// DOM 元素 - 控制面板
const didNameInput = document.getElementById('did-name');
const generateDidBtn = document.getElementById('generate-did-btn');
const didDisplay = document.getElementById('did-display');
const generatedDid = document.getElementById('generated-did');
const copyDidBtn = document.getElementById('copy-did-btn');

// DOM 元素 - 英语学习助手
const englishChatMessages = document.getElementById('english-chat-messages');
const englishMessageInput = document.getElementById('english-message-input');
const englishSendBtn = document.getElementById('english-send-btn');
const englishLoading = document.getElementById('english-loading');

// DOM 元素 - 智能体连接
const connectDidInput = document.getElementById('connect-did-input');
const connectAgentBtn = document.getElementById('connect-agent-btn');
const agentChatMessages = document.getElementById('agent-chat-messages');
const agentMessageInput = document.getElementById('agent-message-input');
const agentSendBtn = document.getElementById('agent-send-btn');
const agentLoading = document.getElementById('agent-loading');
const connectionStatus = document.getElementById('connection-status');

// 应用状态
let myDID = ''; // 用户自己的DID
let connectedAgentDID = ''; // 连接的智能体DID
let englishChatHistory = []; // 英语学习对话历史
let agentChatHistory = []; // 智能体间对话历史

// 初始化
function init() {
    // 事件监听 - 控制面板
    generateDidBtn.addEventListener('click', generateDID);
    copyDidBtn.addEventListener('click', copyDIDToClipboard);
    
    // 事件监听 - 英语学习助手
    englishSendBtn.addEventListener('click', sendEnglishMessage);
    englishMessageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendEnglishMessage();
        }
    });
    
    // 事件监听 - 智能体连接
    connectAgentBtn.addEventListener('click', connectToAgent);
    agentSendBtn.addEventListener('click', sendAgentMessage);
    agentMessageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendAgentMessage();
        }
    });
    
    // 检查URL参数中是否有DID
    const urlParams = new URLSearchParams(window.location.search);
    const didParam = urlParams.get('did');
    
    if (didParam) {
        connectDidInput.value = didParam;
        // 尝试连接
        setTimeout(connectToAgent, 1000);
    }
}

// 生成DID
async function generateDID() {
    const name = didNameInput.value.trim();
    
    // 禁用按钮，防止重复点击
    generateDidBtn.disabled = true;
    generateDidBtn.innerHTML = '<i class="bi bi-hourglass"></i> 正在生成...';
    
    try {
        // 调用API生成DID
        const response = await fetch('/api/generate-did', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name: name || '用户' })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || '生成DID失败');
        }
        
        // 更新状态
        myDID = data.did;
        
        // 显示生成的DID
        generatedDid.value = data.did;
        didDisplay.style.display = 'block';
        
        // 在智能体聊天窗口显示成功消息
        addSystemMessageToAgent(`您的身份已成功生成！现在您可以连接其他智能体进行对话。`);
        
        // 在英语学习窗口显示成功消息
        addSystemMessageToEnglish(`您的身份已成功生成！可以开始使用英语学习助手。`);
    } catch (error) {
        console.error('生成DID错误:', error);
        showError(error.message);
    } finally {
        // 恢复按钮状态
        generateDidBtn.disabled = false;
        generateDidBtn.innerHTML = '<i class="bi bi-key"></i> 生成DID';
    }
}

// 复制DID到剪贴板
function copyDIDToClipboard() {
    if (!generatedDid.value) {
        return;
    }
    
    // 选择文本
    generatedDid.select();
    
    try {
        // 复制文本
        document.execCommand('copy');
        
        // 显示成功提示
        const originalText = copyDidBtn.innerHTML;
        copyDidBtn.innerHTML = '<i class="bi bi-check-lg"></i> 已复制';
        
        // 3秒后恢复按钮文本
        setTimeout(() => {
            copyDidBtn.innerHTML = originalText;
        }, 3000);
    } catch (err) {
        console.error('复制失败:', err);
    }
}

// 发送消息到英语学习助手
async function sendEnglishMessage() {
    const message = englishMessageInput.value.trim();
    
    if (!message) {
        return;
    }
    
    // 添加用户消息到聊天区域
    addUserMessageToEnglish(message);
    
    // 清空输入框
    englishMessageInput.value = '';
    
    // 显示加载指示器
    englishLoading.style.display = 'flex';
    
    try {
        // 发送消息到服务器
        const response = await fetch('/api/english-assistant', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message,
                chat_history: englishChatHistory,
                sender_did: myDID || undefined
            })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || '发送消息失败');
        }
        
        // 添加助手回复
        const assistantResponse = data.response || '很抱歉，我现在无法回答您的问题。';
        addAssistantMessageToEnglish(assistantResponse);
        
        // 更新聊天历史
        englishChatHistory.push(
            { role: 'user', content: message },
            { role: 'assistant', content: assistantResponse }
        );
        
        // 聊天记录限制在最近20条
        if (englishChatHistory.length > 20) {
            englishChatHistory = englishChatHistory.slice(englishChatHistory.length - 20);
        }
        
    } catch (error) {
        console.error('英语助手消息错误:', error);
        addSystemMessageToEnglish(`错误: ${error.message}`, true);
    } finally {
        // 隐藏加载指示器
        englishLoading.style.display = 'none';
    }
}

// 连接到智能体
async function connectToAgent() {
    const did = connectDidInput.value.trim();
    
    if (!did) {
        addSystemMessageToAgent('请输入智能体DID', true);
        return;
    }
    
    if (!myDID) {
        addSystemMessageToAgent('请先生成您的身份（DID）', true);
        return;
    }
    
    // 禁用按钮，防止重复点击
    connectAgentBtn.disabled = true;
    
    // 显示连接中状态
    connectionStatus.textContent = '正在连接...';
    connectionStatus.style.color = 'var(--warning-color)';
    addSystemMessageToAgent('正在连接智能体...');
    
    try {
        // 验证并解析DID
        const response = await fetch('/api/parse-did', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ did })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || '无法连接到智能体');
        }
        
        if (!data.success) {
            throw new Error(data.error || '解析DID失败');
        }
        
        // 更新状态
        connectedAgentDID = did;
        
        // 更新连接状态
        connectionStatus.textContent = `已连接: ${data.agent.name || '未知智能体'}`;
        connectionStatus.style.color = 'var(--success-color)';
        
        // 启用消息输入
        agentMessageInput.disabled = false;
        agentSendBtn.disabled = false;
        
        // 添加系统消息
        addSystemMessageToAgent(`已成功连接到智能体: ${data.agent.name || '未知智能体'}`);
        
        // 清空聊天历史
        agentChatHistory = [];
        
    } catch (error) {
        console.error('连接智能体错误:', error);
        connectionStatus.textContent = '连接失败';
        connectionStatus.style.color = 'var(--danger-color)';
        addSystemMessageToAgent(`错误: ${error.message}`, true);
    } finally {
        connectAgentBtn.disabled = false;
    }
}

// 发送消息到连接的智能体
async function sendAgentMessage() {
    const message = agentMessageInput.value.trim();
    
    if (!message) {
        return;
    }
    
    if (!connectedAgentDID) {
        addSystemMessageToAgent('请先连接智能体', true);
        return;
    }
    
    // 添加用户消息到聊天区域
    addUserMessageToAgent(message);
    
    // 清空输入框
    agentMessageInput.value = '';
    
    // 显示加载指示器
    agentLoading.style.display = 'flex';
    
    try {
        // 发送消息到服务器
        const response = await fetch('/api/send-message', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                did: connectedAgentDID,
                message,
                chat_history: agentChatHistory,
                sender_did: myDID
            })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || '发送消息失败');
        }
        
        if (!data.success) {
            throw new Error(data.error || '智能体未响应');
        }
        
        // 添加智能体回复
        const agentResponse = data.response.response || '...';
        addAgentMessageToAgent(agentResponse);
        
        // 更新聊天历史
        agentChatHistory.push(
            { role: 'user', content: message },
            { role: 'assistant', content: agentResponse }
        );
        
        // 聊天记录限制在最近20条
        if (agentChatHistory.length > 20) {
            agentChatHistory = agentChatHistory.slice(agentChatHistory.length - 20);
        }
        
    } catch (error) {
        console.error('发送消息错误:', error);
        addSystemMessageToAgent(`错误: ${error.message}`, true);
    } finally {
        // 隐藏加载指示器
        agentLoading.style.display = 'none';
    }
}

// 添加用户消息到英语学习聊天
function addUserMessageToEnglish(message) {
    const messageElement = document.createElement('div');
    messageElement.className = 'message message-user';
    
    const time = new Date();
    
    messageElement.innerHTML = `
        <div class="message-content">
            ${escapeHtml(message)}
            <div class="message-time">${formatTime(time)}</div>
        </div>
    `;
    
    englishChatMessages.appendChild(messageElement);
    scrollToBottom(englishChatMessages);
}

// 添加助手消息到英语学习聊天
function addAssistantMessageToEnglish(message) {
    const messageElement = document.createElement('div');
    messageElement.className = 'message message-agent';
    
    const time = new Date();
    
    messageElement.innerHTML = `
        <div class="message-content">
            ${escapeHtml(message).replace(/\n/g, '<br>')}
            <div class="message-time">${formatTime(time)}</div>
        </div>
    `;
    
    englishChatMessages.appendChild(messageElement);
    scrollToBottom(englishChatMessages);
}

// 添加系统消息到英语学习聊天
function addSystemMessageToEnglish(message, isError = false) {
    const messageElement = document.createElement('div');
    messageElement.className = 'message message-system';
    
    messageElement.innerHTML = `
        <div class="message-content" style="
            background-color: ${isError ? '#ffebee' : '#e8f5e9'}; 
            color: ${isError ? '#b71c1c' : '#2e7d32'};
        ">
            ${escapeHtml(message)}
        </div>
    `;
    
    englishChatMessages.appendChild(messageElement);
    scrollToBottom(englishChatMessages);
}

// 添加用户消息到智能体聊天
function addUserMessageToAgent(message) {
    const messageElement = document.createElement('div');
    messageElement.className = 'message message-user';
    
    const time = new Date();
    
    messageElement.innerHTML = `
        <div class="message-content">
            ${escapeHtml(message)}
            <div class="message-time">${formatTime(time)}</div>
        </div>
    `;
    
    agentChatMessages.appendChild(messageElement);
    scrollToBottom(agentChatMessages);
}

// 添加智能体消息到智能体聊天
function addAgentMessageToAgent(message) {
    const messageElement = document.createElement('div');
    messageElement.className = 'message message-agent';
    
    const time = new Date();
    
    messageElement.innerHTML = `
        <div class="message-content">
            ${escapeHtml(message).replace(/\n/g, '<br>')}
            <div class="message-time">${formatTime(time)}</div>
        </div>
    `;
    
    agentChatMessages.appendChild(messageElement);
    scrollToBottom(agentChatMessages);
}

// 添加系统消息到智能体聊天
function addSystemMessageToAgent(message, isError = false) {
    const messageElement = document.createElement('div');
    messageElement.className = 'message message-system';
    
    messageElement.innerHTML = `
        <div class="message-content" style="
            background-color: ${isError ? '#ffebee' : '#e8f5e9'}; 
            color: ${isError ? '#b71c1c' : '#2e7d32'};
        ">
            ${escapeHtml(message)}
        </div>
    `;
    
    agentChatMessages.appendChild(messageElement);
    scrollToBottom(agentChatMessages);
}

// 显示错误信息
function showError(message) {
    alert(`错误: ${message}`);
}

// 滚动到底部
function scrollToBottom(element) {
    element.scrollTop = element.scrollHeight;
}

// 格式化时间
function formatTime(date) {
    return date.toLocaleString('zh-CN', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
}

// 转义HTML
function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// 启动应用
document.addEventListener('DOMContentLoaded', init);