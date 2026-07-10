/**
 * App Module - Main SPA Logic
 */
const App = (() => {
  let currentPage = 'home';
  let currentVideo = null;
  let currentSourceKey = '';
  let currentEpisodeIndex = 0;

  // ===== Initialization =====
  async function init() {
    await API.loadConfig();
    renderApp();
    setupNavigation();
    setupSearch();
    setupMobileNav();
    navigateTo('home');
  }

  // ===== Toast =====
  function toast(msg, type = 'success') {
    const container = document.getElementById('toast-container');
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    el.textContent = msg;
    container.appendChild(el);
    setTimeout(() => el.remove(), 2500);
  }

  // ===== Navigation =====
  function setupNavigation() {
    document.querySelectorAll('.nav-link[data-page]').forEach(link => {
      link.addEventListener('click', e => {
        e.preventDefault();
        navigateTo(link.dataset.page);
      });
    });
  }

  function setupMobileNav() {
    document.querySelectorAll('.mobile-nav a[data-page]').forEach(link => {
      link.addEventListener('click', e => {
        e.preventDefault();
        navigateTo(link.dataset.page);
      });
    });
  }

  function navigateTo(page, data = {}) {
    currentPage = page;
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
    document.querySelectorAll('.mobile-nav a').forEach(l => l.classList.remove('active'));

    const pageEl = document.getElementById('page-' + page);
    if (pageEl) {
      pageEl.classList.add('active');
      window.scrollTo(0, 0);
    }

    document.querySelectorAll(`[data-page="${page}"]`).forEach(l => l.classList.add('active'));

    switch (page) {
      case 'home': renderHome(); break;
      case 'category': renderCategory(data); break;
      case 'search': renderSearchPage(data.query); break;
      case 'detail': renderDetail(data); break;
      case 'player': renderPlayerPage(data); break;
      case 'favorites': renderFavorites(); break;
      case 'history': renderHistory(); break;
      case 'settings': renderSettings(); break;
    }
  }

  // ===== Search =====
  function setupSearch() {
    const input = document.getElementById('search-input');
    const handler = Search.debounce(async (val) => {
      if (val.trim().length >= 1) {
        navigateTo('search', { query: val.trim() });
      }
    }, 500);

    input.addEventListener('input', e => handler(e.target.value));
    input.addEventListener('keydown', e => {
      if (e.key === 'Enter' && e.target.value.trim()) {
        navigateTo('search', { query: e.target.value.trim() });
      }
    });
  }

  // ===== Render App Shell =====
  function renderApp() {
    document.getElementById('app').innerHTML = `
      <nav class="navbar">
        <div class="navbar-brand" onclick="App.navigateTo('home')" style="cursor:pointer">🎬 线上看</div>
        <div class="navbar-nav">
          <a class="nav-link active" data-page="home" href="#">首页</a>
          <a class="nav-link" data-page="category" href="#">分类</a>
          <a class="nav-link" data-page="favorites" href="#">收藏</a>
          <a class="nav-link" data-page="history" href="#">历史</a>
        </div>
        <div class="navbar-search">
          <span class="search-icon">🔍</span>
          <input type="text" id="search-input" placeholder="搜索电影、电视剧、综艺..." autocomplete="off">
        </div>
        <div class="navbar-actions">
          <button class="icon-btn" onclick="App.navigateTo('settings')" title="设置">⚙️</button>
        </div>
      </nav>

      <main class="main">
        <div id="page-home" class="page active"></div>
        <div id="page-category" class="page"></div>
        <div id="page-search" class="page"></div>
        <div id="page-detail" class="page"></div>
        <div id="page-player" class="page"></div>
        <div id="page-favorites" class="page"></div>
        <div id="page-history" class="page"></div>
        <div id="page-settings" class="page"></div>
      </main>

      <nav class="mobile-nav" style="display:none">
        <a data-page="home" href="#"><span class="nav-icon">🏠</span>首页</a>
        <a data-page="category" href="#"><span class="nav-icon">📂</span>分类</a>
        <a data-page="favorites" href="#"><span class="nav-icon">❤️</span>收藏</a>
        <a data-page="history" href="#"><span class="nav-icon">🕐</span>历史</a>
      </nav>

      <div id="toast-container" class="toast-container"></div>
    `;
  }

  // ===== Home Page =====
  async function renderHome() {
    const page = document.getElementById('page-home');
    const sources = API.getSources();
    const mainSource = sources[0];

    page.innerHTML = `
      <div class="hero">
        <div class="hero-bg"></div>
        <div class="hero-overlay"></div>
        <div class="hero-content container">
          <div class="hero-info">
            <h1>海量影视资源</h1>
            <p>聚合多个资源站，支持搜索、分类浏览、多线路切换。免费在线观看电影、电视剧、综艺、动漫。</p>
            <div class="hero-actions">
              <button class="btn btn-primary" onclick="App.navigateTo('category')">开始浏览</button>
            </div>
          </div>
        </div>
      </div>

      <div class="container">
        <div class="section">
          <div class="section-header">
            <h2 class="section-title">🔥 热门推荐</h2>
            <a class="section-more" onclick="App.navigateTo('category')">查看更多 →</a>
          </div>
          <div id="home-latest" class="video-grid">
            ${renderSkeleton(12)}
          </div>
        </div>

        <div class="section">
          <div class="section-header">
            <h2 class="section-title">📺 最近观看</h2>
          </div>
          <div id="home-recent" class="video-grid"></div>
        </div>
      </div>
    `;

    // Load latest from first source
    loadLatestVideos(mainSource.key);

    // Load recent history
    renderHomeRecent();
  }

  function renderSkeleton(count) {
    return Array(count).fill('').map(() => `
      <div class="video-card">
        <div class="poster skeleton" style="aspect-ratio:2/3"></div>
        <div class="info"><div class="skeleton" style="height:14px;width:80%;margin-top:8px;border-radius:4px"></div></div>
      </div>
    `).join('');
  }

  async function loadLatestVideos(sourceKey) {
    try {
      const result = await API.getVideoList(sourceKey, { page: 1 });
      const container = document.getElementById('home-latest');
      if (container && result.list.length > 0) {
        container.innerHTML = result.list.slice(0, 18).map(v => renderVideoCard(v)).join('');
      }
    } catch (e) {
      console.error('Load latest failed:', e);
    }
  }

  function renderHomeRecent() {
    const recent = WatchHistory.getAll().slice(0, 12);
    const container = document.getElementById('home-recent');
    if (!container) return;

    if (recent.length === 0) {
      container.innerHTML = '<div class="empty-state" style="padding:30px"><p>暂无观看记录</p></div>';
      return;
    }

    container.innerHTML = recent.map(h => `
      <div class="video-card" onclick="App.openVideo('${h.sourceKey}', ${h.id})">
        <div class="poster">
          <img src="${h.pic}" alt="${h.name}" loading="lazy" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 200 300%22><rect fill=%22%231a1a2e%22 width=%22200%22 height=%22300%22/><text fill=%22%23666%22 font-size=%2214%22 x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22>暂无</text></svg>'">
          ${h.episode ? `<div class="badge">看到 ${h.episode}</div>` : ''}
        </div>
        <div class="info">
          <div class="title">${h.name}</div>
          <div class="meta">${h.year || ''} ${h.type || ''}</div>
        </div>
      </div>
    `).join('');
  }

  // ===== Video Card =====
  function renderVideoCard(video) {
    const imgSrc = video.pic || '';
    return `
      <div class="video-card" onclick="App.openVideo('${video.sourceKey}', ${video.id})">
        <div class="poster">
          <img src="${imgSrc}" alt="${video.name}" loading="lazy"
            onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 200 300%22><rect fill=%22%231a1a2e%22 width=%22200%22 height=%22300%22/><text fill=%22%23666%22 font-size=%2214%22 x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22>暂无海报</text></svg>'">
          ${video.remark ? `<div class="quality">${video.remark}</div>` : ''}
          <div class="play-icon">
            <svg viewBox="0 0 48 48" fill="white"><path d="M18 12l18 12-18 12z"/></svg>
          </div>
        </div>
        <div class="info">
          <div class="title">${video.name}</div>
          <div class="meta">${video.year || ''} ${video.type || ''}</div>
        </div>
      </div>
    `;
  }

  // ===== Category Page =====
  let categoryState = { sourceKey: '', categoryId: '', page: 1 };

  async function renderCategory(data = {}) {
    const page = document.getElementById('page-category');
    const sources = API.getSources();

    if (data.sourceKey) categoryState.sourceKey = data.sourceKey;
    if (data.categoryId !== undefined) categoryState.categoryId = data.categoryId;
    if (data.page) categoryState.page = data.page;
    if (!categoryState.sourceKey) categoryState.sourceKey = sources[0]?.key || '';

    page.innerHTML = `
      <div class="container">
        <div class="section" style="padding-top:20px">
          <div class="chips" id="source-chips" style="margin-bottom:16px">
            ${sources.map(s => `
              <button class="chip ${s.key === categoryState.sourceKey ? 'active' : ''}"
                onclick="App.switchCategorySource('${s.key}')">${s.name}</button>
            `).join('')}
          </div>
          <div id="category-chips" class="chips" style="margin-bottom:20px">
            <div class="loading"><div class="spinner"></div></div>
          </div>
          <div id="category-grid" class="video-grid">
            ${renderSkeleton(12)}
          </div>
          <div id="category-pagination" style="display:flex;justify-content:center;gap:12px;padding:24px 0"></div>
        </div>
      </div>
    `;

    await loadCategories();
    await loadCategoryVideos();
  }

  async function loadCategories() {
    const cats = await API.getCategories(categoryState.sourceKey);
    const container = document.getElementById('category-chips');
    if (!container) return;

    container.innerHTML = `
      <button class="chip ${!categoryState.categoryId ? 'active' : ''}"
        onclick="App.filterCategory('')">全部</button>
      ${cats.map(c => `
        <button class="chip ${c.type_id == categoryState.categoryId ? 'active' : ''}"
          onclick="App.filterCategory('${c.type_id}')">${c.type_name}</button>
      `).join('')}
    `;
  }

  async function loadCategoryVideos() {
    const container = document.getElementById('category-grid');
    if (!container) return;

    container.innerHTML = renderSkeleton(12);

    try {
      const result = await API.getVideoList(categoryState.sourceKey, {
        page: categoryState.page,
        categoryId: categoryState.categoryId
      });

      container.innerHTML = result.list.length > 0
        ? result.list.map(v => renderVideoCard(v)).join('')
        : '<div class="empty-state"><p>暂无内容</p></div>';

      renderPagination(result.page, result.pageCount);
    } catch (e) {
      container.innerHTML = '<div class="empty-state"><p>加载失败，请稍后重试</p></div>';
    }
  }

  function renderPagination(current, total) {
    const container = document.getElementById('category-pagination');
    if (!container || total <= 1) { if (container) container.innerHTML = ''; return; }

    let html = '';
    if (current > 1) html += `<button class="btn btn-secondary" onclick="App.goCategoryPage(${current - 1})">上一页</button>`;
    html += `<span style="padding:10px;color:var(--text-muted)">${current} / ${total}</span>`;
    if (current < total) html += `<button class="btn btn-secondary" onclick="App.goCategoryPage(${current + 1})">下一页</button>`;
    container.innerHTML = html;
  }

  function switchCategorySource(key) {
    categoryState.sourceKey = key;
    categoryState.categoryId = '';
    categoryState.page = 1;
    renderCategory({ sourceKey: key });
  }

  function filterCategory(catId) {
    categoryState.categoryId = catId;
    categoryState.page = 1;
    loadCategories();
    loadCategoryVideos();
  }

  function goCategoryPage(page) {
    categoryState.page = page;
    loadCategoryVideos();
    window.scrollTo(0, 0);
  }

  // ===== Search Page =====
  async function renderSearchPage(query) {
    const page = document.getElementById('page-search');
    const input = document.getElementById('search-input');
    if (input && query) input.value = query;

    page.innerHTML = `
      <div class="container search-results">
        <p class="search-info">搜索 "<strong>${query}</strong>" 的结果...</p>
        <div id="search-grid" class="video-grid">
          ${renderSkeleton(12)}
        </div>
      </div>
    `;

    try {
      const results = await Search.searchAll(query);
      const grid = document.getElementById('search-grid');
      if (!grid) return;

      if (results.length > 0) {
        grid.innerHTML = results.map(v => renderVideoCard(v)).join('');
        document.querySelector('.search-info').innerHTML =
          `搜索 "<strong>${query}</strong>" 共找到 ${results.length} 个结果`;
      } else {
        grid.innerHTML = '<div class="empty-state"><div class="icon">🔍</div><p>未找到相关内容，换个关键词试试</p></div>';
        document.querySelector('.search-info').innerHTML =
          `搜索 "<strong>${query}</strong>" 未找到结果`;
      }
    } catch (e) {
      document.getElementById('search-grid').innerHTML =
        '<div class="empty-state"><p>搜索出错，请稍后重试</p></div>';
    }
  }

  // ===== Detail Page =====
  async function renderDetail(data) {
    const page = document.getElementById('page-detail');
    page.innerHTML = '<div class="container"><div class="loading" style="padding:60px 0"><div class="spinner"></div></div></div>';

    try {
      const video = await API.getVideoDetail(data.sourceKey, data.id);
      if (!video) throw new Error('Not found');
      currentVideo = video;
      currentSourceKey = video.sourceKey;

      const isFav = Favorites.isFavorited(video.id, video.sourceKey);

      page.innerHTML = `
        <div class="container">
          <div class="detail-hero">
            <div class="detail-poster">
              <img src="${video.pic}" alt="${video.name}"
                onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 200 300%22><rect fill=%22%231a1a2e%22 width=%22200%22 height=%22300%22/><text fill=%22%23666%22 x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22>暂无海报</text></svg>'">
            </div>
            <div class="detail-info">
              <h1>${video.name}</h1>
              <div class="detail-meta">
                ${video.year ? `<span>📅 ${video.year}</span>` : ''}
                ${video.type ? `<span>🏷️ ${video.type}</span>` : ''}
                ${video.area ? `<span>🌍 ${video.area}</span>` : ''}
                ${video.lang ? `<span>🗣️ ${video.lang}</span>` : ''}
                ${video.remark ? `<span>⭐ ${video.remark}</span>` : ''}
              </div>
              ${video.director ? `<p style="font-size:0.85rem;color:var(--text-secondary);margin-bottom:4px">导演: ${video.director}</p>` : ''}
              ${video.actor ? `<p style="font-size:0.85rem;color:var(--text-secondary);margin-bottom:12px">主演: ${video.actor}</p>` : ''}
              <div class="detail-desc" id="detail-desc">
                <p>${video.desc.replace(/<[^>]+>/g, '')}</p>
                <span class="toggle" onclick="document.getElementById('detail-desc').classList.toggle('expanded')">展开</span>
              </div>
              <div class="detail-actions">
                ${video.sources.length > 0 && video.sources[0].episodes.length > 0
                  ? `<button class="btn btn-primary" onclick="App.playEpisode(0, 0)">▶️ 立即播放</button>`
                  : ''}
                <button class="btn btn-secondary" id="fav-btn" onclick="App.toggleFavorite()">
                  ${isFav ? '❤️ 已收藏' : '🤍 收藏'}
                </button>
              </div>
            </div>
          </div>

          <div class="section">
            <div class="section-header">
              <h2 class="section-title">播放源</h2>
            </div>
            <div class="source-tabs" id="source-tabs">
              ${video.sources.map((s, i) => `
                <button class="source-tab ${i === 0 ? 'active' : ''}"
                  onclick="App.switchSource(${i})">${s.name}</button>
              `).join('')}
            </div>
            <div id="episode-container">
              ${renderEpisodes(0)}
            </div>
          </div>
        </div>
      `;
    } catch (e) {
      page.innerHTML = '<div class="container"><div class="empty-state"><p>加载详情失败</p></div></div>';
    }
  }

  function renderEpisodes(sourceIndex) {
    if (!currentVideo || !currentVideo.sources[sourceIndex]) return '';
    const eps = currentVideo.sources[sourceIndex].episodes;
    if (eps.length <= 1) return '';

    const history = WatchHistory.getProgress(currentVideo.id, currentSourceKey);
    const activeEp = history?.episodeIndex || 0;

    return `
      <div class="episode-grid">
        ${eps.map((ep, i) => `
          <button class="ep-btn ${i === activeEp ? 'active' : ''}"
            onclick="App.playEpisode(${sourceIndex}, ${i})"
            title="${ep.name}">${ep.name}</button>
        `).join('')}
      </div>
    `;
  }

  function switchSource(index) {
    if (!currentVideo) return;
    document.querySelectorAll('.source-tab').forEach((t, i) => {
      t.classList.toggle('active', i === index);
    });
    document.getElementById('episode-container').innerHTML = renderEpisodes(index);
  }

  function playEpisode(sourceIndex, episodeIndex) {
    if (!currentVideo || !currentVideo.sources[sourceIndex]) return;
    const ep = currentVideo.sources[sourceIndex].episodes[episodeIndex];
    if (!ep || !ep.url) {
      toast('该集暂无播放地址', 'error');
      return;
    }

    navigateTo('player', {
      video: currentVideo,
      sourceIndex,
      episodeIndex,
      url: ep.url,
      episodeName: ep.name
    });
  }

  // ===== Player Page =====
  function renderPlayerPage(data) {
    const page = document.getElementById('page-player');
    const { video, sourceIndex, episodeIndex, url, episodeName } = data;
    const artEp = WatchHistory.getProgress(video.id, video.sourceKey);

    page.innerHTML = `
      <div class="container" style="padding-top:16px">
        <div class="player-bar">
          <span class="title">${video.name} - ${episodeName}</span>
          <div class="ep-nav">
            <button class="btn btn-secondary" onclick="App.navigateTo('detail', {sourceKey:'${video.sourceKey}', id:${video.id}})">← 返回详情</button>
          </div>
        </div>
        <div class="player-wrapper">
          <div id="artplayer-container"></div>
        </div>
        <div class="section">
          <div id="player-episodes"></div>
        </div>
      </div>
    `;

    // Init player
    const savedProgress = (artEp && artEp.episode === episodeName) ? artEp.progress : 0;

    Player.init('artplayer-container', url, {
      title: `${video.name} - ${episodeName}`,
      savedProgress,
      onProgressSave: ({ progress, duration }) => {
        WatchHistory.updateProgress(video.id, video.sourceKey, {
          progress, duration, episode: episodeName, episodeIndex
        });
      }
    });

    // Render episode list below player
    const epContainer = document.getElementById('player-episodes');
    if (video.sources[sourceIndex] && video.sources[sourceIndex].episodes.length > 1) {
      epContainer.innerHTML = `
        <div class="section-header"><h2 class="section-title">选集</h2></div>
        <div class="episode-grid">
          ${video.sources[sourceIndex].episodes.map((ep, i) => `
            <button class="ep-btn ${i === episodeIndex ? 'active' : ''}"
              onclick="App.playFromPlayer(${sourceIndex}, ${i})"
              title="${ep.name}">${ep.name}</button>
          `).join('')}
        </div>
      `;
    }

    // Save to history
    WatchHistory.add(video, {
      episode: episodeName,
      episodeIndex,
      sourceKey: video.sourceKey
    });
  }

  function playFromPlayer(sourceIndex, episodeIndex) {
    if (!currentVideo || !currentVideo.sources[sourceIndex]) return;
    const ep = currentVideo.sources[sourceIndex].episodes[episodeIndex];
    if (!ep || !ep.url) { toast('该集暂无播放地址', 'error'); return; }

    Player.destroy();
    renderPlayerPage({
      video: currentVideo,
      sourceIndex,
      episodeIndex,
      url: ep.url,
      episodeName: ep.name
    });
    window.scrollTo(0, 0);
  }

  // ===== Open Video =====
  async function openVideo(sourceKey, id) {
    navigateTo('detail', { sourceKey, id });
  }

  // ===== Favorites =====
  function toggleFavorite() {
    if (!currentVideo) return;
    const added = Favorites.toggle(currentVideo);
    const btn = document.getElementById('fav-btn');
    if (btn) btn.innerHTML = added ? '❤️ 已收藏' : '🤍 收藏';
    toast(added ? '已添加到收藏' : '已取消收藏');
  }

  function renderFavorites() {
    const page = document.getElementById('page-favorites');
    const list = Favorites.getAll();

    page.innerHTML = `
      <div class="container list-page">
        <h2>我的收藏 ${list.length > 0 ? `<span style="font-size:0.9rem;color:var(--text-muted);font-weight:normal">(${list.length})</span>` : ''}</h2>
        <div id="favorites-list">
          ${list.length === 0
            ? '<div class="empty-state"><div class="icon">❤️</div><p>暂无收藏</p></div>'
            : list.map(f => `
              <div class="list-item" onclick="App.openVideo('${f.sourceKey}', ${f.id})">
                <img src="${f.pic || ''}" alt="${f.name}" loading="lazy"
                  onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 80 110%22><rect fill=%22%231a1a2e%22 width=%2280%22 height=%22110%22/><text fill=%22%23666%22 x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22>暂无</text></svg>'">
                <div class="info">
                  <h3>${f.name}</h3>
                  <p>${f.year || ''} ${f.type || ''}</p>
                  <p style="color:var(--text-muted);font-size:0.75rem">来源: ${f.sourceName || f.sourceKey}</p>
                </div>
                <button class="remove-btn" onclick="event.stopPropagation(); App.removeFavorite('${f.sourceKey}', ${f.id})" title="取消收藏">✕</button>
              </div>
            `).join('')
          }
        </div>
      </div>
    `;
  }

  function removeFavorite(sourceKey, id) {
    Favorites.remove(id, sourceKey);
    renderFavorites();
    toast('已取消收藏');
  }

  // ===== History =====
  function renderHistory() {
    const page = document.getElementById('page-history');
    const list = WatchHistory.getAll();

    page.innerHTML = `
      <div class="container list-page">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:24px">
          <h2 style="margin:0">观看历史 ${list.length > 0 ? `<span style="font-size:0.9rem;color:var(--text-muted);font-weight:normal">(${list.length})</span>` : ''}</h2>
          ${list.length > 0 ? `<button class="btn btn-secondary" onclick="App.clearHistory()" style="font-size:0.8rem">清空历史</button>` : ''}
        </div>
        <div id="history-list">
          ${list.length === 0
            ? '<div class="empty-state"><div class="icon">🕐</div><p>暂无观看记录</p></div>'
            : list.map(h => `
              <div class="list-item" onclick="App.openVideo('${h.sourceKey}', ${h.id})">
                <img src="${h.pic || ''}" alt="${h.name}" loading="lazy"
                  onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 80 110%22><rect fill=%22%231a1a2e%22 width=%2280%22 height=%22110%22/><text fill=%22%23666%22 x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22>暂无</text></svg>'">
                <div class="info">
                  <h3>${h.name}</h3>
                  <p>${h.year || ''} ${h.type || ''}</p>
                  <p style="color:var(--accent);font-size:0.8rem">${h.episode ? '看到: ' + h.episode : '已观看'}</p>
                  <p style="color:var(--text-muted);font-size:0.75rem">${formatTime(h.watchedAt)}</p>
                </div>
                <button class="remove-btn" onclick="event.stopPropagation(); App.removeHistory('${h.sourceKey}', ${h.id})" title="删除">✕</button>
              </div>
            `).join('')
          }
        </div>
      </div>
    `;
  }

  function removeHistory(sourceKey, id) {
    WatchHistory.remove(id, sourceKey);
    renderHistory();
    toast('已删除');
  }

  function clearHistory() {
    if (confirm('确定清空所有观看历史？')) {
      WatchHistory.clear();
      renderHistory();
      toast('已清空');
    }
  }

  // ===== Settings =====
  function renderSettings() {
    const page = document.getElementById('page-settings');
    const currentMode = localStorage.getItem('proxy_mode') || 'auto';

    page.innerHTML = `
      <div class="container settings-page">
        <h2>⚙️ 设置</h2>

        <div class="setting-group">
          <label>请求模式</label>
          <select id="proxy-select" onchange="App.changeProxyMode(this.value)">
            <option value="auto" ${currentMode === 'auto' ? 'selected' : ''}>自动 (先直连，失败后走代理)</option>
            <option value="direct" ${currentMode === 'direct' ? 'selected' : ''}>直连 (不使用代理，需要HTTP服务)</option>
            <option value="proxy" ${currentMode === 'proxy' ? 'selected' : ''}>强制代理 (所有请求走代理)</option>
          </select>
          <p class="hint">推荐使用"自动"模式。如果直接双击打开html，会自动通过代理转发请求。</p>
        </div>

        <div class="setting-group">
          <label>本地服务器 (推荐)</label>
          <p class="hint" style="margin-bottom:8px">双击 html 文件会有跨域限制。建议启动本地服务器：</p>
          <div style="background:var(--bg-input);padding:12px;border-radius:var(--radius);font-family:monospace;font-size:0.85rem;color:var(--accent)">
            <div style="margin-bottom:8px;color:var(--text-muted)"># 方法1: Python (推荐)</div>
            <div style="margin-bottom:4px">cd movie-site</div>
            <div style="margin-bottom:12px">python -m http.server 8080</div>
            <div style="margin-bottom:8px;color:var(--text-muted)"># 方法2: Node.js</div>
            <div style="margin-bottom:4px">npx serve movie-site</div>
            <div style="margin-bottom:12px;color:var(--text-muted)"># 然后访问 http://localhost:8080</div>
          </div>
        </div>

        <div class="setting-group">
          <label>添加自定义接口</label>
          <input type="text" id="custom-api-input" placeholder="输入CMS API地址，如: https://xxx.com/api.php/provide/vod/">
          <p class="hint">支持苹果CMS标准接口格式。</p>
          <button class="btn btn-primary" style="margin-top:12px" onclick="App.addCustomSource()">添加接口</button>
        </div>

        <div class="setting-group">
          <label>数据管理</label>
          <div style="display:flex;gap:12px;flex-wrap:wrap">
            <button class="btn btn-secondary" onclick="App.exportData()">导出数据</button>
            <button class="btn btn-secondary" onclick="document.getElementById('import-file').click()">导入数据</button>
            <input type="file" id="import-file" accept=".json" style="display:none" onchange="App.importData(event)">
          </div>
        </div>

        <div class="setting-group" style="margin-top:32px;padding-top:24px;border-top:1px solid var(--border)">
          <p style="font-size:0.8rem;color:var(--text-muted)">
            线上看 v1.0 | 基于TVBox接口 | 纯前端应用<br>
            数据保存在浏览器本地，不会上传到任何服务器。
          </p>
        </div>
      </div>
    `;
  }

  function changeProxyMode(mode) {
    localStorage.setItem('proxy_mode', mode);
    toast('请求模式已切换: ' + {auto:'自动', direct:'直连', proxy:'强制代理'}[mode]);
  }

  function addCustomSource() {
    const input = document.getElementById('custom-api-input');
    const api = input.value.trim();
    if (!api) { toast('请输入API地址', 'error'); return; }

    const sources = API.getSources();
    const key = 'custom_' + Date.now();
    sources.push({
      key,
      name: '自定义源',
      api: api,
      type: 1
    });

    // Save to localStorage
    localStorage.setItem('custom_sources', JSON.stringify(sources));
    input.value = '';
    toast('接口已添加，请刷新页面');
  }

  function exportData() {
    const data = {
      favorites: Favorites.getAll(),
      history: WatchHistory.getAll(),
      customSources: JSON.parse(localStorage.getItem('custom_sources') || '[]'),
      proxyIndex: localStorage.getItem('proxy_index') || '0',
      exportedAt: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `movie-data-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast('数据已导出');
  }

  function importData(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = e => {
      try {
        const data = JSON.parse(e.target.result);
        if (data.favorites) localStorage.setItem('movie_favorites', JSON.stringify(data.favorites));
        if (data.history) localStorage.setItem('movie_watch_history', JSON.stringify(data.history));
        if (data.customSources) localStorage.setItem('custom_sources', JSON.stringify(data.customSources));
        if (data.proxyIndex) localStorage.setItem('proxy_index', data.proxyIndex);
        toast('数据已导入，请刷新页面');
      } catch {
        toast('导入失败：文件格式错误', 'error');
      }
    };
    reader.readAsText(file);
  }

  // ===== Utility =====
  function formatTime(ts) {
    if (!ts) return '';
    const d = new Date(ts);
    const now = new Date();
    const diff = now - d;
    if (diff < 60000) return '刚刚';
    if (diff < 3600000) return Math.floor(diff / 60000) + '分钟前';
    if (diff < 86400000) return Math.floor(diff / 3600000) + '小时前';
    if (diff < 604800000) return Math.floor(diff / 86400000) + '天前';
    return d.toLocaleDateString('zh-CN');
  }

  return {
    init, navigateTo, openVideo, playEpisode, playFromPlayer,
    switchSource, switchCategorySource, filterCategory, goCategoryPage,
    toggleFavorite, removeFavorite, removeHistory, clearHistory,
    changeProxyMode, addCustomSource, exportData, importData, toast
  };
})();

// Start
document.addEventListener('DOMContentLoaded', App.init);
