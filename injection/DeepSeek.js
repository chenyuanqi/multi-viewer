// 获取标题并发送回父页面
const title = document.title;
window.parent.postMessage(
  { type: "FROM_IFRAME", title }, 
  "*"
);

const pressButton = (buttonKey, status) => {
  const config = {
    'thinking': 'div[role="button"].ds-button:nth-child(1)',
    'webSearch': 'div[role="button"].ds-button:nth-child(2)'
  }
  const button = document.querySelector(config[buttonKey]);
  if (!button) {
    console.log('Button not found at ', document.title);
    return
  }
  // 判断 --button-text-color 属性是否为 #4CAEFF，是则当前为选中状态 #4D6BFE
  const buttonTextColor = window.getComputedStyle(button).getPropertyValue('--button-text-color').trim().toLowerCase();
  // 定义目标颜色（标准化为小写）
  const targetSelectColors = ['#4caeff', '#4d6bfe']; 
  // 判断是否匹配任意一个颜色
  const current = targetSelectColors.includes(buttonTextColor);
  console.log(buttonKey, config[buttonKey], buttonTextColor, current);
  if (current !== status) {
    button.click();
  } else {
    console.log('状态一致')
  }
}

const messageHandlers = {
  CHAT_MESSAGE: (data) => {
    // 处理 thinking 和 webSearch
    pressButton('webSearch', data.config.webSearch);
    pressButton('thinking', data.config.thinking);

    // 在这里处理接收到的消息
    const chatInput = document.querySelector('#chat-input'); // 替换为实际的选择器
    if (chatInput) {
      chatInput.value = data.message; // 设置输入框的值
      
      // 创建并触发输入事件
      const inputEvent = new Event('input', { bubbles: true });
      chatInput.dispatchEvent(inputEvent);

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
    const button = document.querySelector('.c7dddcde');
    if (button) {
      button.click(); // 点击创建新对话按钮
    } else {
      const button = document.querySelector('.a7f3a288 .ds-icon-button:nth-of-type(2)');
      if (button) {
        button.click();
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