// 支持的站点配置
const SUPPORTED_SITES = [
  {
    name: 'ChatGPT',
    org: 'OpenAI',
    url: 'https://chatgpt.com',
    icon: 'https://cdn.oaistatic.com/assets/favicon-miwirzcw.ico',
    urlFilters: ['||chatgpt.com/*'],
    enabled: false,
    injectionScript: 'injection/ChatGPT.js',
    injectionStyle: 'injection/ChatGPT.css',
    themeMap: {
      light: {
        css: 'light',
        style: {
          'color-scheme': 'dark'
        }
      },
      dark: {
        css: 'dark',
        style: {
          'color-scheme': 'dark'
        }
      },
    },
    tools: ['WebSearch', 'Thinking'],
  }, {
    name: 'Grok',
    org: 'X',
    url: 'https://grok.com',
    icon: 'https://grok.com/images/favicon-light.png',
    urlFilters: ['||grok.com/*'],
    enabled: true,
    injectionScript: 'injection/Grok.js',
    injectionStyle: 'injection/Grok.css',
    tools: ['WebSearch', 'Thinking'],
  }, {
    name: 'Claude',
    org: 'Claude',
    url: 'https://claude.ai',
    icon: 'https://claude.ai//images/claude_app_icon.png',
    urlFilters: ['||claude.ai/*'],
    enabled: false,
    injectionScript: 'injection/Claude.js',
    injectionStyle: 'injection/Claude.css',
    tools: ['Thinking'],
  }, {
    name: 'DeepSeek',
    org: 'DeepSeek',
    url: 'https://chat.deepseek.com',
    icon: 'https://cdn.deepseek.com/chat/icon.png',
    urlFilters: ['||chat.deepseek.com/*'],
    enabled: true,
    injectionScript: 'injection/DeepSeek.js',
    injectionStyle: 'injection/DeepSeek.css',
    tools: ['WebSearch', 'Thinking'],
  }, {
    name: 'Qwen',
    org: 'Alibaba',
    url: 'https://chat.qwen.ai',
    icon: 'https://assets.alicdn.com/g/qwenweb/qwen-webui-fe/0.0.64/favicon.png',
    urlFilters: ['||chat.qwen.ai/*'],
    enabled: false,
    injectionScript: 'injection/Qwen.js',
    injectionStyle: 'injection/Qwen.css',
    tools: ['WebSearch', 'Thinking'],
  }, {
    name: 'Kimi',
    org: 'Moonshot',
    url: 'https://kimi.moonshot.cn/',
    icon: 'https://statics.moonshot.cn/kimi-web-seo/assets/favicon-OXkYivQY.ico',
    urlFilters: ['||kimi.moonshot.cn/*'],
    enabled: false,
    injectionScript: 'injection/Kimi.js',
    injectionStyle: 'injection/Kimi.css',
    tools: ['WebSearch', 'Thinking'],
  }, {
    name: 'Doubao',
    org: 'TikTok',
    url: 'https://www.doubao.com/',
    icon: 'https://lf-flow-web-cdn.doubao.com/obj/flow-doubao/samantha/logo-icon-white-bg.png',
    urlFilters: ['||doubao.com/*'],
    enabled: false,
    injectionScript: 'injection/Doubao.js',
    injectionStyle: 'injection/Doubao.css',
    tools: ['WebSearch', 'Thinking'],
  }, {
    name: 'Copilot',
    org: 'Microsoft',
    url: 'https://copilot.microsoft.com/',
    icon: 'https://studiostaticassetsprod.azureedge.net/bundle-cmc/favicon.svg',
    urlFilters: ['||copilot.microsoft.com/*'],
    enabled: false,
    injectionScript: 'injection/Copilot.js',
    injectionStyle: 'injection/Copilot.css',
    tools: ['WebSearch'],
  }, {
    name: 'Gemini',
    org: 'Google',
    url: 'https://gemini.google.com/',
    icon: 'https://www.gstatic.com/lamda/images/gemini_favicon_f069958c85030456e93de685481c559f160ea06b.png',
    urlFilters: ['gemini.google.com/*'],
    enabled: true,
    injectionScript: 'injection/Gemini.js',
    injectionStyle: 'injection/Gemini.css',
    tools: ['WebSearch', 'Thinking'],
  }, {
    name: 'Mistral',
    org: 'Mistral',
    url: 'https://chat.mistral.ai/',
    icon: 'https://chat.mistral.ai/favicon.ico',
    urlFilters: ['||chat.mistral.ai/*'],
    enabled: false,
    injectionScript: 'injection/Mistral.js',
    injectionStyle: 'injection/Mistral.css',
    tools: [],
  }, {
    name: '元宝',
    org: 'Tencent',
    url: 'https://yuanbao.tencent.com/',
    icon: 'https://cdn-bot.hunyuan.tencent.com/logo.png',
    urlFilters: ['||yuanbao.tencent.com/*'],
    enabled: false,
    injectionScript: 'injection/Yuanbao.js',
    injectionStyle: 'injection/Yuanbao.css',
    tools: ['WebSearch', 'Thinking'],
  }, {
    name: '百小应',
    org: 'BaiChuan',
    url: 'https://ying.baichuan-ai.com/chat',
    icon: 'https://cdn.baichuan-ai.com/build/_next/static/media/logo.ce66885d.png',
    urlFilters: ['||ying.baichuan-ai.com/*'],
    enabled: false,
    injectionScript: 'injection/BaiChuan.js',
    injectionStyle: 'injection/BaiChuan.css',
    tools: ['WebSearch', 'Thinking'],
  }, {
    name: '智谱',
    org: '智谱',
    url: 'https://chat.z.ai/',
    icon: 'https://chat.z.ai/static/logoLight.svg',
    urlFilters: ['||chat.z.ai/*'],
    enabled: false,
    injectionScript: 'injection/ZhiPu.js',
    injectionStyle: 'injection/ZhiPu.css',
    tools: ['WebSearch', 'Thinking'],
  // }, {
  //   name: '知乎直达',
  //   org: '知乎',
  //   url: 'https://zhida.zhihu.com/',
  //   icon: 'https://pic1.zhimg.com/v2-7e3856b1a6d415224ca95814132a3612.png',
  //   urlFilters: ['||zhida.zhihu.com/*'],
  //   enabled: false,
  //   injectionScript: 'injection/ZhiHu.js',
  //   injectionStyle: 'injection/ZhiHu.css',
  //   tools: ['WebSearch', 'Thinking'],
    // },{
    //   name: '文心一言',
    //   org: '百度',
    //   url: 'https://yiyan.baidu.com/',
    //   icon: 'https://nlp-eb.cdn.bcebos.com/logo/favicon.ico',
    //   urlFilters: ['||yiyan.baidu.com/*'],
    //   enabled: false,
    //   injectionScript: 'injection/Yiyan.js',
    //   injectionStyle: 'injection/Yiyan.css',
    //   tools: ['WebSearch', 'Thinking'],
    // }, {
    //   name: '秘塔AI',
    //   url: 'https://metaso.cn/',
    //   icon: 'https://metaso.cn/favicon.ico',
    //   urlFilters: ['||metaso.cn/*'],
    //   enabled: false,
    //   injectionScript: 'injection/Metaso.js',
    //   injectionStyle: 'injection/Metaso.css',
    // },{
    //   name: 'Meta',
    //   url: 'https://www.meta.ai/', // 此站点会报错，暂时无法解决
    //   icon: 'https://static.xx.fbcdn.net/rsrc.php/v4/yG/r/e8dQ3HclyZY.png',
    //   urlFilters: ['||meta.ai/*'],
    //   enabled: false,
    //   injectionScript: 'injection/Mistral.js'
    // },{
    //   name: 'Perplexity',
    //   url: 'https://www.perplexity.ai/',
    //   icon: 'https://www.perplexity.ai/favicon.ico',
    //   urlFilters: ['||perplexity.ai/*'],
    //   enabled: false,
    //   injectionScript: 'injection/Perplexity.js',
    //   injectionStyle: 'injection/Perplexity.css',
    // },{
    //   name: '讯飞星火',
    //   url: 'https://xinghuo.xfyun.cn/desk',
    //   icon: 'https://xinghuo.xfyun.cn/spark-icon.ico',
    //   urlFilters: ['||xfyun.cn/*'],
    //   enabled: false,
    //   injectionScript: 'injection/Xinghuo.js',
    //   injectionStyle: 'injection/Xinghuo.css',
    // }, {
    //   name: '秘塔AI',
    //   url: 'https://metaso.cn/',
    //   icon: 'https://metaso.cn/favicon.ico',
    //   urlFilters: ['||metaso.cn/*'],
    //   enabled: false,
    //   injectionScript: 'injection/Metaso.js',
    //   injectionStyle: 'injection/Metaso.css',
  },
];

const DEFAULT_APPEARANCE = {
  theme: 'light',
  pageOptimization: {
    hiddenSidebar: true,
    hiddenInput: true
  }
}

// 导出配置
export { SUPPORTED_SITES, DEFAULT_APPEARANCE };