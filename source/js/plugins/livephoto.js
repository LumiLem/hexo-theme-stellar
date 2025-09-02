// source/js/plugins/livephoto.js

// 将初始化函数暴露给全局对象
window.initLivePhotos = function() {
  document.querySelectorAll('.live-photo').forEach(livePhoto => {
    const container = livePhoto.querySelector('.container');
    const icon = livePhoto.querySelector('.icon');
    const video = container.querySelector('video');
    const image = container.querySelector('img');
    const warning = livePhoto.querySelector('.warning');
    
    // 保存原始视频URL
    const originalVideoUrl = video.src;
    
    // 仅添加视频转换逻辑
    fetch(originalVideoUrl)
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.blob();
      })
      .then(blob => {
        // 创建Blob URL
        const blobUrl = URL.createObjectURL(blob);
        
        // 设置video的src为Blob URL
        video.src = blobUrl;
        
        // 添加Blob URL释放机制
        // 1. 监听视频结束事件释放Blob URL
        video.addEventListener('ended', () => {
          URL.revokeObjectURL(blobUrl);
        });
        
        // 2. 页面卸载时释放Blob URL
        window.addEventListener('beforeunload', () => {
          URL.revokeObjectURL(blobUrl);
        });
      })
      .catch(error => {
        console.error('视频转换失败:', error);
      });
    
    // 保持原有的事件监听代码不变
    let within = false;

    const start = async (e) => {
      e.stopPropagation();
      e.preventDefault();

      within = true;

      try {
        video.currentTime = 0;
        await video.play();
        livePhoto.classList.add('zoom');
      }
      catch(e) {
        console.log(e);
        if (within && e instanceof DOMException) {
          if (['NotAllowedError','AbortError'].includes(e.name)) {
            warning.innerText = '浏览器未允许视频自动播放权限，无法播放实况照片。';
          } else if (['NotSupportedError'].includes(e.name)) {
            warning.innerText = '视频未加载完成或浏览器不支持播放此视频格式。';
          } else {
            warning.innerText = `其它错误：${e}`;
          }
          warning.classList.add('show');
        }
      }
    };

    const leave = (e) => {
      livePhoto.classList.remove('zoom');
      warning.classList.remove('show');

      within = false;

      video.pause();
    };

    icon.addEventListener('mouseenter',   start);
    icon.addEventListener('mouseleave',   leave);

    image.addEventListener('touchstart',  start);
    image.addEventListener('touchend',    leave);
    image.addEventListener('touchcancel', leave);

    video.addEventListener('ended', () => {
      livePhoto.classList.remove('zoom');
    });
  });
};

// 初始执行
document.addEventListener('DOMContentLoaded', () => {
  if (window.initLivePhotos) {
    window.initLivePhotos();
  }
});