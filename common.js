export function sendMessageToAllIframe(type, message) {
    const iframes = document.querySelectorAll('iframe');
    sendMessageToTargetIframes(type, message, iframes);
}

export function sendMessageToTargetIframes(type, message, targetIframes) {
    // 确保 thinking 和 webSearch 存在, 若无则使用默认值
    const buttons = document.querySelectorAll('.button-selected');
    const config = {};
    buttons.forEach(button => {
        const key = button.getAttribute('data-press-key');
        if (key) {
            config[key] = true;
        }
    });

    // 确保 thinking 和 webSearch 存在, 若无则使用默认值
    config.thinking = config.thinking ?? false;
    config.webSearch = config.webSearch ?? false;

    targetIframes.forEach(iframe => {
        // 构造消息对象 config.id = iframe.dataset.siteId
        config.siteId = iframe.dataset.siteId;

        const postData = {
            type,
            message,
            config // 将缓存中的配置信息附加到消息中
        };
        iframe.contentWindow.postMessage(postData, '*');
    });
}

export function setupAutoResizeTextarea() {
    const textarea = document.getElementById('prompt-input');
    const container = document.getElementById('input-container');

    textarea.addEventListener('input', function () {
        // Reset height to get the correct scrollHeight
        this.style.height = 'auto';
        
        // Set new height based on content
        const newHeight = Math.min(this.scrollHeight, 200); // Maximum 200px
        this.style.height = newHeight + 'px';
        console.log('New height:', newHeight);
        
        // Make the container adjust accordingly
        container.style.height = 'auto';
        
        // No need to scroll the window as the container will handle overflow
    });
}