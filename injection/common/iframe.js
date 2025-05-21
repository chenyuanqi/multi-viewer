// 简单的防抖函数
function debounce(func, wait) {
    let timeout;
    return function() {
        const context = this;
        const args = arguments;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), wait);
    };
}

// 创建引用按钮的函数
function createQuoteButton(rect, selectedText) {
    const btn = document.createElement('button');
    btn.textContent = '引用';
    btn.className = 'quote-float-btn';
    
    // 使用CSS类而非内联样式
    Object.assign(btn.style, {
        position: 'absolute',
        zIndex: '9999',
        padding: '4px 8px',
        fontSize: '12px',
        background: '#555555',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        boxShadow: '0 2px 6px rgba(0, 0, 0, 0.2)',
        left: `${rect.left + window.scrollX}px`,
        top: `${rect.bottom + window.scrollY + 10}px`
    });
    
    // 增加可访问性
    btn.title = '引用所选文字';
    btn.setAttribute('aria-label', '引用所选文字');
    
    btn.addEventListener('click', (event) => {
        event.stopPropagation();
        try {
            window.parent.postMessage({
                type: 'QUOTE_TEXT',
                payload: selectedText,
            }, '*');
            btn.remove();
            window.getSelection().removeAllRanges();
        } catch (error) {
            console.error('引用操作失败:', error);
        }
    });
    
    return btn;
}

// 使用防抖处理选择事件
const handleSelection = debounce(() => {
    try {
        // 删除旧按钮
        const existing = document.querySelector('.quote-float-btn');
        if (existing) existing.remove();
        
        const selection = window.getSelection();
        const selectedText = selection?.toString().trim();
        
        if (!selectedText || selection.rangeCount === 0) return;
        
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        
        // 创建并添加按钮
        const btn = createQuoteButton(rect, selectedText);
        document.body.appendChild(btn);
    } catch (error) {
        console.error('处理文本选择时出错:', error);
    }
}, 200); // 200ms的防抖延迟

// 监听mouseup和触摸结束事件以支持移动设备
document.addEventListener('mouseup', handleSelection);
document.addEventListener('touchend', handleSelection);

// 点击页面其他地方时移除按钮
document.addEventListener('click', (e) => {
    if (!e.target.classList.contains('quote-float-btn')) {
        const btn = document.querySelector('.quote-float-btn');
        if (btn) btn.remove();
    }
});


let lastUrl = location.href;
setInterval(() => {
  const currentUrl = location.href;
  if (currentUrl !== lastUrl) {
    lastUrl = currentUrl;
    console.log('Page changed (polling):', {url: currentUrl});
    // 从存储中获取 siteItem 
    const siteItem = window.siteItem;
    if (siteItem) {
      // 发送消息到父窗口
      siteItem.url = currentUrl;
      console.log('Page changed siteItem:', siteItem);
      window.parent.postMessage({
        type: 'UPDATE_HISTORY',
        payload: {
          siteItem: siteItem,
        },
      }, '*');
    }
  }
}, 500);