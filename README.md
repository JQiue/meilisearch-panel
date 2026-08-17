# MeiliSearch Panel

MeiliSearch Panel is a web-based administration panel for MeiliSearch instances. It provides an intuitive interface for monitoring indexes, managing documents and API keys, viewing tasks, tuning index settings, and performing search operations.

## Features

- **Multi-instance management** — Save multiple Meilisearch connections, switch with one click, real-time health status indicator
- **Instance overview** — Instance version, SDK version, database size, total documents, per-index indexing status
- **Index management** — Create / delete indexes, view details, real-time stats and field distribution
- **Document viewer** — Browse or search documents, advanced filters / sorting / limit, raw JSON view, add and delete documents
- **Settings editor** — User-friendly input constraints for every field:
  - Field multi-select dropdown, candidates taken from **real index document fields** (with sample values), supports custom fields
  - Array fields use tag input (Enter / comma to add, click to remove, automatic deduplication)
  - JSON input with **structure validation** and specific error messages
- **Task list** — Status / type / index filters, cursor-based pagination, failure detail modal, cancel enqueued tasks
- **API key management** — Create / edit / delete keys, official documentation description for each action, relative expiry display, one-click UID copy
- **Dumps** — Create dumps, track dump task status
- **Search** — Full search experience with filters, sorting and raw response view
- **Internationalization** — English and Simplified Chinese, automatic browser language detection, manual switching, synced `<html lang>` attribute
- **Dark mode** — Light / dark theme toggle, follows system preference
- **Modern UI** — shadcn/ui (base-nova style) components: collapsible sidebar, scroll areas, dialogs, dropdown menus

## Quick Start

### Requirements

- Node.js ≥ 20
- A running Meilisearch instance (local or cloud) — see [Meilisearch Quick Start](https://www.meilisearch.com/docs/learn/getting_started/quick_start)

### Installation and Running

```bash
# Install dependencies
pnpm install

# Start the development server
pnpm dev

# Production build
pnpm build

# Preview the production build
pnpm preview
```

After opening the panel, click **Add New Instance**, enter your Meilisearch URL (e.g. `http://localhost:7700`) and API key to connect.

## Tech Stack

- **React 19** + **TypeScript 7**
- **TanStack Router**
- **Vite 8**
- **Tailwind CSS 4** + **shadcn/ui**
- **meilisearch JS SDK**
- **react-i18next**
- **lucide-react**

## Internationalization

- Dictionary files: `src/i18n/locales/{en,zh-CN}.ts`
- `zh-CN` is type-checked against `en` with `satisfies Translation` — missing or extra keys cause a build failure
- Language selection is persisted in `localStorage`; falls back to the browser language when unset, and finally to English

## License

[MIT](./LICENSE)
