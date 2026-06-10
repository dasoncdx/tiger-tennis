# Tiger网球俱乐部 H5应用 设计规范 v1.0

> 基于配色方案A（深松绿）确认稿，结合苹果简约高端风格。作为前端开发的视觉基准，所有组件样式以本文档为准。

---

## 一、设计理念

**简洁、专业、克制。**

- 主色深沉有质感，不泛滥使用
- 大量留白，卡片式布局，信息层级清晰
- 字重和字号区分优先级，不依赖颜色堆砌
- 圆角、阴影、间距全部统一，系统性而非随意

---

## 二、色彩系统

### 主色（Brand）

| Token | Hex | 用途 |
|-------|-----|------|
| `--color-primary` | `#1B4332` | 品牌主色·深松绿；主按钮、导航激活、关键标签 |
| `--color-primary-mid` | `#2D6A4F` | 主色中间色；渐变过渡、头像背景 |
| `--color-primary-light-bg` | `#D8F3DC` | 主色浅背景；标签背景、图标背景 |
| `--color-primary-text-on-light` | `#1B4332` | 主色浅背景上的文字色 |

### 中性色（Neutral）

| Token | Hex | 用途 |
|-------|-----|------|
| `--color-gray-900` | `#1A1A1A` | 主要文字（标题、关键信息） |
| `--color-gray-600` | `#4A4A4A` | 次要文字（副标题、描述） |
| `--color-gray-400` | `#9A9A9A` | 辅助文字（时间、占位符、禁用） |
| `--color-gray-200` | `#C8C8C8` | 箭头、分割线图标 |
| `--color-gray-100` | `#F5F5F5` | 页面背景底色 |
| `--color-gray-50`  | `#FAFAFA` | 卡片内次级背景 |
| `--color-white`    | `#FFFFFF` | 卡片、弹窗、Tab Bar |
| `--color-border`   | `#F0F0F0` | 分割线、边框 |

### 功能色（Semantic）

| Token | Hex | 用途 |
|-------|-----|------|
| `--color-warning` | `#FF9500` | 待确认、即将到期 |
| `--color-warning-bg` | `#FFF3CD` | 待确认标签背景 |
| `--color-error` | `#FF3B30` | 拒绝、错误 |
| `--color-error-bg` | `#FFE8E8` | 错误标签背景 |
| `--color-success` | `#34C759` | 已完成 |
| `--color-info` | `#007AFF` | 信息提示 |

### 状态色速查（预约/出勤）

| 状态 | 标签背景 | 标签文字 | 左边框色 |
|------|---------|---------|---------|
| 待确认 | `#FFF3CD` | `#FF9500` | `#FF9500` |
| 已确认 | `#D8F3DC` | `#1B4332` | `#1B4332` |
| 已完成 | `#F0F0F0` | `#9A9A9A` | `#C8C8C8` |
| 已取消 | `#FFE8E8` | `#FF3B30` | `#FF3B30` |
| 缺课   | `#FFF3E0` | `#FF9500` | — |

---

## 三、字体系统

### 字体栈

```css
font-family: -apple-system, "PingFang SC", "Helvetica Neue", sans-serif;
```

### 字号规范

| 级别 | 字号 | 字重 | 行高 | 用途 |
|------|------|------|------|------|
| Display | 38px | 700 | 1.0 | 课时大数字 |
| H1 | 22px | 600 | 30px | 页面主标题 |
| H2 | 17px | 600 | 24px | Section标题 |
| H3 | 15px | 600 | 22px | 卡片标题、列表主行 |
| Body | 14px | 400 | 22px | 正文内容 |
| Small | 13px | 500 | 20px | 操作链接（"全部 ›"） |
| Caption | 12px | 400 | 18px | 辅助说明、时间 |
| Micro | 11px | 400 | 16px | 标签文字、过期提示 |
| Tab | 10px | 400 | — | Tab Bar文字 |

---

## 四、间距与圆角

### 间距系统（8px基准）

```
4px   极小间距：图标与文字
8px   小间距：卡片内元素间距
10px  卡片列表间距
12px  卡片内padding（紧凑型）
14px  卡片内padding（标准）
16px  页面横向padding、卡片标准内padding
20px  Section间距
24px  大模块间距
```

### 圆角系统

```
6px   小标签（Tag/Badge）
9px   图标背景块（如课程icon）
12px  标准卡片、列表项
14px  课时大卡片（Package Card）
20px  主按钮
全圆  头像、胶囊标签、圆点
```

---

## 五、核心组件规范

### 5.1 主按钮（Primary Button）

```
背景：#1B4332
文字：#FFFFFF，16px，600字重
高度：52px
圆角：20px
宽度：铺满父容器（移动端标准）
按下态：背景 #152E24，轻微缩放 scale(0.98)
禁用态：背景 #E0E0E0，文字 #9A9A9A
```

### 5.2 次级按钮（Secondary Button）

```
背景：#FFFFFF
边框：1.5px solid #1B4332
文字：#1B4332，16px，500字重
高度：52px，圆角20px
```

### 5.3 标准卡片（Card）

```
背景：#FFFFFF
圆角：12px
阴影：0 2px 10px rgba(0,0,0,0.05)
内边距：14px 16px
间距：卡片之间 8px
```

### 5.4 课时卡（Package Card）— 深色渐变

```
背景：linear-gradient(135deg, #1B4332 0%, #2D6A4F 100%)
圆角：14px
内边距：16px 18px
所有文字：#FFFFFF
套餐名：17px，600字重
课时数字：38px，700字重
类型标签：背景 rgba(255,255,255,0.18)，文字白色，11px
有效期：11px，opacity 0.6
```

### 5.5 即将上课行（Upcoming Card）

```
背景：#FFFFFF，圆角12px，阴影标准
左侧竖线：3px，颜色根据状态变化
图标区：38×38px，圆角9px，背景为状态色浅版
标题：14px，600，#1A1A1A
时间：12px，#9A9A9A
状态标签：11px，500，pill形，各状态颜色见状态色速查
```

### 5.6 教练卡片（Coach Card）— 横向滚动

```
背景：#FFFFFF，圆角12px，阴影标准
最小宽度：108px，内边距 13px 11px
头像：50×50px 圆形
  - 有图：显示真实照片（object-fit: cover）
  - 无图：主色渐变背景 + 姓氏文字（19px，白色，700字重）
教练名：13px，600，#1A1A1A
标签：背景 #D8F3DC，文字 #1B4332，10px，500字重，圆角6px
```

### 5.7 套餐列表项（Package Item）

```
背景：#FFFFFF，圆角12px，阴影标准，间距底部7px
图标区：48×48px，圆角9px，背景 #D8F3DC
名称：14px，600，#1A1A1A
描述：12px，#9A9A9A
类型标签：同教练标签样式
右箭头：14px，#C8C8C8
```

### 5.8 列表项（如教练列表页）

```
高度：68px
左侧头像：44px圆形（同5.6头像规则）
头像右间距：12px
名称：15px，600，#1A1A1A
简介：12px，#9A9A9A，超出省略
右侧箭头：#C8C8C8
底部分割线：1px #F0F0F0（不延伸到头像）
```

### 5.9 时段选择格（预约页）

```
高度：44px，圆角8px
网格：3列，间距8px
可选：背景 #F5F5F5，文字 #1A1A1A，14px，500
已选：背景 #1B4332，文字 #FFFFFF
不可选/已满：背景 #F5F5F5，文字 #C8C8C8
```

### 5.10 输入框

```
高度：52px
背景：#F5F5F5
圆角：12px
无边框，聚焦时出现 2px solid #1B4332 内描边
内边距：左右 16px
字号：16px，#1A1A1A
占位符：#9A9A9A
```

### 5.11 底部导航栏（Tab Bar）

```
高度：56px + 底部安全区
背景：#FFFFFF
顶部线：1px solid #F0F0F0
图标：22px
未激活：图标+文字均 #BBBBBB
激活：图标+文字均 #1B4332
```

### 5.12 角标（Unread Badge）

```
最小尺寸：18×18px 圆形
背景：#FF3B30（红色）
文字：白色，11px，700字重
位置：图标右上角，偏移 -4px -4px
```

### 5.13 段位展示卡

```
背景：linear-gradient(135deg, #1B4332 0%, #2D6A4F 100%)
圆角：14px，内边距 18px 20px
段位标识：22px，700，白色（如"3.0A"）
段位描述：13px，rgba(255,255,255,0.7)
进度条轨道：4px高，圆角，背景 rgba(255,255,255,0.2)
进度条填充：背景 #FFFFFF
五维雷达图：白色线条，填充 rgba(255,255,255,0.15)
```

---

## 六、Banner 规范

```
尺寸：375×200px（占满屏幕宽度）
内容：由管理员后台上传图片
底部渐变遮罩：linear-gradient(to top, rgba(0,0,0,0.45) 0%, transparent 100%)
机构名叠加：白色，19px，700字重，位于遮罩上方
轮播指示点：底部居中，激活点宽14px/圆角3px，非激活5px圆形
无图时降级：使用主色渐变背景 + 球场线条SVG装饰
```

---

## 七、页面背景与分层

```
页面底色：#F5F5F5（浅灰）
卡片：#FFFFFF（白）
→ 浅灰底 + 白卡片自然形成对比，无需加重阴影

内嵌次级背景（卡片内区域）：#FAFAFA
```

---

## 八、管理员端（PC）布局规范

```
左侧侧边栏
  宽度：240px，固定
  背景：#1A1A1A（深色）
  激活菜单项：背景 #1B4332，文字 #FFFFFF
  非激活菜单项：文字 #9A9A9A
  hover：背景 rgba(255,255,255,0.06)

右侧内容区
  顶部Header：白色，高度64px，底部1px分割线
  内容区padding：24px
  背景：#F5F5F5

数据表格
  行高：48px
  斑马纹：白/#FAFAFA交替
  表头：#F5F5F5背景，13px，600，#4A4A4A
  边框：1px #F0F0F0

Dashboard卡片
  白底，圆角12px，左侧4px竖线（主色）
  数字：28px，700，#1A1A1A
  标签：13px，#9A9A9A
```

---

## 九、图标方案

使用 **Lucide React**（开源，线性风格，与苹果SF Symbols气质接近）

```
导航栏图标：22px，strokeWidth 1.5
列表项图标：18px，strokeWidth 1.5
按钮内嵌图标：16px，strokeWidth 2
角标区域：12px
```

---

## 十、NutUI-React 主题配置

在 `app.scss` 中全局覆盖，统一组件样式：

```scss
:root {
  --nutui-brand-color: #1B4332;
  --nutui-brand-color-start: #1B4332;
  --nutui-brand-color-end: #2D6A4F;

  --nutui-title-color: #1A1A1A;
  --nutui-content-color: #4A4A4A;
  --nutui-assist-color: #9A9A9A;

  --nutui-background-color: #F5F5F5;
  --nutui-background-color2: #FAFAFA;
  --nutui-white: #FFFFFF;

  --nutui-button-border-radius: 20px;
  --nutui-input-border-radius: 12px;
  --nutui-border-color: #F0F0F0;
}
```

---

## 十一、动效规范

| 场景 | 动效 | 时长 |
|------|------|------|
| 页面切换 | 右滑进入 / 左滑退出 | 300ms ease |
| 底部弹窗 | 从底部滑入 | 280ms ease-out |
| 按钮点击 | scale(0.98) | 100ms |
| 骨架屏 → 内容 | fade in | 200ms |
| Tab 切换 | 无动画，直接切换 | — |

---

*文档版本：v1.0 · 对应配色方案A（深松绿 #1B4332）*
