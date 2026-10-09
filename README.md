# DeepSeek Harness Zotero 学术研究增强插件 (dsh-zotero-academic)

专为 **DeepSeek Harness (dsh)** 打造的 Zotero 学术知识库深度推理、向量语义检索与论文精读伴生引擎。

本项目在保留科研核心能力（本地向量计算、Passage 语义检索、PDF 原文解析）的基础上，深度重构并吸收社区优秀设计，采用**双轨数据驱动架构（Dual-Rail Architecture）**、**Cordis 标准服务模式**、**RRF 混合检索**与 **DSH 原生 Web UI 交互卡片**。

---

## 核心特色与学术护城河

1. **RRF 混合检索算法（Reciprocal Rank Fusion Hybrid Search）**：
   * 将本地 SQLite 高速关键词匹配与 ChromaDB 向量语义检索进行倒数排名融合（RRF）。
   * 兼顾专有名词缩写、人名年份的“精确命中”与自然语言假设推导的“概念泛化”。
2. **纯本地高精度 Embedding 与 ONNX Runtime 加速**：
   * 默认采用开源学术模型 `Qwen/Qwen3-Embedding-0.6B`（免 API Key、免外部 Ollama 服务，100% 数据隐私保护）。
   * 架构内置 `onnx` 推理后端，支持纯 CPU / 低显存环境下极速向量化。
3. **PDF 原文解析与按页精读（Deep Reading & Page Slicing）**：
   * 基于 PyMuPDF 直接从本地 PDF 解析原始学术文本，支持 `start_page` 与 `end_page` 分片精读与划线笔记提取。
4. **双轨数据架构（Dual-Rail Architecture）**：
   * **深轨（Python 引擎 - 端口 23125）**：专精高强度计算——向量化嵌入、ChromaDB 检索、PDF 原始文本解析、DOI/arXiv 外部收录及 SQLite 极速直读。
   * **快轨（Zotero Local API - 端口 23119）**：接入 Zotero 7/10 原生 REST 接口——专职合集层级树浏览（Collections）与多格式学术引用导出（BibTeX/CSL）。
5. **Harness `ctx.jobs` 长任务调度适配**：
   * 向量索引构建与文献大批量 Embedding 自动连接 Harness 后台任务引擎，进度流式上报，彻底解决轮次超时与上下文污染问题。
6. **DSH 原生 Web UI 交互卡片（Toolviews）**：
   * 为 `zotero_hybrid_search`、`zotero_read_paper`、`zotero_export` 定制轻量折叠式交互卡片，支持展示匹配徽标、相关度分值条、代码高亮与一键复制。

---

## 架构概览

```
+-------------------------------------------------------------------------------+
|                       DeepSeek Harness 运行时 (dsh)                            |
|                                                                               |
|   +-----------------------------------------------------------------------+   |
|   |                  dsh-zotero-academic (Cordis Service)                 |   |
|   |                                                                       |   |
|   |  • ctx.zoteroAcademic: 统一服务接缝                                    |   |
|   |  • ctx.jobs: 耗时向量化任务后台化调度                                   |   |
|   |  • Toolviews: Web UI 原生交互卡片 (dist/client.js)                    |   |
|   |  • SidecarManager: 看门狗自动拉起/自愈 Python 进程                     |   |
|   +-------------------+-------------------------------+-------------------+   |
+-----------------------|-------------------------------|-----------------------+
                        | (快轨: 标准元数据与学术导出)     | (深轨: 混合检索/PDF解析)
                        | 本地 REST API (127.0.0.1:23119)| 内部 REST (127.0.0.1:23125)
+-----------------------v-----------------------+ +-----v-----------------------+
|          Zotero 7/10 Desktop 原生服务          | |   Python Academic & Semantic Engine |
|                                               | |                                     |
|  • 合集层级树 (Collections)                   | |  • 混合检索: RRF BM25 + 向量融合   |
|  • 导出引用: BibTeX, CSL-JSON, APA, IEEE      | |  • 本地 Embedding: Qwen3-0.6B/ONNX  |
|  • 官方数据校验与通信权限握手                 | |  • 文献解析: PyMuPDF 原文按页切片   |
|                                               | |  • 文献收录: DOI / arXiv / BibTeX   |
+-----------------------------------------------+ +-------------------------------------+
```

---

## 提供的 9 大核心学术工具

| 工具名称 | 驱动轨道 | 功能说明 | 核心参数 |
| :--- | :--- | :--- | :--- |
| `zotero_hybrid_search` *(✨核心)* | 深轨 (Chroma + SQL) | **RRF 混合检索**：融合关键词频与向量语义，输出带相关度得分与匹配徽标的证据段落 | `query` (必需), `limit`, `mode` ("hybrid"/"semantic"/"keyword") |
| `zotero_semantic_search` | 深轨 (ChromaDB) | **纯向量语义检索**：用自然语言或研究假设匹配最相关的论文段落证据（带得分与页码） | `query` (必需), `limit` (默认 5) |
| `zotero_search` | 深轨 (SQLite 直读) | **极速关键词检索**：在本地数据库中秒级查找标题、作者、年份与摘要 | `query` (必需), `limit` (默认 10) |
| `zotero_read_paper` | 深轨 (PyMuPDF) | **PDF 原文按页阅读**：提取指定论文的元数据及 PDF 原始文本，支持指定页码区间 | `item_key` (必需), `start_page`, `end_page` |
| `zotero_get_annotations` | 深轨 | **高亮与划线笔记**：读取读者在 Zotero 内为该文献添加的高亮文本、便签与批注 | `item_key` (必需) |
| `zotero_export` *(✨新增)* | 快轨 (Local API) | **学术引用导出**：输出标准 APA/IEEE 格式引用、参考文献列表，或 BibTeX/CSL-JSON | `item_keys` (必需), `format`, `style` |
| `zotero_browse` *(✨新增)* | 快轨 (Local API) | **文献合集树浏览**：列出个人文献库的所有合集（Collections）、父子层级与文献篇数 | `target` ("collections") |
| `zotero_add_paper` | 深轨 | **文献智能导入**：输入 DOI、arXiv 链接或 BibTeX 自动抓取元数据并收录入库 | `identifier` (必需) |
| `zotero_sync_database` | 深轨 + Jobs | **向量库状态与增量构建**：查看已向量化篇数，或通过后台 Job 增量构建未索引文献 | `action` ("status" / "update"), `run_in_background` |

---

## 快速上手与一键环境配置

### 1. 前置依赖
* **Zotero 7+**：打开桌面端，进入「设置」→「高级」，勾选「允许此计算机上的其他应用程序与 Zotero 通信」（提供 23119 快轨服务）。
* **Node.js 22+** 与 **DeepSeek Harness** 已就绪。

### 2. 一键自动初始化环境
* **Windows (PowerShell)**:
  ```powershell
  .\scripts\setup-env.ps1
  ```
* **Linux / macOS (Bash)**:
  ```bash
  chmod +x ./scripts/setup-env.sh && ./scripts/setup-env.sh
  ```

脚本会自动检测 `uv` 或虚拟环境，安装所有 Python 依赖与 Node.js 依赖，并自动编译主程序与 Web UI 客户端。

### 3. 运行测试套件
```bash
# 运行 TypeScript / Node.js 单元测试
npm test

# 运行 Python 引擎核心测试
.\.venv\Scripts\python.exe -m unittest tests/test_core.py
```

### 4. 在 DeepSeek Harness 中加载
通过 `--patch` 覆盖层启动 DeepSeek Harness：
```bash
cd /path/to/deepseek-harness
pnpm dsh web --patch C:\Users\panxi\Desktop\dsh-zotero-academic\cordis.yml
```

启动后：
1. 插件会自动通过 Cordis 生命周期拉起后台 Python 守护进程（默认端口 `23125`）。
2. 同时自动检测 Zotero Desktop 桌面端连通性（默认端口 `23119`）。
3. 在 Harness Web 界面向 DeepSeek Agent 提问，Agent 即可调用 9 大学术工具，并以原生交互卡片呈现结果！

---

## 配置说明

在 DeepSeek Harness Web UI 插件设置面板中提供以下配置项（基于 Schemastery）：

* `pythonPath`：Python 可执行文件路径（默认 `python`，可指定虚拟环境绝对路径）。
* `port`：内部 Python 语义引擎端口（默认 `23125`）。
* `autoStart`：是否随插件自动拉起后台 Python 守护进程（默认 `true`）。
* `zoteroDbPath`：自定义 `zotero.sqlite` 数据库路径（留空则自动探测系统默认位置）。
* `huggingfaceModel`：本地 sentence-transformers 模型名称（默认 `Qwen/Qwen3-Embedding-0.6B`）。
* `localApiPort`：Zotero 桌面端 Local API 端口（默认 `23119`）。
* `enableJobs`：是否启用 Harness `ctx.jobs` 后台长任务调度（默认 `true`）。

---

## 许可证

[MIT](./LICENSE)
