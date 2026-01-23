# Stellar主题实况照片功能

## 概述

Stellar主题现已支持实况照片（Live Photo）功能，该功能基于Ech0项目的实况照片实现，提供了完整的实况照片显示和交互体验。

**功能分层设计**：
- **基础功能**：文章内实况照片显示和交互（独立功能，无需其他插件）
- **增强功能**：Fancybox集成，提供完整的弹窗体验（需要启用fancybox插件）

## 功能特性

### 基础功能（始终可用）
- **静态预览**：在文章中显示为静态图片，左上角带有LIVE标识
- **动态播放**：PC端鼠标悬停播放，移动端触摸播放
- **独立性**：无需启用fancybox插件即可使用
- **轻量级**：只加载必要的样式和脚本

### 增强功能（需要fancybox插件）
- **Fancybox集成**：完美集成到Fancybox中，支持与普通图片混合浏览
- **完整控制UI**：包含自动播放设置、下拉菜单等高级功能
- **统一体验**：与普通图片在Fancybox中的行为保持一致

### 交互体验
- **PC端**：鼠标悬停在LIVE图标上时播放视频，点击图片区域进入Fancybox
- **移动端**：触摸LIVE图标时播放视频，点击图片区域进入Fancybox
- **Fancybox**：点击进入Fancybox后，支持完整的实况照片交互
- **设置保存**：自动播放设置会保存到本地存储

## 使用方法

### 基本语法

```markdown
{% image 图片URL 描述文字 fancybox:true livephoto:视频URL %}
```

### 参数说明

| 参数 | 说明 | 必需 |
|------|------|------|
| 图片URL | 实况照片的静态图片地址 | 是 |
| 描述文字 | 图片的描述文字 | 否 |
| fancybox:true | 启用Fancybox放大预览 | 推荐 |
| livephoto:视频URL | 实况照片对应的视频地址 | 是 |

### 使用示例

#### 基础实况照片（无需fancybox）
```markdown
{% image /images/livephoto.jpg 我的实况照片 livephoto:/videos/livephoto.mp4 %}
```

#### 增强实况照片（配合fancybox）
```markdown
{% image /images/livephoto.jpg 我的实况照片 fancybox:true livephoto:/videos/livephoto.mp4 %}
```

#### 混合使用
```markdown
{% image /images/photo1.jpg 普通照片 fancybox:true %}
{% image /images/livephoto.jpg 实况照片 fancybox:true livephoto:/videos/livephoto.mp4 %}
{% image /images/photo2.jpg 另一张普通照片 fancybox:true %}
```

## 文件准备

### 图片文件
- 支持常见的图片格式：JPG、PNG、WEBP、AVIF等
- 建议使用适当的压缩以确保加载速度

### 视频文件
- 支持常见的视频格式：MP4、WEBM等
- **重要**：建议视频文件较小（通常1-3秒，几MB以内）
- 视频应该是循环播放的短片段
- 建议使用H.264编码的MP4格式以确保兼容性

### 文件组织建议
```
source/
├── images/
│   ├── livephoto1.jpg
│   ├── livephoto2.jpg
│   └── ...
└── videos/
    ├── livephoto1.mp4
    ├── livephoto2.mp4
    └── ...
```

## 配置选项

### 主题配置

在 `themes/stellar/_config.yml` 中：

```yaml
plugins:
  fancybox:
    enable: true  # 可选：启用可获得增强的Fancybox体验
    
tag_plugins:
  image:
    fancybox: false  # 可选：设置为true来默认启用fancybox
```

**重要说明**：
- 实况照片的基础功能（文章内播放）**不依赖**fancybox插件
- 只有需要Fancybox弹窗体验时才需要启用fancybox插件
- 即使不启用fancybox，实况照片仍然可以正常工作

### 自动播放设置

用户可以在Fancybox中通过点击LIVE图标来切换自动播放设置：
- **开启自动播放**：进入Fancybox时自动播放实况照片
- **关闭自动播放**：需要手动悬停/触摸才播放

设置会自动保存到浏览器本地存储中。

## 技术实现

### 核心组件
1. **image.js**：扩展了image标签解析，支持livephoto参数
2. **livephoto.css/styl**：实况照片的样式定义
3. **livephoto.js**：实况照片的交互逻辑
4. **fancybox.ejs**：集成实况照片到Fancybox

### 浏览器兼容性
- **现代浏览器**：完整支持所有功能
- **旧版浏览器**：降级为静态图片显示
- **移动端**：完整支持触摸交互

## 注意事项

### 性能考虑
1. **视频大小**：保持视频文件较小以确保快速加载
2. **懒加载**：视频使用`preload="metadata"`，只在需要时加载
3. **内存管理**：自动清理不再使用的视频资源

### 使用建议
1. **交互设计**：LIVE图标区域用于播放视频，图片区域用于进入Fancybox
2. **文件命名**：建议图片和视频使用相同的基础名称
3. **路径管理**：使用相对路径或CDN地址
4. **备用方案**：即使视频加载失败，静态图片仍能正常显示

### 已知限制
1. 需要同时提供图片和视频文件
2. 视频格式需要浏览器支持
3. 在某些网络环境下可能需要较长加载时间

## 故障排除

### 常见问题

**Q: 实况照片不播放？**
A: 检查视频文件路径是否正确，浏览器是否支持该视频格式。

**Q: Fancybox中看不到实况照片效果？**
A: 确保fancybox插件已启用，检查浏览器控制台是否有JavaScript错误。

**Q: 移动端触摸不响应？**
A: 确保没有其他JavaScript事件阻止了触摸事件的传播。

### 调试方法
1. 打开浏览器开发者工具
2. 检查网络面板确认视频文件加载
3. 查看控制台是否有错误信息
4. 验证HTML结构是否正确生成

## 更新日志

### v1.0.0 (2025-01-22)
- 初始版本发布
- 支持基础实况照片功能
- 完整的Fancybox集成
- PC端和移动端交互支持
- 自动播放设置功能

---

*本功能基于Ech0项目的实况照片实现*