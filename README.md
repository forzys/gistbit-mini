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

每个包（小功能 zip、资源包文件）**不能超过 5 MB**，小功能解压后不能超过 20 MB；超过的 `npm run build` 直接报错，App 也不会显示、安装。

能用的 bridge、主题变量、限制见知点项目的 `docs/mini-tools-dev.md`。

## 资源包

- 词书：`{ "kind": "wordbook", "language": "en-US", "meaningLanguage": "zh-Hans", "words": [["单词", "音标", "释义"], …] }`，按常用程度排好。
- 术语表：`{ "kind": "terms", "terms": [{ "term": "Kubernetes", "aliases": ["酷伯内提斯"] }, …] }`。
- 在 `catalog.source.json` 里加：`{ "id": "…", "type": "pack", "group": "…", "source": "packs/<文件>.json", "title": { "zh": "…", "en": "…" } }`。条数、语言、sha256 由发布脚本填。

其他类型（AI 指令 `prompt`、快捷组合 `flow`、网页书签 `link`、活动 `event`、订阅合集 `feeds`；`local` 只用于 App 里已有、但内置目录没列出的页面）直接按目录格式写在 `catalog.source.json` 里，见知点项目的 `docs/tool-extensions.md`。

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

### 多语言

工具的名称、副标题、说明、横幅都写在这里的目录里，按语言给：`"title": { "zh": "…", "en": "…", "ko": "…", "ja": "…", "es": "…", "de": "…", "fr": "…" }`，App 本地的翻译文件不用改。缺的语言 App 显示英文。小功能的名称写在它的 `manifest.json` 里。

`npm run build` 会检查要正式发布的条目（不是 `dev` 的）和分组，缺了哪种语言就提示，但不拦着发布。小功能页面里的文字由小功能自己按 `gistbit.env.lang` 切换。

远程目录是**增量**：App 内置的本地工具（翻译、文档翻译、扫描、识字、提取音频）和「翻译」「识别」分组永远都在，这里只写要新增的工具和分组；和内置同 id 的会被忽略。新工具可以放进内置分组（`"group": "translate"` / `"recognize"`），排在内置工具后面。开发版 App 内置的测试活动、测试合集也一直在，不用写在这里。
