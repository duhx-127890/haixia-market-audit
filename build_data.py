# -*- coding: utf-8 -*-
"""从《水产批发市场明细.xlsx》构建站点数据 assets/js/data.js
数据口径：
- 经纬度采用"标注名称"列（表格第二组经纬度存在逐行错位，已校验）
- 城市勘误：'无心'→无锡、'河南'→郑州
- 名称勘误：site_id=23 原表以地址登记，规范名称为"成都通威三联水产品市场"
- 级别/品类/能力为公开资料核查结果，置信度逐条标注
"""
import json, io

import openpyxl

SRC = "/Users/duhaixin/Downloads/水产批发市场明细.xlsx"
OUT = "/Users/duhaixin/Downloads/海峡市场核查/assets/js/data.js"

wb = openpyxl.load_workbook(SRC, data_only=True)
ws = wb["Sheet1"]

CITY_FIX = {"无心": "无锡", "河南": "郑州"}

# ---------- 核查富化数据（公开资料整理，置信度见 source 字段） ----------
ENRICH = {
    1: dict(tier=1, tierLabel="一级批发市场",
            scale="深圳规模最大的水产综合批发市场，华南重要集散节点",
            cats=["活鲜", "冰鲜", "贝类", "冻品", "干货", "进口海鲜"], status="已核查·公开资料",
            extra=[dict(label="市场定位", value="深圳最大水产批发市场", source="公开资料", conf="中")]),
    2: dict(tier=1, tierLabel="一级批发市场",
            scale="珠三角大型水产批发市场，虎门港物流腹地",
            cats=["活鲜", "冰鲜", "冻品", "贝类", "干货"], status="已核查·公开资料",
            extra=[dict(label="市场定位", value="东莞最大水产批发市场", source="公开资料", conf="中")]),
    3: dict(tier=1, tierLabel="一级批发市场（国家级）",
            scale="全国规模最大的水产品交易中心（马尾），海陆集散枢纽",
            cats=["活鲜", "冰鲜", "贝类", "冻品", "干货", "海捕", "加工品/预制菜", "进口海鲜"], status="已核查·公开报道",
            extra=[dict(label="年交易量", value="约200万吨", source="公开报道", conf="中")]),
    4: dict(tier=1, tierLabel="一级批发市场",
            scale="厦门唯一规模化国际水产交易平台，闽南集散中心",
            cats=["活鲜", "冰鲜", "冻品", "贝类", "干货", "进口海鲜"], status="已核查·公开报道",
            extra=[dict(label="年交易额", value="超百亿元", source="公开报道", conf="中")]),
    5: dict(tier=1, tierLabel="一级批发市场（省级）",
            scale="浙江省鲜活水产品批发源头市场，年成交额70余亿元",
            cats=["活鲜", "冰鲜", "贝类", "冻品", "干货", "河鲜"], status="已核查·官方口径",
            extra=[dict(label="年成交额", value="70余亿元", source="官方行业协会", conf="高")]),
    6: dict(tier=1, tierLabel="一级批发市场（区域）",
            scale="西北地区规模最大的海鲜批发市场",
            cats=["活鲜", "冻品", "干货", "贝类", "河鲜"], status="已核查·公开资料",
            extra=[dict(label="市场定位", value="西北最大海鲜批发市场", source="公开资料", conf="中")]),
    7: dict(tier=1, tierLabel="一级批发市场",
            scale="武汉规模最大的水产批发市场（汉口北）",
            cats=["活鲜", "冰鲜", "冻品", "河鲜", "干货", "贝类"], status="已核查·公开资料",
            extra=[dict(label="市场定位", value="武汉最大水产批发市场", source="公开资料", conf="中")]),
    8: dict(tier=1, tierLabel="一级批发市场",
            scale="青岛最大的活海鲜批发交易市场",
            cats=["活鲜", "贝类", "冰鲜", "海捕", "干货"], status="已核查·公开资料",
            extra=[dict(label="市场定位", value="青岛最大活海鲜批发市场", source="公开资料", conf="中")]),
    9: dict(tier=1, tierLabel="一级批发市场",
            scale="南京最大农产品物流中心，华东重要农批枢纽",
            cats=["活鲜", "冰鲜", "冻品", "干货", "河鲜", "贝类"], status="已核查·公开资料",
            extra=[dict(label="市场定位", value="南京最大农产品批发市场", source="公开资料", conf="中")]),
    10: dict(tier=3, tierLabel="三级市场（城区终端）",
             scale="城区终端零售型海鲜市场，服务周边社区居民",
             cats=["活鲜", "贝类", "海捕", "冰鲜"], status="已核查·公开资料",
             extra=[dict(label="市场定位", value="青岛埠西片区零售海鲜市场", source="公开资料", conf="中")]),
    11: dict(tier=1, tierLabel="一级批发市场（城市）",
             scale="南宁主城区规模最大的海鲜批发市场",
             cats=["活鲜", "冰鲜", "冻品", "干货", "贝类"], status="已核查·公开资料",
             extra=[dict(label="市场定位", value="南宁主要海鲜批发市场", source="公开资料", conf="中")]),
    12: dict(tier=1, tierLabel="一级批发市场",
             scale="苏州最大农产品批发市场，水产交易区规模居首",
             cats=["活鲜", "冰鲜", "冻品", "河鲜", "贝类", "干货"], status="已核查·公开资料",
             extra=[dict(label="市场定位", value="苏州最大农批·水产交易区", source="公开资料", conf="中")]),
    13: dict(tier=1, tierLabel="一级批发市场（城市）",
             scale="上海中心城区以北最大水产批发市场群",
             cats=["活鲜", "冰鲜", "冻品", "贝类", "干货", "进口海鲜"], status="已核查·公开资料",
             extra=[dict(label="市场定位", value="上海主要水产批发市场群", source="公开资料", conf="中")]),
    14: dict(tier=1, tierLabel="一级批发市场",
             scale="合肥最大农产品物流园，水产板块区域集散",
             cats=["活鲜", "冰鲜", "冻品", "河鲜", "干货"], status="已核查·公开资料",
             extra=[dict(label="市场定位", value="合肥最大农产品物流园", source="公开资料", conf="中")]),
    15: dict(tier=1, tierLabel="一级批发市场",
             scale="南通最大农副产品批发中心，水产肉类供销两旺",
             cats=["活鲜", "冰鲜", "冻品", "贝类", "海捕"], status="已核查·公开资料",
             extra=[dict(label="市场定位", value="南通最大农副产品批发中心", source="南通日报", conf="中")]),
    16: dict(tier=1, tierLabel="一级批发市场",
             scale="无锡最大农产品批发市场，水产区年交易额数十亿元",
             cats=["活鲜", "冰鲜", "冻品", "河鲜", "贝类", "干货"], status="已核查·公开资料",
             extra=[dict(label="年交易额", value="数十亿元（市场整体）", source="公开资料", conf="中")]),
    17: dict(tier=2, tierLabel="二级批发市场（产地型）",
             scale="潮阳产地收购型市场，辐射粤东与闽西南",
             cats=["活鲜", "冰鲜", "海捕", "贝类"], status="待实地复核",
             extra=[dict(label="市场定位", value="产地收购集散市场", source="公开资料", conf="低")]),
    18: dict(tier=1, tierLabel="一级批发市场",
             scale="粤东重要水产批发与冷链集散平台",
             cats=["活鲜", "冰鲜", "冻品", "干货"], status="已核查·公开资料",
             extra=[dict(label="市场定位", value="粤东水产批发+冷链物流", source="公开资料", conf="中")]),
    19: dict(tier=2, tierLabel="二级批发市场（产地码头）",
             scale="台山广海湾产地渔港码头型市场，一手海捕货源",
             cats=["海捕", "活鲜", "冰鲜", "贝类", "干货"], status="已核查·公开资料",
             extra=[dict(label="市场定位", value="产地渔港码头市场", source="公开资料", conf="中")]),
    20: dict(tier=1, tierLabel="一级批发市场（区域）",
             scale="珠江西岸最大水产产业综合体",
             cats=["活鲜", "冰鲜", "冻品", "干货", "贝类"], status="已核查·公开报道",
             extra=[dict(label="市场定位", value="珠江西岸最大水产产业综合体", source="开业报道", conf="中")]),
    21: dict(tier=1, tierLabel="一级批发市场",
             scale="重庆规模最大的水产综合交易市场",
             cats=["活鲜", "冻品", "干货", "河鲜", "贝类"], status="已核查·公开资料",
             extra=[dict(label="市场定位", value="重庆最大水产综合市场", source="公开资料", conf="中")]),
    22: dict(tier=2, tierLabel="二级批发市场（城市分销）",
             scale="成都市区历史最久的水产批发市场，现以城市分销与零售为主",
             cats=["活鲜", "冻品", "干货", "河鲜", "贝类"], status="已核查·公开资料",
             extra=[dict(label="市场定位", value="成都市区分销+零售市场", source="公开资料", conf="中")]),
    23: dict(tier=1, tierLabel="一级批发市场（区域）",
             scale="西南规模最大的水产批发市场（通威三联），原表以地址登记",
             cats=["活鲜", "冰鲜", "冻品", "河鲜", "干货", "贝类"], status="已核查·公开资料",
             extra=[dict(label="市场定位", value="西南最大水产批发市场", source="公开资料", conf="中")]),
    24: dict(tier=1, tierLabel="一级批发市场（城市）",
             scale="贵阳主城区最主要的水产品批发市场",
             cats=["活鲜", "冻品", "干货", "河鲜"], status="已核查·公开资料",
             extra=[dict(label="市场定位", value="贵阳主要水产批发市场", source="公开资料", conf="中")]),
    25: dict(tier=1, tierLabel="一级批发市场（区域）",
             scale="云南最大干菜副食水产品市场，旺季日交易额超5000万元",
             cats=["冻品", "干货", "活鲜", "河鲜"], status="已核查·官方口径",
             extra=[dict(label="旺季日交易额", value="超5000万元", source="官方报道", conf="高")]),
    26: dict(tier=1, tierLabel="一级批发市场（区域）",
             scale="中部最大农产品物流城，水产板块为区域枢纽",
             cats=["活鲜", "冻品", "干货", "河鲜", "贝类"], status="已核查·公开资料",
             extra=[dict(label="市场定位", value="中部最大农产品物流城", source="公开资料", conf="中")]),
    27: dict(tier=1, tierLabel="一级批发市场",
             scale="北京大红门区域最大的海鲜批发市场",
             cats=["活鲜", "冻品", "干货", "贝类", "进口海鲜"], status="已核查·公开资料",
             extra=[dict(label="市场定位", value="北京主要海鲜批发市场", source="公开资料", conf="中")]),
    28: dict(tier=1, tierLabel="一级批发市场",
             scale="天津最大的海鲜批发市场（新红旗市场群）",
             cats=["活鲜", "冻品", "干货", "贝类"], status="已核查·公开资料",
             extra=[dict(label="年交易额", value="百亿级（历史口径）", source="北方网·2009", conf="中")]),
    29: dict(tier=2, tierLabel="二级批发市场（城市分销）",
             scale="石家庄主要海鲜批发兼零售市场之一",
             cats=["活鲜", "冻品", "干货", "贝类"], status="已核查·公开资料",
             extra=[dict(label="市场定位", value="石家庄四大海鲜市场之一", source="公开资料", conf="中")]),
    30: dict(tier=1, tierLabel="一级批发市场（国家级）",
             scale="华南最大、全国性水产集散中心，日均约600吨供应全国",
             cats=["活鲜", "冰鲜", "贝类", "冻品", "干货", "进口海鲜", "加工品"], status="已核查·官方口径",
             extra=[dict(label="日均供应量", value="约600吨", source="广州市政府", conf="高")]),
}

NAME_FIX = {
    23: ("成都通威三联水产品市场", "原表以地址登记，规范名称为成都通威三联水产品市场（成洛大道5999号）"),
}

# ---------- 城市 → 省份（覆盖城市列表高亮用，与 GeoJSON name 对齐） ----------
PROV = {
    "北京市": ["北京市"], "天津市": ["天津市"], "上海市": ["上海市"], "重庆市": ["重庆市"],
    "河北省": ["石家庄市", "唐山市", "秦皇岛市", "邯郸市", "邢台市", "保定市", "张家口市", "承德市", "沧州市", "廊坊市", "衡水市"],
    "山西省": ["太原市", "大同市", "阳泉市", "长治市", "晋城市", "朔州市", "晋中市", "运城市", "忻州市", "临汾市", "吕梁市"],
    "江苏省": ["南京市", "无锡市", "徐州市", "常州市", "苏州市", "南通市", "连云港市", "淮安市", "盐城市", "扬州市", "镇江市", "泰州市", "宿迁市"],
    "浙江省": ["杭州市", "宁波市", "温州市", "嘉兴市", "湖州市", "绍兴市", "金华市", "衢州市", "舟山市", "台州市", "丽水市"],
    "安徽省": ["合肥市", "芜湖市", "蚌埠市", "淮南市", "马鞍山市", "淮北市", "铜陵市", "安庆市", "黄山市", "滁州市", "阜阳市", "宿州市", "六安市", "亳州市", "池州市", "宣城市"],
    "福建省": ["福州市", "厦门市", "莆田市", "三明市", "泉州市", "漳州市", "南平市", "龙岩市", "宁德市"],
    "江西省": ["南昌市", "景德镇市", "萍乡市", "九江市", "新余市", "鹰潭市", "赣州市", "吉安市", "宜春市", "抚州市", "上饶市"],
    "山东省": ["济南市", "青岛市", "淄博市", "枣庄市", "东营市", "烟台市", "潍坊市", "济宁市", "泰安市", "威海市", "日照市", "临沂市", "德州市", "聊城市", "滨州市", "菏泽市"],
    "河南省": ["郑州市", "开封市", "洛阳市", "平顶山市", "安阳市", "鹤壁市", "新乡市", "焦作市", "濮阳市", "许昌市", "漯河市", "三门峡市", "南阳市", "商丘市", "信阳市", "周口市", "驻马店市", "济源市"],
    "湖北省": ["武汉市", "黄石市", "十堰市", "宜昌市", "襄阳市", "鄂州市", "荆门市", "孝感市", "荆州市", "黄冈市", "咸宁市", "随州市", "恩施土家族苗族自治州", "仙桃市", "潜江市", "天门市"],
    "湖南省": ["长沙市", "株洲市", "湘潭市", "衡阳市", "邵阳市", "岳阳市", "常德市", "张家界市", "益阳市", "郴州市", "永州市", "怀化市", "娄底市", "湘西土家族苗族自治州"],
    "广东省": ["广州市", "深圳市", "珠海市", "汕头市", "佛山市", "韶关市", "湛江市", "肇庆市", "江门市", "茂名市", "惠州市", "梅州市", "汕尾市", "河源市", "阳江市", "清远市", "东莞市", "中山市", "潮州市", "揭阳市", "云浮市"],
    "广西壮族自治区": ["南宁市", "柳州市", "桂林市", "梧州市", "北海市", "防城港市", "钦州市", "贵港市", "玉林市", "百色市", "贺州市", "河池市", "来宾市", "崇左市"],
    "四川省": ["成都市", "自贡市", "攀枝花市", "泸州市", "德阳市", "绵阳市", "广元市", "遂宁市", "内江市", "乐山市", "南充市", "眉山市", "宜宾市", "广安市", "达州市", "雅安市", "巴中市", "资阳市", "阿坝藏族羌族自治州", "甘孜藏族自治州", "凉山彝族自治州"],
    "贵州省": ["贵阳市", "六盘水市", "遵义市", "安顺市", "毕节市", "铜仁市", "黔西南布依族苗族自治州", "黔东南苗族侗族自治州", "黔南布依族苗族自治州"],
    "云南省": ["昆明市", "曲靖市", "玉溪市", "保山市", "昭通市", "丽江市", "普洱市", "临沧市", "楚雄彝族自治州", "红河哈尼族彝族自治州", "文山壮族苗族自治州", "西双版纳傣族自治州", "大理白族自治州", "德宏傣族景颇族自治州", "怒江傈僳族自治州", "迪庆藏族自治州"],
    "陕西省": ["西安市", "铜川市", "宝鸡市", "咸阳市", "渭南市", "延安市", "汉中市", "榆林市", "安康市", "商洛市"],
    "甘肃省": ["兰州市", "嘉峪关市", "金昌市", "白银市", "天水市", "武威市", "张掖市", "平凉市", "酒泉市", "庆阳市", "定西市", "陇南市", "临夏回族自治州", "甘南藏族自治州"],
}
CITY2PROV = {c: p for p, cs in PROV.items() for c in cs}


def grade_of(plan):
    return "S" if plan >= 60 else "A" if plan >= 40 else "B" if plan >= 20 else "C"


markets, rows = [], []
for row in ws.iter_rows(min_row=2, max_row=31, values_only=True):
    rows.append(row)

for row in rows:
    (_, city, reg_name, addr, lng, lat, site_id, mkt_name, _, _, _, cover_raw, plan) = row
    sid = int(site_id)
    city = CITY_FIX.get(city, city)
    e = ENRICH[sid]
    name, name_note = NAME_FIX.get(sid, (mkt_name.strip(), None))
    coverage = json.loads(cover_raw)
    provs = sorted({CITY2PROV.get(c) for c in coverage if CITY2PROV.get(c)})
    unknown = [c for c in coverage if not CITY2PROV.get(c)]
    if unknown:
        print("WARN unknown cities for", sid, unknown)
    figures = [dict(label="辐射城市", value=f"{len(coverage)} 城", unit="", source="台账明细", conf="高")]
    figures += e["extra"]
    markets.append(dict(
        id=sid, city=city, name=name, regName=reg_name.strip(), nameNote=name_note,
        address=addr.strip(), lng=round(lng, 6), lat=round(lat, 6),
        coverage=coverage, provinces=provs,
        tier=e["tier"], tierLabel=e["tierLabel"], scale=e["scale"], cats=e["cats"],
        status=e["status"], figures=figures, grade=grade_of(plan), source="ledger",
        conclusion=f"{city}·{name}为{e['tierLabel']}，主营{'、'.join(e['cats'][:4])}；台账辐射 {len(coverage)} 座城市，规模等级 {grade_of(plan)}。",
    ))

cities = sorted({m["city"] for m in markets})
coverage_cities = sorted({c for m in markets for c in m["coverage"]})
tier_count = {1: 0, 2: 0, 3: 0}
grade_count = {"S": 0, "A": 0, "B": 0, "C": 0}
for m in markets:
    tier_count[m["tier"]] += 1
    grade_count[m["grade"]] += 1
cat_count = {}
for m in markets:
    for c in m["cats"]:
        cat_count[c] = cat_count.get(c, 0) + 1
cats_sorted = sorted(cat_count.items(), key=lambda x: -x[1])

print("markets:", len(markets), "| cities:", len(cities), "| coverage cities:", len(coverage_cities),
      "| tier:", tier_count, "| grade:", grade_count)

js = "/* 自动生成：build_data.py · 数据来源《水产批发市场明细.xlsx》+ 公开资料核查（含置信度标注） */\n"
js += f"window.AUDIT = {{generated: '2026-10', sourceFile: '水产批发市场明细.xlsx',"
js += f" tierCount: {json.dumps(tier_count, ensure_ascii=False)}, gradeCount: {json.dumps(grade_count, ensure_ascii=False)},"
js += f" catCount: {json.dumps([list(x) for x in cats_sorted], ensure_ascii=False)},\n"
js += f"cities: {json.dumps(cities, ensure_ascii=False)},\n"
js += f"coverageCityCount: {len(coverage_cities)},\n"
js += "markets: " + json.dumps(markets, ensure_ascii=False, indent=1) + ",\n"
js += "CITY2PROV: " + json.dumps(CITY2PROV, ensure_ascii=False) + "\n};\n"

with io.open(OUT, "w", encoding="utf-8") as f:
    f.write(js)
print("written:", OUT, len(js), "chars")
