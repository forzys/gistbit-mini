/*
 * gistbit-mock.js：在浏览器里开发小功能时模拟 window.gistbit（知点 App 里会自动跳过，用真的）。
 * 用法：<script src="gistbit-mock.js"></script> 放在自己的脚本前面；也可以只在不在 App 里时动态加载，见 examples/hello。
 *   - 主题变量给浅色 / 深色两套默认值，跟随浏览器的深浅色
 *   - storage 存在 localStorage（前缀 gistbit-mock:）
 *   - toast 在页面底部显示，触感只打印日志
 *   - item.pick 返回一份示例资料，ai 返回固定的模拟文字（ai.stream 分几段发 gistbit:ai 事件），朗读用浏览器的 speechSynthesis
 *   - note.create、vocab.add 只打印日志
 * 文档：docs/mini-tools-dev.md
 */
;(function () {
    if (window.gistbit && window.gistbit.call) return

    var dark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches
    var vars = dark
        ? {
              "--gistbit-background": "#000000",
              "--gistbit-surface": "#1C1C1E",
              "--gistbit-fill": "rgba(118,118,128,0.24)",
              "--gistbit-text": "rgba(255,255,255,0.95)",
              "--gistbit-text-secondary": "#AEAEB2",
              "--gistbit-text-tertiary": "#8E8E93",
              "--gistbit-separator": "#38383A",
              "--gistbit-accent": "#A9B4C7",
              "--gistbit-on-accent": "#000000",
              "--gistbit-danger": "#FF453A",
              "--gistbit-success": "#30D158",
              "--gistbit-seal": "#E0573F",
          }
        : {
              "--gistbit-background": "#F2F2F7",
              "--gistbit-surface": "#FFFFFF",
              "--gistbit-fill": "rgba(118,118,128,0.12)",
              "--gistbit-text": "rgba(0,0,0,0.95)",
              "--gistbit-text-secondary": "#6C6C70",
              "--gistbit-text-tertiary": "#8E8E93",
              "--gistbit-separator": "#E5E5EA",
              "--gistbit-accent": "#2F3A4C",
              "--gistbit-on-accent": "#FFFFFF",
              "--gistbit-danger": "#FF3B30",
              "--gistbit-success": "#34C759",
              "--gistbit-seal": "#C8402A",
          }
    vars["--gistbit-font"] = "-apple-system"
    vars["--gistbit-radius-sm"] = "8px"
    vars["--gistbit-radius-md"] = "12px"
    vars["--gistbit-radius-lg"] = "16px"
    vars["--gistbit-radius-xl"] = "20px"
    var style = document.createElement("style")
    style.textContent =
        ":root {" +
        Object.keys(vars)
            .map(function (key) {
                return key + ": " + vars[key] + ";"
            })
            .join(" ") +
        "}"
    ;(document.head || document.documentElement).appendChild(style)

    var PREFIX = "gistbit-mock:"
    var PERMISSIONS = {
        "storage.get": "storage",
        "storage.set": "storage",
        "storage.remove": "storage",
        "storage.keys": "storage",
        "share.text": "share",
        "share.image": "share",
        "item.pick": "readItem",
        "item.text": "readItem",
        "ai.available": "ai",
        "ai.complete": "ai",
        "ai.stream": "ai",
        "speech.speak": "speech",
        "speech.stop": "speech",
        "note.create": "writeNote",
        "vocab.add": "writeVocab",
    }
    var MOCK_ITEM = { id: "mock-item", kind: "note", title: "示例笔记", createdAt: Date.now() }
    var MOCK_TEXT = "光合作用是绿色植物利用光能，把二氧化碳和水合成有机物、放出氧气的过程。叶绿素吸收光能，主要在叶绿体中进行。"
    var mockAnswer = function (prompt) {
        return "（模拟回答）收到 " + String(prompt).length + " 个字的提示词：" + String(prompt).slice(0, 30)
    }

    function showToast(text) {
        var node = document.createElement("div")
        node.textContent = text
        node.style.cssText =
            "position:fixed;left:50%;bottom:24px;transform:translateX(-50%);padding:10px 16px;border-radius:12px;background:rgba(0,0,0,.8);color:#fff;font:14px -apple-system,sans-serif;z-index:99999"
        document.body.appendChild(node)
        setTimeout(function () {
            node.remove()
        }, 2000)
    }

    var handlers = {
        "app.close": function () {
            console.log("[gistbit-mock] app.close")
        },
        "app.setTitle": function (p) {
            document.title = p.title
        },
        "app.openURL": function (p) {
            window.open(p.url, "_blank")
        },
        "ui.toast": function (p) {
            showToast(p.text)
        },
        "ui.haptic": function (p) {
            console.log("[gistbit-mock] haptic", p.style)
        },
        "clipboard.write": function (p) {
            return navigator.clipboard ? navigator.clipboard.writeText(p.text) : null
        },
        "storage.get": function (p) {
            var value = localStorage.getItem(PREFIX + p.key)
            return value === null ? null : JSON.parse(value)
        },
        "storage.set": function (p) {
            localStorage.setItem(PREFIX + p.key, JSON.stringify(p.value))
        },
        "storage.remove": function (p) {
            localStorage.removeItem(PREFIX + p.key)
        },
        "storage.keys": function () {
            return Object.keys(localStorage)
                .filter(function (key) {
                    return key.indexOf(PREFIX) === 0
                })
                .map(function (key) {
                    return key.slice(PREFIX.length)
                })
        },
        "share.text": function (p) {
            if (navigator.share) return navigator.share({ text: p.text, url: p.url })
            console.log("[gistbit-mock] share.text", p)
        },
        "share.image": function () {
            console.log("[gistbit-mock] share.image")
        },
        "item.pick": function () {
            return MOCK_ITEM
        },
        "item.text": function (p) {
            if (p.id !== MOCK_ITEM.id) throw { code: "permission_denied", message: "只能读取用户通过 item.pick 选择的资料" }
            return { text: MOCK_TEXT }
        },
        "ai.available": function () {
            return { available: true }
        },
        "ai.complete": function (p) {
            return { text: mockAnswer(p.prompt) }
        },
        "ai.stream": function (p, callId) {
            var text = mockAnswer(p.prompt)
            return new Promise(function (resolve) {
                var shown = 0
                var timer = setInterval(function () {
                    shown = Math.min(text.length, shown + 6)
                    var done = shown >= text.length
                    window.dispatchEvent(new CustomEvent("gistbit:ai", { detail: { callId: callId, text: text.slice(0, shown), done: done } }))
                    if (done) {
                        clearInterval(timer)
                        resolve({ text: text })
                    }
                }, 80)
            })
        },
        "speech.speak": function (p) {
            if (!window.speechSynthesis) return console.log("[gistbit-mock] speak", p.text)
            speechSynthesis.cancel()
            var utterance = new SpeechSynthesisUtterance(p.text)
            if (p.language) utterance.lang = p.language
            speechSynthesis.speak(utterance)
        },
        "speech.stop": function () {
            if (window.speechSynthesis) speechSynthesis.cancel()
        },
        "note.create": function (p) {
            console.log("[gistbit-mock] note.create", p)
            return { id: "mock-note-" + Date.now() }
        },
        "vocab.add": function (p) {
            console.log("[gistbit-mock] vocab.add", p)
            return { added: true }
        },
    }
    var callSeq = 0

    window.gistbit = {
        mock: true,
        env: { scheme: dark ? "dark" : "light", lang: (navigator.language || "en").slice(0, 2), appVersion: "mock", toolVersion: "mock" },
        // 浏览器里默认按全部权限放行；想模拟没声明的权限，把名字放进 gistbit.mockPermissions（如 ["storage"]）
        mockPermissions: null,
        supports: function (name) {
            return name in handlers
        },
        call: function (name, params) {
            var handler = handlers[name]
            if (!handler) return Promise.reject({ code: "not_supported", message: "不支持 " + name })
            var permission = PERMISSIONS[name]
            var granted = window.gistbit.mockPermissions
            if (permission && granted && granted.indexOf(permission) < 0) {
                return Promise.reject({ code: "permission_denied", message: "manifest 没有声明 " + permission + " 权限" })
            }
            try {
                return Promise.resolve(handler(params || {}, ++callSeq)).then(function (result) {
                    return result === undefined ? null : result
                })
            } catch (error) {
                return Promise.reject(error && error.code ? error : { code: "failed", message: String(error) })
            }
        },
    }
})()
