# gistbit-mini

知点（Gistbit）的工具目录、小功能、资源包。App 从 GitHub Pages 读目录：

```
https://forzys.github.io/gistbit-mini/catalog.json
```

改了这里、发布后，App 下次拉目录（进入工具页时，超过 6 小时没拉就拉一次）就能看到，不用发版。

## 目录结构

```
catalog.source.json   手写的目录（发布脚本据此生成 docs/catalog.json）
minis/<id>/           小功能源码：manifest.json + 入口 html，相对路径引用资源
packs/*.json          资源包：词书（wordbook）、术语表（terms）
sdk/gistbit-mock.js   在浏览器里开发小功能时模拟 window.gistbit
scripts/build.mjs     发布脚本：打包、算 sha256、生成目录
scripts/serve.mjs     本地测试服务
docs/                 生成的发布内容（GitHub Pages 从这里提供），不要手改
```

## 写一个小功能

1. 在 `minis/<id>/` 里写：`manifest.json`（`id` 和目录 id 一致、`version` 用语义化版本、`permissions`、`network`）、`index.html`。参考 `minis/hello`。
2. 在浏览器里开发：页面里在不在 App 里时加载 `../../sdk/gistbit-mock.js`（见 `minis/hello/index.html`）。
3. 在 `catalog.source.json` 的 `tools` 里加一条：`{ "id": "<id>", "type": "mini", "group": "…", "source": "minis/<id>" }`。还在开发的加 `"dev": true`，只出现在本地测试目录里。
4. 发新版本：改 `manifest.json` 的 `version`，重新发布。App 后台下载，下次打开生效。

能用的 bridge、主题变量、限制见知点项目的 `docs/mini-tools-dev.md`。

## 资源包

- 词书：`{ "kind": "wordbook", "language": "en-US", "meaningLanguage": "zh-Hans", "words": [["单词", "音标", "释义"], …] }`，按常用程度排好。
- 术语表：`{ "kind": "terms", "terms": [{ "term": "Kubernetes", "aliases": ["酷伯内提斯"] }, …] }`。
- 在 `catalog.source.json` 里加：`{ "id": "…", "type": "pack", "group": "…", "source": "packs/<文件>.json", "title": { "zh": "…", "en": "…" } }`。条数、语言、sha256 由发布脚本填。

其他类型（AI 指令 `prompt`、网页书签 `link`、活动 `event`、订阅合集 `feeds`、本地工具 `local`）直接按目录格式写在 `catalog.source.json` 里，见知点项目的 `docs/tool-extensions.md`。

## 本地测试

手机和电脑在同一个局域网：

```bash
npm run serve            # 打印出本地地址，例如 http://192.168.1.5:8000
```

在知点开发版里：

- **整份目录**：设置 › 开发 › 实验室 › 目录地址，填 `http://<IP>:8000/catalog.json`。本地目录包含 `dev` 条目；改了文件后在实验室点「刷新目录」，工具页就是新的。
- **只调一个小功能**：实验室 › 打开开发中的小功能，填 `http://<IP>:8000/dev/minis/<id>/`，不用打包，改完刷新页面即可（bridge 全部放行）。

## 发布

```bash
npm run build            # 生成 docs/catalog.json 和 docs/files/（跳过 dev 条目）
git add -A && git commit -m "…" && git push
```

GitHub Pages 一般一两分钟内更新。

注意：**正式目录会整个替换 App 内置的目录**，所以 `catalog.source.json` 里要一直保留 5 个本地工具（翻译、文档翻译、扫描、识字、提取音频），删掉的话 App 里就不显示了。
