// 元素数据：[符号, 英文名, 中文名, 相对原子质量, 分类]，按原子序数排列（下标 + 1 = 原子序数）。
// 相对原子质量取 IUPAC 标准值（四到五位有效数字）；没有稳定同位素的写最稳定同位素的质量数，显示时加方括号。
// 分类：alkali 碱金属、alkaline 碱土金属、transition 过渡金属、post 后过渡金属、metalloid 类金属、
// nonmetal 非金属、halogen 卤素、noble 稀有气体、lanthanide 镧系、actinide 锕系、unknown 性质未知
;(function () {
    var R = true // 放射性、没有标准相对原子质量：质量数加方括号
    var raw = [
        ["H", "Hydrogen", "氢", 1.008, "nonmetal"],
        ["He", "Helium", "氦", 4.0026, "noble"],
        ["Li", "Lithium", "锂", 6.94, "alkali"],
        ["Be", "Beryllium", "铍", 9.0122, "alkaline"],
        ["B", "Boron", "硼", 10.81, "metalloid"],
        ["C", "Carbon", "碳", 12.011, "nonmetal"],
        ["N", "Nitrogen", "氮", 14.007, "nonmetal"],
        ["O", "Oxygen", "氧", 15.999, "nonmetal"],
        ["F", "Fluorine", "氟", 18.998, "halogen"],
        ["Ne", "Neon", "氖", 20.18, "noble"],
        ["Na", "Sodium", "钠", 22.99, "alkali"],
        ["Mg", "Magnesium", "镁", 24.305, "alkaline"],
        ["Al", "Aluminium", "铝", 26.982, "post"],
        ["Si", "Silicon", "硅", 28.085, "metalloid"],
        ["P", "Phosphorus", "磷", 30.974, "nonmetal"],
        ["S", "Sulfur", "硫", 32.06, "nonmetal"],
        ["Cl", "Chlorine", "氯", 35.45, "halogen"],
        ["Ar", "Argon", "氩", 39.948, "noble"],
        ["K", "Potassium", "钾", 39.098, "alkali"],
        ["Ca", "Calcium", "钙", 40.078, "alkaline"],
        ["Sc", "Scandium", "钪", 44.956, "transition"],
        ["Ti", "Titanium", "钛", 47.867, "transition"],
        ["V", "Vanadium", "钒", 50.942, "transition"],
        ["Cr", "Chromium", "铬", 51.996, "transition"],
        ["Mn", "Manganese", "锰", 54.938, "transition"],
        ["Fe", "Iron", "铁", 55.845, "transition"],
        ["Co", "Cobalt", "钴", 58.933, "transition"],
        ["Ni", "Nickel", "镍", 58.693, "transition"],
        ["Cu", "Copper", "铜", 63.546, "transition"],
        ["Zn", "Zinc", "锌", 65.38, "transition"],
        ["Ga", "Gallium", "镓", 69.723, "post"],
        ["Ge", "Germanium", "锗", 72.63, "metalloid"],
        ["As", "Arsenic", "砷", 74.922, "metalloid"],
        ["Se", "Selenium", "硒", 78.971, "nonmetal"],
        ["Br", "Bromine", "溴", 79.904, "halogen"],
        ["Kr", "Krypton", "氪", 83.798, "noble"],
        ["Rb", "Rubidium", "铷", 85.468, "alkali"],
        ["Sr", "Strontium", "锶", 87.62, "alkaline"],
        ["Y", "Yttrium", "钇", 88.906, "transition"],
        ["Zr", "Zirconium", "锆", 91.224, "transition"],
        ["Nb", "Niobium", "铌", 92.906, "transition"],
        ["Mo", "Molybdenum", "钼", 95.95, "transition"],
        ["Tc", "Technetium", "锝", 98, "transition", R],
        ["Ru", "Ruthenium", "钌", 101.07, "transition"],
        ["Rh", "Rhodium", "铑", 102.91, "transition"],
        ["Pd", "Palladium", "钯", 106.42, "transition"],
        ["Ag", "Silver", "银", 107.87, "transition"],
        ["Cd", "Cadmium", "镉", 112.41, "transition"],
        ["In", "Indium", "铟", 114.82, "post"],
        ["Sn", "Tin", "锡", 118.71, "post"],
        ["Sb", "Antimony", "锑", 121.76, "metalloid"],
        ["Te", "Tellurium", "碲", 127.6, "metalloid"],
        ["I", "Iodine", "碘", 126.9, "halogen"],
        ["Xe", "Xenon", "氙", 131.29, "noble"],
        ["Cs", "Caesium", "铯", 132.91, "alkali"],
        ["Ba", "Barium", "钡", 137.33, "alkaline"],
        ["La", "Lanthanum", "镧", 138.91, "lanthanide"],
        ["Ce", "Cerium", "铈", 140.12, "lanthanide"],
        ["Pr", "Praseodymium", "镨", 140.91, "lanthanide"],
        ["Nd", "Neodymium", "钕", 144.24, "lanthanide"],
        ["Pm", "Promethium", "钷", 145, "lanthanide", R],
        ["Sm", "Samarium", "钐", 150.36, "lanthanide"],
        ["Eu", "Europium", "铕", 151.96, "lanthanide"],
        ["Gd", "Gadolinium", "钆", 157.25, "lanthanide"],
        ["Tb", "Terbium", "铽", 158.93, "lanthanide"],
        ["Dy", "Dysprosium", "镝", 162.5, "lanthanide"],
        ["Ho", "Holmium", "钬", 164.93, "lanthanide"],
        ["Er", "Erbium", "铒", 167.26, "lanthanide"],
        ["Tm", "Thulium", "铥", 168.93, "lanthanide"],
        ["Yb", "Ytterbium", "镱", 173.05, "lanthanide"],
        ["Lu", "Lutetium", "镥", 174.97, "lanthanide"],
        ["Hf", "Hafnium", "铪", 178.49, "transition"],
        ["Ta", "Tantalum", "钽", 180.95, "transition"],
        ["W", "Tungsten", "钨", 183.84, "transition"],
        ["Re", "Rhenium", "铼", 186.21, "transition"],
        ["Os", "Osmium", "锇", 190.23, "transition"],
        ["Ir", "Iridium", "铱", 192.22, "transition"],
        ["Pt", "Platinum", "铂", 195.08, "transition"],
        ["Au", "Gold", "金", 196.97, "transition"],
        ["Hg", "Mercury", "汞", 200.59, "transition"],
        ["Tl", "Thallium", "铊", 204.38, "post"],
        ["Pb", "Lead", "铅", 207.2, "post"],
        ["Bi", "Bismuth", "铋", 208.98, "post"],
        ["Po", "Polonium", "钋", 209, "post", R],
        ["At", "Astatine", "砹", 210, "halogen", R],
        ["Rn", "Radon", "氡", 222, "noble", R],
        ["Fr", "Francium", "钫", 223, "alkali", R],
        ["Ra", "Radium", "镭", 226, "alkaline", R],
        ["Ac", "Actinium", "锕", 227, "actinide", R],
        ["Th", "Thorium", "钍", 232.04, "actinide"],
        ["Pa", "Protactinium", "镤", 231.04, "actinide"],
        ["U", "Uranium", "铀", 238.03, "actinide"],
        ["Np", "Neptunium", "镎", 237, "actinide", R],
        ["Pu", "Plutonium", "钚", 244, "actinide", R],
        ["Am", "Americium", "镅", 243, "actinide", R],
        ["Cm", "Curium", "锔", 247, "actinide", R],
        ["Bk", "Berkelium", "锫", 247, "actinide", R],
        ["Cf", "Californium", "锎", 251, "actinide", R],
        ["Es", "Einsteinium", "锿", 252, "actinide", R],
        ["Fm", "Fermium", "镄", 257, "actinide", R],
        ["Md", "Mendelevium", "钔", 258, "actinide", R],
        ["No", "Nobelium", "锘", 259, "actinide", R],
        ["Lr", "Lawrencium", "铹", 266, "actinide", R],
        ["Rf", "Rutherfordium", "𬬻", 267, "transition", R],
        ["Db", "Dubnium", "𬭊", 268, "transition", R],
        ["Sg", "Seaborgium", "𬭳", 269, "transition", R],
        ["Bh", "Bohrium", "𬭛", 270, "transition", R],
        ["Hs", "Hassium", "𬭶", 269, "transition", R],
        ["Mt", "Meitnerium", "鿏", 278, "unknown", R],
        ["Ds", "Darmstadtium", "𫟼", 281, "unknown", R],
        ["Rg", "Roentgenium", "𬬭", 282, "unknown", R],
        ["Cn", "Copernicium", "鿔", 285, "unknown", R],
        ["Nh", "Nihonium", "鿭", 286, "unknown", R],
        ["Fl", "Flerovium", "𫓧", 289, "unknown", R],
        ["Mc", "Moscovium", "镆", 290, "unknown", R],
        ["Lv", "Livermorium", "𫟷", 293, "unknown", R],
        ["Ts", "Tennessine", "鿬", 294, "unknown", R],
        ["Og", "Oganesson", "鿫", 294, "unknown", R],
    ]

    // ---------- 周期、族、在表里的位置 ----------

    var PERIOD_END = [2, 10, 18, 36, 54, 86, 118]
    function periodOf(z) {
        for (var i = 0; i < PERIOD_END.length; i++) if (z <= PERIOD_END[i]) return i + 1
    }
    /** 族（1–18）；镧系、锕系（57–71、89–103）返回 null */
    function groupOf(z) {
        if (z === 1) return 1
        if (z === 2) return 18
        var p = periodOf(z)
        var start = p === 1 ? 1 : PERIOD_END[p - 2] + 1
        var i = z - start
        if (p <= 3) return i < 2 ? i + 1 : i + 11
        if (p <= 5) return i + 1
        if (i < 2) return i + 1
        if (i <= 16) return null
        return i - 13
    }
    /** 表格里的行、列（从 1 开始）；镧系在第 9 行、锕系在第 10 行，第 3–17 列 */
    function cellOf(z) {
        if (z >= 57 && z <= 71) return { row: 9, col: z - 57 + 3 }
        if (z >= 89 && z <= 103) return { row: 10, col: z - 89 + 3 }
        return { row: periodOf(z), col: groupOf(z) }
    }

    // ---------- 电子排布（按构造原理，加上已知的例外） ----------

    var ORDER = ["1s", "2s", "2p", "3s", "3p", "4s", "3d", "4p", "5s", "4d", "5p", "6s", "4f", "5d", "6p", "7s", "5f", "6d", "7p"]
    var CAPACITY = { s: 2, p: 6, d: 10, f: 14 }
    var CORES = [
        [86, "[Rn]"],
        [54, "[Xe]"],
        [36, "[Kr]"],
        [18, "[Ar]"],
        [10, "[Ne]"],
        [2, "[He]"],
    ]
    var EXCEPTIONS = {
        24: "[Ar] 3d5 4s1",
        29: "[Ar] 3d10 4s1",
        41: "[Kr] 4d4 5s1",
        42: "[Kr] 4d5 5s1",
        44: "[Kr] 4d7 5s1",
        45: "[Kr] 4d8 5s1",
        46: "[Kr] 4d10",
        47: "[Kr] 4d10 5s1",
        57: "[Xe] 5d1 6s2",
        58: "[Xe] 4f1 5d1 6s2",
        64: "[Xe] 4f7 5d1 6s2",
        78: "[Xe] 4f14 5d9 6s1",
        79: "[Xe] 4f14 5d10 6s1",
        89: "[Rn] 6d1 7s2",
        90: "[Rn] 6d2 7s2",
        91: "[Rn] 5f2 6d1 7s2",
        92: "[Rn] 5f3 6d1 7s2",
        93: "[Rn] 5f4 6d1 7s2",
        96: "[Rn] 5f7 6d1 7s2",
        103: "[Rn] 5f14 7s2 7p1",
    }
    function configOf(z) {
        if (EXCEPTIONS[z]) return EXCEPTIONS[z]
        var filled = []
        var left = z
        for (var i = 0; i < ORDER.length && left > 0; i++) {
            var n = Math.min(CAPACITY[ORDER[i][1]], left)
            filled.push([ORDER[i], n])
            left -= n
        }
        var core = null
        for (var c = 0; c < CORES.length; c++) {
            if (CORES[c][0] < z) {
                core = CORES[c]
                break
            }
        }
        // 去掉内层（稀有气体部分），剩下的按主量子数、角量子数排
        var skip = core ? core[0] : 0
        var rest = []
        filled.forEach(function (item) {
            var take = Math.min(item[1], skip)
            skip -= take
            if (item[1] - take > 0) rest.push([item[0], item[1] - take])
        })
        rest.sort(function (a, b) {
            return a[0][0] - b[0][0] || "spdf".indexOf(a[0][1]) - "spdf".indexOf(b[0][1])
        })
        var parts = rest.map(function (item) {
            return item[0] + item[1]
        })
        return (core ? core[1] + " " : "") + parts.join(" ")
    }

    window.ELEMENTS = raw.map(function (item, index) {
        var z = index + 1
        return {
            z: z,
            symbol: item[0],
            en: item[1],
            zh: item[2],
            mass: item[5] ? "[" + item[3] + "]" : String(item[3]),
            category: item[4],
            period: periodOf(z),
            group: groupOf(z),
            cell: cellOf(z),
            config: configOf(z),
        }
    })
})()
