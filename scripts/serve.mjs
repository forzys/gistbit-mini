#!/usr/bin/env node
// 本地测试：npm run serve [-- --port 8000]
//   http://<局域网 IP>:<端口>/catalog.json   本地目录（含 dev 条目）。每次请求都重新生成，改了文件在 App 里刷新目录就能看到
//   http://<局域网 IP>:<端口>/files/…        打好的小功能 zip、资源包
//   http://<局域网 IP>:<端口>/dev/…          仓库原样的文件：开发中的小功能直接打开（如 /dev/minis/hello/），不用打包
// App 开发版：设置 › 开发 › 实验室 › 目录地址 填上面的 catalog.json；或「打开开发中的小功能」填 /dev/minis/<目录>/

import { execFileSync } from "node:child_process"
import { createReadStream, existsSync, statSync } from "node:fs"
import { createServer } from "node:http"
import { networkInterfaces } from "node:os"
import { dirname, extname, join, normalize, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const args = process.argv.slice(2)
const port = Number(args[args.indexOf("--port") + 1]) || 8000

const ip =
    Object.values(networkInterfaces())
        .flat()
        .find((item) => item && item.family === "IPv4" && !item.internal)?.address ?? "127.0.0.1"
const base = `http://${ip}:${port}`

const TYPES = {
    ".html": "text/html; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".zip": "application/zip",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".svg": "image/svg+xml",
    ".woff2": "font/woff2",
}

const build = () => execFileSync(process.execPath, [join(ROOT, "scripts", "build.mjs"), "--local", base], { stdio: "pipe" }).toString()

/** 只能读 root 里面的文件 */
function fileIn(root, path) {
    const target = normalize(join(root, decodeURIComponent(path)))
    if (!target.startsWith(root)) return null
    if (existsSync(target) && statSync(target).isDirectory()) return join(target, "index.html")
    return target
}

console.log(build())

createServer((request, response) => {
    const url = new URL(request.url ?? "/", base)
    let file = null
    if (url.pathname === "/catalog.json") {
        try {
            build()
        } catch (error) {
            response.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" })
            response.end(String(error.stderr ?? error))
            console.error(String(error.stderr ?? error))
            return
        }
        file = join(ROOT, ".local", "catalog.json")
    } else if (url.pathname.startsWith("/files/")) {
        file = fileIn(join(ROOT, ".local"), url.pathname)
    } else if (url.pathname.startsWith("/dev/")) {
        file = fileIn(ROOT, url.pathname.slice("/dev".length))
    }
    if (!file || !existsSync(file)) {
        response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" })
        response.end("not found")
        return
    }
    response.writeHead(200, { "Content-Type": TYPES[extname(file)] ?? "application/octet-stream", "Cache-Control": "no-store" })
    createReadStream(file).pipe(response)
    console.log(`${request.method} ${url.pathname}`)
}).listen(port, "0.0.0.0", () => {
    console.log(`\n本地服务：${base}`)
    console.log(`  目录地址          ${base}/catalog.json`)
    console.log(`  开发中的小功能    ${base}/dev/minis/hello/`)
})
