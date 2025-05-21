// 导入配置
import { SUPPORTED_SITES } from './config.js';
import { getAppearanceConfig } from './settings.js';

// 生成规则
let ruleId = 1;
const rules = SUPPORTED_SITES.reduce((acc, site) => {
  if (Array.isArray(site.urlFilters) && site.urlFilters.length > 0) {
    site.urlFilters.forEach(urlFilter => {
      acc.push({
        id: ruleId++,
        priority: 1,
        action: {
          type: "modifyHeaders",
          responseHeaders: [
            {
              header: "Content-Security-Policy",
              operation: "set",
              value: "frame-ancestors 'self' chrome-extension://*"
            },
            {
              header: "X-Frame-Options",
              operation: "remove"
            }
          ]
        },
        condition: {
          urlFilter,
          resourceTypes: ["main_frame", "sub_frame"]
        }
      });
    });
  }
  return acc;
}, []);

// 使用 declarativeNetRequest API 来修改响应头
chrome.declarativeNetRequest.updateDynamicRules({
  removeRuleIds: SUPPORTED_SITES.map((site, index) => index + 1),
  addRules: rules
}).then(() => {
  console.log('Rules updated successfully');
}).catch(error => {
  console.log('Error updating rules:', error);
});

chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === "install") {
    await chrome.storage.local.set({ firstInstall: true });
    chrome.tabs.create({ url: chrome.runtime.getURL("chatbrawl.html") }, (tab) => {
      // 更新存储
      chrome.storage.local.get('chatbrawlTabIds', (result) => {
        const tabIds = new Set(result.chatbrawlTabIds || []);
        tabIds.add(tab.id);
        chrome.storage.local.set({ chatbrawlTabIds: Array.from(tabIds) });
      });
    });
  }
});

chrome.action.onClicked.addListener(() => {
  chrome.tabs.create({ url: chrome.runtime.getURL("chatbrawl.html") }, (tab) => {
    // 更新存储
    chrome.storage.local.get('chatbrawlTabIds', (result) => {
      const tabIds = new Set(result.chatbrawlTabIds || []);
      tabIds.add(tab.id);
      chrome.storage.local.set({ chatbrawlTabIds: Array.from(tabIds) });
    });
  });
});

// 监听插件页面的加载，动态记录 tabId
chrome.webNavigation.onCommitted.addListener((details) => {
  const chatbrawlUrl = chrome.runtime.getURL("chatbrawl.html");
  if (details.url === chatbrawlUrl) {
    // 更新存储
    chrome.storage.local.get('chatbrawlTabIds', (result) => {
      const tabIds = new Set(result.chatbrawlTabIds || []);
      tabIds.add(details.tabId);
      chrome.storage.local.set({ chatbrawlTabIds: Array.from(tabIds) });
    });
  }
});

// 监听标签页关闭事件，移除已关闭的 tabId
chrome.tabs.onRemoved.addListener((tabId) => {
  // 更新存储
  chrome.storage.local.get('chatbrawlTabIds', (result) => {
    const tabIds = new Set(result.chatbrawlTabIds || []);
    if (tabIds.has(tabId)) {
      tabIds.delete(tabId);
      chrome.storage.local.set({ chatbrawlTabIds: Array.from(tabIds) });
    }
  });
});

// 公共方法：检查文件是否存在
async function fileExists(file) {
  try {
    const response = await fetch(chrome.runtime.getURL(file));
    return response.ok;
  } catch (e) {
    console.warn(`${file} not exists`);
    return false;
  }
}

// 公共方法：检查文件是否存在
async function getExistingFiles(files) {
  const existingFiles = [];
  for (const file of files) {
    if (await fileExists(file)) {
      existingFiles.push(file);
    }
  }
  return existingFiles;
}

chrome.webNavigation.onCommitted.addListener(
  async (details) => {
    // 仅处理 iframe，且父页面必须是插件打开的 chatbrawl 页面
    if (!details || details.frameId === 0) {
      console.log('当前页面不支持注入', details);
      return;
    }

    const res = await chrome.storage.local.get(['chatbrawlTabIds']);
    const chatbrawlTabIds = res.chatbrawlTabIds || [];
    if(!chatbrawlTabIds.includes(details.tabId)) {
      console.log('当前页面不支持注入', details, chatbrawlTabIds);
      return;
    }

    // 基于 URL 获取到站点配置，以及站点的注入脚本
    const site = SUPPORTED_SITES.filter(site => site.urlFilters).find(site => details.url.startsWith(site.url));
    if (!site) {
      console.log(`Site not supported Injection: ${details.url}`);
      return;
    }
    console.log(`Injection start for ${details.frameId}, ${details.url}, ${site.name}, ${site.injectionScript}, ${site.injectionStyle}, `);
    const cssFiles = await getExistingFiles(['injection/common/iframe.css', site.injectionStyle]);
    if(cssFiles.length > 0) {
      chrome.scripting.insertCSS({
        target: { tabId: details.tabId, frameIds: [details.frameId] },
        files: cssFiles
      }).catch(e => console.log(`Injection css failed for ${details.url}:`, e));
    }
    
    // 注入配置变量
    // await chrome.scripting.executeScript({
    //   target: { tabId: details.tabId, frameIds: [details.frameId] },
    //   func: (config) => {
    //     window.__SITE_CONFIG__ = config;
    //     console.log('window.__SITE_CONFIG__', window.__SITE_CONFIG__);
    //   },
    //   args: [getAppearanceConfig()],
    // });
    const jsFiles = await getExistingFiles(['injection/common/iframe.js', site.injectionScript]);
    if(jsFiles.length > 0) {
      chrome.scripting.executeScript({
        target: { tabId: details.tabId, frameIds: [details.frameId] },
        files: jsFiles,
      }).catch(e => console.log(`Injection js failed for ${details.url}:`, e));
    }
  },
  { url: [{ urlMatches: 'https://*/*' }] } // 仅监听 HTTPS
);