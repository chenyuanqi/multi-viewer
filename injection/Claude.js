console.log('Claude.js loaded');
// 执行自定义初始化脚本，隐藏页面元素等
window.addEventListener('DOMContentLoaded', () => {
  console.log('Claude.js page loaded');
  // 获取标题并发送回父页面
  const title = document.title;
  window.parent.postMessage(
    { type: "FROM_IFRAME", title }, 
    "*"
  );
});

// 消息处理器映射表
const messageHandlers = {
  CHAT_MESSAGE: (data) => {
    // 在这里处理接收到的消息
    const chatInput = document.querySelector('div[contenteditable="true"]');
    if (chatInput) {
      // 创建并触发输入事件
      chatInput.textContent = data.message; // 设置输入框的内容
      // 添加短暂延迟再触发点击事件
      setTimeout(() => {
        const enterEvent = new KeyboardEvent('keydown', {
          bubbles: true,
          cancelable: true,
          key: 'Enter',
          code: 'Enter',
          keyCode: 13
        });
        chatInput.dispatchEvent(enterEvent); // 模拟按下回车键
      }, 100);
    } else {
      console.log('Chat input not found at ', document.title);
    }
  },
  
  NEW_CHAT: (data) => {
    const button = document.querySelector('a[aria-label="New chat"]');
    if (button) {
      button.click(); // 点击创建新对话按钮
    } else {
      console.log('New chat button not found at ', document.title);
    }
  },

  SYNC_SESSION: (data) => {
    console.log('Syncing session data:', data);
    let siteItem = data.message;
    siteItem.siteName = data.config.siteId;
    window.siteItem = siteItem;
  },
};

// 默认处理器
const defaultHandler = (type, data) => {
  console.log(`No handler registered for message type: ${type}`, data);
};

// 消息监听
window.addEventListener('message', (event) => {
  if(!event.data) {
    return;
  }
  const { type, message, config } = event.data;
  if(!type) {
    return;
  }
  console.log('Received message in iframe', document.title,' type:', type, ', message:', message, ', config:', config);
  const handler = messageHandlers[type] || ((data) => defaultHandler(type, event.data));
  try {
    handler(event.data);
  } catch (error) {
    console.log(`${document.title} Error processing message type ${type}:`, error);
  }
});