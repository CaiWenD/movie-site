/**
 * Player Module - ArtPlayer wrapper
 */
const Player = (() => {
  let art = null;
  let saveTimer = null;

  function init(container, videoUrl, options = {}) {
    destroy();

    const art = new Artplayer({
      container,
      url: videoUrl,
      title: options.title || '',
      volume: 0.7,
      isLive: false,
      muted: false,
      autoplay: false,
      pip: true,
      autoSize: false,
      autoMini: true,
      screenshot: true,
      setting: true,
      loop: false,
      flip: true,
      playbackRate: true,
      aspectRatio: true,
      fullscreen: true,
      fullscreenWeb: true,
      subtitleOffset: false,
      miniProgressBar: true,
      mutex: true,
      backdrop: true,
      playsInline: true,
      autoPlayback: true,
      airplay: true,
      theme: '#e50914',
      lang: navigator.language.toLowerCase() === 'zh-cn' ? 'zh-cn' : 'en',
      settings: [
        {
          width: 200,
          html: '画质选择',
          tooltip: options.quality || '默认',
          selector: options.qualities || [],
          onSelect: options.onQualityChange || (() => {})
        }
      ],
      hotkey: true,
      video: {
        crossOrigin: 'anonymous'
      }
    });

    // Auto-save progress
    art.on('video:timeupdate', () => {
      if (saveTimer) clearTimeout(saveTimer);
      saveTimer = setTimeout(() => {
        if (options.onProgressSave) {
          options.onProgressSave({
            progress: art.currentTime,
            duration: art.duration
          });
        }
      }, 3000);
    });

    // Seek to saved position
    if (options.savedProgress && options.savedProgress > 0) {
      art.once('video:loadedmetadata', () => {
        art.currentTime = options.savedProgress;
      });
    }

    window._currentArt = art;
    return art;
  }

  function destroy() {
    if (art) {
      art.destroy(false);
      art = null;
    }
    window._currentArt = null;
    if (saveTimer) clearTimeout(saveTimer);
  }

  function getArt() {
    return art || window._currentArt;
  }

  return { init, destroy, getArt };
})();
