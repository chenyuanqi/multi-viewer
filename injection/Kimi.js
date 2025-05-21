// 获取标题并发送回父页面
const title = document.title;
window.parent.postMessage(
  { type: "FROM_IFRAME", title }, 
  "*"
);

const pressButton = (buttonKey, status) => {
  const config = {
    'thinking': 'div.k15-switch',
    'webSearch': 'div.search-switch',
  }
  if(!config[buttonKey]) {
    console.log('current not support model:', buttonKey)
    return;
  }
  const button = document.querySelector(config[buttonKey]);
  if (!button) {
    console.log('Button not found at ', document.title);
    return
  }
  // 判断元素属性是否包含 open 属性
  const current = button.classList.contains('open');
  if (current !== status) {
    button.click();
  } else {
    console.log('状态一致')
  }
}

const messageHandlers = {
  CHAT_MESSAGE: (data) => {
    // 在这里处理接收到的消息
    const chatInput = document.querySelector('.chat-input-editor'); // 替换为实际的选择器
    if (chatInput) {
      // 创建并触发输入事件
      chatInput.dispatchEvent(new InputEvent('input', { bubbles: true, data: data.message, inputType: 'insertText' }));

      pressButton('webSearch', data.config.webSearch);
      pressButton('thinking', data.config.thinking);
      // 添加短暂延迟再触发点击事件
      setTimeout(() => {
        const button = document.querySelector('.send-button');
        if (button) {
          button.click(); // 点击发送按钮
        } else {
          console.log('kimi send button not found')
        }
      }, 100); // 延迟100毫秒
    } else {
      console.log('Chat input not found at ', document.title);
    }
  },
  
  NEW_CHAT: (data) => {
    const newBtns = [
      document.querySelector('.new-chat-btn'),
      document.querySelector('svg[name="AddConversation"]')
    ]
    const newBtn = newBtns.find(btn => btn);
    if (newBtn) {
      newBtn.click(); // 点击第一个存在的按钮
    } else {
      console.log('New chat button not found at ', document.title, document.location.href);
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