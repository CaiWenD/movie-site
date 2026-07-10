/**
 * Search Module
 */
const Search = (() => {
  let searchTimer = null;
  let lastQuery = '';

  function debounce(fn, delay = 400) {
    return (...args) => {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(() => fn(...args), delay);
    };
  }

  async function searchAll(keyword) {
    if (!keyword || keyword.trim().length < 1) return [];
    lastQuery = keyword.trim();
    return await API.search(lastQuery);
  }

  function getHighlight(name, keyword) {
    if (!keyword) return name;
    const regex = new RegExp(`(${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return name.replace(regex, '<mark style="background:#e50914;color:#fff;padding:0 2px;border-radius:2px">$1</mark>');
  }

  return { debounce, searchAll, getHighlight, getLastQuery: () => lastQuery };
})();
