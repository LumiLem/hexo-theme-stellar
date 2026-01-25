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
            let currentPage = 1;

            const loadEchos = (page) => {
                utils.onLoading(el);
                fetch(`${api}/echo/page`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        page: page,
                        pageSize: limit,
                        search: ''
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
                            if (resp.data.items && resp.data.items.length === limit) {
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

            const renderEchos = (container, items, baseApi) => {
                if (!items) return;
                const siteUrl = baseApi.replace(/\/api$/, '');

                const markedParse = (text) => {
                    if (typeof marked !== 'undefined' && marked.parse) {
                        return marked.parse(text);
                    }
                    return text;
                };

                items.forEach(item => {
                    const node = document.createElement('div');
                    node.className = 'timenode';
                    node.setAttribute('index', item.id);

                    const isTextTop = item.layout === 'grid' || item.layout === 'horizontal';

                    let contentHtml = `<div class="content md-text">${markedParse(item.content || '')}</div>`;
                    let galleryHtml = item.media && item.media.length > 0 ? renderGallery(item, item.media, item.layout, baseApi) : '';
                    let extensionHtml = item.extension ? renderExtension(item.extension, item.extension_type, baseApi) : '';

                    let html = `
                    <div class="header">
                        <div class="user-info">
                            <img src="${item.user?.avatar || (siteUrl + '/favicon.ico')}" onerror="this.style.opacity='0'">
                            <span>${item.user?.username || item.username}</span>
                        </div>
                        <span>${new Date(item.created_at).toLocaleString()}</span>
                    </div>
                    <div class="body">
                        ${isTextTop ? contentHtml + galleryHtml : galleryHtml + contentHtml}
                        ${extensionHtml}
                        <div class="footer">
                            <div class="flex left">
                                <a class="item origin" href="${siteUrl}/echo/${item.id}" target="_blank" rel="external nofollow noopener noreferrer">跳转原帖</a>
                            </div>
                            <div class="flex right">
                                <div class="item reaction like ${hasLiked(item.id) ? 'active' : ''}" data-id="${item.id}">
                                    <span>👍 <span class="count">${item.fav_count || 0}</span></span>
                                </div>
                            </div>
                        </div>
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

                // 处理懒加载和 Fancybox
                if (window.StellarLivePhoto) window.StellarLivePhoto.init();
                if (window.wrapLazyloadImages) window.wrapLazyloadImages(container);
            };

            const renderGallery = (echo, media, layout, baseApi) => {
                const l = layout || 'grid';
                const caption = (echo.content || '').substring(0, 50).replace(/"/g, '&quot;').replace(/\n/g, ' ');
                let html = `<div class="gallery layout-${l}" data-count="${media.length}">`;

                // 过滤出要在画廊显示的媒体项（实况照片只显示图，视频部分隐藏）
                const visibleMedia = media.filter(m => {
                    if (m.media_type === 'video') {
                        return !media.some(img => img.live_video_id === m.id);
                    }
                    return true;
                });

                visibleMedia.forEach((m, idx) => {
                    const isLive = m.media_type === 'image' && m.live_video_id;
                    const liveVideo = isLive ? media.find(v => v.id === m.live_video_id) : null;

                    if (isLive && liveVideo) {
                        html += `
                        <div class="livephoto-item">
                            <a class="livephoto-container" href="${m.media_url}" 
                               data-fancybox="gallery-${echo.id}" 
                               data-caption="${caption}"
                               data-livephoto-image="${m.media_url}" 
                               data-livephoto-video="${liveVideo.media_url}">
                                <img class="livephoto-image" src="${m.media_url}" loading="lazy">
                                <video class="livephoto-video" src="${liveVideo.media_url}" preload="metadata" muted playsinline loop></video>
                                <div class="livephoto-overlay">LIVE</div>
                            </a>
                        </div>
                    `;
                    } else if (m.media_type === 'video') {
                        html += `
                        <div class="video-container">
                            <a href="${m.media_url}" data-fancybox="gallery-${echo.id}" data-type="video" data-thumb="${m.media_url}#t=0.1" data-caption="${caption}">
                                <video src="${m.media_url}#t=0.1" preload="metadata" muted></video>
                                <div class="play-overlay">
                                    <svg viewBox="0 0 24 24" width="24" height="24" fill="white"><path d="M8 5v14l11-7z"/></svg>
                                </div>
                            </a>
                        </div>
                    `;
                    } else {
                        html += `
                        <div class="image-container">
                            <a href="${m.media_url}" data-fancybox="gallery-${echo.id}" data-src="${m.media_url}" data-caption="${caption}">
                                <img src="${m.media_url}" loading="lazy">
                            </a>
                        </div>
                    `;
                    }
                });

                html += '</div>';
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
                        <div class="tag-plugin video-player shadow" style="aspect-ratio:16/9;max-width:100%;margin:0.5rem 1rem;">
                            <iframe src="https://player.bilibili.com/player.html?bvid=${ext}&autoplay=false" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true" style="width:100%;height:100%;border-radius:8px;"></iframe>
                        </div>
                    `;
                    } else if (/^[a-zA-Z0-9_-]{11}$/.test(ext)) {
                        return `
                        <div class="tag-plugin video-player shadow" style="aspect-ratio:16/9;max-width:100%;margin:0.5rem 1rem;">
                            <iframe src="https://www.youtube.com/embed/${ext}" frameborder="0" allowfullscreen="true" style="width:100%;height:100%;border-radius:8px;"></iframe>
                        </div>
                    `;
                    } else {
                        return `
                        <div class="tag-plugin video-player shadow" style="max-width:100%;margin:0.5rem 1rem;">
                            <video controls preload="metadata" playsinline webkit-playsinline style="width:100%;border-radius:8px;">
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
                btn.innerHTML = '<span>加载更多</span>';
                btn.onclick = () => {
                    btn.innerHTML = '<span>正在加载...</span>';
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

            // 事件委托：点赞
            el.addEventListener('click', (e) => {
                const likeBtn = e.target.closest('.like');
                if (likeBtn) {
                    const id = parseInt(likeBtn.dataset.id);
                    toggleLike(id, likeBtn);
                }
            });

            loadEchos(currentPage);
        }
    });
});
