#!/usr/bin/env node
// 生成工具目录和要托管的文件：
//   npm run build                         正式：输出到 docs/（GitHub Pages），地址用 catalog.source.json 的 baseUrl，跳过 dev 条目
//   npm run build -- --local <baseUrl>    本地测试：输出到 .local/，地址用给的局域网地址，包含 dev 条目（npm run serve 会自动调用）
//
// catalog.source.json 和 App 读的目录格式一样，只是：
//   - mini   写 "source": "minis/<目录>"，不写 package；打包成 zip，自动填 package（url、sha256、size、version）和 permissions
//   - pack   写 "source": "packs/<文件>.json"，不写 file；自动填 file、count、language（词书）、packKind
//   - 其他类型原样输出；"dev": true 的条目只在本地测试时输出
//   - 目录的 version 自动取当前时间（秒），App 拉到新的就替换
//   - 检查多语言：要正式发布的条目（不是 dev）和分组，名称、副标题、说明、横幅缺了哪种语言就提示（不拦着发布，缺的语言 App 显示英文）
// 文件格式和字段说明：知点项目 docs/tool-extensions.md、docs/mini-tools-dev.md

import { execFileSync } from "node:child_process"
import { createHash } from "node:crypto"
import { copyFileSync, existsSync, mkdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs"
import { basename, dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..")
/** 每个包（小功能 zip、资源包文件）最大 5 MB，和 App 里的上限一致；超过的不发布 */
const MAX_MINI = 5 * 1024 * 1024
const MAX_PACK = 5 * 1024 * 1024
/** 小功能解压后最大 20 MB（App 安装时也会检查） */
const MAX_UNZIPPED = 20 * 1024 * 1024
/** App 支持的界面语言 */
const LANGUAGES = ["zh", "en", "ko", "ja", "es", "de", "fr"]
const TEXT_FIELDS = ["title", "subtitle", "description", "banner"]

const errors = []
const fail = (message) => errors.push(message)
const sha256Of = (path) => createHash("sha256").update(readFileSync(path)).digest("hex")

const args = process.argv.slice(2)
const localIndex = args.indexOf("--local")
const local = localIndex >= 0
const source = JSON.parse(readFileSync(join(ROOT, "catalog.source.json"), "utf8"))
const baseUrl = (local ? args[localIndex + 1] : source.baseUrl)?.replace(/\/$/, "")
if (!baseUrl) {
    console.error("✗ 缺少 baseUrl（catalog.source.json 里写，或 --local <地址>）")
    process.exit(1)
}

const outDirectory = join(ROOT, local ? ".local" : "docs")
rmSync(join(outDirectory, "files"), { recursive: true, force: true })
mkdirSync(join(outDirectory, "files", "minis"), { recursive: true })
mkdirSync(join(outDirectory, "files", "packs"), { recursive: true })

// ---------- 小功能 ----------

function buildMini(entry) {
    const directory = join(ROOT, entry.source)
    const manifestPath = join(directory, "manifest.json")
    if (!existsSync(manifestPath)) return fail(`${entry.id}：找不到 ${entry.source}/manifest.json`)
    const manifest = JSON.parse(readFileSync(manifestPath, "utf8"))
    if (manifest.id !== entry.id) return fail(`${entry.id}：manifest.id 是 ${manifest.id}，要和目录里的 id 一致`)
    if (!/^\d+\.\d+\.\d+/.test(manifest.version ?? "")) return fail(`${entry.id}：manifest.version 要用语义化版本（如 1.2.0）`)
    const entryFile = manifest.entry ?? "index.html"
    if (!existsSync(join(directory, entryFile))) return fail(`${entry.id}：找不到入口文件 ${entryFile}`)

    const fileName = `${manifest.id}-${manifest.version}.zip`
    const zipPath = join(outDirectory, "files", "minis", fileName)
    // -X 不写额外的文件属性；跳过隐藏文件和 .DS_Store
    execFileSync("zip", ["-r", "-X", "-q", zipPath, ".", "-x", "*.DS_Store", "-x", ".*", "-x", "*/.*"], { cwd: directory })
    const size = statSync(zipPath).size
    if (size > MAX_MINI) return fail(`${entry.id}：包有 ${(size / 1048576).toFixed(1)} MB，超过 5 MB`)
    const unzipped = Number(execFileSync("unzip", ["-Zt", zipPath]).toString().match(/(\d+) bytes uncompressed/)?.[1] ?? 0)
    if (unzipped > MAX_UNZIPPED) return fail(`${entry.id}：解压后有 ${(unzipped / 1048576).toFixed(1)} MB，超过 20 MB`)

    const { source: _source, dev: _dev, ...rest } = entry
    return {
        ...rest,
        icon: entry.icon ?? manifest.icon,
        title: entry.title ?? manifest.title,
        ...(entry.subtitle ?? manifest.subtitle ? { subtitle: entry.subtitle ?? manifest.subtitle } : {}),
        ...(manifest.minAppVersion && !entry.minAppVersion ? { minAppVersion: manifest.minAppVersion } : {}),
        package: { url: `${baseUrl}/files/minis/${fileName}`, sha256: sha256Of(zipPath), size, version: manifest.version },
        permissions: manifest.permissions ?? [],
    }
}

// ---------- 资源包 ----------

function buildPack(entry) {
    const path = join(ROOT, entry.source)
    if (!existsSync(path)) return fail(`${entry.id}：找不到 ${entry.source}`)
    const size = statSync(path).size
    if (size > MAX_PACK) return fail(`${entry.id}：文件有 ${(size / 1048576).toFixed(1)} MB，超过 5 MB`)
    let data
    try {
        data = JSON.parse(readFileSync(path, "utf8"))
    } catch (error) {
        return fail(`${entry.id}：不是合法的 JSON（${error.message}）`)
    }
    let count
    if (data.kind === "wordbook") {
        if (!data.language || !data.meaningLanguage || !Array.isArray(data.words)) return fail(`${entry.id}：词书要有 language、meaningLanguage、words`)
        if (data.words.some((word) => !Array.isArray(word) || typeof word[0] !== "string")) return fail(`${entry.id}：words 的每一项是 [单词, 音标, 释义]`)
        count = data.words.length
    } else if (data.kind === "terms") {
        if (!Array.isArray(data.terms) || data.terms.some((item) => typeof item?.term !== "string")) return fail(`${entry.id}：术语表的 terms 每一项要有 term`)
        count = data.terms.length
    } else {
        return fail(`${entry.id}：kind 只能是 wordbook 或 terms`)
    }
    // 文件名带上 sha256 前 8 位：内容变了地址就变，不会被 CDN 缓存住旧文件
    const sha256 = sha256Of(path)
    const fileName = `${basename(path, ".json")}-${sha256.slice(0, 8)}.json`
    copyFileSync(path, join(outDirectory, "files", "packs", fileName))
    const { source: _source, dev: _dev, ...rest } = entry
    return {
        ...rest,
        packKind: data.kind,
        version: entry.version ?? sha256.slice(0, 8),
        count,
        ...(data.kind === "wordbook" ? { language: data.language } : {}),
        file: { url: `${baseUrl}/files/packs/${fileName}`, sha256, size },
    }
}

// ---------- 目录 ----------

/** 缺哪些语言：[字段, 缺的语言] */
function missingLanguages(entry) {
    return TEXT_FIELDS.flatMap((field) => {
        const value = entry[field]
        if (!value || typeof value !== "object") return []
        const missing = LANGUAGES.filter((lang) => !value[lang])
        return missing.length ? [[field, missing]] : []
    })
}
const languageWarnings = []
for (const group of source.groups ?? []) {
    for (const [field, missing] of missingLanguages(group)) languageWarnings.push(`分组 ${group.id} 的 ${field} 缺：${missing.join(" ")}`)
}

const ids = new Set()
const tools = []
for (const entry of source.tools ?? []) {
    if (entry.dev && !local) continue
    if (!/^[a-z0-9][a-z0-9-]{0,63}$/.test(entry.id ?? "")) {
        fail(`id 不合法：${entry.id}`)
        continue
    }
    if (ids.has(entry.id)) {
        fail(`id 重复：${entry.id}`)
        continue
    }
    ids.add(entry.id)
    const built = entry.type === "mini" && entry.source ? buildMini(entry) : entry.type === "pack" && entry.source ? buildPack(entry) : (({ dev: _dev, ...rest }) => rest)(entry)
    if (built) {
        tools.push(built)
        // 小功能的名称来自 manifest，检查生成后的条目
        if (!entry.dev) for (const [field, missing] of missingLanguages(built)) languageWarnings.push(`${entry.id} 的 ${field} 缺：${missing.join(" ")}`)
    }
}

if (errors.length) {
    errors.forEach((message) => console.error(`✗ ${message}`))
    process.exit(1)
}

const catalog = {
    version: Math.floor(Date.now() / 1000),
    updatedAt: new Date().toISOString(),
    groups: source.groups ?? [],
    tools,
}
writeFileSync(join(outDirectory, "catalog.json"), `${JSON.stringify(catalog, null, 4)}\n`)
// GitHub Pages 不要用 Jekyll 处理（会跳过下划线开头的文件）
if (!local) writeFileSync(join(outDirectory, ".nojekyll"), "")

if (languageWarnings.length) {
    console.warn(`! 多语言不全（缺的语言 App 显示英文）：`)
    languageWarnings.forEach((message) => console.warn(`  - ${message}`))
}
console.log(`✓ ${local ? "本地测试" : "正式"}目录：${join(outDirectory, "catalog.json")}`)
console.log(`  ${tools.length} 个工具，地址前缀 ${baseUrl}`)
for (const tool of tools) {
    const detail = tool.package ? `${tool.package.version}，${(tool.package.size / 1024).toFixed(1)} KB` : tool.file ? `${tool.count} 条，${(tool.file.size / 1024).toFixed(1)} KB` : ""
    console.log(`  - ${tool.type.padEnd(6)} ${tool.id}${detail ? `（${detail}）` : ""}`)
}
