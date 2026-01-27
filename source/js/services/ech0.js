/**
 * ech0.js v1.0 | https://github.com/xaoxuu/hexo-theme-stellar/
 * 
 * 获取 Ech0 内容并在时间线展示
 */

utils.jq(() => {
    $(function () {
        const timelines = document.getElementsByClassName('ds-ech0');

        for (let i = 0; i < timelines.length; i++) {
            const el = timelines[i];
            let api = el.dataset.api;
            if (!api) continue;

            // 规格化 API 地址：移除末尾的 /echo/page 或 /
            api = api.replace(/\/echo\/page\/?$/, '').replace(/\/$/, '');

            const limit = parseInt(el.getAttribute('limit')) || 10;
            const default_avatar = el.getAttribute('avatar') || def.avatar;
            const user_filter = el.getAttribute('user');
            const hide_filter = el.getAttribute('hide')?.split(',') || [];
            const loadmore_enabled = el.getAttribute('loadmore') !== 'false';
            const forced_layout = el.getAttribute('layout');
            let currentPage = 1;

            const loadEchos = (page) => {
                utils.onLoading(el);
                fetch(`${api}/echo/page`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        page: page,
                        pageSize: limit,
                        search: '',
                        user: user_filter
                    })
                })
                    .then(res => {
                        if (!res.ok) throw new Error('Network response was not ok');
                        return res.json();
                    })
                    .then(resp => {
                        utils.onLoadSuccess(el);
                        if (resp.code === 1) {
                            renderEchos(el, resp.data.items, api);
                            if (loadmore_enabled && resp.data.items && resp.data.items.length === limit) {
                                updateLoadMore(el, page + 1);
                            } else {
                                removeLoadMore(el);
                            }
                        } else {
                            console.error('[Ech0] Error code:', resp.code, resp.msg);
                            utils.onLoadFailure(el);
                        }
                    })
                    .catch(err => {
                        utils.onLoadFailure(el);
                        console.error('[Ech0] Load error:', err);
                    });
            };

            const markedParse = (text) => {
                if (typeof marked !== 'undefined' && marked.parse) {
                    return marked.parse(text, { breaks: true, gfm: true });
                }
                return text;
            };

            const renderEchos = (container, items, baseApi) => {
                if (!items) return;
                const siteUrl = baseApi.replace(/\/api$/, '');

                const getURL = (url) => {
                    if (!url) return '';
                    if (url.startsWith('http') || url.startsWith('//') || url.startsWith('data:')) {
                        return url;
                    }
                    // 使用 baseApi 作为相对路径的基准，确保包含 /api 前缀
                    return baseApi + (url.startsWith('/') ? '' : '/') + url;
                };

                items.forEach(item => {
                    const node = document.createElement('div');
                    node.className = 'timenode';
                    node.setAttribute('index', item.id);

                    const postLayout = forced_layout || item.layout || 'grid';
                    const isTextTop = postLayout === 'grid' || postLayout === 'horizontal';

                    let contentHtml = `<div class="content md-text">${markedParse(item.content || '')}</div>`;
                    let galleryHtml = item.media && item.media.length > 0 ? renderGallery(item, item.media, postLayout, baseApi) : '';
                    let extensionHtml = item.extension ? renderExtension(item.extension, item.extension_type, baseApi) : '';

                    const avatarUrl = item.user?.avatar ? getURL(item.user.avatar) : default_avatar;

                    let html = `
                    <div class="header">
                        ${!hide_filter.includes('user') ? `
                        <div class="user-info">
                            ${!hide_filter.includes('avatar') ? `<img src="${avatarUrl}" onerror="this.src='${default_avatar}'">` : ''}
                            ${!hide_filter.includes('username') ? `<span>${item.user?.username || item.username}</span>` : ''}
                        </div>` : ''}
                        <span>${new Date(item.created_at).toLocaleString()}</span>
                    </div>
                    <div class="body">
                        ${isTextTop ? contentHtml + galleryHtml : galleryHtml + contentHtml}
                        ${extensionHtml}
                        ${!hide_filter.includes('footer') ? `
                        <div class="footer">
                            <div class="flex left">
                                ${item.tags ? item.tags.map(t => `<div class="item label"># ${t.name}</div>`).join('') : ''}
                            </div>
                            <div class="flex right">
                                <div class="item share" data-url="${siteUrl}/echo/${item.id}" title="复制链接">
                                    <svg viewBox="0 0 24 24" width="18" height="18"><circle cx="12" cy="12" r="10" fill="currentColor" opacity=".5"/><path fill="currentColor" d="M10 13c-.221 0-.43-.086-.585-.243l-3.172-3.172a1 1 0 0 1 1.414-1.414l2.465 2.465l6.303-6.303a1 1 0 0 1 1.414 1.414l-7.014 7.014A.825.825 0 0 1 10 13z" opacity=".8"/><path fill="currentColor" d="M14.829 6.343a4 4 0 0 0-5.657 5.657l.707.707a1 1 0 0 1-1.414 1.414l-.707-.707a6 6 0 0 1 8.485-8.485l3.535 3.536a6 6 0 0 1-8.485 8.485l-.707-.707a1 1 0 0 1 1.414-1.414l.707.707a4 4 0 0 0 5.657-5.657l-3.536-3.536z"/></svg>
                                </div>
                                <a class="item origin" href="${siteUrl}/echo/${item.id}" target="_blank" rel="external nofollow noopener noreferrer" title="跳转原帖">
                                    <svg viewBox="0 0 24 24" width="18" height="18"><circle cx="12" cy="12" r="10" fill="currentColor" opacity=".5"/><path fill="currentColor" d="M14.5 12c0-.3-.1-.5-.3-.7l-3-3a1 1 0 0 0-1.4 1.4l2.3 2.3-2.3 2.3a1 1 0 0 0 1.4 1.4l3-3c.2-.2.3-.4.3-.7z"/></svg>
                                </a>
                                <div class="item reaction like ${hasLiked(item.id) ? 'active' : ''}" data-id="${item.id}">
                                    <svg viewBox="0 0 24 24" width="18" height="18"><circle cx="12" cy="12" r="10" fill="currentColor" opacity=".5"/><path fill="currentColor" d="M12 16.5c-.2 0-.4-.1-.5-.2l-3-3c-.9-.9-.9-2.4 0-3.3s2.4-.9 3.3 0L12 10.2l.2-.2c.9-.9 2.4-.9 3.3 0s.9 2.4 0 3.3l-3 3c-.1.1-.3.2-.5.2z"/></svg>
                                    <span class="count">${item.fav_count || 0}</span>
                                </div>
                            </div>
                        </div>` : ''}
                    </div>
                `;

                    node.innerHTML = html;
                    const loadMoreBtn = container.querySelector('.load-more');
                    if (loadMoreBtn) {
                        container.insertBefore(node, loadMoreBtn);
                    } else {
                        container.appendChild(node);
                    }
                });

                // 处理懒加载
                if (window.wrapLazyloadImages) window.wrapLazyloadImages(container);
            };

            const renderGallery = (echo, media, layout, baseApi) => {
                const l = layout || 'grid';
                const caption = markedParse(echo.content || '').replace(/"/g, '&quot;');
                // 过滤出要在画廊显示的媒体项（实况照片只显示图，视频部分隐藏）
                const visibleMedia = media.filter(m => {
                    if (m.media_type === 'video') {
                        return !media.some(img => img.live_video_id === m.id);
                    }
                    return true;
                });

                const isCarousel = l === 'carousel';
                let html = `<div class="gallery layout-${l}" data-count="${visibleMedia.length}">`;

                visibleMedia.forEach((m, idx) => {
                    const isLive = m.media_type === 'image' && m.live_video_id;
                    const liveVideo = isLive ? media.find(v => v.id === m.live_video_id) : null;
                    // 轮播图模式：第一张默认显示
                    const activeClass = isCarousel ? (idx === 0 ? ' active' : '') : '';

                    if (isLive && liveVideo) {
                        html += `
                        <div class="livephoto-container${activeClass}" 
                             data-fancybox="ech0-${i}-${echo.id}" 
                             data-caption="${caption}"
                             data-livephoto-image="${m.media_url}" 
                             data-livephoto-video="${liveVideo.media_url}">
                            <img class="livephoto-image" src="${m.media_url}" loading="lazy">
                            <video class="livephoto-video" src="${liveVideo.media_url}" preload="metadata" muted playsinline disablepictureinpicture></video>
                            <div class="livephoto-overlay" title="点击查看实况照片">
                                <svg class="livephoto-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                                    <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="1.5" fill="none"/>
                                    <circle cx="12" cy="12" r="6" stroke="currentColor" stroke-width="1.5" fill="none"/>
                                    <circle cx="12" cy="12" r="3" fill="currentColor"/>
                                </svg>
                                <span class="livephoto-text">LIVE</span>
                            </div>
                        </div>
                    `;
                    } else if (m.media_type === 'video') {
                        html += `
                        <div class="video-container${activeClass}">
                            <video src="${m.media_url}#t=0.1" 
                                   preload="metadata" 
                                   muted
                                   data-fancybox="ech0-${i}-${echo.id}" 
                                   data-type="video"
                                   data-caption="${caption}"></video>
                            <div class="play-overlay">
                                <svg viewBox="0 0 24 24" width="24" height="24" fill="white"><path d="M8 5v14l11-7z"/></svg>
                            </div>
                        </div>
                    `;
                    } else {
                        html += `
                        <div class="image-container${activeClass}">
                            <img src="${m.media_url}" 
                                 loading="lazy"
                                 data-fancybox="ech0-${i}-${echo.id}" 
                                 data-caption="${caption}">
                        </div>
                    `;
                    }
                });

                html += '</div>';

                // 轮播图添加导航（图片下方，显示页码）
                if (isCarousel && visibleMedia.length > 1) {
                    html += `
                    <div class="carousel-nav">
                        <button class="nav-btn prev" aria-label="上一张">
                            <svg viewBox="0 0 24 24"><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/></svg>
                        </button>
                        <span class="carousel-counter">1 / ${visibleMedia.length}</span>
                        <button class="nav-btn next" aria-label="下一张">
                            <svg viewBox="0 0 24 24"><path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/></svg>
                        </button>
                    </div>`;
                }

                return html;
            };

            const parseMusicURL = (url) => {
                url = url.trim();
                if (/^https:\/\/([a-z0-9-]+\.)*music\.163\.com/i.test(url)) {
                    const idMatch = url.match(/[?&]id=(\d+)/);
                    if (!idMatch) return null;
                    let type;
                    if (/(\/|#\/|\/m\/)song/.test(url)) type = 'song';
                    else if (/(\/|#\/|\/m\/)playlist/.test(url)) type = 'playlist';
                    if (!type) return null;
                    return { server: 'netease', type, id: idMatch[1] };
                }
                if (/^https:\/\/([a-z0-9-]+\.)*qq\.com/i.test(url)) {
                    const newSongMatch = url.match(/songDetail\/([a-zA-Z0-9]+)/);
                    if (newSongMatch) return { server: 'tencent', type: 'song', id: newSongMatch[1] };
                    const oldSongMatch = url.match(/[?&]songid=(\d+)/);
                    if (oldSongMatch) return { server: 'tencent', type: 'song', id: oldSongMatch[1] };
                    const playlistMatch = url.match(/\/playlist\/(\d+)/i);
                    if (playlistMatch) return { server: 'tencent', type: 'playlist', id: playlistMatch[1] };
                    return null;
                }
                if (/^https:\/\/music\.apple\.com/i.test(url)) {
                    const appleMatch = url.match(/\/(song|album)\/[^/]+\/(\d+)/);
                    if (!appleMatch) return null;
                    return { server: 'apple', type: appleMatch[1], id: appleMatch[2] };
                }
                return null;
            };

            const renderExtension = (ext, type, baseApi) => {
                if (!ext) return '';

                if (type === 'WEBSITE') {
                    try {
                        const info = JSON.parse(ext);
                        return `
                        <div class="tag-plugin link dis-select shadow">
                            <a class="link-card plain" href="${info.site}" target="_blank" rel="external nofollow noopener noreferrer">
                                <div class="left">
                                    <span class="title">${info.title}</span>
                                    <span class="cap link footnote">${info.site}</span>
                                </div>
                            </a>
                        </div>
                    `;
                    } catch (e) {
                        return `<div class="tag-plugin link dis-select shadow"><a class="link-card plain" href="${ext}">${ext}</a></div>`;
                    }
                }

                if (type === 'GITHUBPROJ') {
                    const repo = ext.split('/').slice(-2).join('/');
                    return `
                    <div class="tag-plugin link dis-select shadow">
                        <a class="link-card plain" href="${ext}" target="_blank" rel="external nofollow noopener noreferrer">
                            <div class="left">
                                <span class="title">${repo}</span>
                                <span class="cap link footnote">${ext}</span>
                            </div>
                        </a>
                    </div>
                `;
                }

                if (type === 'VIDEO') {
                    if (ext.startsWith('BV')) {
                        return `
                        <div class="tag-plugin video-player shadow" style="aspect-ratio:16/9;">
                            <iframe src="https://player.bilibili.com/player.html?bvid=${ext}&autoplay=false" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true"></iframe>
                        </div>
                    `;
                    } else if (/^[a-zA-Z0-9_-]{11}$/.test(ext)) {
                        return `
                        <div class="tag-plugin video-player shadow" style="aspect-ratio:16/9;">
                            <iframe src="https://www.youtube.com/embed/${ext}" frameborder="0" allowfullscreen="true"></iframe>
                        </div>
                    `;
                    } else {
                        return `
                        <div class="tag-plugin video-player shadow">
                            <video controls preload="metadata" playsinline webkit-playsinline>
                                <source src="${ext}" type="video/mp4">
                            </video>
                        </div>
                    `;
                    }
                }

                if (type === 'MUSIC') {
                    const music = parseMusicURL(ext);
                    if (music) {
                        if (music.server === 'apple') {
                            return `
                            <div class="shadow-sm rounded-xl overflow-hidden" style="margin:0.5rem 1rem;">
                                <iframe allow="autoplay *; encrypted-media *; fullscreen *; clipboard-write" frameborder="0" height="175" style="width: 100%; overflow: hidden; border-radius: 10px" sandbox="allow-forms allow-popups allow-same-origin allow-scripts allow-storage-access-by-user-activation allow-top-navigation-by-user-activation" src="https://embed.music.apple.com/cn/${music.type}/${music.id}"></iframe>
                            </div>
                        `;
                        } else {
                            return `
                            <div class="tag-plugin audio shadow" style="margin:0.5rem 1rem;">
                                <meting-js server="${music.server}" type="${music.type}" id="${music.id}" volume="0.7" lrc-type="0"></meting-js>
                            </div>
                        `;
                        }
                    }
                    return `
                    <div class="tag-plugin audio shadow" style="margin:0.5rem 1rem;">
                        <audio controls src="${ext}" style="width:100%"></audio>
                    </div>
                `;
                }
                return '';
            };

            const updateLoadMore = (container, nextPage) => {
                let btn = container.querySelector('.load-more');
                if (!btn) {
                    btn = document.createElement('div');
                    btn.className = 'load-more item';
                    btn.style.marginTop = '1rem';
                    container.appendChild(btn);
                }
                const iconLoad = '<svg class="loading" viewBox="0 0 24 24" width="20" height="20"><path fill="currentColor" opacity=".5" d="M12,4V2A10,10 0 0,0 2,12H4A8,8 0 0,1 12,4Z"/></svg>';
                const iconMore = '<svg viewBox="0 0 24 24" width="20" height="20"><circle cx="12" cy="12" r="10" fill="currentColor" opacity=".5"/><path fill="currentColor" d="M12 7a.75.75 0 0 1 .75.75v3.5h3.5a.75.75 0 0 1 0 1.5h-3.5v3.5a.75.75 0 0 1-1.5 0v-3.5h-3.5a.75.75 0 0 1 0-1.5h3.5v-3.5A.75.75 0 0 1 12 7Z"/></svg>';

                btn.innerHTML = `${iconMore}<span>加载更多</span>`;
                btn.onclick = () => {
                    btn.innerHTML = `${iconLoad}<span>正在加载...</span>`;
                    loadEchos(nextPage);
                };
            };

            const removeLoadMore = (container) => {
                const btn = container.querySelector('.load-more');
                if (btn) btn.remove();
            };

            const hasLiked = (id) => {
                const liked = JSON.parse(localStorage.getItem('liked_echos') || '[]');
                return liked.includes(id);
            };

            const toggleLike = (id, btn) => {
                let liked = JSON.parse(localStorage.getItem('liked_echos') || '[]');
                if (liked.includes(id)) return;

                fetch(`${api}/echo/like/${id}`, { method: 'PUT' })
                    .then(res => res.json())
                    .then(resp => {
                        if (resp.code === 1) {
                            liked.push(id);
                            localStorage.setItem('liked_echos', JSON.stringify(liked));
                            btn.classList.add('active');
                            const countEl = btn.querySelector('.count');
                            countEl.innerText = parseInt(countEl.innerText) + 1;
                        }
                    });
            };

            // 事件委托：点赞 + 分享 + 轮播图
            el.addEventListener('click', (e) => {
                const likeBtn = e.target.closest('.like');
                if (likeBtn) {
                    const id = parseInt(likeBtn.dataset.id);
                    toggleLike(id, likeBtn);
                    return;
                }

                const shareBtn = e.target.closest('.share');
                if (shareBtn) {
                    const url = shareBtn.dataset.url;
                    if (navigator.clipboard && navigator.clipboard.writeText) {
                        navigator.clipboard.writeText(url).then(() => {
                            if (typeof hud !== 'undefined') hud.toast('链接已复制', 2500);
                        });
                    } else {
                        // 回退方案
                        const input = document.createElement('input');
                        input.setAttribute('value', url);
                        document.body.appendChild(input);
                        input.select();
                        document.execCommand('copy');
                        document.body.removeChild(input);
                        if (typeof hud !== 'undefined') hud.toast('链接已复制', 2500);
                    }
                    return;
                }

                // 轮播图导航按钮
                const navBtn = e.target.closest('.carousel-nav .nav-btn');
                if (navBtn) {
                    const nav = navBtn.closest('.carousel-nav');
                    const gallery = nav.previousElementSibling; // gallery 在 nav 之前
                    if (!gallery || !gallery.classList.contains('layout-carousel')) return;

                    const items = gallery.querySelectorAll('.image-container, .video-container, .livephoto-container');
                    const total = items.length;
                    if (total <= 1) return;

                    // 找到当前 active 的索引
                    let currentIndex = 0;
                    items.forEach((item, idx) => {
                        if (item.classList.contains('active')) currentIndex = idx;
                    });

                    // 计算新索引
                    let newIndex = currentIndex;
                    if (navBtn.classList.contains('prev')) {
                        newIndex = Math.max(0, currentIndex - 1);
                    } else {
                        newIndex = Math.min(total - 1, currentIndex + 1);
                    }

                    // 切换 active 类
                    items.forEach((item, idx) => {
                        item.classList.toggle('active', idx === newIndex);
                    });

                    // 更新计数器
                    const counter = nav.querySelector('.carousel-counter');
                    if (counter) {
                        counter.textContent = `${newIndex + 1} / ${total}`;
                    }

                    // 更新按钮禁用状态
                    const prevBtn = nav.querySelector('.nav-btn.prev');
                    const nextBtn = nav.querySelector('.nav-btn.next');
                    if (prevBtn) prevBtn.disabled = newIndex === 0;
                    if (nextBtn) nextBtn.disabled = newIndex === total - 1;

                    return;
                }
            });

            loadEchos(currentPage);
        }
    });
});
