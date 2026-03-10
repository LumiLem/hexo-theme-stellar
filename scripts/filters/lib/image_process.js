'use strict';

const { URL } = require('url');

function processImageProcess(str, data) {
    const config = this.theme.config.image_process;
    if (!config || !config.enable) return str;

    const pRules = Array.isArray(config.rules) ? config.rules : [];
    if (pRules.length === 0) return str;

    const addParam = (urlStr, param) => {
        if (!param || typeof param !== 'string' || !param.trim()) return urlStr;
        if (urlStr.startsWith('data:')) return urlStr;
        if (urlStr.includes(param.replace(/^[?&]/, ''))) return urlStr;
        if (/\.(mp4|webm|svg|gif|swf)($|\?)/i.test(urlStr)) return urlStr;

        param = param.trim();
        const separator = urlStr.includes('?') ? '&' : '?';
        const paramToAppend = param.startsWith('?') || param.startsWith('&') ? param.slice(1) : param;
        return `${urlStr}${separator}${paramToAppend}`;
    };

    const findRule = (hostname) => {
        for (const rule of pRules) {
            const domains = rule.domains || [];
            if (domains.includes(hostname)) {
                return rule;
            }
        }
        return null;
    };

    const isRelative = (urlStr) => {
        return urlStr && !urlStr.startsWith('http://') && !urlStr.startsWith('https://') && !urlStr.startsWith('//') && !urlStr.startsWith('data:');
    };

    const isSkipUrl = (url) => {
        return url.includes('api.iconify.design') || url.includes('cdn-x/placeholder') || url.startsWith('data:');
    };

    const processUrl = (urlStr, scene) => {
        try {
            if (urlStr.startsWith('data:')) return urlStr;
            if (isRelative(urlStr)) return urlStr;

            const urlToParse = urlStr.startsWith('//') ? `https:${urlStr}` : urlStr;
            const urlObj = new URL(urlToParse);
            const targetRule = findRule(urlObj.hostname);
            if (!targetRule) return urlStr;

            const param = scene === 'thumb' ? targetRule.thumb_param : targetRule.full_param;
            return addParam(urlStr, param);
        } catch (e) {
            return urlStr;
        }
    };

    // Replace <img>
    str = str.replace(/<img([^>]*)>/gi, (match, attr) => {
        let firstProcessedUrl = null;

        // 提取 src 和 data-src 值
        const srcMatch = attr.match(/\s+src="([^"]+)"/i);
        const dataSrcMatch = attr.match(/\s+data-src="([^"]+)"/i);
        const srcUrl = srcMatch ? srcMatch[1] : '';
        const dataSrcUrl = dataSrcMatch ? dataSrcMatch[1] : '';
        const srcIsRelative = srcUrl && isRelative(srcUrl) && !isSkipUrl(srcUrl);
        const dataSrcIsRelative = dataSrcUrl && isRelative(dataSrcUrl) && !isSkipUrl(dataSrcUrl);

        // 判断这张图片是否包含需要运行期处理的相对路径
        const hasRelativeUrl = srcIsRelative || dataSrcIsRelative;
        const alreadyLazy = attr.includes('lazy');

        let newAttr = attr;

        if (hasRelativeUrl && !alreadyLazy) {
            // 非懒加载的相对路径图片：src → data-src，转为懒加载模式
            newAttr = newAttr.replace(/\s+src="([^"]+)"/i, ` data-src="$1" data-img-process src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"`);
            if (newAttr.includes('class="')) {
                newAttr = newAttr.replace(/class="([^"]*)"/i, 'class="$1 lazy"');
            } else {
                newAttr += ' class="lazy"';
            }
            firstProcessedUrl = srcUrl;
        } else if (hasRelativeUrl && alreadyLazy) {
            // 已经是懒加载的相对路径图片：只加标记，运行期脚本会处理 data-src
            if (!attr.includes('data-img-process')) {
                newAttr += ' data-img-process';
            }
            firstProcessedUrl = dataSrcUrl || srcUrl;
        } else {
            // 绝对路径图片：编译期直接处理
            newAttr = attr.replace(/\s+(src|data-src)="([^"]+)"/gi, (attrMatch, name, url) => {
                if (isSkipUrl(url)) return attrMatch;
                if (!firstProcessedUrl) firstProcessedUrl = url;
                return ` ${name}="${processUrl(url, 'thumb')}"`;
            });
        }

        // data-original for fancybox
        if (firstProcessedUrl && (newAttr.includes('data-fancybox') || newAttr.includes('lazy')) && !newAttr.includes('data-original=')) {
            newAttr += ` data-original="${processUrl(firstProcessedUrl, 'full')}"`;
        }

        return `<img${newAttr}>`;
    });

    // Replace <a href="..." data-fancybox(...)>
    str = str.replace(/<a([^>]*)>/gi, (match, attr) => {
        if (attr.includes('data-fancybox')) {
            let newAttr = attr.replace(/\s+href="([^"]+)"/gi, (attrMatch, url) => {
                if (url.startsWith('#') || url.startsWith('javascript:')) return attrMatch;
                return ` href="${processUrl(url, 'full')}"`;
            });
            return `<a${newAttr}>`;
        }
        return match;
    });

    // Replace <div data-livephoto-image="...">
    str = str.replace(/<div([^>]*)>/gi, (match, attr) => {
        if (attr.includes('data-livephoto-image')) {
            let newAttr = attr.replace(/\s+data-livephoto-image="([^"]+)"/gi, (attrMatch, url) => {
                return ` data-livephoto-image="${processUrl(url, 'full')}" data-src="${processUrl(url, 'full')}"`;
            });
            return `<div${newAttr}>`;
        }
        return match;
    });

    return str;
}

module.exports.processSite = processImageProcess;
