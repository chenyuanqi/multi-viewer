// 获取标题并发送回父页面
const title = document.title;
window.parent.postMessage(
  { type: "FROM_IFRAME", title }, 
  "*"
);

const pressButton = (buttonKey, status) => {
  const config = {
    'thinking': document.querySelectorAll('button.chat-input-feature-btn')[0],
    'webSearch': document.querySelectorAll('button.chat-input-feature-btn')[1],
  }
  const button = config[buttonKey];
  if (!button) {
    console.log('Button not found at ', document.title, buttonKey);
    return
  }
  // 判断元素是否包含名为 text-purple-600 的 css
  const current = button.classList.contains('active');
  if (current !== status) {
    button.click();
  } else {
    console.log('状态一致')
  }
}

const messageHandlers = {
  CHAT_MESSAGE: (data) => {
    pressButton('webSearch', data.config.webSearch);
    pressButton('thinking', data.config.thinking);
    // 在这里处理接收到的消息
    const chatInput = document.querySelector('#chat-input'); // 替换为实际的选择器
    if (chatInput) {
      chatInput.value = data.message; // 设置输入框的值
      
      // 创建并触发输入事件
      const inputEvent = new Event('input', { bubbles: true });
      chatInput.dispatchEvent(inputEvent);

      // 添加短暂延迟再触发点击事件
      setTimeout(() => {
        const button = document.querySelector('#send-message-button');
        if (button) {
          button.click(); // 点击发送按钮
        }
      }, 100); // 延迟100毫秒
    } else {
      console.log('Chat input not found at ', document.title);
    }

    setTimeout(() => {
      console.log(document.title, " message end ", document.location.href, " ", window.location.href)
    }, 2000);
  },
  
  NEW_CHAT: (data) => {
    const button = document.querySelector('#new-chat-button');
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