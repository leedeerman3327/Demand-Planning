import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const scenarios = [
  { key: "optimistic", label: "乐观", color: "#0f766e" },
  { key: "baseline", label: "客观", color: "#2563eb" },
  { key: "pessimistic", label: "悲观", color: "#b45309" },
];

const tabs = [
  { key: "project", label: "项目设置" },
  { key: "tier", label: "档位空间" },
  { key: "fourP", label: "4P 分析" },
];

const inputClass =
  "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-4 focus:ring-slate-100";

const initialProject = {
  productName: "Hendry4",
  targetMarket: "中国",
  forecastPeriod: "2026H1",
  planner: "",
  notes: "",
};

const initialTier = {
  marketTotal: {
    optimistic: { value: 3500, probability: 20 },
    baseline: { value: 3200, probability: 60 },
    pessimistic: { value: 2800, probability: 20 },
  },
  tierShare: {
    optimistic: { value: 18, probability: 20 },
    baseline: { value: 15, probability: 60 },
    pessimistic: { value: 12, probability: 20 },
  },
  ourShare: {
    optimistic: { value: 20, probability: 20 },
    baseline: { value: 13, probability: 60 },
    pessimistic: { value: 9, probability: 20 },
  },
};

const initialFourP = {
  prevProductName: "Hendry3",
  prevSales: 85,
  product: {
    optimistic: { value: 15, probability: 20 },
    baseline: { value: 10, probability: 60 },
    pessimistic: { value: 5, probability: 20 },
  },
  price: {
    optimistic: { value: 5, probability: 20 },
    baseline: { value: -2, probability: 60 },
    pessimistic: { value: -8, probability: 20 },
  },
  place: {
    optimistic: { value: 8, probability: 20 },
    baseline: { value: 5, probability: 60 },
    pessimistic: { value: 1, probability: 20 },
  },
  promotion: {
    optimistic: { value: 10, probability: 20 },
    baseline: { value: 2, probability: 60 },
    pessimistic: { value: -4, probability: 20 },
  },
  marketChange: {
    optimistic: { value: 8, probability: 20 },
    baseline: { value: 3, probability: 60 },
    pessimistic: { value: -2, probability: 20 },
  },
};

function formatUnits(value) {
  return value == null || Number.isNaN(value) ? "待完善" : `${value.toFixed(1)} 万台`;
}

function formatPercent(value) {
  return value == null || Number.isNaN(value) ? "—" : `${value.toFixed(1)}%`;
}

function parseNumber(value) {
  return value === "" ? null : Number.isNaN(Number(value)) ? null : Number(value);
}

function compareDelta(a, b) {
  return a == null || b == null || b === 0 ? null : (Math.abs(a - b) / Math.abs(b)) * 100;
}

function buildTierPaths(tier) {
  const leaves = [];
  for (const a of scenarios) {
    for (const b of scenarios) {
      for (const c of scenarios) {
        const market = tier.marketTotal[a.key];
        const share = tier.tierShare[b.key];
        const our = tier.ourShare[c.key];
        if ([market.value, share.value, our.value].some((v) => v == null)) continue;
        leaves.push({
          id: `${a.key}-${b.key}-${c.key}`,
          path: [
            { label: "大盘总量", scenario: a.label, value: market.value, suffix: " 万台", probability: market.probability },
            { label: "目标档位占比", scenario: b.label, value: share.value, suffix: "%", probability: share.probability },
            { label: "我方份额", scenario: c.label, value: our.value, suffix: "%", probability: our.probability },
          ],
          probability: (market.probability / 100) * (share.probability / 100) * (our.probability / 100),
          result: market.value * (share.value / 100) * (our.value / 100),
        });
      }
    }
  }
  return leaves.sort((x, y) => y.probability - x.probability);
}

function buildFourPPaths(fourP) {
  const leaves = [];
  for (const a of scenarios) {
    for (const b of scenarios) {
      for (const c of scenarios) {
        for (const d of scenarios) {
          for (const e of scenarios) {
            const product = fourP.product[a.key];
            const price = fourP.price[b.key];
            const place = fourP.place[c.key];
            const promotion = fourP.promotion[d.key];
            const market = fourP.marketChange[e.key];
            if ([fourP.prevSales, product.value, price.value, place.value, promotion.value, market.value].some((v) => v == null)) continue;
            const result =
              fourP.prevSales *
              (1 + product.value / 100) *
              (1 + price.value / 100) *
              (1 + place.value / 100) *
              (1 + promotion.value / 100) *
              (1 + market.value / 100);
            leaves.push({
              id: `${a.key}-${b.key}-${c.key}-${d.key}-${e.key}`,
              path: [
                { label: "Product", scenario: a.label, value: product.value, suffix: "%", probability: product.probability },
                { label: "Price", scenario: b.label, value: price.value, suffix: "%", probability: price.probability },
                { label: "Place", scenario: c.label, value: place.value, suffix: "%", probability: place.probability },
                { label: "Promotion", scenario: d.label, value: promotion.value, suffix: "%", probability: promotion.probability },
                { label: "大盘变化", scenario: e.label, value: market.value, suffix: "%", probability: market.probability },
              ],
              probability:
                (product.probability / 100) *
                (price.probability / 100) *
                (place.probability / 100) *
                (promotion.probability / 100) *
                (market.probability / 100),
              result,
            });
          }
        }
      }
    }
  }
  return leaves.sort((x, y) => y.probability - x.probability);
}

function summarize(paths) {
  if (!paths.length) return null;
  const ordered = [...paths].sort((a, b) => a.result - b.result);
  const expected = paths.reduce((sum, item) => sum + item.result * item.probability, 0);
  return { expected, min: ordered[0], max: ordered[ordered.length - 1] };
}

function Card({ label, value }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
      <div className="text-xs uppercase tracking-[0.16em] text-slate-400">{label}</div>
      <div className="mt-2 text-lg font-semibold text-slate-900">{value}</div>
    </div>
  );
}

export default function App() {
  const [tab, setTab] = useState("project");
  const [project, setProject] = useState(initialProject);
  const [tier, setTier] = useState(initialTier);
  const [fourP, setFourP] = useState(initialFourP);
  const [selectedTierId, setSelectedTierId] = useState(null);
  const [selectedFourPId, setSelectedFourPId] = useState(null);

  const tierPaths = useMemo(() => buildTierPaths(tier), [tier]);
  const fourPPaths = useMemo(() => buildFourPPaths(fourP), [fourP]);
  const tierSummary = useMemo(() => summarize(tierPaths), [tierPaths]);
  const fourPSummary = useMemo(() => summarize(fourPPaths), [fourPPaths]);

  const tierScenarioResults = Object.fromEntries(
    scenarios.map((item) => [
      item.key,
      tier.marketTotal[item.key].value * (tier.tierShare[item.key].value / 100) * (tier.ourShare[item.key].value / 100),
    ]),
  );

  const fourPScenarioResults = Object.fromEntries(
    scenarios.map((item) => [
      item.key,
      fourP.prevSales *
        (1 + fourP.product[item.key].value / 100) *
        (1 + fourP.price[item.key].value / 100) *
        (1 + fourP.place[item.key].value / 100) *
        (1 + fourP.promotion[item.key].value / 100) *
        (1 + fourP.marketChange[item.key].value / 100),
    ]),
  );

  const compareRows = scenarios.map((item) => ({
    label: item.label,
    tier: tierScenarioResults[item.key],
    fourP: fourPScenarioResults[item.key],
    delta: compareDelta(tierScenarioResults[item.key], fourPScenarioResults[item.key]),
  }));

  const chartData = compareRows.map((item) => ({
    name: item.label,
    档位空间: item.tier,
    "4P分析": item.fourP,
  }));

  const selectedTier = tierPaths.find((item) => item.id === selectedTierId) ?? tierPaths[0] ?? null;
  const selectedFourP = fourPPaths.find((item) => item.id === selectedFourPId) ?? fourPPaths[0] ?? null;

  const updateBlock = (setter, source, field, scenario, target, value) => {
    setter({
      ...source,
      [field]: {
        ...source[field],
        [scenario]: {
          ...source[field][scenario],
          [target]: value,
        },
      },
    });
  };

  return (
    <div className="min-h-screen pb-20">
      <div className="mx-auto max-w-7xl px-4 pb-10 pt-6 sm:px-6 lg:px-8">
        <header className="card p-6 xl:p-8">
          <div className="mb-3 inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">决策树预测分析台</div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">先看路径，再看解释，再做校验</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">这是一个可直接演示的需求预测网站。主阅读区优先展示高概率路径，右侧解释单条路径，底部用第二种方法做交叉验证。</p>
          <div className="mt-6 grid gap-3 md:grid-cols-3">
            {tabs.map((item) => (
              <button key={item.key} type="button" onClick={() => setTab(item.key)} className={`rounded-3xl border px-4 py-4 text-left transition ${tab === item.key ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-slate-50 text-slate-700"}`}>
                <div className="text-sm font-semibold">{item.label}</div>
              </button>
            ))}
          </div>
        </header>

        <main className="mt-8 space-y-6">
          {tab === "project" && (
            <>
              <section className="card p-6">
                <h2 className="text-2xl font-semibold text-slate-950">项目设置</h2>
                <p className="mt-2 text-sm text-slate-600">先对齐项目背景和方法认知，再进入具体测算。</p>
                <div className="mt-6 grid gap-5 md:grid-cols-2">
                  <label><div className="mb-2 text-sm font-medium text-slate-700">产品名称</div><input className={inputClass} value={project.productName} onChange={(e) => setProject({ ...project, productName: e.target.value })} /></label>
                  <label><div className="mb-2 text-sm font-medium text-slate-700">目标市场</div><input className={inputClass} value={project.targetMarket} onChange={(e) => setProject({ ...project, targetMarket: e.target.value })} /></label>
                  <label><div className="mb-2 text-sm font-medium text-slate-700">预测周期</div><input className={inputClass} value={project.forecastPeriod} onChange={(e) => setProject({ ...project, forecastPeriod: e.target.value })} /></label>
                  <label><div className="mb-2 text-sm font-medium text-slate-700">负责人</div><input className={inputClass} value={project.planner} onChange={(e) => setProject({ ...project, planner: e.target.value })} /></label>
                </div>
              </section>
              <section className="card p-6">
                <h2 className="text-2xl font-semibold text-slate-950">决策树方法说明</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">决策树不是为了画图，而是把业务假设、概率判断和最终结果拆开讲清楚。它适合新品预测、价格带规划、季度需求评估等场景。</p>
                <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <Card label="它是什么" value="把复杂预测拆成多层假设" />
                  <Card label="它有什么用" value="帮助团队看到高概率结果与风险" />
                  <Card label="简单数学" value="路径结果按公式，路径概率按相乘" />
                  <Card label="业务案例" value="大盘 × 档位占比 × 我方份额" />
                </div>
              </section>
            </>
          )}

          {tab === "tier" && (
            <>
              <section className="card p-6">
                <h2 className="text-2xl font-semibold text-slate-950">档位空间</h2>
                <p className="mt-2 text-sm text-slate-600">先填三层变量，再看高概率路径。</p>
              </section>
              {[
                ["大盘总量", "marketTotal", "万台"],
                ["目标档位占比", "tierShare", "%"],
                ["我方份额", "ourShare", "%"],
              ].map(([title, field, unit]) => (
                <section key={field} className="card p-6">
                  <h3 className="text-xl font-semibold text-slate-950">{title}</h3>
                  <div className="mt-6 grid gap-4 lg:grid-cols-3">
                    {scenarios.map((item) => (
                      <div key={item.key} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                        <div className="text-sm font-semibold text-slate-800">{item.label}</div>
                        <div className="mt-3 text-xs font-medium uppercase tracking-[0.16em] text-slate-400">数值</div>
                        <input type="number" className={`${inputClass} mt-2`} value={tier[field][item.key].value} onChange={(e) => updateBlock(setTier, tier, field, item.key, "value", parseNumber(e.target.value))} />
                        <div className="mt-4 text-xs font-medium uppercase tracking-[0.16em] text-slate-400">概率</div>
                        <input type="number" className={`${inputClass} mt-2`} value={tier[field][item.key].probability} onChange={(e) => updateBlock(setTier, tier, field, item.key, "probability", parseNumber(e.target.value))} />
                        <div className="mt-2 text-xs text-slate-500">单位：{unit}</div>
                      </div>
                    ))}
                  </div>
                </section>
              ))}
              <section className="card bg-slate-900 p-6 text-white">
                <h3 className="text-2xl font-semibold">档位空间结果摘要</h3>
                <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                  <Card label="期望销量" value={tierSummary ? formatUnits(tierSummary.expected) : "待完善"} />
                  <Card label="最低结果" value={tierSummary ? formatUnits(tierSummary.min.result) : "待完善"} />
                  <Card label="最高结果" value={tierSummary ? formatUnits(tierSummary.max.result) : "待完善"} />
                  <Card label="客观场景" value={formatUnits(tierScenarioResults.baseline)} />
                  <Card label="乐观场景" value={formatUnits(tierScenarioResults.optimistic)} />
                </div>
              </section>
              <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
                <div className="card p-5">
                  <div className="text-sm font-semibold text-slate-900">档位空间路径结果表</div>
                  <div className="mt-4 overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead className="text-slate-500"><tr className="border-b border-slate-200"><th className="px-3 py-3 text-left font-medium">路径</th><th className="px-3 py-3 text-left font-medium">组合</th><th className="px-3 py-3 text-left font-medium">概率</th><th className="px-3 py-3 text-left font-medium">结果</th></tr></thead>
                      <tbody>
                        {tierPaths.map((row, index) => (
                          <tr key={row.id} onClick={() => setSelectedTierId(row.id)} className={`cursor-pointer border-b border-slate-100 last:border-b-0 ${selectedTier?.id === row.id ? "bg-slate-100" : "hover:bg-slate-50"}`}>
                            <td className="px-3 py-3 font-medium text-slate-900">#{index + 1}</td>
                            <td className="px-3 py-3 text-slate-700">{row.path.map((item) => item.scenario).join(" / ")}</td>
                            <td className="px-3 py-3 text-slate-700">{formatPercent(row.probability * 100)}</td>
                            <td className="px-3 py-3 font-semibold text-slate-900">{formatUnits(row.result)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                <div className="card p-5">
                  <div className="text-sm font-semibold text-slate-900">选中路径解释</div>
                  {selectedTier && <div className="mt-4 space-y-3">{selectedTier.path.map((item, index) => <div key={index} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"><div className="text-xs uppercase tracking-[0.14em] text-slate-400">{item.label}</div><div className="mt-1 text-sm font-semibold text-slate-900">{item.scenario} / {item.value}{item.suffix}</div><div className="mt-2 text-xs text-slate-500">分支概率：{formatPercent(item.probability)}</div></div>)}</div>}
                </div>
              </section>
            </>
          )}

          {tab === "fourP" && (
            <>
              <section className="card p-6">
                <h2 className="text-2xl font-semibold text-slate-950">4P 分析</h2>
                <p className="mt-2 text-sm text-slate-600">用另一种业务逻辑重新检验结果。</p>
                <div className="mt-6 grid gap-5 md:grid-cols-2">
                  <label><div className="mb-2 text-sm font-medium text-slate-700">上一代产品名称</div><input className={inputClass} value={fourP.prevProductName} onChange={(e) => setFourP({ ...fourP, prevProductName: e.target.value })} /></label>
                  <label><div className="mb-2 text-sm font-medium text-slate-700">上一代销量</div><input type="number" className={inputClass} value={fourP.prevSales} onChange={(e) => setFourP({ ...fourP, prevSales: parseNumber(e.target.value) })} /></label>
                </div>
              </section>
              {[
                ["Product", "product"],
                ["Price", "price"],
                ["Place", "place"],
                ["Promotion", "promotion"],
                ["大盘变化", "marketChange"],
              ].map(([title, field]) => (
                <section key={field} className="card p-6">
                  <h3 className="text-xl font-semibold text-slate-950">{title}</h3>
                  <div className="mt-6 grid gap-4 lg:grid-cols-3">
                    {scenarios.map((item) => (
                      <div key={item.key} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                        <div className="text-sm font-semibold text-slate-800">{item.label}</div>
                        <div className="mt-3 text-xs font-medium uppercase tracking-[0.16em] text-slate-400">数值</div>
                        <input type="number" className={`${inputClass} mt-2`} value={fourP[field][item.key].value} onChange={(e) => updateBlock(setFourP, fourP, field, item.key, "value", parseNumber(e.target.value))} />
                        <div className="mt-4 text-xs font-medium uppercase tracking-[0.16em] text-slate-400">概率</div>
                        <input type="number" className={`${inputClass} mt-2`} value={fourP[field][item.key].probability} onChange={(e) => updateBlock(setFourP, fourP, field, item.key, "probability", parseNumber(e.target.value))} />
                      </div>
                    ))}
                  </div>
                </section>
              ))}
              <section className="card bg-slate-900 p-6 text-white">
                <h3 className="text-2xl font-semibold">4P 结果摘要</h3>
                <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                  <Card label="期望销量" value={fourPSummary ? formatUnits(fourPSummary.expected) : "待完善"} />
                  <Card label="最低结果" value={fourPSummary ? formatUnits(fourPSummary.min.result) : "待完善"} />
                  <Card label="最高结果" value={fourPSummary ? formatUnits(fourPSummary.max.result) : "待完善"} />
                  <Card label="客观场景" value={formatUnits(fourPScenarioResults.baseline)} />
                  <Card label="乐观场景" value={formatUnits(fourPScenarioResults.optimistic)} />
                </div>
              </section>
              <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
                <div className="card p-5">
                  <div className="text-sm font-semibold text-slate-900">4P 路径结果表</div>
                  <div className="mt-4 overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead className="text-slate-500"><tr className="border-b border-slate-200"><th className="px-3 py-3 text-left font-medium">路径</th><th className="px-3 py-3 text-left font-medium">组合</th><th className="px-3 py-3 text-left font-medium">概率</th><th className="px-3 py-3 text-left font-medium">结果</th></tr></thead>
                      <tbody>
                        {fourPPaths.map((row, index) => (
                          <tr key={row.id} onClick={() => setSelectedFourPId(row.id)} className={`cursor-pointer border-b border-slate-100 last:border-b-0 ${selectedFourP?.id === row.id ? "bg-slate-100" : "hover:bg-slate-50"}`}>
                            <td className="px-3 py-3 font-medium text-slate-900">#{index + 1}</td>
                            <td className="px-3 py-3 text-slate-700">{row.path.map((item) => item.scenario).join(" / ")}</td>
                            <td className="px-3 py-3 text-slate-700">{formatPercent(row.probability * 100)}</td>
                            <td className="px-3 py-3 font-semibold text-slate-900">{formatUnits(row.result)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                <div className="card p-5">
                  <div className="text-sm font-semibold text-slate-900">选中路径解释</div>
                  {selectedFourP && <div className="mt-4 space-y-3">{selectedFourP.path.map((item, index) => <div key={index} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"><div className="text-xs uppercase tracking-[0.14em] text-slate-400">{item.label}</div><div className="mt-1 text-sm font-semibold text-slate-900">{item.scenario} / {item.value}{item.suffix}</div><div className="mt-2 text-xs text-slate-500">分支概率：{formatPercent(item.probability)}</div></div>)}</div>}
                </div>
              </section>
            </>
          )}

          <section className="grid gap-4 lg:grid-cols-[1.25fr_1fr]">
            <div className="card p-4">
              <div className="mb-3"><h2 className="text-sm font-semibold text-slate-900">交叉验证表</h2><p className="mt-1 text-xs text-slate-500">若偏差率超过 30%，建议回看核心假设是否不一致。</p></div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="text-slate-500"><tr className="border-b border-slate-200"><th className="px-3 py-2 text-left font-medium">场景</th><th className="px-3 py-2 text-left font-medium">档位空间</th><th className="px-3 py-2 text-left font-medium">4P 分析</th><th className="px-3 py-2 text-left font-medium">偏差率</th></tr></thead>
                  <tbody>
                    {compareRows.map((row) => (
                      <tr key={row.label} className="border-b border-slate-100 last:border-b-0">
                        <td className="px-3 py-3 font-medium text-slate-800">{row.label}</td>
                        <td className="px-3 py-3 text-slate-700">{formatUnits(row.tier)}</td>
                        <td className="px-3 py-3 text-slate-700">{formatUnits(row.fourP)}</td>
                        <td className="px-3 py-3">{row.delta == null ? <span className="text-slate-400">待完善</span> : <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${row.delta > 30 ? "bg-rose-50 text-rose-700" : "bg-emerald-50 text-emerald-700"}`}>{row.delta.toFixed(1)}%</span>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="card p-4">
              <div className="mb-3"><h2 className="text-sm font-semibold text-slate-900">场景对比图</h2><p className="mt-1 text-xs text-slate-500">用来快速看三种场景下两种方法的结果差异。</p></div>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} barGap={10}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                    <XAxis dataKey="name" tickLine={false} axisLine={false} />
                    <YAxis tickLine={false} axisLine={false} />
                    <Tooltip formatter={(value) => (value == null ? "待完善" : `${Number(value).toFixed(1)} 万台`)} />
                    <Legend />
                    <ReferenceLine y={0} stroke="#cbd5e1" />
                    <Bar dataKey="档位空间" radius={[8, 8, 0, 0]}>{chartData.map((entry, index) => <Cell key={`tier-${entry.name}-${index}`} fill={scenarios[index].color} fillOpacity={0.92} />)}</Bar>
                    <Bar dataKey="4P分析" radius={[8, 8, 0, 0]} fill="#0f172a" fillOpacity={0.88} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
