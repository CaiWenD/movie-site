/**
 * Favorites Module - localStorage based
 */
const Favorites = (() => {
  const STORAGE_KEY = 'movie_favorites';

  function getAll() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    } catch { return []; }
  }

  function save(list) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  }

  function add(video) {
    const list = getAll();
    if (list.some(f => f.id === video.id && f.sourceKey === video.sourceKey)) return false;
    list.unshift({
      id: video.id,
      name: video.name,
      pic: video.pic,
      year: video.year,
      type: video.type,
      sourceKey: video.sourceKey,
      sourceName: video.sourceName,
      addedAt: Date.now()
    });
    if (list.length > 200) list.pop();
    save(list);
    return true;
  }

  function remove(id, sourceKey) {
    const list = getAll().filter(f => !(f.id === id && f.sourceKey === sourceKey));
    save(list);
  }

  function isFavorited(id, sourceKey) {
    return getAll().some(f => f.id === id && f.sourceKey === sourceKey);
  }

  function toggle(video) {
    if (isFavorited(video.id, video.sourceKey)) {
      remove(video.id, video.sourceKey);
      return false;
    } else {
      add(video);
      return true;
    }
  }

  function clear() {
    localStorage.removeItem(STORAGE_KEY);
  }

  return { getAll, add, remove, isFavorited, toggle, clear };
})();
