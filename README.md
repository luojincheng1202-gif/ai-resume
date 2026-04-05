# AI 简历助手 · AI Resume Builder

[中文](#中文说明) | [English](#english)

---

## 中文说明

### 简介

AI 简历助手是一款**纯静态网页应用**，无需安装、无需注册、无需后端服务器。你的所有简历数据存储在本地浏览器，不上传任何服务器。

**核心理念**：建立一个「素材库」，把你所有的工作经历、项目、教育背景等内容存入其中。每次投递时，根据岗位要求筛选素材、组合生成针对性简历，并一键导出 PDF 或 Word。

### 主要功能

- **素材库管理** — 添加、编辑个人信息、教育经历、工作经历、项目经历、技能证书，支持中英文双语内容
- **JD 岗位匹配** — 粘贴职位描述，AI 自动分析关键词，为素材库中每条内容打相关度分数
- **12 款内置模板** — 经典、简约、商务、双栏、紧凑、优雅、创意、时间轴、技术、极简、粗体、学术
- **实时预览** — A4 尺寸实时预览，所见即所得
- **导出 PDF** — 一键导出高质量 PDF
- **导出 Word** — 一键导出 .docx 文件
- **AI 写作** — AI 辅助生成或优化简历内容（需配置 API Key）
- **AI 导入解析** — 上传已有简历文件（PDF/Word/JSON），AI 自动提取内容填入素材库
- **中英文切换** — 简历内容、模板标签均支持中英双语

### 快速开始

#### 方式一：直接使用在线版

访问部署好的网页即可，无需任何配置。https://splendid-starlight-b729a6.netlify.app/

#### 方式二：本地运行

1. 下载或克隆本仓库
2. 用浏览器直接打开 `index.html`，或通过任意静态文件服务器访问

```bash
# 使用 Python 启动本地服务（可选）
python -m http.server 8080
# 然后访问 http://localhost:8080
```

> 直接双击 `index.html` 也可运行（Chrome/Edge/Firefox 均支持）。

### 配置 AI 功能

点击右上角 **⚙ 设置**，填写 AI 服务信息：

| 字段 | 说明 |
|---|---|
| 模型提供商 | 选择你的 AI 服务商 |
| API Key | 填写对应平台的 API Key（仅存储在本地，不上传） |
| API Base URL | 留空使用默认地址，或填写代理地址 |
| 模型 | 可直接输入或点击推荐模型快速选择 |

**支持的 AI 服务商（浏览器直连）：**

| 服务商 | 推荐模型 | 获取 API Key |
|---|---|---|
| OpenAI | gpt-4o-mini | platform.openai.com |
| DeepSeek | deepseek-chat | platform.deepseek.com |
| Kimi (Moonshot) | moonshot-v1-8k | platform.moonshot.cn |
| MiniMax | abab6.5s-chat | api.minimax.chat |
| Google Gemini | gemini-1.5-flash | aistudio.google.com |

> **注意**：Anthropic Claude API 不支持浏览器直接调用（CORS 限制），请使用上述其他服务商，或自行搭建代理后填写代理地址。

### 使用流程

1. **建立素材库** — 在左侧面板点击「＋ 添加素材」，或导入已有简历文件
2. **分析岗位** — 粘贴目标岗位 JD，点击「分析」，素材库各条目会显示匹配分数
3. **组建简历** — 将高分素材拖拽到右侧简历区域，或点击素材卡片上的「＋」按钮
4. **选择模板** — 点击导航栏的「模板」图标，预览并选择喜欢的模板
5. **导出** — 点击「导出 PDF」或「导出 Word」下载简历

### 内置模板一览

| 中文名 | 英文名 | 适用场景 |
|---|---|---|
| 经典 | Classic | 传统正式风格，适合大多数岗位 |
| 简约 | Modern | 简洁现代，适合互联网行业 |
| 商务 | Executive | 深蓝配色，适合管理岗位 |
| 双栏 | Sidebar | 左栏暗色+右栏内容，视觉清晰 |
| 紧凑 | Compact | 小字紧凑，适合内容丰富的候选人 |
| 优雅 | Elegant | 衬线字体+金色装饰，精致典雅 |
| 创意 | Creative | 渐变色彩，适合设计/创意岗位 |
| 时间轴 | Timeline | 左侧时间轴，适合经历丰富者 |
| 技术 | Technical | 终端风格，适合开发工程师 |
| 极简 | Clean | 超简洁双栏布局，干净清爽 |
| 粗体 | Bold | 超粗标题，强对比度，当代风格 |
| 学术 | Academic | 正式排版，适合科研/教职申请 |

### 数据与隐私

- 所有数据（素材库、简历内容、API Key）均存储在**本地浏览器的 localStorage** 中
- 不依赖任何后端服务器，数据不会上传
- AI 功能直接从浏览器调用第三方 API，调用记录由对应服务商保存
- 清除浏览器数据会删除所有简历数据，建议定期使用「设置 → 导出数据备份」

### 浏览器要求

需要支持 `<script type="importmap">` 的现代浏览器：

- Chrome 89+（推荐）
- Edge 89+
- Firefox 108+
- Safari 16.4+

### 自托管部署

本项目为纯静态网站，无需任何服务器端配置：

**GitHub Pages：**
```bash
# 在仓库 Settings → Pages 中选择 main 分支 (root) 即可
```


---

## English

### Introduction

AI Resume Builder is a **fully static web application** — no installation, no registration, no backend server required. All your resume data is stored in your local browser and never uploaded anywhere.

**Core concept**: Build a "material library" with all your work experience, projects, education, and skills. For each job application, filter relevant materials, compose a targeted resume, and export it as PDF or Word in one click.

### Features

- **Material Library** — Add and edit personal info, education, work experience, projects, and skills with bilingual CN/EN content
- **JD Matching** — Paste a job description, AI analyzes keywords and scores each material by relevance
- **12 Built-in Templates** — Classic, Modern, Executive, Sidebar, Compact, Elegant, Creative, Timeline, Technical, Clean, Bold, Academic
- **Live Preview** — Real-time A4-size preview, what you see is what you get
- **Export PDF** — Download high-quality PDF in one click
- **Export Word** — Download .docx file in one click
- **AI Writing** — AI-assisted content generation and optimization (requires API Key)
- **AI Import** — Upload existing resumes (PDF/Word/JSON), AI extracts and populates your material library
- **Bilingual** — Full Chinese and English support for both content and UI

### Quick Start

#### Option 1: Use the Online Version

Visit the deployed URL directly — no setup needed.https://splendid-starlight-b729a6.netlify.app/

#### Option 2: Run Locally

1. Download or clone this repository
2. Open `index.html` directly in your browser, or serve it with any static file server

```bash
# Optional: start a local server with Python
python -m http.server 8080
# Then visit http://localhost:8080
```

> Double-clicking `index.html` also works in Chrome, Edge, and Firefox.

### Configuring AI Features

Click **⚙ Settings** (top right) and enter your AI service details:

| Field | Description |
|---|---|
| Provider | Select your AI service provider |
| API Key | Enter your API key (stored locally only, never uploaded) |
| API Base URL | Leave blank for default, or enter a proxy URL |
| Model | Type a model name or click a suggested model |

**Supported AI Providers (browser-compatible):**

| Provider | Recommended Model | Get API Key |
|---|---|---|
| OpenAI | gpt-4o-mini | platform.openai.com |
| DeepSeek | deepseek-chat | platform.deepseek.com |
| Kimi (Moonshot) | moonshot-v1-8k | platform.moonshot.cn |
| MiniMax | abab6.5s-chat | api.minimax.chat |
| Google Gemini | gemini-1.5-flash | aistudio.google.com |

> **Note**: Anthropic Claude API does not support direct browser calls (CORS restriction). Use one of the providers above, or set up a proxy and enter its URL in the Base URL field.

### How to Use

1. **Build your library** — Click "＋ Add Material" in the left panel, or import an existing resume file
2. **Analyze the job** — Paste a job description (JD) and click "Analyze" — each material will show a match score
3. **Build your resume** — Drag high-scoring materials to the resume panel on the right, or click "＋" on a material card
4. **Choose a template** — Click the template icon in the navigation bar to preview and select a style
5. **Export** — Click "Export PDF" or "Export Word" to download your resume

### Template Gallery

| Name | Style | Best For |
|---|---|---|
| Classic | Traditional serif | Most industries |
| Modern | Clean sans-serif | Tech / Internet |
| Executive | Deep navy header | Management roles |
| Sidebar | Dark left column | Visual hierarchy |
| Compact | Tight small text | Content-dense resumes |
| Elegant | Serif + gold accents | Luxury / Finance |
| Creative | Gradient color stripe | Design / Creative |
| Timeline | Left timeline track | Career-rich profiles |
| Technical | Terminal / code aesthetic | Software Engineers |
| Clean | Ultra-minimal two-column | Any industry |
| Bold | Heavy black headings | Modern / Bold personality |
| Academic | Formal centered layout | Research / Academia |

### Data & Privacy

- All data (materials, resume content, API keys) is stored in your **browser's localStorage**
- No backend server — nothing is ever uploaded
- AI features call third-party APIs directly from your browser; those call logs are held by the respective provider
- Clearing browser data will erase all resume data — use "Settings → Export Backup" periodically

### Browser Requirements

Requires a modern browser with `<script type="importmap">` support:

- Chrome 89+ (recommended)
- Edge 89+
- Firefox 108+
- Safari 16.4+

### Self-Hosting

This is a pure static site — no server-side configuration needed:

**GitHub Pages:**
```bash
# In repository Settings → Pages, select the main branch (root)
```

### Tech Stack

| Concern | Technology |
|---|---|
| Framework | Vue 3 (CDN ESM, no build step) |
| Styling | Tailwind CSS (CDN) |
| PDF Export | html2canvas + jsPDF |
| Word Export | html-docx-js |
| Storage | Browser localStorage |
| AI | Multi-provider REST API (browser direct) |

### License

MIT License — free to use, modify, and distribute.

