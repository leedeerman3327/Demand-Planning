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
  priceBreakthrough: false,
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
            { label: "大盘总量", scenario: a.label, value: market.value, suffix: " 万台", probability: market.probability, color: a.color },
            { label: "目标档位占比", scenario: b.label, value: share.value, suffix: "%", probability: share.probability, color: b.color },
            { label: "我方份额", scenario: c.label, value: our.value, suffix: "%", probability: our.probability, color: c.color },
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
            let result =
              fourP.prevSales *
              (1 + product.value / 100) *
              (1 + price.value / 100) *
              (1 + place.value / 100) *
              (1 + promotion.value / 100) *
              (1 + market.value / 100);
            if (fourP.priceBreakthrough) result *= 0.7;
            leaves.push({
              id: `${a.key}-${b.key}-${c.key}-${d.key}-${e.key}`,
              path: [
                { label: "Product", scenario: a.label, value: product.value, suffix: "%", probability: product.probability, color: a.color },
                { label: "Price", scenario: b.label, value: price.value, suffix: "%", probability: price.probability, color: b.color },
                { label: "Place", scenario: c.label, value: place.value, suffix: "%", probability: place.probability, color: c.color },
                { label: "Promotion", scenario: d.label, value: promotion.value, suffix: "%", probability: promotion.probability, color: d.color },
                { label: "大盘变化", scenario: e.label, value: market.value, suffix: "%", probability: market.probability, color: e.color },
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
  let cumulative = 0;
  let p50 = ordered[ordered.length - 1];
  let p90 = ordered[ordered.length - 1];
  for (const row of ordered) {
    cumulative += row.probability;
    if (cumulative >= 0.5 && p50 === ordered[ordered.length - 1]) p50 = row;
    if (cumulative >= 0.9) {
      p90 = row;
      break;
    }
  }
  return { expected, p50, p90, min: ordered[0], max: ordered[ordered.length - 1] };
}

function scenarioResult(block, calc) {
  return Object.fromEntries(scenarios.map((item) => [item.key, calc(item.key)]));
}

function Intro({ eyebrow, title, description }) {
  return (
    <div>
      <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{eyebrow}</div>
      <h2 className="mt-2 text-2xl font-semibold text-slate-950">{title}</h2>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">{description}</p>
    </div>
  );
}

function SummaryCard({ label, value }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
      <div className="text-xs uppercase tracking-[0.16em] text-slate-400">{label}</div>
      <div className="mt-2 text-lg font-semibold text-slate-900">{value}</div>
    </div>
  );
}

function Workflow({ items }) {
  return (
    <section className="rounded-[28px] border border-slate-200 bg-white/90 p-5 shadow-[0_18px_60px_rgba(15,23,42,0.06)]">
      <div className="grid gap-3 lg:grid-cols-3">
        {items.map((item, index) => (
          <div key={item.title} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm font-semibold text-slate-900">{index + 1}. {item.title}</div>
              <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${item.done ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                {item.done ? "已具备" : "待完善"}
              </span>
            </div>
            <p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function TripleCard({ title, description, block, unitLabel, onChange }) {
  const sum = scenarios.reduce((acc, item) => acc + (block[item.key].probability ?? 0), 0);
  return (
    <section className="rounded-[28px] border border-slate-200 bg-white/92 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.06)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-xl font-semibold text-slate-950">{title}</h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
          <div className="font-medium text-slate-900">概率合计</div>
          <div className="mt-1 text-lg font-semibold">{sum.toFixed(1)}%</div>
        </div>
      </div>
      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        {scenarios.map((item) => (
          <div key={item.key} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-slate-800">{item.label}</div>
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
            </div>
            <div className="mt-3 text-xs font-medium uppercase tracking-[0.16em] text-slate-400">数值</div>
            <div className="relative mt-2">
              <input type="number" value={block[item.key].value ?? ""} onChange={(e) => onChange(item.key, "value", parseNumber(e.target.value))} className={`${inputClass} pr-16`} />
              <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm text-slate-400">{unitLabel}</span>
            </div>
            <div className="mt-4 text-xs font-medium uppercase tracking-[0.16em] text-slate-400">概率</div>
            <div className="relative mt-2">
              <input type="number" value={block[item.key].probability ?? ""} onChange={(e) => onChange(item.key, "probability", parseNumber(e.target.value))} className={`${inputClass} pr-14`} />
              <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm text-slate-400">%</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function PathTable({ title, rows, selectedId, onSelect }) {
  const labels = rows[0]?.path.map((item) => item.label) ?? [];
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_12px_40px_rgba(15,23,42,0.06)]">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-slate-900">{title}</div>
          <p className="mt-1 text-sm text-slate-500">默认按路径概率倒序，建议先看 Top 5。</p>
        </div>
        <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-600">共 {rows.length} 条路径</div>
      </div>
      <div className="mt-4 overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="text-slate-500">
            <tr className="border-b border-slate-200">
              <th className="px-3 py-3 text-left font-medium">路径</th>
              {labels.map((label) => <th key={label} className="px-3 py-3 text-left font-medium">{label}</th>)}
              <th className="px-3 py-3 text-left font-medium">路径概率</th>
              <th className="px-3 py-3 text-left font-medium">最终销量</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={row.id} onClick={() => onSelect(row.id)} className={`cursor-pointer border-b border-slate-100 last:border-b-0 ${selectedId === row.id ? "bg-slate-100/80" : "hover:bg-slate-50"}`}>
                <td className="px-3 py-3 font-medium text-slate-900">#{index + 1}</td>
                {row.path.map((item) => (
                  <td key={`${row.id}-${item.label}`} className="px-3 py-3 text-slate-700">
                    <div className="font-medium text-slate-900">{item.scenario}</div>
                    <div className="mt-1 text-xs text-slate-500">{item.value}{item.suffix}</div>
                  </td>
                ))}
                <td className="px-3 py-3 text-slate-700">{formatPercent(row.probability * 100)}</td>
                <td className="px-3 py-3 font-semibold text-slate-900">{formatUnits(row.result)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PathExplanation({ path }) {
  if (!path) return null;
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_12px_40px_rgba(15,23,42,0.06)]">
      <div className="text-sm font-semibold text-slate-900">选中路径解释</div>
      <p className="mt-1 text-sm text-slate-500">这里专门解释当前选中的单条路径，适合拿来讲给业务或管理层听。</p>
      <div className="mt-4 space-y-3">
        {path.path.map((item, index) => (
          <div key={`${item.label}-${index}`} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-xs uppercase tracking-[0.14em] text-slate-400">{item.label}</div>
                <div className="mt-1 text-sm font-semibold text-slate-900">{item.scenario} / {item.value}{item.suffix}</div>
              </div>
              <span className="inline-flex rounded-full px-2 py-1 text-xs font-semibold text-white" style={{ backgroundColor: item.color }}>第 {index + 1} 层</span>
            </div>
            <div className="mt-2 text-xs text-slate-500">分支概率：{formatPercent(item.probability)}</div>
          </div>
        ))}
      </div>
      <div className="mt-4 rounded-2xl bg-slate-900 px-4 py-4 text-white">
        <div className="text-xs text-slate-300">叶子结果</div>
        <div className="mt-2 text-base font-semibold">最终销量：{formatUnits(path.result)}</div>
        <div className="mt-1 text-sm text-slate-300">路径概率：{formatPercent(path.probability * 100)}</div>
      </div>
    </div>
  );
}

export default function App() {
  const [activeTab, setActiveTab] = useState("project");
  const [project, setProject] = useState(initialProject);
  const [tier, setTier] = useState(initialTier);
  const [fourP, setFourP] = useState(initialFourP);

  const tierPaths = useMemo(() => buildTierPaths(tier), [tier]);
  const fourPPaths = useMemo(() => buildFourPPaths(fourP), [fourP]);
  const tierSummary = useMemo(() => summarize(tierPaths), [tierPaths]);
  const fourPSummary = useMemo(() => summarize(fourPPaths), [fourPPaths]);
  const [selectedTierId, setSelectedTierId] = useState(tierPaths[0]?.id ?? null);
  const [selectedFourPId, setSelectedFourPId] = useState(fourPPaths[0]?.id ?? null);

  const selectedTierPath = tierPaths.find((item) => item.id === selectedTierId) ?? tierPaths[0] ?? null;
  const selectedFourPPath = fourPPaths.find((item) => item.id === selectedFourPId) ?? fourPPaths[0] ?? null;

  const tierScenarios = scenarioResult(tier, (key) => tier.marketTotal[key].value * (tier.tierShare[key].value / 100) * (tier.ourShare[key].value / 100));
  const fourPScenarios = scenarioResult(fourP, (key) => {
    let result =
      fourP.prevSales *
      (1 + fourP.product[key].value / 100) *
      (1 + fourP.price[key].value / 100) *
      (1 + fourP.place[key].value / 100) *
      (1 + fourP.promotion[key].value / 100) *
      (1 + fourP.marketChange[key].value / 100);
    if (fourP.priceBreakthrough) result *= 0.7;
    return result;
  });

  const compareRows = scenarios.map((item) => ({
    label: item.label,
    tier: tierScenarios[item.key],
    fourP: fourPScenarios[item.key],
    delta: compareDelta(tierScenarios[item.key], fourPScenarios[item.key]),
  }));

  const chartData = compareRows.map((item) => ({
    name: item.label,
    档位空间: item.tier,
    "4P分析": item.fourP,
  }));

  const updateTriple = (setter, source, field, scenario, target, value) => {
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
        <header className="rounded-[28px] border border-slate-200 bg-white/88 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur xl:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl">
              <div className="mb-3 inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">决策树预测分析台</div>
              <h1 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">先看路径，再看解释，再做校验</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">这是一套面向业务展示的预测工作台。主阅读区优先展示高概率路径，右侧负责解释路径逻辑，底部再用另一种方法做交叉验证。</p>
            </div>
          </div>
          <div className="mt-6 grid gap-3 md:grid-cols-3">
            {tabs.map((tab) => {
              const active = activeTab === tab.key;
              return (
                <button key={tab.key} type="button" onClick={() => setActiveTab(tab.key)} className={`rounded-3xl border px-4 py-4 text-left transition ${active ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300 hover:bg-white"}`}>
                  <div className="text-sm font-semibold">{tab.label}</div>
                </button>
              );
            })}
          </div>
        </header>

        <main className="mt-8 space-y-6">
          {activeTab === "project" ? (
            <>
              <Intro eyebrow="项目设置" title="先对齐项目背景和方法认知" description="这个页签适合第一次给团队演示：先交代项目，再介绍决策树方法。" />
              <Workflow items={[
                { title: "补全项目背景", description: "记录产品名、目标市场和预测周期，方便导出与复盘。", done: Boolean(project.productName && project.targetMarket && project.forecastPeriod) },
                { title: "理解方法", description: "让新同事先明白决策树到底在预测里扮演什么角色。", done: true },
                { title: "进入分析页", description: "建议先做档位空间，再用 4P 分析做交叉验证。", done: true },
              ]} />
              <section className="rounded-[28px] border border-slate-200 bg-white/92 p-6 shadow-[0_20px_70px_rgba(15,23,42,0.08)]">
                <div className="grid gap-5 md:grid-cols-2">
                  <label className="block"><div className="mb-2 text-sm font-medium text-slate-700">产品名称</div><input className={inputClass} value={project.productName} onChange={(e) => setProject({ ...project, productName: e.target.value })} /></label>
                  <label className="block"><div className="mb-2 text-sm font-medium text-slate-700">目标市场</div><input className={inputClass} value={project.targetMarket} onChange={(e) => setProject({ ...project, targetMarket: e.target.value })} /></label>
                  <label className="block"><div className="mb-2 text-sm font-medium text-slate-700">预测周期</div><input className={inputClass} value={project.forecastPeriod} onChange={(e) => setProject({ ...project, forecastPeriod: e.target.value })} /></label>
                  <label className="block"><div className="mb-2 text-sm font-medium text-slate-700">负责人</div><input className={inputClass} value={project.planner} onChange={(e) => setProject({ ...project, planner: e.target.value })} /></label>
                </div>
                <div className="mt-5"><label className="block"><div className="mb-2 text-sm font-medium text-slate-700">备注</div><textarea className={`${inputClass} min-h-32 resize-y`} value={project.notes} onChange={(e) => setProject({ ...project, notes: e.target.value })} /></label></div>
                <div className="mt-6 grid gap-4 md:grid-cols-3">
                  <SummaryCard label="产品" value={project.productName || "待完善"} />
                  <SummaryCard label="市场" value={project.targetMarket || "待完善"} />
                  <SummaryCard label="周期" value={project.forecastPeriod || "待完善"} />
                </div>
              </section>
              <section className="rounded-[28px] border border-slate-200 bg-white/90 p-6 shadow-[0_20px_70px_rgba(15,23,42,0.08)]">
                <Intro eyebrow="决策树方法说明" title="给新同事的快速上手版" description="决策树不是为了画复杂图，而是为了把假设、概率和结果拆开讲清楚。" />
                <div className="mt-6 grid gap-4 xl:grid-cols-2">
                  <SummaryCard label="它是什么" value="把复杂预测拆成多层假设，再自动组合成路径结果。" />
                  <SummaryCard label="它有什么用" value="帮助团队看到高概率结果、风险区间和关键驱动因素。" />
                  <SummaryCard label="简单数学" value="路径结果按公式计算，路径概率按各层概率相乘。" />
                  <SummaryCard label="适用场景" value="新品预测、价格带规划、季度需求评估、营销测算。" />
                </div>
                <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-600">例：大盘 3200 × 档位占比 15% × 我方份额 13% = 62.4 万台；路径概率 = 60% × 60% × 60% = 21.6%。</div>
              </section>
            </>
          ) : null}

          {activeTab === "tier" ? (
            <>
              <Intro eyebrow="档位空间" title="先输入三层变量，再看高概率路径" description="建议先看摘要卡，再点 Top 路径查看右侧解释。" />
              <Workflow items={[
                { title: "填三层变量", description: "大盘总量、目标档位占比、我方份额。", done: true },
                { title: "先看摘要", description: "优先看期望值、P50、P90，而不是直接盯住某一个数字。", done: Boolean(tierSummary) },
                { title: "点选路径", description: "从高概率路径开始查看解释，更适合业务沟通。", done: Boolean(selectedTierPath) },
              ]} />
              <TripleCard title="大盘总量" description="定义整体市场规模区间。" block={tier.marketTotal} unitLabel="万台" onChange={(scenario, target, value) => updateTriple(setTier, tier, "marketTotal", scenario, target, value)} />
              <TripleCard title="目标档位占比" description="输入目标价格带在整体市场中的占比。" block={tier.tierShare} unitLabel="%" onChange={(scenario, target, value) => updateTriple(setTier, tier, "tierShare", scenario, target, value)} />
              <TripleCard title="我方份额" description="输入我方在该价格带中的预期份额。" block={tier.ourShare} unitLabel="%" onChange={(scenario, target, value) => updateTriple(setTier, tier, "ourShare", scenario, target, value)} />
              <section className="rounded-[28px] border border-slate-800 bg-slate-900 p-6 text-white shadow-[0_28px_90px_rgba(15,23,42,0.2)]">
                <div className="text-xs uppercase tracking-[0.18em] text-slate-400">直接结果</div>
                <h3 className="mt-2 text-2xl font-semibold">档位空间结果摘要</h3>
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  {scenarios.map((item) => <SummaryCard key={item.key} label={item.label} value={formatUnits(tierScenarios[item.key])} />)}
                </div>
                <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                  <SummaryCard label="期望销量" value={tierSummary ? formatUnits(tierSummary.expected) : "待完善"} />
                  <SummaryCard label="P50" value={tierSummary ? formatUnits(tierSummary.p50.result) : "待完善"} />
                  <SummaryCard label="P90" value={tierSummary ? formatUnits(tierSummary.p90.result) : "待完善"} />
                  <SummaryCard label="最低结果" value={tierSummary ? formatUnits(tierSummary.min.result) : "待完善"} />
                  <SummaryCard label="最高结果" value={tierSummary ? formatUnits(tierSummary.max.result) : "待完善"} />
                </div>
              </section>
              <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
                <PathTable title="档位空间路径结果表" rows={tierPaths} selectedId={selectedTierId} onSelect={setSelectedTierId} />
                <PathExplanation path={selectedTierPath} />
              </section>
            </>
          ) : null}

          {activeTab === "fourP" ? (
            <>
              <Intro eyebrow="4P 分析" title="用另一种业务逻辑重新检验结果" description="这部分适合验证不同方法是否讲同一个故事。" />
              <section className="rounded-[28px] border border-slate-200 bg-white/92 p-6 shadow-[0_20px_70px_rgba(15,23,42,0.08)]">
                <div className="grid gap-5 md:grid-cols-2">
                  <label className="block"><div className="mb-2 text-sm font-medium text-slate-700">上一代产品名称</div><input className={inputClass} value={fourP.prevProductName} onChange={(e) => setFourP({ ...fourP, prevProductName: e.target.value })} /></label>
                  <label className="block"><div className="mb-2 text-sm font-medium text-slate-700">上一代销量</div><input type="number" className={inputClass} value={fourP.prevSales} onChange={(e) => setFourP({ ...fourP, prevSales: parseNumber(e.target.value) })} /></label>
                </div>
              </section>
              <TripleCard title="Product" description="产品力变化对销量的影响。" block={fourP.product} unitLabel="%" onChange={(scenario, target, value) => updateTriple(setFourP, fourP, "product", scenario, target, value)} />
              <TripleCard title="Price" description="价格变化对销量的影响。" block={fourP.price} unitLabel="%" onChange={(scenario, target, value) => updateTriple(setFourP, fourP, "price", scenario, target, value)} />
              <TripleCard title="Place" description="渠道变化对销量的影响。" block={fourP.place} unitLabel="%" onChange={(scenario, target, value) => updateTriple(setFourP, fourP, "place", scenario, target, value)} />
              <TripleCard title="Promotion" description="营销变化对销量的影响。" block={fourP.promotion} unitLabel="%" onChange={(scenario, target, value) => updateTriple(setFourP, fourP, "promotion", scenario, target, value)} />
              <TripleCard title="大盘变化" description="整体市场环境变化对销量的影响。" block={fourP.marketChange} unitLabel="%" onChange={(scenario, target, value) => updateTriple(setFourP, fourP, "marketChange", scenario, target, value)} />
              <section className="rounded-[28px] border border-slate-800 bg-slate-900 p-6 text-white shadow-[0_28px_90px_rgba(15,23,42,0.2)]">
                <div className="text-xs uppercase tracking-[0.18em] text-slate-400">直接结果</div>
                <h3 className="mt-2 text-2xl font-semibold">4P 结果摘要</h3>
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  {scenarios.map((item) => <SummaryCard key={item.key} label={item.label} value={formatUnits(fourPScenarios[item.key])} />)}
                </div>
                <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                  <SummaryCard label="期望销量" value={fourPSummary ? formatUnits(fourPSummary.expected) : "待完善"} />
                  <SummaryCard label="P50" value={fourPSummary ? formatUnits(fourPSummary.p50.result) : "待完善"} />
                  <SummaryCard label="P90" value={fourPSummary ? formatUnits(fourPSummary.p90.result) : "待完善"} />
                  <SummaryCard label="最低结果" value={fourPSummary ? formatUnits(fourPSummary.min.result) : "待完善"} />
                  <SummaryCard label="最高结果" value={fourPSummary ? formatUnits(fourPSummary.max.result) : "待完善"} />
                </div>
              </section>
              <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
                <PathTable title="4P 路径结果表" rows={fourPPaths} selectedId={selectedFourPId} onSelect={setSelectedFourPId} />
                <PathExplanation path={selectedFourPPath} />
              </section>
            </>
          ) : null}

          <section className="pt-2">
            <Intro eyebrow="交叉验证" title="最后再看两种方法是否出现明显分歧" description="如果偏差过大，建议回看核心假设是否不一致。" />
          </section>
          <section className="grid gap-4 lg:grid-cols-[1.25fr_1fr]">
            <div className="rounded-3xl border border-slate-200 bg-white/92 p-4 shadow-[0_18px_60px_rgba(15,23,42,0.06)]">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-sm font-semibold text-slate-900">交叉验证表</h2>
                  <p className="mt-1 text-xs text-slate-500">若偏差率超过 30%，建议回看核心假设。</p>
                </div>
                <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-500">{project.productName || "未命名"} / {project.forecastPeriod || "未设周期"}</div>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="text-slate-500">
                    <tr className="border-b border-slate-200">
                      <th className="px-3 py-2 text-left font-medium">场景</th>
                      <th className="px-3 py-2 text-left font-medium">档位空间</th>
                      <th className="px-3 py-2 text-left font-medium">4P 分析</th>
                      <th className="px-3 py-2 text-left font-medium">偏差率</th>
                    </tr>
                  </thead>
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
            <div className="rounded-3xl border border-slate-200 bg-white/92 p-4 shadow-[0_18px_60px_rgba(15,23,42,0.06)]">
              <div className="mb-3">
                <h2 className="text-sm font-semibold text-slate-900">场景对比图</h2>
                <p className="mt-1 text-xs text-slate-500">用来快速看三种场景下两种方法的结果差异。</p>
              </div>
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
