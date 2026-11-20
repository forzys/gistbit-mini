// 示例：读环境、用 gistbit.storage 存计数、逐个试 bridge 能力（结果和错误码都打印在下面）
;(function () {
    var gistbit = window.gistbit
    var log = document.getElementById("log")
    var print = function (text) {
        log.textContent = text + "\n" + log.textContent
    }

    function showEnv(env) {
        document.getElementById("env").textContent = JSON.stringify(env, null, 2)
    }
    showEnv(gistbit.env)
    // 主题、深浅色、语言变了
    window.addEventListener("gistbit:env", function (event) {
        showEnv(event.detail)
    })

    var countNode = document.getElementById("count")
    gistbit.call("storage.get", { key: "count" }).then(function (value) {
        countNode.textContent = value || 0
    })
    function setCount(value) {
        gistbit
            .call("storage.set", { key: "count", value: value })
            .then(function () {
                countNode.textContent = value
            })
            .catch(function (error) {
                print("storage.set 失败：" + error.code + " " + error.message)
            })
    }
    document.getElementById("increase").onclick = function () {
        setCount(Number(countNode.textContent) + 1)
    }
    document.getElementById("reset").onclick = function () {
        setCount(0)
    }

    // 资料与 AI：选资料（第一次会弹授权框）→ 读文字 → AI 流式总结 → 朗读、存笔记；加生词
    var picked = null
    var aiOutput = document.getElementById("ai")
    var fail = function (name) {
        return function (error) {
            print(name + " 失败：" + error.code + " " + error.message)
            // 拒绝权限时 message 是给用户看的提示，直接弹出来
            if (error.code === "permission_denied") gistbit.call("ui.alert", { title: error.message }).catch(function () {})
        }
    }
    window.addEventListener("gistbit:ai", function (event) {
        aiOutput.textContent = event.detail.text
    })
    document.getElementById("pick").onclick = function () {
        gistbit
            .call("item.pick", {})
            .then(function (item) {
                picked = item
                aiOutput.textContent = "已选择：" + item.title + "（" + item.kind + "）"
            })
            .catch(fail("item.pick"))
    }
    document.getElementById("summarize").onclick = function () {
        if (!picked) return print("先选一份资料")
        gistbit
            .call("item.text", { id: picked.id })
            .then(function (result) {
                return gistbit.call("ai.stream", { prompt: "用三句话总结下面的内容：\n" + result.text.slice(0, 3000), maxTokens: 400 })
            })
            .then(function (result) {
                aiOutput.textContent = result.text
            })
            .catch(fail("ai.stream"))
    }
    document.getElementById("speak").onclick = function () {
        gistbit.call("speech.speak", { text: aiOutput.textContent || "你好，知点" }).catch(fail("speech.speak"))
    }
    document.getElementById("stop").onclick = function () {
        gistbit.call("speech.stop").catch(fail("speech.stop"))
    }
    document.getElementById("save-note").onclick = function () {
        gistbit
            .call("note.create", { title: "示例小功能的笔记", markdown: aiOutput.textContent || "（空）" })
            .then(function (result) {
                // App 会自己弹「已存为笔记」，这里只记日志
                print("note.create 成功：" + result.id)
            })
            .catch(fail("note.create"))
    }
    document.getElementById("add-word").onclick = function () {
        gistbit
            .call("vocab.add", { term: "photosynthesis", meaning: "光合作用", language: "en-US" })
            .then(function (result) {
                // App 会自己弹提示，这里只记日志
                print("vocab.add：" + (result.added ? "已加入" : "已经有了"))
            })
            .catch(fail("vocab.add"))
    }

    var params = {
        "ui.toast": { text: "来自小功能的提示", type: "success" },
        "ui.haptic": { style: "medium" },
        "clipboard.write": { text: "Hello from 知点" },
        "share.text": { text: "来自示例小功能" },
        "app.setTitle": { title: "改过的标题" },
        "app.openURL": { url: "https://www.apple.com" },
        "ui.alert": { title: "删除这条记录？", message: "删除后不能恢复", buttons: [{ text: "取消", style: "cancel" }, { text: "删除", style: "destructive" }] },
        "ui.prompt": { title: "给计数起个名字", placeholder: "名字", value: "我的计数" },
        "ui.sheet": {
            title: "排序方式",
            options: [
                { title: "按时间", icon: "clock", checked: true },
                { title: "按名称", icon: "textformat" },
                { title: "清空全部", icon: "trash", destructive: true },
            ],
        },
        "ui.info": { title: "关于示例", message: "演示知点小功能能用的能力。", rows: [{ label: "版本", value: "1.2.0" }] },
        "unknown.method": {},
        "app.close": {},
    }
    document.querySelectorAll("[data-call]").forEach(function (button) {
        button.onclick = function () {
            var name = button.getAttribute("data-call")
            print(name + " → supports: " + gistbit.supports(name))
            gistbit
                .call(name, params[name])
                .then(function (result) {
                    print(name + " 成功：" + JSON.stringify(result))
                })
                .catch(function (error) {
                    print(name + " 失败：" + error.code + " " + error.message)
                })
        }
    })
})()
