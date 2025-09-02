'use strict';

hexo.extend.filter.register('after_render:html', require('./lib/img_lazyload').processSite);
hexo.extend.filter.register('after_render:html', require('./lib/img_onerror').processSite);

function getAttr(attributes, name) {
    // 支持单双引号、无引号、属性名和值之间有空格，且无引号时不包含/
    const regex = new RegExp(`\\b${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s"'>/]+))`, 'i');
    const match = attributes.match(regex);
    return match ? (match[1] || match[2] || match[3]) : '';
}

function change_image(data) {
    if (this.theme.config.tag_plugins.image.parse_markdown) {
        let splited_content = data.content.split(/(```[\s\S]*?```|{%\s*gallery\s*%}[\s\S]*?{%\s*endgallery\s*%})/g);
        splited_content = splited_content.map((s) => {
            let matches_no = s.match(/(```[\s\S]*?```|{%\s*gallery\s*%}[\s\S]*?{%\s*endgallery\s*%})/i);
            let matches_img = s.match(/!\[(.*?)\]\((.*?)\s*(?:"(.*?)")?\)/i);
            let matches_html_img = s.match(/<img\s+([^>]+)\s*\/?>/i);

            if (!matches_no && (matches_img || matches_html_img)) {
                // 处理Markdown图片
                if (matches_img) {
                    s = s.replace(
                        /!\[(.*?)\]\((.*?)\s*(?:"(.*?)")?\)/g,
                        (match, alt, src, title) => {
                            // 避免 undefined
                            let tag = `{% image ${src}`;
                            if (title) tag += ` ${title}`;
                            tag += ' %}';
                            return tag;
                        }
                    );
                }

                // 处理HTML img标签
                if (matches_html_img) {
                    s = s.replace(
                        /<img\s+([^>]+)\s*\/?>/g,
                        function(match, attributes) {
                            // 提取所有属性，支持单双引号、无引号
                            const src = getAttr(attributes, 'src');
                            const alt = getAttr(attributes, 'alt');
                            const title = getAttr(attributes, 'title');
                            const style = getAttr(attributes, 'style');

                            // 尺寸属性
                            let width = '';
                            let height = '';

                            // 优先使用data-*属性，其次使用原生属性
                            const dataWidth = getAttr(attributes, 'data-width');
                            const dataHeight = getAttr(attributes, 'data-height');
                            if (dataWidth) {
                                width = `width:${dataWidth}`;
                            } else {
                                const w = getAttr(attributes, 'width');
                                if (w) width = `width:${w}`;
                            }
                            if (dataHeight) {
                                height = `height:${dataHeight}`;
                            } else {
                                const h = getAttr(attributes, 'height');
                                if (h) height = `height:${h}`;
                            }

                            // 处理Typora的zoom属性
                            if (style) {
                                const zoomMatch = style.match(/zoom:\s*(\d+(?:\.\d+)?)%/);
                                if (zoomMatch && zoomMatch[1]) {
                                    const zoomPercent = parseFloat(zoomMatch[1]);
                                    if (!width) {
                                        width = `width:${zoomPercent}%`;
                                    }
                                }
                            }

                            // 其他data-*属性
                            const dataBg = getAttr(attributes, 'data-bg');
                            const dataDownload = getAttr(attributes, 'data-download');
                            const dataPadding = getAttr(attributes, 'data-padding');
                            const dataFancybox = getAttr(attributes, 'data-fancybox');
                            const dataRatio = getAttr(attributes, 'data-ratio');

                            // 构建image标签
                            let imageTag = `{% image ${src}`;
                            if (title) {
                                imageTag += ` ${title}`;
                            } else if (alt) {
                                imageTag += ` ${alt}`;
                            }
                            if (width) {
                                imageTag += ` ${width}`;
                            }
                            if (height) {
                                imageTag += ` ${height}`;
                            }
                            if (dataBg) {
                                imageTag += ` bg:${dataBg}`;
                            }
                            if (dataDownload) {
                                imageTag += ` download:${dataDownload}`;
                            }
                            if (dataPadding) {
                                imageTag += ` padding:${dataPadding}`;
                            }
                            if (dataFancybox) {
                                imageTag += ` fancybox:${dataFancybox}`;
                            }
                            if (dataRatio) {
                                imageTag += ` ratio:${dataRatio}`;
                            }
                            imageTag += ' %}';

                            return imageTag;
                        }
                    );
                }
            }
            return s;
        });
        data.content = splited_content.join('');
    }
    return data;
}

hexo.extend.filter.register('before_post_render', change_image, 9);