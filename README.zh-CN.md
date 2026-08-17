# MeiliSearch Panel

MeiliSearch Panel 是一个基于 Web 的 MeiliSearch 实例管理面板。提供直观的界面用于监控索引、管理文档与 API 密钥、查看任务、调优索引设置以及执行搜索。

## 功能特性

- **多实例管理** — 保存多个 Meilisearch 连接，一键切换，实时健康状态指示
- **实例概览** — 实例版本、SDK 版本、数据库大小、文档总数、各索引索引状态
- **索引管理** — 创建 / 删除索引，查看详情，实时统计与字段分布
- **文档查看器** — 浏览或搜索文档，高级筛选 / 排序 / 数量限制，原始 JSON 视图，添加与删除文档
- **设置编辑器** — 每个字段都有用户友好的输入约束：
  - 字段多选下拉，候选取自**索引真实文档字段**（带示例值），支持自定义字段
  - 数组字段使用标签输入（回车 / 逗号添加、点击移除、自动去重）
  - JSON 输入带**结构校验**与具体错误提示
- **任务列表** — 状态 / 类型 / 索引筛选，基于游标的分页，失败详情弹窗，取消排队中的任务
- **API 密钥管理** — 创建 / 编辑 / 删除密钥，每个 action 带官方文档作用说明，相对过期时间显示，一键复制 UID
- **备份（Dumps）** — 创建备份，跟踪备份任务状态
- **搜索** — 完整的搜索体验，支持筛选、排序与原始响应查看
- **国际化** — 英文与简体中文，自动检测浏览器语言，手动切换，同步 `<html lang>` 属性
- **暗色模式** — 亮 / 暗主题切换，跟随系统偏好
- **现代 UI** — shadcn/ui（base-nova 风格）组件：可折叠侧边栏、滚动区域、对话框、下拉菜单

## 快速开始

### 环境要求

- Node.js ≥ 20
- 一个运行中的 Meilisearch 实例（本地或云端）— 参见 [Meilisearch 快速入门](https://www.meilisearch.com/docs/learn/getting_started/quick_start)

### 安装与运行

```bash
# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev

# 生产构建
pnpm build

# 预览生产构建
pnpm preview
```

打开面板后，点击 **添加新实例**，输入你的 Meilisearch 地址（例如 `http://localhost:7700`）与 API 密钥，即可连接。

## 技术栈

- **React 19** + **TypeScript 7**
- **TanStack Router**
- **Vite 8**
- **Tailwind CSS 4** + **shadcn/ui**
- **meilisearch JS SDK**
- **react-i18next**
- **lucide-react**

## 国际化

- 词典文件：`src/i18n/locales/{en,zh-CN}.ts`
- `zh-CN` 通过 `satisfies Translation` 与 `en` 做类型校验 — 缺少或多余的 key 会导致构建失败
- 语言选择持久化在 `localStorage`；未设置时回退到浏览器语言，最后回退英文

## 许可证

[MIT](./LICENSE)
