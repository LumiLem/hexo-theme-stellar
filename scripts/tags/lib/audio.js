/**
 * audio.js v1.0 | https://github.com/xaoxuu/hexo-theme-stellar/
 * 格式与官方标签插件一致使用空格分隔，中括号内的是可选参数（中括号不需要写出来）
 *
 * {% audio src %}
 *
 */

'use strict';

const parseMusicURL = (url) => {
  if (!url) return null;
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

module.exports = ctx => function (args) {
  args = ctx.args.map(args, ['type', 'netease', 'tencent', 'apple', 'server', 'id', 'autoplay', 'volume', 'lrc'], ['src'])

  // 原版网易云旧语法保留（如果是数字 type 如 "2" 或未填参数，优先走老代码保持完全向下兼容）
  if (args.netease && (!args.type || !isNaN(args.type))) {
    return `
    <div class="tag-plugin audio">
    <iframe src="//music.163.com/outchain/player?type=${args.type || '2'}&id=${args.netease}&auto=${args.autoplay == 'true' ? '1' : '0'}&height=32" frameborder="no" border="0" marginwidth="0" marginheight="0" width=288px height=52>
    </iframe>
    </div>
    `
  }

  let music = null;

  // 1. 解析参数式传入 (例如 server:netease id:123456 type:song)
  if (args.server && args.id) {
    music = { server: args.server, type: args.type || 'song', id: args.id };
  }
  // 简写参数式 (例如 tencent:123456 type:song 或 apple:123456 type:album)
  else if (args.tencent) {
    music = { server: 'tencent', type: args.type || 'song', id: args.tencent };
  } else if (args.apple) {
    music = { server: 'apple', type: args.type || 'song', id: args.apple };
  } else if (args.netease && isNaN(args.type)) {
    // 新版格式使用文字 type (例如 netease:123456 type:song) 则走 MetingJS
    music = { server: 'netease', type: args.type || 'song', id: args.netease };
  }
  // 2. 解析直链 URL 式传入 (前面写好的提取逻辑)
  else if (args.src) {
    music = parseMusicURL(args.src);
  }

  // 渲染最终组件
  if (music) {
    if (music.server === 'apple') {
      return `
      <div class="tag-plugin audio shadow-sm rounded-xl overflow-hidden" style="margin:0.5rem 0;">
          <iframe allow="autoplay *; encrypted-media *; fullscreen *; clipboard-write" frameborder="0" height="175" style="width: 100%; overflow: hidden; border-radius: 10px" sandbox="allow-forms allow-popups allow-same-origin allow-scripts allow-storage-access-by-user-activation allow-top-navigation-by-user-activation" src="https://embed.music.apple.com/cn/${music.type}/${music.id}"></iframe>
      </div>
      `;
    } else {
      const volume = args.volume || '0.7';
      const lrcType = args.lrc || '0';
      return `
      <div class="tag-plugin audio shadow" style="margin:0.5rem 0;">
          <meting-js server="${music.server}" type="${music.type}" id="${music.id}" volume="${volume}" lrc-type="${lrcType}"></meting-js>
      </div>
      `;
    }
  }

  // 解析不到任何对应平台，则保底当作直链文件走原生 HTML5 audio
  return `
  <div class="tag-plugin audio">
  <audio controls preload>
  <source src="${args.src}" type="${args.type || 'audio/mp3'}">Your browser does not support the audio tag.
  </audio>
  </div>
  `
}