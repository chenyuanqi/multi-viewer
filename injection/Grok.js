// 获取标题并发送回父页面
const title = document.title;
window.parent.postMessage(
  { type: "FROM_IFRAME", title }, 
  "*"
);

const pressButton = (buttonKey, status) => {
  const config = {
    'thinking': 'button[aria-label="DeepSearch"]',
  }
  const button = document.querySelector(config[buttonKey]);
  if (!button) {
    console.log(' button not found for ', buttonKey, ' at ', document.title);
    return
  }

  const current = button.getAttribute('aria-pressed') === 'true';
  if (current !== status) {
    button.click();
    console.log('点击按钮', config[buttonKey], '当前状态:', current, '目标状态:', status);
  } else {
    console.log('状态一致')
  }
}

const messageHandlers = {
  CHAT_MESSAGE: (data) => {
    pressButton('thinking', data.config.thinking);
    // 在这里处理接收到的消息
    const chatInput = document.querySelector('textarea[aria-label');
    if (chatInput) {
      // 创建并触发输入事件
      chatInput.value = data.message; // 设置输入框的内容
      const inputEvent = new Event('input', { bubbles: true });
      chatInput.dispatchEvent(inputEvent);

      // 添加短暂延迟再触发点击事件
      setTimeout(() => {
        const button = document.querySelector('button[type="submit"]');
        if (button) {
          button.click(); // 点击发送按钮
          console.log('Clicked send button');
        } else {
          console.log('Send button not found');
        }
      }, 100); // 延迟100毫秒
    } else {
      console.log('Chat input not found at ', document.title);
    }
  },
  
  NEW_CHAT: (data) => {
    const button = document.querySelector('a[type="button"]')
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