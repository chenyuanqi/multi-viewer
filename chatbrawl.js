import { sendMessageToAllIframe, sendMessageToTargetIframes, setupAutoResizeTextarea } from './common.js';
import { getSitesConfig, saveConfig, displaySites, initSettings } from './settings.js';
import { syncSessionToIframs, recordHistory, resetSessionId, showHistoryModal } from './history.js';


// 初始化页面
document.addEventListener('DOMContentLoaded', async () => {
  // 初始加载
  await displaySites();

  // 设置按钮
  document.getElementById('settings-button').addEventListener('click', initSettings);
  // 判断是否为首次安装，如果是的话，弹出设置页面
  const result = await chrome.storage.local.get(['firstInstall']);
  if (result && result.firstInstall) {
    // 延时加载 
    setTimeout(initSettings, 100);
    // 清除缓存标识
    setTimeout(async () => {
      await chrome.storage.local.remove(['firstInstall']);
    }, 1000);
  }


  // 保存按钮
  document.getElementById('settings-save').addEventListener('click', async () => {
    await saveConfig();
    await displaySites();
    document.getElementById('settings-modal').classList.remove('show');
  });

  // 取消按钮
  document.getElementById('settings-cancel').addEventListener('click', () => {
    document.getElementById('settings-modal').classList.remove('show');
  });

  // 发送消息功能
  document.getElementById('send-button').addEventListener('click', sendChatMessage);

  // 发送消息功能
  document.getElementById('history-button').addEventListener('click', showHistoryModal);
  
  // 创建新对话
  document.getElementById('new-chat-button').addEventListener('click', () => {
    // 这里添加创建新对话的逻辑
    sendMessageToAllIframe('NEW_CHAT', 'NEW_CHAT');
    // 清空之前的对话记录
    resetSessionId();
  });

  // 思考按钮
  initializeButtonState('thinking-button', 'thinking');
  // 联网搜索按钮
  initializeButtonState('web-search-button', 'webSearch');

  setupAutoResizeTextarea();

  // 独立对话支持
  initSingleChat();

  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    const msg = chrome.i18n.getMessage(key);
    if (msg) {
      if (el.hasAttribute("data-i18n-attr")) {
        el.setAttribute(el.getAttribute("data-i18n-attr"), msg);
      } else {
        el.textContent = msg;
      }
    }
  });
});


function initSingleChat() {
  const promptInput = document.getElementById("prompt-input");
  // 只允许纯文本的插入
  promptInput.addEventListener('paste', function (e) {
    e.preventDefault(); // 阻止默认粘贴行为
    const text = e.clipboardData.getData('text/plain'); // 只取纯文本
    document.execCommand('insertText', false, text); // 插入纯文本
  });
  // 创建下拉容器
  const dropdown = document.getElementById("input-dropdown");

  // 用于记录当前的导航索引
  let currentSelectionIndex = -1;

  // 更新下拉菜单项的选中样式
  function updateDropdownSelection(items) {
    items.forEach((item, index) => {
      if (index === currentSelectionIndex) {
        item.style.backgroundColor = "#e0e0e0";
      } else {
        item.style.backgroundColor = "";
      }
    });
  }

  // 获取所有 iframe 的 title 值
  function getIframeNames() {
    const iframeList = document.getElementById("iframe-list");
    const iframes = iframeList.querySelectorAll("iframe");
    return Array.from(iframes)
      .map(iframe => iframe.getAttribute("name"))
      .filter(name => name); // 排除无 name 属性的 iframe
  }

  function positionDropdown() {
    const sel = window.getSelection();
    if (!sel.rangeCount) return;
    const range = sel.getRangeAt(0).cloneRange();
    range.collapse(true);
    const rect = range.getBoundingClientRect();
    dropdown.style.display = "block";
    const dropdownHeight = dropdown.offsetHeight;
    // 将 dropdown 放在光标正上方 5px 距离处
    dropdown.style.top = (rect.top + window.scrollY - dropdownHeight - 5) + "px";
    dropdown.style.left = (rect.left + window.scrollX) + "px";
    // 自动宽度，由内容决定
    dropdown.style.width = "auto";
  }

  // 处理键盘导航：上下选择，Enter确认
  promptInput.addEventListener("keydown", (e) => {
    // 先处理下拉菜单导航相关按键
    const dropdownItems = dropdown.querySelectorAll("div");
    if (dropdown.style.display === "block" && dropdownItems.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        currentSelectionIndex = (currentSelectionIndex + 1) % dropdownItems.length;
        updateDropdownSelection(dropdownItems);
        return;
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        currentSelectionIndex = (currentSelectionIndex - 1 + dropdownItems.length) % dropdownItems.length;
        updateDropdownSelection(dropdownItems);
        return;
      } else if (e.key === "Enter") {
        if (currentSelectionIndex >= 0 && currentSelectionIndex < dropdownItems.length) {
          // 模拟点击选中的下拉项
          dropdownItems[currentSelectionIndex].click();
          e.preventDefault();
          return;
        }
      }
    } else {
      if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) {
        e.preventDefault();
        sendChatMessage();
      }
    }
  });

  promptInput.addEventListener("keyup", (e) => {
    // 忽略导航键
    if (["ArrowUp", "ArrowDown", "Enter"].includes(e.key)) {
      return;
    }
  
    const sel = window.getSelection();
    // 仅当光标在文本节点时才处理
    if (!sel.focusNode || sel.focusNode.nodeType !== Node.TEXT_NODE) {
      dropdown.style.display = "none";
      return;
    }
    
    const node = sel.focusNode;
    const text = node.textContent;
    const caretOffset = sel.focusOffset;
    // 在当前文本节点中定位最后一个 @
    const atIndex = text.lastIndexOf("@", caretOffset - 1);
  
    if (atIndex !== -1) {
      // 使用 @ 后的文本作为过滤条件
      const query = text.substring(atIndex + 1).toLowerCase();
      const iframeNames = getIframeNames();
      const filteredNames = iframeNames.filter(name => 
        name.toLowerCase().includes(query)
      );
  
      if (filteredNames.length > 0) {
        dropdown.innerHTML = "";
        filteredNames.forEach(name => {
          const item = document.createElement("div");
          item.textContent = name;
          // hover 状态
          item.addEventListener("mouseenter", () => {
            item.style.backgroundColor = "#f0f0f0";
          });
          item.addEventListener("mouseleave", () => {
            item.style.backgroundColor = "";
            updateDropdownSelection(dropdown.querySelectorAll("div"));
          });
          item.addEventListener("click", () => {
            // 使用当前文本节点进行替换
            const currentText = node.textContent;
            const pos = currentText.lastIndexOf("@", caretOffset - 1);
            if (pos !== -1) {
              const beforeText = currentText.substring(0, pos);
              const afterText = currentText.substring(caretOffset);
              // 用 @ 前部分更新当前节点
              node.textContent = beforeText;
    
              // 创建 mention 元素
              const mentionSpan = document.createElement("span");
              mentionSpan.classList.add("mention");
              mentionSpan.contentEditable = "false";
              mentionSpan.textContent = "@" + name;
    
              // 插入 mention 元素和后续文本
              const space = document.createTextNode(" ");
              const afterNode = document.createTextNode(afterText);
              node.parentNode.insertBefore(mentionSpan, node.nextSibling);
              node.parentNode.insertBefore(space, mentionSpan.nextSibling);
              node.parentNode.insertBefore(afterNode, space.nextSibling);
    
              // 移动光标到插入后节点的开头
              const newRange = document.createRange();
              newRange.setStart(afterNode, 0);
              newRange.collapse(true);
              sel.removeAllRanges();
              sel.addRange(newRange);
            }
            dropdown.style.display = "none";
            currentSelectionIndex = -1;
            promptInput.focus();
          });
          dropdown.appendChild(item);
        });
        // 重置导航索引并定位下拉框
        currentSelectionIndex = 0;
        updateDropdownSelection(dropdown.querySelectorAll("div"));
        positionDropdown();
      } else {
        dropdown.style.display = "none";
      }
    } else {
      dropdown.style.display = "none";
    }
  });

  // 点击其他区域关闭下拉框
  document.addEventListener("click", (e) => {
    if (e.target !== promptInput && !dropdown.contains(e.target)) {
      dropdown.style.display = "none";
      currentSelectionIndex = -1;
    }
  });
}

function toggleButton(buttonId, configKey) {
  const config = JSON.parse(localStorage.getItem('config')) || {};
  const button = document.getElementById(buttonId);
  if (config[configKey]) {
    delete config[configKey];
    button.classList.remove('button-selected');
  } else {
    config[configKey] = true;
    button.classList.add('button-selected');
  }
  localStorage.setItem('config', JSON.stringify(config));
}

function initializeButtonState(buttonId, configKey) {
  const config = JSON.parse(localStorage.getItem('config')) || {};
  const button = document.getElementById(buttonId);
  if (config[configKey]) {
    button.classList.add('button-selected');
  }
  button.dataset.pressKey = configKey;

  document.getElementById(buttonId).addEventListener('click', () => {
    toggleButton(buttonId, configKey);
  });

}

window.history.replaceState(null, null, window.location.href);
window.onpopstate = function (event) {
  window.history.go(1); // 立即前进到当前页面
  // 或者
  window.history.replaceState(null, null, window.location.href);
  return false;
};

function sendChatMessage() {
  const promptInput = document.getElementById('prompt-input');
  // 获取 promptInput 不包含mention 元素的值
  let message = promptInput.innerText.trim();
  if(!message) {
    return;
  }

  syncSessionToIframs(message);

  // 检查是否包含 mention 元素
  const mentionElements = promptInput.querySelectorAll(".mention");
  if (mentionElements.length > 0) {
    const iframeNames = Array.from(mentionElements).map(element => element.textContent.replace('@', '').trim());
    // 使用 Set 去重
    const uniqueIframeNames = [...new Set(iframeNames)];
    // 原始的信息，需要移除 @iframeName
    for (const name of uniqueIframeNames) {
      message = message.replace(`@${name}`, '').trim();
    }
    const targetIframes = Array.from(document.querySelectorAll('iframe')).filter(iframe => {
      const title = iframe.getAttribute("name");
      return uniqueIframeNames.includes(title);
    });
    if (promptInput.length == 0 || targetIframes.length == 0) {
      console.log('No target iframe found for mention:', message);
      return;
    }
    console.log('Sending message:', message);
    // 发送消息到所有 iframe
    sendMessageToTargetIframes('CHAT_MESSAGE', message, targetIframes);
  } else {
    console.log('Sending message:', message);
    sendMessageToAllIframe('CHAT_MESSAGE', message);
  }
  
  promptInput.innerText = '';
  // 触发输入事件
  promptInput.dispatchEvent(new Event('input', { bubbles: true }));
  
  // 延迟 200ms 后重新聚焦输入框
  setTimeout(() => {
      promptInput.focus();
  }, 200);
}

// 接收iframe消息
window.addEventListener('message', (event) => {
  if (event.data.type === 'FROM_IFRAME') {
      // 发送消息到所有 iframe
      const iframes = document.querySelectorAll('iframe');
      console.log('Received Message from iframe:', event.data);
  }
  if (event.data?.type === 'QUOTE_TEXT') {
      const quotedText = event.data.payload;
      // 输入框 prompt-input 赋值
      const promptInput = document.getElementById('prompt-input');
      promptInput.innerText = quotedText;
      // 这里需要触发输入框的动态调整事件
      promptInput.dispatchEvent(new Event('input', { bubbles: true }));

  }
  if (event.data?.type === 'UPDATE_HISTORY') {
      const data = event.data.payload.siteItem;
      console.log('接收到历史记录更新:', data);
      const siteItem = {
          [data.siteName]: data.url
      }
      console.log('更新历史记录:', data.sessionId, siteItem);
      recordHistory(null, siteItem).then(() => {
          console.log('历史记录更新成功');
      }).catch((error) => {
          console.error('历史记录更新失败:', error);
      });
  }
});