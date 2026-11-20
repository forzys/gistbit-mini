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

    var params = {
        "ui.toast": { text: "来自小功能的提示", type: "success" },
        "ui.haptic": { style: "medium" },
        "clipboard.write": { text: "Hello from 知点" },
        "share.text": { text: "来自示例小功能" },
        "app.setTitle": { title: "改过的标题" },
        "app.openURL": { url: "https://www.apple.com" },
        "speech.speak": { text: "你好" },
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
