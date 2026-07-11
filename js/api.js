/**
 * API Module - CMS Source Management & Requests
 */
const API = (() => {
  let config = null;
  let categories = {};

  // Inline config (avoids file:// CORS issues)
  const INLINE_CONFIG = {
    corsProxies: [
      "https://corsproxy.io/?url=",
      "https://api.allorigins.win/raw?url=",
      "https://cors-anywhere.herokuapp.com/"
    ],
    defaultProxy: 0,
    sources: [
      { key: "ffzy", name: "非凡资源", api: "https://cj.ffzyapi.com/api.php/provide/vod/", type: 1 },
      { key: "hongniu", name: "红牛资源", api: "https://www.hongniuzy2.com/api.php/provide/vod/", type: 1 },
      { key: "lzzy", name: "量子资源", api: "https://cj.lziapi.com/api.php/provide/vod/", type: 1 },
      { key: "hwzy", name: "华为资源", api: "https://hjzyapi.com/api.php/provide/vod/", type: 1 },
      { key: "bfzy", name: "暴风资源", api: "https://bfzyapi.com/api.php/provide/vod/", type: 1 },
      { key: "sdzy", name: "闪电资源", api: "https://sdzyapi.com/api.php/provide/vod/", type: 1 },
      { key: "tpzy", name: "淘片资源", api: "https://topzyapi.com/api.php/provide/vod/", type: 1 },
      { key: "ckzy", name: "CK资源", api: "https://ckzy.me/api.php/provide/vod/", type: 1 },
      { key: "woczy", name: "卧槽资源", api: "https://wmzyapi.com/api.php/provide/vod/", type: 1 },
      { key: "360zy", name: "360资源", api: "https://360zy.com/api.php/provide/vod/", type: 1 },
      { key: "jinying", name: "金鹰资源", api: "https://jyzyapi.com/provide/vod/", type: 1 },
      { key: "heimuer", name: "黑木耳", api: "https://json.heimuer.xyz/api.php/provide/vod/", type: 1 },
      { key: "lydzy", name: "低端资源", api: "https://api.lziapi.com/api.php/provide/vod/", type: 1 },
      { key: "kbzy", name: "快播资源", api: "https://www.kbzyapi.com/api.php/provide/vod/", type: 1 },
      { key: "dbzy", name: "豆瓣资源", api: "https://dbzyapi.com/api.php/provide/vod/", type: 1 },
      { key: "tfzy", name: "天空资源", api: "https://api.tiankongapi.com/api.php/provide/vod/", type: 1 },
      { key: "mgzy", name: "魔法资源", api: "https://api.mofaboch.com/api.php/provide/vod/", type: 1 },
      { key: "jszy", name: "极速资源", api: "https://jszyapi.com/api.php/provide/vod/", type: 1 }
    ],
    parses: [
      { name: "虾米", url: "https://jx.xmflv.com/?url=" },
      { name: "云解", url: "https://yparse.ik9.cc/index.php?url=" },
      { name: "咸鱼", url: "https://jx.xymp4.cc/?url=" },
      { name: "盘古", url: "https://www.playm3u8.cn/jiexi.php?url=" },
      { name: "夜幕", url: "https://yemu.xyz/?url=" },
      { name: "冰豆", url: "https://bd.jx.cn/?url=" }
    ]
  };

  async function loadConfig() {
    if (config) return config;
    config = INLINE_CONFIG;
    // Merge custom sources from localStorage
    try {
      const custom = JSON.parse(localStorage.getItem('custom_sources') || '[]');
      if (custom.length > 0) config.sources = [...config.sources, ...custom];
    } catch {}
    return config;
  }

  async function tryFetch(url, timeout = 10000) {
    const resp = await fetch(url, { signal: AbortSignal.timeout(timeout) });
    if (!resp.ok) throw new Error('HTTP ' + resp.status);
    const text = await resp.text();
    try { return JSON.parse(text); } catch { return text; }
  }

  async function request(url) {
    // CORS proxies that work from HTTPS origins
    const proxies = [
      (u) => 'https://api.allorigins.win/raw?url=' + encodeURIComponent(u),
      (u) => 'https://api.codetabs.com/v1/proxy?quest=' + encodeURIComponent(u),
      (u) => 'https://corsproxy.io/?url=' + encodeURIComponent(u),
      (u) => u // direct fallback
    ];

    for (const proxyFn of proxies) {
      try {
        const proxyUrl = proxyFn(url);
        const result = await tryFetch(proxyUrl, 15000);
        if (result) return result;
      } catch (e) {
        console.warn('Failed:', proxyUrl || url, e.message);
        continue;
      }
    }

    throw new Error('All request strategies failed');
    const proxies = [
      'https://api.allorigins.win/raw?url=',
      'https://api.codetabs.com/v1/proxy?quest=',
      'https://corsproxy.io/?url='
    ];

    for (const proxy of proxies) {
      try {
        const result = await tryFetch(proxy + encodeURIComponent(url), 15000);
        if (result) return result;
      } catch (e) {
        continue;
      }
    }

    throw new Error('All request strategies failed');
  }

  // Get categories from a source
  async function getCategories(sourceKey) {
    if (categories[sourceKey]) return categories[sourceKey];
    const source = config.sources.find(s => s.key === sourceKey);
    if (!source) return [];

    try {
      const data = await request(source.api + '?ac=list');
      if (data && data.class) {
        categories[sourceKey] = data.class;
        return data.class;
      }
    } catch (e) {
      console.error('getCategories failed:', e);
    }
    return [];
  }

  // Get video list from a source
  async function getVideoList(sourceKey, { page = 1, categoryId = '', type = '' } = {}) {
    const source = config.sources.find(s => s.key === sourceKey);
    if (!source) return { list: [], total: 0 };

    let url = source.api + '?ac=detail&pg=' + page;
    if (categoryId) url += '&t=' + categoryId;
    if (type) url += '&t=' + type;

    try {
      const data = await request(url);
      if (data && data.list) {
        return {
          list: data.list.map(normalizeVideo),
          total: data.total || 0,
          page: data.page || page,
          pageCount: data.pagecount || 1
        };
      }
    } catch (e) {
      console.error('getVideoList failed:', e);
    }
    return { list: [], total: 0 };
  }

  // Search across multiple sources
  async function search(keyword, sourceKeys = null) {
    const sources = sourceKeys
      ? config.sources.filter(s => sourceKeys.includes(s.key))
      : config.sources;

    const results = await Promise.allSettled(
      sources.map(async source => {
        try {
          const data = await request(source.api + '?ac=detail&wd=' + encodeURIComponent(keyword));
          if (data && data.list) {
            return data.list.map(v => normalizeVideo(v, source));
          }
        } catch (e) { /* skip */ }
        return [];
      })
    );

    return results
      .filter(r => r.status === 'fulfilled')
      .flatMap(r => r.value);
  }

  // Get video detail with play URLs
  async function getVideoDetail(sourceKey, vodId) {
    const source = config.sources.find(s => s.key === sourceKey);
    if (!source) return null;

    try {
      const data = await request(source.api + '?ac=detail&ids=' + vodId);
      if (data && data.list && data.list.length > 0) {
        return normalizeVideo(data.list[0], source);
      }
    } catch (e) {
      console.error('getVideoDetail failed:', e);
    }
    return null;
  }

  // Normalize video object across different CMS formats
  function normalizeVideo(vod, source = null) {
    const playFroms = (vod.vod_play_from || '').split('$$$').filter(Boolean);
    const playUrls = (vod.vod_play_url || '').split('$$$').filter(Boolean);

    const sources = playFroms.map((name, i) => {
      const episodes = (playUrls[i] || '').split('#').filter(Boolean).map(ep => {
        const idx = ep.indexOf('$');
        if (idx === -1) return { name: ep, url: '' };
        return {
          name: ep.substring(0, idx),
          url: ep.substring(idx + 1)
        };
      });
      return { name, episodes };
    });

    return {
      id: vod.vod_id,
      name: vod.vod_name || '未知',
      pic: vod.vod_pic || '',
      year: vod.vod_year || '',
      area: vod.vod_area || '',
      type: vod.type_name || '',
      lang: vod.vod_lang || '',
      remark: vod.vod_remark || '',
      director: vod.vod_director || '',
      actor: vod.vod_actor || '',
      desc: vod.vod_content || vod.vod_blurb || '',
      sourceKey: source?.key || '',
      sourceName: source?.name || '',
      sources,
      tags: vod.vod_tag || ''
    };
  }

  // Get all configured sources
  function getSources() {
    return config?.sources || [];
  }

  // Get parse services
  function getParses() {
    return config?.parses || [];
  }

  // Get CORS proxies
  function getProxies() {
    return config?.corsProxies || [];
  }

  return {
    loadConfig, getCategories, getVideoList, search,
    getVideoDetail, getSources, getParses, getProxies
  };
})();
