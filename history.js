import { sendMessageToAllIframe } from './common.js';
import { displayHistoryChat } from './settings.js';

// 初始化当前页面的会话 ID，此值为uuid，新对话时要变更此 ID；展示历史对话时也要变更此 ID
var currentSessionId = null;

export function getCurrentSessionId() {
    return currentSessionId;
}

export function generateNewSessionId() {
  currentSessionId = crypto.randomUUID();
  return currentSessionId;
}

// 创建一个函数来生成新的会话ID
export function resetSessionId() {
    currentSessionId = null;
}

// 使用Promise队列确保串行执行
let historyOperationQueue = Promise.resolve();
let isOperationInProgress = false;

/**
 * 记录历史对话，格式为: [{"sessionId":id1,"message":"对话内容","sites":{sitename_1:siteurl_1,sitename_2:siteurl_2,},"timestamp":timestamp}]
 * siteItem: {
 *  sitename_1: siteurl_1,
 * }
 * 需要串行执行，防止并发导致数据不一致
 */
export function recordHistory(message, siteItem) {
  let sessionId = getCurrentSessionId();
  if (!sessionId) {
    console.log('当前 session 不存在, 忽略')
    return;
  }
  // 将当前操作加入队列
  historyOperationQueue = historyOperationQueue.then(() => {
    // 如果已有操作正在进行，等待短暂时间后重试
    if (isOperationInProgress) {
      console.log('Operation in progress, waiting...');
      // 返回一个延迟的Promise
      return new Promise(resolve => {
        setTimeout(() => {
          // 递归调用自身，但不在队列中添加新Promise
          resolve(recordHistoryOperation(sessionId, message, siteItem));
        }, 100);
      });
    }
    
    return recordHistoryOperation(sessionId, message, siteItem);
  }).catch(error => {
    console.error('Error in history operation queue:', error);
    isOperationInProgress = false;
  });
  
  // 返回队列Promise，允许外部代码等待操作完成
  return historyOperationQueue;
}

// 实际执行存储操作的函数
export function recordHistoryOperation(sessionId, message, siteItem) {
  isOperationInProgress = true;
  
  return new Promise((resolve, reject) => {
    try {
      // 获取当前时间戳
      const timestamp = new Date().toISOString();
      
      // 获取当前存储的历史记录
      chrome.storage.local.get(['history'], (result) => {
        try {
          const history = result.history || [];
          // 判断是否存在相同的 sessionId
          const existingSession = history.find(item => item.sessionId === sessionId);
          if (existingSession) {
            if (!existingSession.sites) {
              existingSession.sites = {};
            }
            // 使用 siteItem 中的最新值更新同名的站点
            for (const [key, value] of Object.entries(siteItem)) {
              existingSession.sites[key] = value;
            }
            existingSession.timestamp = timestamp;
          } else {
            // 如果不存在，则添加新的记录
            history.push({
              sessionId,
              message,
              sites: siteItem,
              timestamp
            });
          }
          
          // 保存更新后的历史记录
          chrome.storage.local.set({ history }, () => {
            if (chrome.runtime.lastError) {
              reject(chrome.runtime.lastError);
            } else {
              resolve();
            }
            // 操作完成
            isOperationInProgress = false;
          });
        } catch (error) {
          isOperationInProgress = false;
          reject(error);
        }
      });
    } catch (error) {
      isOperationInProgress = false;
      reject(error);
    }
  });
}

export function syncSessionToIframs(message) {
  // 记录对话
  if (!currentSessionId) {
    currentSessionId = generateNewSessionId();
    recordHistory(message, null);
  }
  // 将当前对话 ID 和 对应的站点信息发送给 iframe
  const syncSession = {
    "sessionId": currentSessionId,
  }
  sendMessageToAllIframe('SYNC_SESSION', syncSession);
}

/**
 * 显示历史记录模态框
 */
export function showHistoryModal() {
  // 获取历史记录
  chrome.storage.local.get(['history'], (result) => {
    const history = result.history || [];
    
    // 按时间戳倒序排序
    const sortedHistory = [...history].sort((a, b) => 
      new Date(b.timestamp) - new Date(a.timestamp)
    );
    
    // 创建模态框
    const modal = document.createElement('div');
    modal.className = 'history-modal';
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: rgba(0, 0, 0, 0.5);
      z-index: 9999;
      display: flex;
      justify-content: center;
      align-items: center;
    `;
    
    // 创建模态框内容
    const modalContent = document.createElement('div');
    modalContent.className = 'history-modal-content';
    modalContent.style.cssText = `
      background-color: white;
      padding: 20px;
      border-radius: 8px;
      width: 80%;
      max-width: 800px;
      height: 60vh;
      overflow-y: auto;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    `;
    
    // 添加搜索框
    const searchContainer = document.createElement('div');
    searchContainer.style.cssText = `
      margin-bottom: 15px;
      padding-bottom: 15px;
      border-bottom: 1px solid #eee;
    `;
    
    const searchInput = document.createElement('input');
    searchInput.type = 'text';
    searchInput.placeholder = '搜索本地历史记录...';
    searchInput.style.cssText = `
      width: 100%;
      padding: 8px 12px;
      border: none;
      border-radius: 4px;
      font-size: 14px;
      box-sizing: border-box;
    `;
    
    // 移除输入框获得焦点时的轮廓
    searchInput.addEventListener('focus', () => {
      searchInput.style.outline = 'none';
    });
    
    searchContainer.appendChild(searchInput);
    modalContent.appendChild(searchContainer);
    
    // 创建历史记录列表容器
    const historyList = document.createElement('div');
    historyList.className = 'history-list';
    
    // 渲染历史记录函数
    const renderHistory = (filteredHistory) => {
      // 清空当前列表
      historyList.innerHTML = '';
      
      if (filteredHistory.length === 0) {
        const emptyMessage = document.createElement('p');
        emptyMessage.textContent = '暂无历史记录';
        emptyMessage.style.textAlign = 'center';
        emptyMessage.style.color = '#888';
        historyList.appendChild(emptyMessage);
      } else {
        filteredHistory.forEach((item) => {
          const historyItem = document.createElement('div');
          historyItem.className = 'history-item';
          historyItem.style.cssText = `
            padding: 12px;
            margin-bottom: 10px;
            border: 1px solid #eee;
            border-radius: 4px;
            cursor: pointer;
            transition: all 0.2s;
            display: flex;
            justify-content: space-between;
            align-items: center;
          `;
          historyItem.onmouseover = () => {
            historyItem.style.backgroundColor = '#f9f9f9';
          };
          historyItem.onmouseout = () => {
            historyItem.style.backgroundColor = 'white';
          };
          
          // 内容容器 (左侧)
          const contentContainer = document.createElement('div');
          contentContainer.style.cssText = `
            flex-grow: 1;
            display: flex;
            align-items: center;
            overflow: hidden;
            margin-right: 10px;
          `;
          
          contentContainer.onclick = async () => {
            currentSessionId = item.sessionId;
            document.body.removeChild(modal);
            if (item.sites) {
              await displayHistoryChat(item.sites);
            }
          };
          
          // 消息内容
          const message = document.createElement('span');
          message.className = 'history-message';
          message.textContent = item.message;
          message.style.cssText = `
            font-weight: bold;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            margin-right: 15px;
            flex-grow: 1;
          `;
          
          // 站点列表
          // const sitesList = document.createElement('span');
          // sitesList.className = 'history-sites';
          // if (item.sites) {
          //   const sitesText = Object.keys(item.sites).join(', ');
          //   sitesList.textContent = sitesText;
          //   sitesList.style.cssText = `
          //     color: #555;
          //     white-space: nowrap;
          //     margin-right: 15px;
          //     max-width: 150px;
          //     text-overflow: ellipsis;
          //   `;
          // }
          
          // 时间
          const time = document.createElement('span');
          time.className = 'history-time';
          const date = new Date(item.timestamp);
          time.textContent = date.toLocaleString();
          time.style.cssText = `
            color: #888;
            font-size: 12px;
            white-space: nowrap;
          `;
          
          contentContainer.appendChild(message);
          // contentContainer.appendChild(sitesList);
          contentContainer.appendChild(time);
          historyItem.appendChild(contentContainer);
          
          // 删除按钮 (右侧)
          const deleteButton = document.createElement('button');
          deleteButton.className = 'delete-history-button';
          deleteButton.style.cssText = `
            background: none;
            border: none;
            cursor: pointer;
            padding: 5px;
            display: flex;
            align-items: center;
            justify-content: center;
          `;
          
          // 添加删除图标 (SVG)
          deleteButton.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 6h18"></path>
              <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
              <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
            </svg>
          `;
          
          // 阻止点击删除按钮时触发父元素的点击事件
          deleteButton.onclick = (e) => {
            e.stopPropagation();
            
            // 实现删除逻辑
            chrome.storage.local.get(['history'], (result) => {
              const currentHistory = result.history || [];
              const updatedHistory = currentHistory.filter(record => record.sessionId !== item.sessionId);
              
              chrome.storage.local.set({ history: updatedHistory }, () => {
                // 从界面上移除元素
                historyList.removeChild(historyItem);
                
                // 如果删除后列表为空，显示空消息
                if (historyList.children.length === 0) {
                  const emptyMessage = document.createElement('p');
                  emptyMessage.textContent = '暂无历史记录';
                  emptyMessage.style.textAlign = 'center';
                  emptyMessage.style.color = '#888';
                  historyList.appendChild(emptyMessage);
                }
              });
            });
          };
          
          historyItem.appendChild(deleteButton);
          historyList.appendChild(historyItem);
        });
      }
    };
    
    // 初始渲染
    renderHistory(sortedHistory);
    modalContent.appendChild(historyList);
    
    // 添加警告提示信息
    const warningMessage = document.createElement('div');
    warningMessage.style.cssText = `
      margin-top: 15px;
      padding: 10px;
      background-color: #fff3cd;
      color: #856404;
      border-radius: 4px;
      font-size: 12px;
      line-height: 1.4;
      border-left: 4px solid #ffeeba;
    `;
    warningMessage.innerHTML = `⚠️ 历史记录仅保存在您的浏览器中，清除浏览器数据将删除这些记录。删除插件内的记录不会影响您账号中的任何数据。`;
    modalContent.appendChild(warningMessage);
    
    // 添加搜索功能
    searchInput.addEventListener('input', (e) => {
      const searchTerm = e.target.value.toLowerCase();
      const filteredHistory = sortedHistory.filter(item => 
        item.message.toLowerCase().includes(searchTerm)
      );
      renderHistory(filteredHistory);
    });
    
    // 点击模态框背景关闭
    modal.onclick = (event) => {
      if (event.target === modal) {
        document.body.removeChild(modal);
      }
    };
    
    modal.appendChild(modalContent);
    document.body.appendChild(modal);
  });
}