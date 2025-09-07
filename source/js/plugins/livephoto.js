// 将初始化函数暴露给全局对象
window.initLivePhotos = function() {
  document.querySelectorAll('.live-photo-container').forEach(container => {
    const video = container.querySelector('video');
    const img = container.querySelector('img');
    const icon = container.querySelector('.icon');
    const warning = container.querySelector('.warning');
    const spinner = icon ? icon.querySelector('.loading-spinner') : null;
    const iconImg = icon ? icon.querySelector('img') : null;
    const iconText = icon ? icon.querySelector('span') : null;
    
    // 错误处理函数
    const handleError = (errorMessage) => {
      if (warning) {
        warning.textContent = errorMessage;
        warning.style.opacity = 1;
        warning.style.display = 'inline-block';
        
        setTimeout(() => {
          warning.style.opacity = 0;
        }, 5000);
      }
    };
    
    img.onerror = function() {
      this.src = ctx.theme.config.default.image_onerror;
      handleError('图片加载失败');
    };
    
    // 加载视频函数 - 使用Blob URL
    const loadVideo = async () => {
      try {
        // 获取原始视频URL
        const originalVideoUrl = video.dataset.src;
        
        // 添加视频转换逻辑（防止浏览器劫持）
        const response = await fetch(originalVideoUrl);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const blob = await response.blob();
        
        // 创建Blob URL
        const blobUrl = URL.createObjectURL(blob);
        
        // 设置video的src为Blob URL
        video.src = blobUrl;
        
        // 添加Blob URL释放机制
        const releaseBlobUrl = () => {
          URL.revokeObjectURL(blobUrl);
        };
        
        // 1. 监听视频结束事件释放Blob URL
        video.addEventListener('ended', releaseBlobUrl);
        
        // 2. 页面卸载时释放Blob URL
        window.addEventListener('beforeunload', releaseBlobUrl);
        
        // 3. 容器移除时释放Blob URL
        const observer = new MutationObserver(() => {
          if (!document.body.contains(container)) {
            releaseBlobUrl();
            observer.disconnect();
          }
        });
        observer.observe(document.body, { childList: true, subtree: true });
        
        return true;
      } catch (error) {
        console.error('视频转换失败:', error);
        handleError('视频加载失败');
        return false;
      }
    };
    
    let within = false;

    const start = async (e) => {
      e.stopPropagation();
      e.preventDefault();

      within = true;
      
      // 检查视频是否已经加载
      const videoLoaded = video.src && video.src.startsWith('blob:');
      
      // 只有在视频未加载时才显示加载状态
      if (!videoLoaded && iconImg && spinner && iconText) {
        iconImg.style.display = 'none';
        spinner.style.display = 'block';
        iconText.textContent = '加载中';
      }

      try {
        // 确保视频已加载
        if (!videoLoaded) {
          const loaded = await loadVideo();
          if (!loaded) return;
          
          // 等待视频加载完成
          await new Promise((resolve, reject) => {
            video.addEventListener('loadeddata', resolve);
            video.addEventListener('error', reject);
          });
        }
        
        video.currentTime = 0;
        await video.play();
        container.classList.add('zoom');
      }
      catch(e) {
        if (within && e instanceof DOMException) {
          let errorMessage = '播放错误';
          if (['NotAllowedError','AbortError'].includes(e.name)) {
            errorMessage = '浏览器未允许视频自动播放权限';
          } else if (['NotSupportedError'].includes(e.name)) {
            errorMessage = '浏览器不支持此视频格式';
          } else {
            errorMessage = `播放错误: ${e.message}`;
          }
          handleError(errorMessage);
        }
      }
      finally {
        // 只有在视频未加载时才恢复图标状态
        if (!videoLoaded && iconImg && spinner && iconText) {
          iconImg.style.display = 'block';
          spinner.style.display = 'none';
          iconText.textContent = '实况';
        }
      }
    };

    const leave = (e) => {
      container.classList.remove('zoom');
      within = false;
      video.pause();
      video.currentTime = 0;
      
      // 隐藏警告
      if (warning) {
        warning.style.opacity = 0;
      }
    };

    // 事件监听
    // PC端：只在图标上监听鼠标事件
    if (icon) {
      icon.addEventListener('mouseenter', start);
      icon.addEventListener('mouseleave', leave);
    }
    
    // 移动端：在图片上监听触摸事件
    if (img) {
      img.addEventListener('touchstart', start);
      img.addEventListener('touchend', leave);
      img.addEventListener('touchcancel', leave);
    }
    
    // 保留图标点击事件（PC和移动端通用）
    if (icon) {
      icon.addEventListener('click', start);
    }

    // 视频播放结束事件
    video.addEventListener('ended', () => {
      container.classList.remove('zoom');
    });
  });
};

// 初始执行
document.addEventListener('DOMContentLoaded', () => {
  if (window.initLivePhotos) {
    window.initLivePhotos();
  }
});