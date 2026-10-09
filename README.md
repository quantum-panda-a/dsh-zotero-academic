# DeepSeek Harness Zotero 学术研究增强插件 (dsh-zotero-academic)

<p align="center">
  <img src="https://img.shields.io/badge/version-1.0.0-blue.svg" alt="Version 1.0.0" />
  <img src="https://img.shields.io/badge/license-MIT-green.svg" alt="License MIT" />
  <img src="https://img.shields.io/badge/node-%3E%3D22.0.0-brightgreen.svg" alt="Node >= 22" />
  <img src="https://img.shields.io/badge/python-%3E%3D3.10-blue.svg" alt="Python >= 3.10" />
  <img src="https://img.shields.io/badge/Cordis-Compatible-orange.svg" alt="Cordis Compatible" />
  <img src="https://img.shields.io/badge/Privacy-100%25%20Local-success.svg" alt="100% Local Privacy" />
</p>

专为 **DeepSeek Harness (dsh)** 打造的工业级 Zotero 学术知识库深度推理、向量语义检索与论文精读伴生引擎。

在严谨的科研论证与文献综述场景中，传统通用检索常面临学术专有名词未命中、长篇 PDF 关键论点提取受限以及外部知识云端传输带来的隐私泄露风险。本项目基于**双轨数据驱动架构（Dual-Rail Architecture）**与 **Cordis 插件规范**构建，打通了本地向量计算、倒数排名融合（RRF）混合检索、PDF 原文切片精读与 Zotero 原生学术导出能力，并提供 DeepSeek Harness 原生 Web UI 交互卡片，为学术 Agent 提供确定、可溯源、高精度的本地文献交互底座。

---

## 核心特性与技术优势

### 1. RRF 混合检索算法（Reciprocal Rank Fusion Hybrid Search）
* **关键词频与密集向量双重对齐**：融合本地 SQLite 高性能关键词检索（精确匹配作者、年份、缩写、专业术语）与 ChromaDB 向量语义检索（捕捉自然语言研究假设与概念关联）。
* **倒数排名融合**：基于标准 RRF 算法动态权衡排名，有效消除单一算法在专有名词盲区或概念漂移时的局限，显著提升学术检索的召回率（Recall）与精确率（Precision）。

### 2. 纯本地高精度 Embedding 与 ONNX Runtime 加速
* **学术优化嵌入模型**：默认搭载 `Qwen/Qwen3-Embedding-0.6B`，对多语言学术论著及中文社科/理工文献具备优异的表征能力。
* **零外部服务依赖**：无需申请商业 API Key，亦无需依赖外部 Ollama 后台，100% 在本地执行计算，确保未发表手稿与私人学术笔记的绝对隐私。
* **推理加速支持**：底层集成 ONNX Runtime 推理引擎，在纯 CPU 及低显存环境下均能保持高吞吐向量化。

### 3. PDF 原文解析与按页切片精读（Deep Reading & Page Slicing）
* **原文字节级精准解析**：基于 PyMuPDF (fitz) 高保真解析文献 PDF，避免文本错位或字符丢失。
* **按页按需精读**：支持 `start_page` 与 `end_page` 精准切片阅读，彻底解决长篇专著导入上下文窗口导致的 Token 浪费与注意力稀释。
* **划线批注联动**：直接提取文献在 Zotero 内的高亮标记、评论笔记与便签，辅助 Agent 理解读者的过往阅读思考。

### 4. 双轨数据驱动架构（Dual-Rail Architecture）
* **深轨（Python 计算引擎 · 默认端口 23125）**：承载高算力密集型任务——文本分块、向量化嵌入、ChromaDB 存储、PyMuPDF 解析、DOI/arXiv 外部智能收录及本地 SQLite 极速检索。
* **快轨（Zotero Desktop Local API · 默认端口 23119）**：接入 Zotero 7/10 官方内置 REST 接口——保障文献分类树（Collections）浏览、多格式引用导出（APA、IEEE、BibTeX、CSL-JSON）的官方规范性。
* **进程守护与自愈机制**：内置 `SidecarManager` 看门狗机制，随 Cordis 生命周期自动托管 Python 后台进程，提供健康检查轮询与异常崩溃自动恢复。

### 5. Harness `ctx.jobs` 长任务后台调度
* **无阻塞文献向量化**：大批量文献构建与更新向量索引接入 Harness 后台任务系统，流式上报进度百分比与处理状态，避免会话单轮请求超时与上下文污染。

### 6. DSH 原生 Web UI 交互卡片（Interactive Toolviews）
* 为 `zotero_hybrid_search`、`zotero_read_paper`、`zotero_export` 定制轻量折叠式交互卡片组件，支持多维度匹配徽标展示、相似度分值可视化、代码块高亮与一键学术引用复制。

---

## 系统架构

```
+-------------------------------------------------------------------------------+
|                       DeepSeek Harness 运行时环境 (dsh)                        |
|                                                                               |
|   +-----------------------------------------------------------------------+   |
|   |                  dsh-zotero-academic (Cordis Service)                 |   |
|   |                                                                       |   |
|   |  • ctx.zoteroAcademic: 统一学术服务接入接口                           |   |
|   |  • ctx.jobs: 向量化耗时任务后台异步流式调度                           |   |
|   |  • Toolviews: Web UI 原生交互卡片渲染 (dist/client.js)                |   |
|   |  • SidecarManager: Python 计算引擎守护与健康自愈监控                  |   |
|   +-------------------+-------------------------------+-------------------+   |
+-----------------------|-------------------------------|-----------------------+
                        | 快轨: 标准元数据与学术引用导出   | 深轨: 混合检索/向量计算/PDF解析
                        | 本地 REST API (127.0.0.1:23119)| 内部 REST API (127.0.0.1:23125)
+-----------------------v-----------------------+ +-----v-----------------------+
|          Zotero 7/10 Desktop 官方服务         | |    Python Academic & Semantic Engine|
|                                               | |                                     |
|  • 文献合集层级树 (Collections)               | |  • RRF 混合检索: BM25 + 向量语义融合|
|  • 学术引用格式化: BibTeX, CSL, APA, IEEE     | |  • 本地向量嵌入: Qwen3-0.6B / ONNX  |
|  • 官方沙箱通信权限握手与一致性校验           | |  • 文献解析: PyMuPDF 原文按页切片   |
|                                               | |  • 文献智能录入: DOI / arXiv 解析   |
+-----------------------------------------------+ +-------------------------------------+
```

---

## 学术工具集参考 (Tool Reference)

插件为 DeepSeek Agent 注册了 9 项核心学术工具，覆盖文献全生命周期的检索、精读、收录与引用导出：

| 工具标识 | 运行轨道 | 核心能力说明 | 关键参数说明 |
| :--- | :--- | :--- | :--- |
| `zotero_hybrid_search` | 深轨 (Chroma + SQL) | **RRF 混合检索**：融合关键词与向量语义，输出带相关度得分与匹配标签的论据段落 | `query` *(string)*, `limit` *(int, 默认 5)*, `mode` *(hybrid/semantic/keyword)* |
| `zotero_semantic_search`| 深轨 (ChromaDB) | **向量语义检索**：使用自然语言假设或研究问题匹配学术文献库中的相关段落 | `query` *(string)*, `limit` *(int, 默认 5)* |
| `zotero_search` | 深轨 (SQLite 直读) | **高速关键词匹配**：在本地数据库中秒级检索文献标题、作者、发表年份与摘要 | `query` *(string)*, `limit` *(int, 默认 10)* |
| `zotero_read_paper` | 深轨 (PyMuPDF) | **PDF 原文按页精读**：提取指定论文元数据及 PDF 原始文本，支持按页码区间切片阅读 | `item_key` *(string)*, `start_page` *(int)*, `end_page` *(int)* |
| `zotero_get_annotations`| 深轨 | **划线与高亮批注提取**：读取文献在 Zotero 内所有高亮文本、便签批注与划线笔记 | `item_key` *(string)* |
| `zotero_export` | 快轨 (Local API) | **标准化引用导出**：输出标准 APA/IEEE 格式引文，或导出 BibTeX / CSL-JSON 条目 | `item_keys` *(array)*, `format` *(bibtex/csljson/bibliography)*, `style` *(apa/ieee)* |
| `zotero_browse` | 快轨 (Local API) | **文献合集树层级浏览**：读取用户文献库的合集架构、层级嵌套关系及各分类文献计数 | `target` *(collections)* |
| `zotero_add_paper` | 深轨 | **文献智能收录入库**：根据 DOI、arXiv 编号或 BibTeX 文本抓取元数据并收录入库 | `identifier` *(string)* |
| `zotero_sync_database` | 深轨 + Jobs | **向量库状态与增量索引**：查询向量库统计数据，或触发后台任务增量构建向量索引 | `action` *(status/update)*, `run_in_background` *(bool)* |

---

## 快速上手与部署安装

### 1. 环境前置依赖
* **操作系统**：Windows 10/11、macOS (Apple Silicon / Intel)、Linux (x86_64 / arm64)。
* **Node.js**：`>= 22.0.0`，推荐使用 `pnpm` 作为包管理工具。
* **Python**：`>= 3.10`（推荐 3.12），推荐安装 `uv` 获得极速包安装体验。
* **Zotero Desktop**：Zotero 7 或 Zotero 10。
  * *配置说明*：打开 Zotero 桌面端，进入「设置（Preferences）」→「高级（Advanced）」，勾选「允许此计算机上的其他应用程序与 Zotero 通信（Allow other applications on this computer to communicate with Zotero）」，开放 23119 本地通信端口。

### 2. 初始化项目环境

我们提供了自动化初始化脚本，亦支持标准手动分步安装：

#### 方案 A：使用一键自动化脚本（推荐）
* **Windows (PowerShell)**:
  ```powershell
  .\scripts\setup-env.ps1
  ```
* **Linux / macOS (Bash)**:
  ```bash
  chmod +x ./scripts/setup-env.sh && ./scripts/setup-env.sh
  ```
> 脚本将自动检测 `uv` 或虚拟环境，安装 Python 与 Node.js 全部依赖，并编译主程序与 Web 客户端资源包。

#### 方案 B：手动分步安装（适用于 CI/CD 或自定义环境）
```bash
# 1. 创建并激活 Python 虚拟环境
python -m venv .venv

# Windows 激活:
.\.venv\Scripts\activate
# Linux / macOS 激活:
source .venv/bin/activate

# 2. 安装 Python 核心引擎依赖
pip install --upgrade pip
pip install -e .

# 3. 安装 Node.js 依赖并编译项目
npm install
npm run build
```

---

## 在 DeepSeek Harness 中安装与使用

本项目全面支持在 **DeepSeek Harness Desktop (桌面客户端)** 以及 **DeepSeek Harness CLI / 源码环境** 中部署使用。

### 场景一：在 DeepSeek Harness Desktop 客户端中使用（推荐日常使用）

#### 1. 前置环境就绪
* 确保已按照上方说明完成插件本地初始化（`.\scripts\setup-env.ps1` 或 `./scripts/setup-env.sh`），项目根目录下已生成 `dist` 运行产物（含 `dist/index.js` 和 `dist/client.js`），并创建了 Python 虚拟环境。
* 打开 **Zotero 桌面端**（Zotero 7 或更高版本），进入「设置 (Preferences)」→「高级 (Advanced)」，勾选「允许此计算机上的其他应用程序与 Zotero 通信」，保持 Zotero 在后台运行。

#### 2. 在桌面端中加载本地插件
1. 启动 **DeepSeek Harness Desktop** 客户端。
2. 点击界面侧边栏或设置中心中的 **「插件管理 (Plugins / Extensions)」**。
3. 点击页面右上角的 **「加载本地插件」**（或 **「Load Local Plugin / Add from Directory」**）。
4. 在弹出的系统文件选择器中，选择本插件的项目根目录（即包含 `package.json` 的目录，例如 `C:\path\to\dsh-zotero-academic` 或 `/path/to/dsh-zotero-academic`）。
5. 成功导入后，列表中将展示 **`dsh-zotero-academic`**，状态为已激活（Active / Enabled）。

#### 3. 配置 Python 解释器路径（关键步骤）
由于 DSH 桌面端在独立沙箱中运行，通常无法自动读取虚拟环境的环境变量，建议在可视化面板中显式指定 Python 解释器：
1. 在 DSH Desktop 插件列表中，找到 `dsh-zotero-academic`，点击右侧的 **「设置 / 齿轮图标」** 打开配置面板。
2. 检查并设置核心配置项：
   * **`pythonPath`**：填入虚拟环境中的 Python 可执行文件绝对路径：
     * **Windows 环境示例**：`C:\path\to\dsh-zotero-academic\.venv\Scripts\python.exe`（请替换为您机器上的实际绝对路径）
     * **Linux / macOS 环境示例**：`/path/to/dsh-zotero-academic/.venv/bin/python`
     * *(注：若宿主机全局系统 Python 已安装了 PyMuPDF、ChromaDB 等全部依赖，可直接保持默认值 `python`)*
   * **`autoStart`**：保持开启（`true`），DSH 启动时将自动在后台随插件生命周期拉起 Python 语义引擎守护进程。
   * **`port`**：保持默认 `23125`（内部语义计算引擎端口）。
   * **`localApiPort`**：保持默认 `23119`（对应 Zotero Desktop 端口）。
3. 点击 **保存配置**，插件将自动完成看门狗初始化并与 Zotero 完成握手连接。

#### 4. 对话体验与学术提示词示例
在 DSH 桌面端中新建或打开对话，向 DeepSeek Agent 发起学术文献提问，Agent 将自动调用学术工具并在聊天窗口中渲染**专属交互卡片（Toolviews）**：

* **RRF 混合向量检索（展示匹配徽标、相关度评分条与证据段落）**：
  > “帮我在 Zotero 文献库中检索关于‘大语言模型强化学习优化算法’的相关论据段落。”
  > 
  > ➔ Agent 自动调用 `zotero_hybrid_search`，卡片内可视化展示匹配模式徽标（Hybrid/Semantic/Keyword）、相关度分值条与证据展开预览。

* **PDF 原文按页切片精读**：
  > “帮我精读论文 [文献Key] 的第 3 到第 5 页，重点提取其系统架构与对比实验设置。”
  > 
  > ➔ Agent 自动调用 `zotero_read_paper`，按页切片提取原文，避免长篇大作溢出上下文窗口。

* **学术引用格式化导出（支持一键复制）**：
  > “将刚才命中的文献条目导出为标准 APA 格式引用，并附带 BibTeX 条目。”
  > 
  > ➔ Agent 自动调用 `zotero_export`，卡片内提供带有语法高亮与一键复制按钮的引用结果。

* **合集层级树与向量库同步**：
  > “列出我当前 Zotero 所有的文献合集目录结构。”
  > 
  > “检查当前本地向量库的状态，并开始为未索引的文献构建向量。”

---

### 场景二：在 DeepSeek Harness CLI / 源码环境中加载

#### 方式 1：通过 `--patch` 覆盖层启动（推荐本地开发与测试）

在 DeepSeek Harness 运行时中，通过 `--patch` 参数加载本插件的配置覆盖层：

```bash
# 进入 DeepSeek Harness 项目目录
cd /path/to/deepseek-harness

# 使用 --patch 参数指向 dsh-zotero-academic 目录下的 cordis.yml
pnpm dsh web --patch /path/to/dsh-zotero-academic/cordis.yml

# 示例（Windows 环境）:
# pnpm dsh web --patch C:\path\to\dsh-zotero-academic\cordis.yml

# 示例（类 Unix 环境）:
# pnpm dsh web --patch ~/path/to/dsh-zotero-academic/cordis.yml
```

#### 方式 2：作为工作区/模块依赖加载（推荐生产部署）

若已将本插件作为依赖引入 Harness 工作区：

```bash
# 1. 在 Harness 根目录链接本地包
pnpm link /path/to/dsh-zotero-academic

# 2. 在 Harness 的主配置文件（cordis.yml）中添加插件配置项：
# - insert:
#     - id: zotero-academic
#       name: dsh-zotero-academic
```

### 启动与健康检查验证
1. **Python 引擎就绪**：插件随生命周期自动拉起后台守护进程，访问 `http://127.0.0.1:23125/health` 应返回 `{"status": "ok"}`。
2. **Zotero 快轨就绪**：插件启动时会自动检测本地 Zotero 7/10 通信端口（`http://127.0.0.1:23119`）。
3. **Agent 交互就绪**：向 Agent 发送文献检索指令，确认能正常输出折叠卡片及检索结果。

---

## 插件配置项 (Configuration)

支持在 DeepSeek Harness 插件控制面板或配置文件中进行自定义调整（基于 Schemastery 规范）：

| 配置项 | 类型 | 默认值 | 说明 |
| :--- | :--- | :--- | :--- |
| `pythonPath` | `string` | `"python"` | Python 可执行程序路径（可指定为虚拟环境路径，如 `.venv/bin/python`） |
| `port` | `number` | `23125` | 内部 Python 语义计算引擎服务监听端口 |
| `autoStart` | `boolean` | `true` | 是否随插件生命周期自动启动与回收 Python 守护进程 |
| `zoteroDbPath` | `string` | `""` | 自定义 `zotero.sqlite` 数据库文件路径（留空则自动检索操作系统标准路径） |
| `huggingfaceModel` | `string` | `"Qwen/Qwen3-Embedding-0.6B"` | 本地用于 sentence-transformers 的学术 Embedding 模型标识 |
| `localApiPort` | `number` | `23119` | Zotero Desktop 原生 Local API 端口 |
| `enableJobs` | `boolean` | `true` | 是否启用 Harness `ctx.jobs` 后台异步流式长任务调度 |

---

## 开发与自动化测试 (Development & Testing)

本项目提供严谨的跨平台单元测试与类型校验流程：

### 1. 运行 Node.js / TypeScript 测试套件
```bash
# 执行单元测试
npm test

# 执行 TypeScript 静态类型校验
npm run typecheck
```

### 2. 运行 Python 计算引擎测试
```bash
# 激活虚拟环境后运行测试套件
python -m unittest discover tests

# 或使用 pytest（如已安装）:
pytest tests/
```

### 3. 构建发布产物
```bash
# 编译 TypeScript 主程序与浏览器端 Web UI 交互组件 (dist/client.js)
npm run build
```

---

## 常见问题与排查指南 (Troubleshooting)

<details>
<summary><b>Q1: 报错提示无法连接到 Zotero 桌面端（端口 23119 连接被拒绝）？</b></summary>

* 请确保 Zotero 客户端（版本 7 或更高）已处于运行状态。
* 进入 Zotero「设置」→「高级」，确保已勾选「允许此计算机上的其他应用程序与 Zotero 通信」。
* 在终端执行 `curl http://127.0.0.1:23119` 验证本地 API 是否正常响应。
</details>

<details>
<summary><b>Q2: Python 守护进程启动超时或端口冲突？</b></summary>

* 若端口 `23125` 已被其他服务占用，可在插件配置项中修改 `port` 为其他空闲端口。
* 若使用的是独立虚拟环境，可在配置中显式指定 `pythonPath`（例如 Windows 下填写绝对路径，类 Unix 下填写 `.venv/bin/python`）。
* 可通过启动日志查看 Python 报错详情。
</details>

<details>
<summary><b>Q3: 首次执行向量化时下载模型缓慢？</b></summary>

* 本地 Embedding 默认从 HuggingFace 自动下载 `Qwen/Qwen3-Embedding-0.6B`。
* 在网络受限环境中，可设置环境变量 `HF_ENDPOINT=https://hf-mirror.com`，或预先下载模型权重至本地目录，并将配置项 `huggingfaceModel` 设置为本地模型绝对路径。
</details>

<details>
<summary><b>Q4: SQLite 数据库出现锁定（Database is locked）？</b></summary>

* 插件内置对 `zotero.sqlite` 的只读 WAL（Write-Ahead Logging）连接策略，保障即使在 Zotero 桌面端高频写入时，检索端也不会发生数据库写入死锁。
</details>

---

## 安全与隐私声明 (Security & Privacy)

* **100% 本地运算原则**：所有向量计算、文献解析及数据库检索均在宿主机本地环境执行，绝无任何文献内容或向量数据上传至第三方云端。
* **安全沙箱握手**：快轨通信严格遵循 Zotero 桌面端本地通信授权规范，保护文献元数据安全。

---

## 许可证 (License)

本项目采用 [MIT 许可证](./LICENSE) 开源发布。
