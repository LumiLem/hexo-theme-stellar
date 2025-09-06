/**
 * livephoto.js | 实况照片标签插件
 * 格式: {% livephoto photo:图片路径 video:视频路径 [alt:描述] [width:宽度] [height:高度] [bg:背景色] [padding:内边距] [ratio:宽高比] %}
 */

'use strict';

const LIVE_ICON = "data:image/png;base64,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";

module.exports = ctx => function(args) {
  args = ctx.args.map(args, ['width', 'height', 'bg', 'padding', 'ratio'], ['photo', 'video', 'alt']);
  
  if (!args.photo) throw new Error('必须提供 photo 参数');
  if (!args.video) throw new Error('必须提供 video 参数');
  
  var style = '';
  if (args.width) {
    style += 'width:' + args.width + ';';
  }
  if (args.height) {
    style += 'height:' + args.height + ';';
  }
  
  var containerStyle = '';
  if (args.bg && args.bg.length > 0) {
    containerStyle += 'background:' + args.bg + ';';
  }
  if (args.padding) {
    containerStyle += 'padding:' + args.padding + ';';
  }
  if (args.ratio) {
    containerStyle += 'aspect-ratio:' + args.ratio + ';';
  }
  
  var el = '';
  
  el += '<div class="tag-plugin image live-photo">';
  
  el += '<div class="image-bg"';
  if (containerStyle || style) {
    el += ' style="';
    if (containerStyle) {
      el += containerStyle;
    }
    if (style) {
      el += style;
    }
    el += '"';
  }
  el += '>';
  
  el += '<div class="live-photo-container"';
  if (style && !args.ratio) {
    el += ' style="' + style + '"';
  }
  el += ' data-video="' + args.video + '"';
  el += ' data-photo="' + args.photo + '">';
  
  el += '<video playsinline preload="none" data-src="' + args.video + '"></video>';
  
  el += '<img class="lazy" src="' + ctx.theme.config.default.loading + '"';
  el += ' data-src="' + args.photo + '"';
  if (args.alt) {
    el += ' alt="' + args.alt + '"';
  }
  el += ' onerror="this.src=&quot;' + ctx.theme.config.default.image_onerror + '&quot;">';
  
  el += '<div class="lazy-icon" style="background-image:url(' + ctx.theme.config.default.loading + ');"></div>';
  
  el += '<div class="icon">';
  el += '<img src="' + LIVE_ICON + '" class="no-zoom static">';
  el += '<span>实况</span>';
  el += '</div>';
  
  el += '<div class="warning" style="opacity: 0;"></div>';
  
  el += '</div>'; 
  
  el += '</div>'; 
  
  if (args.alt && args.alt.length > 0) {
    el += '<div class="image-meta">';
    el += '<span class="image-caption center">' + args.alt + '</span>';
    el += '</div>';
  }
  
  el += '</div>'; 
  
  return el;
};