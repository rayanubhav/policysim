import { useMemo, useState } from 'react'
import {
  Activity,
  BrainCircuit,
  Building,
  ChevronDown,
  Database,
  Sparkles,
  User,
} from 'lucide-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:8000'

const policiesByCategory = {
  'Economy & Taxes': [
    'Government action to control inflation and lower the cost of living',
    'Government programs to reduce unemployment and create/save jobs',
    'Reducing the national debt and balancing the federal budget',
    'Tax policy (including taxes on the rich, poor, and overall tax burden)',
    'Government assistance to industries and high-tech sectors',
    'Government regulation of business and prices',
    'Increasing taxes on high-income earners to fund social welfare programs',
    'Subsidizing domestic manufacturing for strategic industries',
  ],
  'Civil Rights & Liberties': [
    'Civil liberties and equality issues (including torture, wealth redistribution, and LGBT rights)',
    'Racial equality, desegregation, affirmative action, and aid to Black Americans',
    'Women\'s rights, LGBT workplace/military rights, and gay marriage',
    'School prayer and book banning (social conservative issues)',
    'Abortion rights and access (all circumstances)',
    'Affirmative action in college admissions',
  ],
  'Health & Social Welfare': [
    'Implementing a comprehensive national health insurance program funded by the government',
    'Government spending on AIDS research and treatment',
    'Stem-cell research and general science funding',
    'Increasing government spending on welfare programs for low-income families',
    'Government intervention to ensure housing and shelter for the homeless',
  ],
  'Labor & Employment': [
    'Government job-creation programs and work-hour regulations',
    'Union power and labor protections',
    'Childcare programs and pre-school funding',
  ],
  'Education': [
    'Overall government spending on education and schools',
    'Providing parents with tax money in the form of school vouchers for private or religious schools',
  ],
  'Environment & Energy': [
    'Stricter government regulations to protect the environment and combat pollution',
    'Energy policy (drilling, alternative sources, and regulation)',
    'Banning single-use plastics nationwide within five years',
    'Mandatory climate-risk disclosures for large corporations',
  ],
  'Immigration & Security': [
    'Immigration levels and border policy',
    'Expanding surveillance powers to improve national security',
  ],
  'Law & Order': [
    'Crime prevention and gun control',
    'Drug enforcement and the war on drugs',
  ],
  'Urban & Infrastructure': [
    'Government spending on urban renewal and rebuilding inner-city infrastructure',
    'Expanding public transportation infrastructure in major cities',
  ],
  'Defense & Foreign Policy': [
    'Defense spending and military readiness',
  ],
  'Science & Technology': [
    'Government funding for science, space exploration, and technology',
  ],
  'Government & Social Programs': [
    'Size and power of the federal government',
    'Whether people in the government waste a lot of the money we pay in taxes',
    'Introducing universal basic income for all adults',
  ],
  'Utilities & Commerce': [
    'Privatizing parts of the national electricity grid',
  ],
  'Natural Resources': [
    'National parks and public lands',
  ],
}

const scorePalette = {
  economy_score: '#0ea5e9',
  environment_score: '#22c55e',
  social_score: '#f59e0b',
}

const scoreLabels = {
  economy_score: 'Economy',
  environment_score: 'Environment',
  social_score: 'Social',
}

function App() {
  const [policy, setPolicy] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [showRag, setShowRag] = useState(false)

  const chartData = useMemo(() => {
    if (!result?.analyst_agent) return []

    return Object.keys(scorePalette).map((key) => {
      const reasonKey = key.replace('_score', '_reason')
      return {
        name: scoreLabels[key],
        score: result.analyst_agent[key] ?? 0,
        reason: result.analyst_agent[reasonKey] ?? '',
        color: scorePalette[key],
      }
    })
  }, [result])

  const handleSimulate = async () => {
    if (!policy) return

    setLoading(true)
    setResult(null)
    setError('')

    try {
      const response = await fetch(`${API_BASE}/simulate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ policy_name: policy }),
      })

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}))
        throw new Error(payload.detail || 'Simulation request failed')
      }

      const data = await response.json()
      setResult(data)
    } catch (err) {
      setError(err.message || 'Unable to reach backend service.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden px-4 py-8 sm:px-8 lg:py-12">
      <div className="scanline pointer-events-none absolute inset-0" />

      <div className="relative mx-auto max-w-6xl space-y-6 sm:space-y-8">
        <header className="glass animate-rise rounded-2xl px-5 py-6 sm:px-8 sm:py-8">
          <div className="mb-6 flex flex-col gap-4 text-center sm:mb-8">
            <div className="mx-auto flex w-fit items-center gap-3 rounded-full border border-sky-400/40 bg-sky-500/10 px-3 py-1 text-sm text-sky-200">
              <Sparkles size={15} />
              Multi-Agent Policy Lab
            </div>

            <div className="flex items-center justify-center gap-3">
              <BrainCircuit className="text-sky-300" size={36} />
              <h1 className="font-display text-3xl font-extrabold tracking-tight text-white sm:text-5xl">
                AI Policy Simulator
              </h1>
            </div>

            <p className="mx-auto max-w-2xl text-sm text-slate-300 sm:text-base">
              Run a policy through citizen, government, and analyst agents backed by your
              RAG knowledge base.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
            <div className="relative">
              <ChevronDown
                className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
                size={20}
              />
              <select
                value={policy}
                onChange={(e) => setPolicy(e.target.value)}
                className="w-full appearance-none rounded-xl border border-slate-700 bg-slate-950/80 p-4 pr-12 text-sm text-slate-100 outline-none ring-0 transition focus:border-sky-400"
              >
                <option value="">Select a policy to simulate</option>
                {Object.entries(policiesByCategory).map(([category, items]) => (
                  <optgroup key={category} label={category}>
                    {items.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>

            <button
              onClick={handleSimulate}
              disabled={!policy || loading}
              className="rounded-xl bg-gradient-to-r from-sky-500 to-emerald-500 px-6 py-4 font-display text-sm font-bold tracking-wide text-white shadow-lg shadow-sky-500/30 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? 'SIMULATING...' : 'RUN SIMULATION'}
            </button>
          </div>

          {error && (
            <div className="mt-4 rounded-lg border border-rose-400/30 bg-rose-500/10 p-3 text-sm text-rose-200">
              {error}
            </div>
          )}
        </header>

        {loading && (
          <section className="glass animate-rise rounded-2xl p-10 text-center">
            <Activity className="mx-auto mb-3 animate-spin text-sky-300" size={40} />
            <p className="font-display text-xl text-white">AI agents are debating...</p>
            <p className="mt-2 text-sm text-slate-300">
              Retrieving context, simulating personas, and scoring impact.
            </p>
          </section>
        )}

        {!loading && result && (
          <>
            <section className="grid animate-rise gap-4 md:grid-cols-2">
              <article className="glass rounded-2xl border-t-4 border-rose-400 p-5 sm:p-6">
                <div className="mb-4 flex items-center gap-3 border-b border-slate-700 pb-3 text-rose-300">
                  <User size={20} />
                  <h2 className="font-display text-xl font-semibold text-white">Citizen Agent</h2>
                </div>
                <p className="leading-7 text-slate-200">{result.citizen_agent}</p>
              </article>

              <article className="glass rounded-2xl border-t-4 border-sky-400 p-5 sm:p-6">
                <div className="mb-4 flex items-center gap-3 border-b border-slate-700 pb-3 text-sky-300">
                  <Building size={20} />
                  <h2 className="font-display text-xl font-semibold text-white">Government Agent</h2>
                </div>
                <p className="leading-7 text-slate-200">{result.government_agent}</p>
              </article>
            </section>

            <section className="glass animate-rise rounded-2xl p-5 sm:p-7">
              <div className="mb-6 text-center">
                <h2 className="font-display text-2xl font-bold text-white">Analyst Dashboard</h2>
                <p className="mx-auto mt-2 max-w-3xl text-slate-200">{result.analyst_agent.verdict}</p>
              </div>

              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} layout="vertical" margin={{ top: 8, right: 20, left: 10, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="4 4" stroke="#263244" />
                    <XAxis type="number" domain={[0, 100]} stroke="#8fa3bf" />
                    <YAxis dataKey="name" type="category" stroke="#c6d4e6" width={110} />
                    <Tooltip
                      cursor={{ fill: '#122033' }}
                      contentStyle={{
                        backgroundColor: '#0f1b2e',
                        border: '1px solid #28425f',
                        borderRadius: 10,
                        color: '#e5edf7',
                      }}
                    />
                    <Bar dataKey="score" radius={[0, 8, 8, 0]}>
                      {chartData.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-3">
                {chartData.map((item) => (
                  <div key={item.name} className="rounded-lg border border-slate-700 bg-slate-900/50 p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                      <h3 className="font-display font-semibold text-white">{item.name}</h3>
                    </div>
                    <div className="mb-2 text-lg font-bold" style={{ color: item.color }}>
                      {item.score}/100
                    </div>
                    <p className="text-sm leading-5 text-slate-300 italic">{item.reason}</p>
                  </div>
                ))}
              </div>

              <div className="mt-5">
                <button
                  onClick={() => setShowRag((prev) => !prev)}
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-600 bg-slate-900/70 px-4 py-2 text-sm text-slate-100 transition hover:border-sky-400"
                >
                  <Database size={16} />
                  {showRag ? 'Hide RAG Data' : 'View RAG Data'}
                </button>

                {showRag && (
                  <div className="mt-3 rounded-lg border border-slate-700 bg-slate-950/75 p-4 text-sm leading-6 text-slate-300">
                    {result.rag_context_used}
                  </div>
                )}
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  )
}

export default App
