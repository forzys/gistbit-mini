// 元素周期表：周期表（横向滑动）+ 分类图例（点一下只看这一类）；搜索名称、符号、原子序数；
// 点元素看详情（相对原子质量、分类、周期、族、电子排布），可以收藏（gistbit.storage）、分享（gistbit.share）。
// 界面语言：中文界面用中文，其他语言用英文
;(function () {
    var gistbit = window.gistbit
    var ELEMENTS = window.ELEMENTS

    var TEXT = {
        zh: {
            search: "搜索名称、符号或序数",
            table: "周期表",
            favorites: "收藏",
            favoritesCount: "收藏 {n}",
            noFavorites: "暂无收藏\n在元素详情里点「收藏」",
            noResults: "没有找到「{q}」",
            mass: "相对原子质量",
            category: "分类",
            period: "周期",
            group: "族",
            config: "电子排布",
            favorite: "收藏",
            unfavorite: "取消收藏",
            share: "分享",
            number: "原子序数 {z}",
            lanthanides: "镧系",
            actinides: "锕系",
            groupNone: "—",
            categories: {
                alkali: "碱金属",
                alkaline: "碱土金属",
                transition: "过渡金属",
                post: "后过渡金属",
                metalloid: "类金属",
                nonmetal: "非金属",
                halogen: "卤素",
                noble: "稀有气体",
                lanthanide: "镧系元素",
                actinide: "锕系元素",
                unknown: "性质未知",
            },
        },
        en: {
            search: "Search name, symbol or number",
            table: "Table",
            favorites: "Favorites",
            favoritesCount: "Favorites {n}",
            noFavorites: "No favorites\nTap Favorite in an element's details",
            noResults: "No results for “{q}”",
            mass: "Atomic mass",
            category: "Category",
            period: "Period",
            group: "Group",
            config: "Electron configuration",
            favorite: "Favorite",
            unfavorite: "Unfavorite",
            share: "Share",
            number: "Atomic number {z}",
            lanthanides: "Lanthanides",
            actinides: "Actinides",
            groupNone: "—",
            categories: {
                alkali: "Alkali metal",
                alkaline: "Alkaline earth metal",
                transition: "Transition metal",
                post: "Post-transition metal",
                metalloid: "Metalloid",
                nonmetal: "Nonmetal",
                halogen: "Halogen",
                noble: "Noble gas",
                lanthanide: "Lanthanide",
                actinide: "Actinide",
                unknown: "Unknown properties",
            },
        },
    }
    var CATEGORIES = ["alkali", "alkaline", "transition", "post", "metalloid", "nonmetal", "halogen", "noble", "lanthanide", "actinide", "unknown"]

    var lang = "zh"
    var text = TEXT.zh
    var favorites = []
    var tab = "table"
    var filter = null
    var current = null

    var $ = function (id) {
        return document.getElementById(id)
    }
    var format = function (template, values) {
        return template.replace(/\{(\w+)\}/g, function (_, key) {
            return values[key]
        })
    }
    var nameOf = function (element) {
        return lang === "zh" ? element.zh : element.en
    }
    var catColor = function (category) {
        return "var(--c-" + category + ")"
    }

    function setLanguage(env) {
        lang = env && env.lang === "zh" ? "zh" : "en"
        text = TEXT[lang]
        document.documentElement.lang = lang
        $("search").placeholder = text.search
        renderAll()
    }

    // ---------- 周期表 ----------

    function renderTable() {
        var table = $("table")
        table.innerHTML = ""
        table.classList.toggle("filtering", !!filter)
        ELEMENTS.forEach(function (element) {
            var cell = document.createElement("button")
            cell.className = "cell" + (favorites.indexOf(element.z) >= 0 ? " favorite" : "") + (filter === element.category ? " match" : "")
            cell.style.gridRow = element.cell.row
            cell.style.gridColumn = element.cell.col
            cell.style.setProperty("--cat", catColor(element.category))
            cell.setAttribute("aria-label", element.z + " " + nameOf(element))
            cell.innerHTML = '<span class="z">' + element.z + '</span><span class="symbol">' + element.symbol + '</span><span class="label">' + nameOf(element) + "</span>"
            cell.onclick = function () {
                openSheet(element)
            }
            table.appendChild(cell)
        })
        // 主表里镧系、锕系的位置：点一下只看这一类
        ;[
            [6, "57–71", "lanthanide", text.lanthanides],
            [7, "89–103", "actinide", text.actinides],
        ].forEach(function (item) {
            var cell = document.createElement("button")
            cell.className = "cell placeholder" + (filter === item[2] ? " match" : "")
            cell.style.gridRow = item[0]
            cell.style.gridColumn = 3
            cell.innerHTML = "<span>" + item[1] + "</span><span>" + item[3] + "</span>"
            cell.onclick = function () {
                setFilter(filter === item[2] ? null : item[2])
            }
            table.appendChild(cell)
        })
    }

    function renderLegend() {
        var legend = $("legend")
        legend.innerHTML = ""
        CATEGORIES.forEach(function (category) {
            var button = document.createElement("button")
            button.className = filter === category ? "active" : ""
            button.style.setProperty("--cat", catColor(category))
            button.innerHTML = "<i></i>" + text.categories[category]
            button.onclick = function () {
                setFilter(filter === category ? null : category)
            }
            legend.appendChild(button)
        })
    }

    function setFilter(category) {
        filter = category
        renderTable()
        renderLegend()
    }

    // ---------- 列表：搜索结果、收藏 ----------

    function matches(query) {
        var q = query.trim().toLowerCase()
        if (!q) return []
        if (/^\d+$/.test(q)) {
            var z = Number(q)
            return z >= 1 && z <= ELEMENTS.length ? [ELEMENTS[z - 1]] : []
        }
        // 符号完全一样的排最前，其次名称、符号开头一样的，最后是包含的
        var scored = []
        ELEMENTS.forEach(function (element) {
            var symbol = element.symbol.toLowerCase()
            var en = element.en.toLowerCase()
            var score = symbol === q ? 0 : symbol.indexOf(q) === 0 || en.indexOf(q) === 0 || element.zh === q ? 1 : en.indexOf(q) >= 0 || element.zh.indexOf(q) >= 0 ? 2 : -1
            if (score >= 0) scored.push([score, element])
        })
        return scored
            .sort(function (a, b) {
                return a[0] - b[0] || a[1].z - b[1].z
            })
            .map(function (item) {
                return item[1]
            })
    }

    function renderList(elements, emptyText) {
        var list = $("list")
        list.innerHTML = ""
        elements.forEach(function (element) {
            var row = document.createElement("button")
            row.className = "row"
            row.style.setProperty("--cat", catColor(element.category))
            var other = lang === "zh" ? element.en : element.zh
            row.innerHTML =
                '<span class="symbol">' +
                element.symbol +
                '</span><span class="text"><div class="title">' +
                nameOf(element) +
                " · " +
                other +
                '</div><div class="meta">' +
                text.categories[element.category] +
                " · " +
                element.mass +
                '</div></span><span class="z">' +
                element.z +
                "</span>"
            row.onclick = function () {
                openSheet(element)
            }
            list.appendChild(row)
        })
        $("empty").hidden = elements.length > 0
        $("empty").textContent = emptyText
    }

    function renderTabs() {
        var buttons = $("tabs").querySelectorAll("button")
        buttons[0].textContent = text.table
        buttons[1].textContent = favorites.length ? format(text.favoritesCount, { n: favorites.length }) : text.favorites
        buttons.forEach(function (button) {
            button.classList.toggle("active", button.getAttribute("data-tab") === tab)
        })
    }

    function renderAll() {
        var query = $("search").value
        var searching = query.trim().length > 0
        document.querySelector(".top").classList.toggle("searching", searching)
        renderTabs()
        var showList = searching || tab === "favorites"
        $("table-view").hidden = showList
        $("list-view").hidden = !showList
        if (searching) {
            renderList(matches(query), format(text.noResults, { q: query.trim() }))
        } else if (tab === "favorites") {
            renderList(
                favorites
                    .slice()
                    .sort(function (a, b) {
                        return a - b
                    })
                    .map(function (z) {
                        return ELEMENTS[z - 1]
                    }),
                text.noFavorites,
            )
        } else {
            renderTable()
            renderLegend()
        }
        if (current) renderSheet()
    }

    // ---------- 详情 ----------

    function openSheet(element) {
        current = element
        $("search").blur()
        $("backdrop").hidden = false
        $("sheet").hidden = false
        renderSheet()
    }

    function closeSheet() {
        current = null
        $("backdrop").hidden = true
        $("sheet").hidden = true
    }

    function renderSheet() {
        var element = current
        $("sheet").style.setProperty("--cat", catColor(element.category))
        $("d-symbol").textContent = element.symbol
        $("d-name").textContent = nameOf(element)
        $("d-sub").textContent = (lang === "zh" ? element.en : element.zh) + " · " + format(text.number, { z: element.z })
        var rows = [
            [text.mass, element.mass],
            [text.category, text.categories[element.category]],
            [text.period, element.period],
            [text.group, element.group || (element.category === "lanthanide" ? text.lanthanides : element.category === "actinide" ? text.actinides : text.groupNone)],
            [text.config, element.config],
        ]
        $("d-rows").innerHTML = rows
            .map(function (row) {
                return "<div><dt>" + row[0] + "</dt><dd>" + row[1] + "</dd></div>"
            })
            .join("")
        var starred = favorites.indexOf(element.z) >= 0
        $("d-favorite").textContent = (starred ? "★ " : "☆ ") + (starred ? text.unfavorite : text.favorite)
        $("d-share").textContent = text.share
    }

    function toggleFavorite() {
        if (!current) return
        var z = current.z
        var next = favorites.indexOf(z) >= 0 ? favorites.filter(function (item) {
                  return item !== z
              }) : favorites.concat([z])
        gistbit
            .call("storage.set", { key: "favorites", value: next })
            .then(function () {
                favorites = next
                gistbit.call("ui.haptic", { style: "light" }).catch(function () {})
                renderAll()
            })
            .catch(function (error) {
                gistbit.call("ui.toast", { text: error.message, type: "error" }).catch(function () {})
            })
    }

    function share() {
        if (!current) return
        var element = current
        var line = nameOf(element) + " " + element.symbol + " · " + format(text.number, { z: element.z }) + " · " + text.mass + " " + element.mass + " · " + element.config
        // 用户关掉分享面板不算出错
        gistbit.call("share.text", { text: line }).catch(function () {})
    }

    // ---------- 启动 ----------

    $("search").addEventListener("input", renderAll)
    $("tabs").addEventListener("click", function (event) {
        var target = event.target.closest("button")
        if (!target) return
        tab = target.getAttribute("data-tab")
        renderAll()
    })
    $("backdrop").onclick = closeSheet
    $("d-favorite").onclick = toggleFavorite
    $("d-share").onclick = share
    window.addEventListener("gistbit:env", function (event) {
        setLanguage(event.detail)
    })

    setLanguage(gistbit.env)
    gistbit
        .call("storage.get", { key: "favorites" })
        .then(function (value) {
            favorites = Array.isArray(value) ? value.filter(Number.isInteger) : []
            renderAll()
        })
        .catch(function () {})
})()
