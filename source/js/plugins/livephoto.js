/**
 * Stellar 主题实况照片交互逻辑
 * 基于 Ech0 项目的实况照片功能实现
 */

(function() {
  'use strict';

  // 实况照片自动播放设置
  let livePhotoAutoPlay = localStorage.getItem('livePhotoAutoPlay') !== 'false';

  // 切换自动播放设置
  function toggleLivePhotoAutoPlay() {
    livePhotoAutoPlay = !livePhotoAutoPlay;
    localStorage.setItem('livePhotoAutoPlay', String(livePhotoAutoPlay));
    return livePhotoAutoPlay;
  }

  // 获取自动播放状态
  function getLivePhotoAutoPlay() {
    return livePhotoAutoPlay;
  }

  // 初始化单个实况照片
  function initLivePhoto(container) {
    const video = container.querySelector('.livephoto-video');
    const image = container.querySelector('.livephoto-image');
    
    if (!video || !image) return;

    let isPlaying = false;
    let playTimeout = null;

    // 播放实况照片
    function playLivePhoto(e) {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }
      
      if (isPlaying) return;
      
      isPlaying = true;
      container.classList.add('playing');
      video.currentTime = 0;
      
      video.play().catch(err => {
        console.warn('Live photo play failed:', err);
        stopLivePhoto();
      });
    }

    // 停止播放实况照片
    function stopLivePhoto(e) {
      if (e) {
        e.preventDefault();
      }
      
      if (!isPlaying) return;
      
      isPlaying = false;
      container.classList.remove('playing');
      video.pause();
      
      if (playTimeout) {
        clearTimeout(playTimeout);
        playTimeout = null;
      }
    }

    // 视频播放结束处理
    function handleVideoEnded() {
      stopLivePhoto();
    }

    // 阻止右键菜单
    function preventContextMenu(e) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }

    // 检测是否为移动端
    function isMobile() {
      return window.innerWidth <= 768 || 'ontouchstart' in window;
    }

    // PC端：只在LIVE图标区域悬停播放
    const liveIcon = container.querySelector('.livephoto-overlay');
    if (!isMobile() && liveIcon) {
      liveIcon.addEventListener('mouseenter', playLivePhoto);
      liveIcon.addEventListener('mouseleave', stopLivePhoto);
    }

    // 移动端：长按整个实况照片区域播放
    let touchStartTime = 0;
    let touchTimer = null;
    let longPressTimer = null;
    const LONG_PRESS_DURATION = 500; // 长按时间阈值（毫秒）

    if (isMobile()) {
      // 移动端在整个容器上监听长按
      container.addEventListener('touchstart', function(e) {
        touchStartTime = Date.now();
        
        // 设置长按定时器
        longPressTimer = setTimeout(() => {
          // 长按触发播放
          playLivePhoto(e);
          
          // 添加触觉反馈（如果支持）
          if (navigator.vibrate) {
            navigator.vibrate(50);
          }
        }, LONG_PRESS_DURATION);
      }, { passive: false });

      container.addEventListener('touchend', function(e) {
        const touchDuration = Date.now() - touchStartTime;
        
        // 清除长按定时器
        if (longPressTimer) {
          clearTimeout(longPressTimer);
          longPressTimer = null;
        }
        
        if (touchDuration >= LONG_PRESS_DURATION) {
          // 长按结束，停止播放
          stopLivePhoto(e);
        } else {
          // 短触摸，如果正在播放则停止
          if (isPlaying) {
            stopLivePhoto(e);
          }
          // 短触摸不阻止默认行为，允许点击进入fancybox
        }
      }, { passive: false });

      container.addEventListener('touchmove', function(e) {
        // 触摸移动时取消长按
        if (longPressTimer) {
          clearTimeout(longPressTimer);
          longPressTimer = null;
        }
      }, { passive: false });

      container.addEventListener('touchcancel', function(e) {
        // 触摸取消时清理
        if (longPressTimer) {
          clearTimeout(longPressTimer);
          longPressTimer = null;
        }
        stopLivePhoto(e);
      }, { passive: false });
    }

    // 阻止长按菜单
    container.addEventListener('contextmenu', preventContextMenu);
    video.addEventListener('contextmenu', preventContextMenu);
    
    // 视频事件
    video.addEventListener('ended', handleVideoEnded);
    
    // 清理函数
    container._livePhotoCleanup = function() {
      const liveIcon = container.querySelector('.livephoto-overlay');
      
      if (!isMobile() && liveIcon) {
        liveIcon.removeEventListener('mouseenter', playLivePhoto);
        liveIcon.removeEventListener('mouseleave', stopLivePhoto);
      }
      
      if (isMobile()) {
        container.removeEventListener('touchstart', playLivePhoto);
        container.removeEventListener('touchend', stopLivePhoto);
        container.removeEventListener('touchmove', stopLivePhoto);
        container.removeEventListener('touchcancel', stopLivePhoto);
      }
      
      container.removeEventListener('contextmenu', preventContextMenu);
      video.removeEventListener('contextmenu', preventContextMenu);
      video.removeEventListener('ended', handleVideoEnded);
      
      if (touchTimer) {
        clearTimeout(touchTimer);
      }
      if (longPressTimer) {
        clearTimeout(longPressTimer);
      }
      if (playTimeout) {
        clearTimeout(playTimeout);
      }
      
      stopLivePhoto();
    };

    // 暂停播放（用于页面切换等场景）
    container._livePhotoPause = function() {
      stopLivePhoto();
    };
  }

  // 初始化所有实况照片
  function initAllLivePhotos() {
    const containers = document.querySelectorAll('.livephoto-container');
    containers.forEach(container => {
      if (!container._livePhotoInitialized) {
        initLivePhoto(container);
        container._livePhotoInitialized = true;
      }
    });
  }

  // 清理所有实况照片
  function cleanupAllLivePhotos() {
    const containers = document.querySelectorAll('.livephoto-container');
    containers.forEach(container => {
      if (container._livePhotoCleanup) {
        container._livePhotoCleanup();
        container._livePhotoInitialized = false;
      }
    });
  }

  // 页面可见性变化处理
  function handleVisibilityChange() {
    if (document.hidden) {
      // 页面隐藏时暂停所有实况照片
      const containers = document.querySelectorAll('.livephoto-container');
      containers.forEach(container => {
        if (container._livePhotoPause) {
          container._livePhotoPause();
        }
      });
    }
  }

  // DOM加载完成后初始化
  function init() {
    initAllLivePhotos();
    
    // 监听页面可见性变化
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // 监听动态内容加载（如果有的话）
    const observer = new MutationObserver(function(mutations) {
      let shouldInit = false;
      mutations.forEach(function(mutation) {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach(function(node) {
            if (node.nodeType === 1) { // Element node
              if (node.classList && node.classList.contains('livephoto-container')) {
                shouldInit = true;
              } else if (node.querySelector && node.querySelector('.livephoto-container')) {
                shouldInit = true;
              }
            }
          });
        }
      });
      
      if (shouldInit) {
        setTimeout(initAllLivePhotos, 100);
      }
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  // 页面卸载时清理
  function cleanup() {
    cleanupAllLivePhotos();
    document.removeEventListener('visibilitychange', handleVisibilityChange);
  }

  // 导出到全局作用域供 Fancybox 使用
  window.StellarLivePhoto = {
    init: init,
    cleanup: cleanup,
    initLivePhoto: initLivePhoto,
    toggleAutoPlay: toggleLivePhotoAutoPlay,
    getAutoPlay: getLivePhotoAutoPlay
  };

  // 自动初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // 页面卸载时清理
  window.addEventListener('beforeunload', cleanup);

})();