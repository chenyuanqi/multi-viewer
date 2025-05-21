import { SUPPORTED_SITES, DEFAULT_APPEARANCE } from './config.js';

// 获取配置（合并存储和默认值）
export async function getSitesConfig() {
  const result = await chrome.storage.local.get(['sites']);
  // 如果 sites 不存在则返回默认站点列表
  if (!result.sites) {
    return [...SUPPORTED_SITES];
  }
  // 取两者的并集，默认 SUPPORTED_SITES 中的所有站点为未启用状态
  return SUPPORTED_SITES.map(site => {
    const storedSite = result.sites.find(s => s.name === site.name);

    return storedSite ? { ...storedSite, ...site, enabled: storedSite.enabled } : { ...site, enabled: false };
  });
}

export async function getAppearanceConfig() {
  const result = await chrome.storage.local.get(['appearance']);
  if (!result || !result.appearance) {
    console.log("没有找到用户设置的外观配置，使用默认配置");
    return DEFAULT_APPEARANCE;
  }
   // 只保留 defaultAppearance 中定义的 key
   const mergedAppearance = {}
   const userAppearance = result.appearance;
   for (const key in DEFAULT_APPEARANCE) {
     mergedAppearance[key] = userAppearance.hasOwnProperty(key)
       ? userAppearance[key]
       : DEFAULT_APPEARANCE[key]
   }
   console.log(userAppearance, DEFAULT_APPEARANCE, mergedAppearance)
   return mergedAppearance
}

// 获取当前UI状态配置（完整数据版）
export function getCurrentSitesConfig() {
  const sites = [];
  const checkboxes = document.querySelectorAll('.site-checkbox');
  
  checkboxes.forEach((el, index) => {
    const siteId = el.dataset.siteId;
    const originalSite = SUPPORTED_SITES.find(s => s.name === siteId);
    if (!originalSite) return;
    
    sites.push({
      ...originalSite,  // 保留所有原始属性
      enabled: el.querySelector('input').checked,
      order: index + 1
    });
  });
  
  // 补充未出现在UI中的站点（如有）
  SUPPORTED_SITES.forEach(originalSite => {
    if (!sites.some(s => s.name === originalSite.name)) {
      sites.push({ ...originalSite });
    }
  });
  return sites;
}

export function getCurrentAppearanceConfig() {
  const userAppearance = {};
  // 获取 theme 的用户设置
  const checkbox = document.querySelector(`input[name="theme"]:checked`);
  userAppearance.theme = checkbox ? checkbox.value : 'light';
  // 获取 pageOptimization 的用户设置
  const pageOptimizationCheckboxes = document.querySelectorAll('input[name="pageOptimization"]');
  userAppearance.pageOptimization = {};
  pageOptimizationCheckboxes.forEach(checkbox => {
    userAppearance.pageOptimization[checkbox.value] = checkbox.checked;
  });
  return userAppearance;
}

// 保存配置（完整数据版）
export async function saveConfig() {
  const currentConfig = getCurrentSitesConfig();
  const userAppearance = getCurrentAppearanceConfig();
  console.log(currentConfig, userAppearance);
  await chrome.storage.local.set({ 
    sites: currentConfig,
    appearance: userAppearance,
  });

  // 发送消息，修改外观配置
  await sendSettingUpdateMessage();
}

async function sendSettingUpdateMessage() {
  const message = await getAppearanceConfig();
  const iframes = document.querySelectorAll('iframe');
  // 构造消息对象
  const postData = {
    'type': 'SETTING_UPDATE',
    'message': message
  };

  iframes.forEach(iframe => {
    iframe.contentWindow.postMessage(postData, '*');
  });
}

// 获取启用的站点（按order排序）
export function getEnabledSites(sites) {
  return sites
    .filter(site => site.enabled)
    .sort((a, b) => a.order - b.order);
}

// 计算显示分布
function optimizeDistribution(n) {
  // Step 1: 计算最小列数 c
  let c = Math.ceil(n / 3);

  // Step 2: 计算基础容量 b 和余数 r
  let b = Math.floor(n / c);
  let r = n % c;

  // Step 3: 构建列分布
  let distribution = [];
  for (let i = 0; i < c; i++) {
      if (i < r) {
          distribution.push(b + 1); // 前 r 列每列 b + 1 个数据
      } else {
          distribution.push(b); // 后 c - r 列每列 b 个数据
      }
  }

  // Step 4: 计算行数
  let rows = b + (r > 0 ? 1 : 0);

  // Step 5: 返回结果
  return {
      columns: c,          // 最小列数
      rows: rows,          // 行数
      distribution: distribution // 每列的数据分布
  };
}

// 显示站点
export async function displaySites() {
  const sites = await getSitesConfig();
  const enabledSites = getEnabledSites(sites);
  await displayEnableSites(enabledSites);
}

export async function displayHistoryChat(historyChat) {
  const sites = await getSitesConfig();
  // 筛选出historyChat中，key与 sites中 name相同的元素
  const filteredSites = sites
  .filter(site => historyChat && historyChat.hasOwnProperty(site.name))
  .map(site => ({
    ...site,
    url: historyChat[site.name], // Replace the default URL with the history URL
    update: true,
  }))
  .sort((a, b) => a.order - b.order);
  // 展示
  console.log('displayHistoryChat', filteredSites)
  await displayEnableSites(filteredSites);
}

export async function displayEnableSites(enabledSites) {
  const iframeUl = document.getElementById('iframe-list');

  if (enabledSites.length === 0) {
    iframeUl.innerHTML = '';
    iframeUl.innerHTML = '<li class="empty-message">Please select the GPT to display in the settings!</li>';
    return;
  } else {
    const emptyMessage = iframeUl.querySelector('.empty-message');
    if (emptyMessage) {
      iframeUl.removeChild(emptyMessage);
    }
  }
  const result = optimizeDistribution(enabledSites.length);
  const flexGap = 8; // iframe-list 的 gap，如果
  const reduceHeight = 73 + flexGap * (result.columns - 1); // 需要减去的高度
  const frameHeight = `calc((100vh - ${reduceHeight}px) / ${result.columns})`;
  const reduceWidth = flexGap - flexGap/(result.rows) ; // 需要减去的宽度
  const frameWidth = `calc( 100% / ${result.rows} - ${reduceWidth}px)`;
  
  const iframes = iframeUl.querySelectorAll('li > iframe');
  
  // 动态调整当前页面上的 iframe，如果已经存在的，修改 iframe，不存在，增加
  // 移除 iframes 中 title 不在 enabledSites 的 site.name 的元素
  iframes.forEach(iframe => {
    const siteName = iframe.title;
    if (!enabledSites.some(site => site.name === siteName)) {
      iframeUl.removeChild(iframe.parentElement);
    }
  });

  // 对 enabledSites 中不在 iframes 中的元素，createIframe
  enabledSites.forEach(site => {
    const existingIframe = Array.from(iframes).find(iframe => iframe.title === site.name);
    if (!existingIframe) {
      const iframe = createIframe(site, frameHeight, frameWidth);
      iframeUl.appendChild(iframe);
    } else {
      // 在 src 和 URL 不一致的情况下，更新 iframe 的 src
      if(site.update) {
        existingIframe.src = site.url;
      }
      // 对于存在的元素，调整宽度和高度
      existingIframe.parentElement.style.height = frameHeight;
      existingIframe.parentElement.style.width = frameWidth;
    }
  });
}

// 创建iframe元素
function createIframe(site, height, width) {
  const li = document.createElement('li');
  li.style.height = height;
  li.style.width = width;
  
  const iframe = document.createElement('iframe');
  iframe.src = site.url;
  iframe.dataset.siteId=site.name
  iframe.title = site.name;
  iframe.name = site.name;
  iframe.style.height = '100%';
  iframe.style.width = '100%';
  iframe.style.minHeight = '0'; // 允许flex收缩
  iframe.style.border = 'none';
  iframe.style.borderRadius = '6px';
  iframe.style.backgroundColor = 'white';
  iframe.allow ="clipboard-read; clipboard-write";
  // iframe.sandbox = "allow-scripts allow-same-origin allow-forms allow-popups";
  li.appendChild(iframe);
  return li;
}

export async function initSettings() {
  const sites = await getSitesConfig();

  const container = document.getElementById('site-checkboxes');
  container.innerHTML = '';

  let draggedElement = null;
  let placeholder = null;

  // 创建占位符元素
  const createPlaceholder = () => {
    const div = document.createElement('div');
    div.style.height = '2px';
    div.style.background = 'var(--accent-color)';
    div.style.margin = '2px 0';
    return div;
  };

  // 按order排序后渲染
  sites.sort((a, b) => a.order - b.order).forEach(site => {
    const div = document.createElement('div');
    div.className = 'site-checkbox';
    div.draggable = true;
    div.dataset.siteId = site.name;
    const lableText = site.name === site.org ? site.name : `${site.name} · ${site.org}`;
    div.innerHTML = `
      <label for="${site.name}" class="toggle-switch">
        <input 
          type="checkbox" 
          id="${site.name}" 
          ${site.enabled ? 'checked' : ''}
          data-site-id="${site.name}"
        >
        <span class="slider"></span>
        <img src="${site.icon}" alt="${site.name} icon" class="site-icon">
        <span class="switch-label-text site-name">${lableText}</span>
        <a class="open-link" href="${site.url}" target="_blank" rel="noopener noreferrer">
          <svg class="wh-18"><use href="#JumpOut-icon"></use></svg>
        </a>
        <div class="tools-container">
          ${site.tools.map(tool => `<svg class="wh-14"><use href="#${tool}-icon"></use></svg>`).join(' ')}
        </div>
      </label>
    `;
    container.appendChild(div);

    // 拖动开始
    div.addEventListener('dragstart', (e) => {
      draggedElement = div;
      placeholder = createPlaceholder();
      div.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
    });

    // 拖动结束
    div.addEventListener('dragend', () => {
      draggedElement.classList.remove('dragging');
      if (placeholder && placeholder.parentNode) {
        placeholder.parentNode.removeChild(placeholder);
      }
      draggedElement = null;
      placeholder = null;
    });

    // 拖动经过
    div.addEventListener('dragover', (e) => {
      e.preventDefault();
      if (!draggedElement || draggedElement === div) return;

      const rect = div.getBoundingClientRect();
      const offset = e.clientY - rect.top;
      const middle = rect.height / 2;

      // 移除旧占位符
      if (placeholder && placeholder.parentNode) {
        placeholder.parentNode.removeChild(placeholder);
      }

      // 插入新占位符
      if (offset < middle) {
        container.insertBefore(placeholder, div);
      } else {
        container.insertBefore(placeholder, div.nextSibling);
      }
    });
  });

  // 容器放置处理
  container.addEventListener('drop', (e) => {
    e.preventDefault();
    if (!draggedElement || !placeholder) return;

    // 插入被拖动的元素到占位符位置
    if (placeholder.parentNode) {
      container.insertBefore(draggedElement, placeholder);
      container.removeChild(placeholder);
    }
  });

  const appearance = await getAppearanceConfig();
  console.log("appearance", appearance)
  // 设置默认值
  const theme = appearance.theme;
  const themeRadio = document.querySelector(`input[name="theme"][value="${theme}"]`);
  if (themeRadio) {
    themeRadio.checked = true;
  }
  // 页面美化
  const pageOptimization = appearance.pageOptimization;
  console.log(pageOptimization);
  const pageOptimizationCheckboxes = document.querySelectorAll('input[name="pageOptimization"]');
  pageOptimizationCheckboxes.forEach(checkbox => {
    const key = checkbox.value;
    if (pageOptimization[key]) {
      checkbox.checked = true;
    } else {
      checkbox.checked = false;
    }
  });

  document.getElementById('settings-modal').classList.add('show');
}

