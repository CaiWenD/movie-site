/**
 * History Module - Watch History with localStorage
 */
const WatchHistory = (() => {
  const STORAGE_KEY = 'movie_watch_history';
  const MAX_ITEMS = 100;

  function getAll() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    } catch { return []; }
  }

  function save(list) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  }

  // Add or update watch record
  function add(video, { episode = '', episodeIndex = 0, progress = 0, sourceKey = '' } = {}) {
    const list = getAll();
    const key = `${video.id}_${sourceKey || video.sourceKey}`;
    const existing = list.findIndex(h => `${h.id}_${h.sourceKey}` === key);

    const record = {
      id: video.id,
      name: video.name,
      pic: video.pic,
      year: video.year,
      type: video.type,
      sourceKey: sourceKey || video.sourceKey,
      sourceName: video.sourceName || '',
      episode,
      episodeIndex,
      progress,
      duration: 0,
      watchedAt: Date.now()
    };

    if (existing >= 0) {
      list.splice(existing, 1);
    }
    list.unshift(record);
    if (list.length > MAX_ITEMS) list.pop();
    save(list);
  }

  // Update progress for existing record
  function updateProgress(id, sourceKey, { progress = 0, duration = 0, episode = '', episodeIndex = 0 } = {}) {
    const list = getAll();
    const key = `${id}_${sourceKey}`;
    const item = list.find(h => `${h.id}_${h.sourceKey}` === key);
    if (item) {
      if (progress > 0) item.progress = progress;
      if (duration > 0) item.duration = duration;
      if (episode) item.episode = episode;
      if (episodeIndex >= 0) item.episodeIndex = episodeIndex;
      item.watchedAt = Date.now();
      save(list);
    }
  }

  function remove(id, sourceKey) {
    const list = getAll().filter(h => !(h.id === id && h.sourceKey === sourceKey));
    save(list);
  }

  function getProgress(id, sourceKey) {
    const list = getAll();
    return list.find(h => h.id === id && h.sourceKey === sourceKey);
  }

  function clear() {
    localStorage.removeItem(STORAGE_KEY);
  }

  return { getAll, add, updateProgress, remove, getProgress, clear };
})();
