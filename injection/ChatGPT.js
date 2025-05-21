// 执行自定义初始化脚本，隐藏页面元素等
console.log('ChatGPT.js page loaded');
// 获取标题并发送回父页面
const title = document.title;
window.parent.postMessage(
  { type: "IFRAME_LOADED", title },
  "*"
);

document.addEventListener('copy', (e) => {
  const selection = window.getSelection();
  if (selection.toString().includes('代码块内容')) {
    e.preventDefault();
    e.clipboardData.setData('text/plain', selection.toString());
  }
});

const pressButton = (button, status) => {
  if (!button) {
    console.log('Button not found at ', document.title);
    return
  }
  const current = button.getAttribute('aria-pressed') === 'true';
  if (current !== status) {
    button.click();
  } else {
    console.log('状态一致')
  }
}

// 消息处理器映射表
const messageHandlers = {
  CHAT_MESSAGE: (data) => {
    // 处理 thinking 和 webSearch
    const webSearchButton = document.querySelectorAll('button[aria-pressed]')[0];
    pressButton(webSearchButton, data.config.webSearch);

    const thinkingButton = document.querySelectorAll('button[aria-pressed]')[1];
    pressButton(thinkingButton, data.config.thinking);

    // 在这里处理接收到的消息
    const chatInput = document.querySelector('#prompt-textarea');
    if (chatInput) {
      // 创建并触发输入事件
      chatInput.textContent = data.message; // 设置输入框的内容
      // 添加短暂延迟再触发点击事件
      setTimeout(() => {
        const button = document.querySelector('button[data-testid="send-button"]');
        if (button) {
          button.click(); // 点击发送按钮
        } else {
          console.log('Send button not found at ', document.title);
        }
      }, 100); // 延迟100毫秒
    } else {
      console.log('Chat input not found at ', document.title);
    }
  },

  NEW_CHAT: (data) => {
    let button = document.querySelector('[data-testid="create-new-chat-button"]');
    if (button) {
      button.click(); // 点击创建新对话按钮
    } else {
      let button = document.querySelector('a.text-token-text-secondary.h-10:nth-of-type(1)');
      if (button) {
        button.click(); // 点击创建新对话按钮
      } else {
        console.log('New chat button not found at ', document.title);
      }
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
  if (!event.data) {
    return;
  }
  const { type, message, config } = event.data;
  if (!type) {
    return;
  }
  console.log('Received message in iframe', document.title, ' type:', type, ', message:', message, ', config:', config);
  const handler = messageHandlers[type] || ((data) => defaultHandler(type, event.data));
  try {
    handler(event.data);
  } catch (error) {
    console.log(`${document.title} Error processing message type ${type}:`, error);
  }
});