// 获取标题并发送回父页面
const title = document.title;

window.parent.postMessage(
  { type: "FROM_IFRAME", title }, 
  "*"
);

const pressButton = (buttonKey, status) => {
  const config = {
    'thinking': '.input-area-container button.toolbox-drawer-item-button',
  }
  const button = document.querySelectorAll(config[buttonKey]);
  if (!button || button.length != 2) {
    console.log('Button not found at ', document.title);
    return
  }

  const btn = button[0];
  // 检查是否包含以 "active-" 开头的类
  const current = [...btn.classList].some(className => 
    className.startsWith('is-selected')
  );

  if (current !== status) {
    console.log(btn);
    btn.click();
    console.log('点击按钮', config[buttonKey], '当前状态:', current, '目标状态:', status);
  } else {
    console.log('状态一致')
  }
}

const messageHandlers = {
  CHAT_MESSAGE: (data) => {

    pressButton('thinking', data.config.thinking);

    // 在这里处理接收到的消息
    const chatInput = document.querySelector('.ql-editor'); // 替换为实际的选择器
    if (chatInput) {
      chatInput.textContent = data.message; // 设置输入框的值
      
      // 创建并触发输入事件
      const inputEvent = new Event('input', { bubbles: true });
      chatInput.dispatchEvent(inputEvent);

      setTimeout(() => {
        const button = document.querySelector('button.submit');
        if (button) {
          button.click(); // 点击发送按钮
        } else {
          console.log('Send button not found');
        }
      }, 100);
    } else {
      console.log('Chat input not found at ', document.title);
    }
  },
  
  NEW_CHAT: (data) => {
    const button = document.querySelector('expandable-button[data-test-id="new-chat-button"]');
    if (button) {
      button.click(); // 点击创建新对话按钮
    } else {
      const button = document.querySelector('button[data-test-id="start-new-conversation-button"]');
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