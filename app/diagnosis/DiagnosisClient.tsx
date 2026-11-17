"use client";
import { useRef, useState } from "react";
import type { Report } from "@/lib/types";

const API_BASE = (process.env.NEXT_PUBLIC_API_BASE || "").replace(/\/$/, "");

type Opt = { code: string; label: string };
type Options = { job: Opt[]; level: Opt[]; stuck: Opt[] };
type Step = { id: string; label: string; status: "start" | "done" | "error" };

// ---------------- 체크리스트 v2 문항 (docs/진단체크리스트_v1.md) ----------------
const FIRST: Opt[] = [{ code: "never", label: "써 본 적 없어요" }, { code: "lt1m", label: "1개월 미만이에요" }, { code: "m1to6", label: "1개월~6개월이에요" }, { code: "m6to12", label: "6개월~1년이에요" }, { code: "gte1y", label: "1년 이상이에요" }];
const TOOLS: Opt[] = [{ code: "chatgpt", label: "ChatGPT" }, { code: "gemini", label: "Gemini" }, { code: "claude", label: "Claude" }, { code: "copilot", label: "Copilot" }, { code: "canva_etc", label: "이미지·디자인 AI" }, { code: "coding", label: "코딩 도구(Codex 등)" }, { code: "none", label: "써 본 적 없어요" }];
const YESNO: Opt[] = [{ code: "yes", label: "예" }, { code: "no", label: "아니요" }, { code: "unsure", label: "잘 모르겠어요" }];
const SCALE: Opt[] = [{ code: "1", label: "전혀 아니다" }, { code: "2", label: "아니다" }, { code: "3", label: "그렇다" }, { code: "4", label: "매우 그렇다" }];
const TIME: Opt[] = [{ code: "30", label: "30분 이하" }, { code: "60", label: "1시간" }, { code: "120", label: "2시간" }, { code: "240", label: "4시간 이상" }];
const BUDGET: Opt[] = [{ code: "subscribed", label: "유료 AI를 구독 중이에요" }, { code: "free", label: "무료만 써요" }, { code: "if_supported", label: "교육비 지원이 있으면 가능해요" }];
const MODE: Opt[] = [{ code: "any", label: "상관없어요" }, { code: "online", label: "온라인" }, { code: "offline", label: "오프라인" }];

const B_Q = [
  "(최근 2주) 답이 마음에 안 들어 질문을 바꿔 다시 물어본 적이 있다",
  "(최근 1개월) 메일·보고서·공지 같은 내 업무 문서의 초안을 AI로 만들어 실제로 썼다",
  "(최근 1개월) AI에게 상황·대상·분량·말투를 함께 알려 준다",
  "(최근 1개월) AI가 준 숫자·사실을 확인한 뒤에 사용한다",
  "(최근 1개월) AI를 반복 업무 흐름에 넣어 정기적으로 쓴다 (템플릿 저장·GPTs·프로젝트·자동화 도구 등)",
  "(최근 3개월) AI로 내 업무용 도구(앱·스크립트·시트 자동화)를 만들어 쓴다",
];
const D_Q = [
  "AI가 낸 결과가 내가 원하는 것과 자주 다르다",
  "내 일 중에 AI에게 무엇을 시킬지 모르겠다",
  "AI 도구가 너무 많아 어떤 걸 써야 할지 모르겠다",
  "몇 번 써 보다가 다시 안 쓰게 된다",
  "AI 답이 틀릴까 봐 믿고 쓰기 어렵다",
  "같은 요청을 매번 처음부터 다시 쓴다",
  "업무 자료를 AI에 넣어도 되는지 불안하다",
  "AI에 대해 물어볼 사람이나 곳이 없다",
];

type Answers = {
  jobText: string; firstUse: string; tools: string[]; b: string[]; d: string[];
  weeklyMinutes: string; budget: string; mode: string; stuckDetail: string;
};
const initial = (): Answers => ({ jobText: "", firstUse: "", tools: [], b: Array(6).fill(""), d: Array(8).fill(""), weeklyMinutes: "", budget: "", mode: "any", stuckDetail: "" });

type Screen =
  | { id: string; kind: "single"; title: string; opts: Opt[]; get: (a: Answers) => string; set: (a: Answers, v: string) => Answers; section: string }
  | { id: string; kind: "multi" | "text" | "final"; title: string; section: string };

function buildScreens(a: Answers): Screen[] {
  const S: Screen[] = [
    { id: "job", kind: "text", section: "기본 정보", title: "하시는 일을 한 줄로 알려 주세요" },
    { id: "first", kind: "single", section: "기본 정보", title: "AI를 처음 써 본 건 언제쯤인가요?", opts: FIRST, get: (x) => x.firstUse, set: (x, v) => ({ ...x, firstUse: v }) },
    { id: "tools", kind: "multi", section: "기본 정보", title: "써 본 AI 도구를 모두 골라 주세요" },
  ];
  if (a.firstUse !== "never") {
    B_Q.forEach((q, k) => S.push({ id: `b${k}`, kind: "single", section: "활용 행동 체크", title: q, opts: YESNO, get: (x) => x.b[k], set: (x, v) => ({ ...x, b: x.b.map((o, i) => (i === k ? v : o)) }) }));
    D_Q.forEach((q, k) => S.push({ id: `d${k}`, kind: "single", section: "막힘 점검", title: q, opts: SCALE, get: (x) => x.d[k], set: (x, v) => ({ ...x, d: x.d.map((o, i) => (i === k ? v : o)) }) }));
  }
  S.push(
    { id: "time", kind: "single", section: "조건과 목표", title: "일주일에 배움에 쓸 수 있는 시간은?", opts: TIME, get: (x) => x.weeklyMinutes, set: (x, v) => ({ ...x, weeklyMinutes: v }) },
    { id: "budget", kind: "single", section: "조건과 목표", title: "유료 AI 구독과 교육비는?", opts: BUDGET, get: (x) => x.budget, set: (x, v) => ({ ...x, budget: v }) },
    { id: "final", kind: "final", section: "마지막", title: "마지막으로 선택 사항이에요" },
  );
  return S;
}

function Chips({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: Opt[] }) {
  return (
    <div className="chips" role="radiogroup">
      {options.map((o) => (
        <button key={o.code} type="button" className="chip" aria-pressed={value === o.code} onClick={() => onChange(o.code)}>{o.label}</button>
      ))}
    </div>
  );
}

const APPLY: Record<string, { t: string; c: string }> = {
  open: { t: "접수 중", c: "ok" }, not_open_yet: { t: "접수 시작 전", c: "warn" }, unknown: { t: "접수 정보 없음", c: "warn" }, closed: { t: "접수 마감", c: "bad" },
};
const safeHref = (u?: string | null) => (u && /^https:\/\//.test(u) ? u : undefined);

export default function DiagnosisClient({ options }: { options: Options }) {
  const [a, setA] = useState<Answers>(initial());
  const [step, setStep] = useState(0);
  const [phase, setPhase] = useState<"form" | "running" | "done">("form");
  const [steps, setSteps] = useState<Step[]>([]);
  const [report, setReport] = useState<Report | null>(null);
  const [source, setSource] = useState<"agent" | "rules">("agent");
  const [notice, setNotice] = useState("");
  const [err, setErr] = useState("");
  const abort = useRef<AbortController | null>(null);

  const screens = buildScreens(a);
  const idx = Math.min(step, screens.length - 1);
  const cur = screens[idx];
  const reset = () => { setPhase("form"); setReport(null); setStep(0); setA(initial()); };

  const pick = (s: Extract<Screen, { kind: "single" }>, v: string) => {
    setA((p) => s.set(p, v));
    setTimeout(() => setStep((n) => n + 1), 160);
  };
  const toggleTool = (c: string) => setA((p) => {
    if (c === "none") return { ...p, tools: p.tools.includes("none") ? [] : ["none"] };
    const t = p.tools.filter((x) => x !== "none");
    return { ...p, tools: t.includes(c) ? t.filter((x) => x !== c) : [...t, c] };
  });

  async function submit() {
    setErr(""); setNotice(""); setSteps([]); setReport(null); setPhase("running");
    const ctrl = new AbortController(); abort.current = ctrl;
    const used = a.firstUse !== "never";
    const body = {
      jobText: a.jobText.trim(), firstUse: a.firstUse, tools: a.tools, paid: a.budget === "subscribed" ? "yes" : "no", mode: a.mode, stuckDetail: a.stuckDetail,
      ...(used && a.b.every(Boolean) ? { b: a.b } : {}),
      ...(used && a.d.every(Boolean) ? { d: a.d.map(Number) } : {}),
      ...(a.weeklyMinutes ? { weeklyMinutes: a.weeklyMinutes } : {}),
      ...(a.budget ? { budget: a.budget } : {}),
    };
    try {
      const res = await fetch(API_BASE + "/api/diagnosis", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body), signal: ctrl.signal });
      if (!res.ok || !res.body) {
        const j = await res.json().catch(() => null);
        throw new Error(j?.error?.message || "진단 요청에 실패했어요.");
      }
      const reader = res.body.getReader(); const dec = new TextDecoder(); let buf = "";
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        let i: number;
        while ((i = buf.indexOf("\n\n")) >= 0) {
          const chunk = buf.slice(0, i); buf = buf.slice(i + 2);
          if (!chunk.startsWith("data: ")) continue;
          const ev = JSON.parse(chunk.slice(6));
          if (ev.type === "step") setSteps((s) => (s.some((x) => x.id === ev.id) ? s.map((x) => (x.id === ev.id ? { ...x, status: ev.status } : x)) : [...s, { id: ev.id, label: ev.label, status: ev.status }]));
          else if (ev.type === "report") { setReport(ev.report); setSource(ev.source); setPhase("done"); }
          else if (ev.type === "error") setNotice(ev.message);
        }
      }
      setPhase((p) => { if (p === "running") setErr("결과를 받지 못했어요. 다시 시도해 주세요."); return p === "running" ? "form" : p; });
    } catch (e) {
      if ((e as Error).name === "AbortError") return;
      setErr((e as Error).message); setPhase("form");
    }
  }

  if (phase === "running" || (phase === "done" && report)) {
    return (
      <>
        {phase === "running" && (
          <section className="card" aria-live="polite">
            <h2>진단 agent가 분석 중이에요</h2>
            <ul className="steps">
              {steps.map((s) => <li key={s.id} className={s.status}><span className="dot" />{s.label}{s.status === "error" ? " (다시 시도)" : ""}</li>)}
              {!steps.length && <li className="start"><span className="dot" />답변을 읽는 중</li>}
            </ul>
            <button className="btn ghost" type="button" onClick={() => { abort.current?.abort(); setPhase("form"); }}>취소</button>
          </section>
        )}
        {phase === "done" && report && <ReportView r={report} source={source} notice={notice} steps={steps} onReset={reset} />}
      </>
    );
  }

  const canNext = cur.kind === "single" ? !!cur.get(a) : cur.kind === "multi" ? a.tools.length > 0 : cur.kind === "text" ? a.jobText.trim().length >= 2 : true;
  return (
    <form onSubmit={(e) => { e.preventDefault(); if (cur.kind === "final") submit(); }}>
      <div className="progress" aria-label={`${idx + 1} / ${screens.length} 단계`}>
        <div className="progress-bar"><i style={{ width: `${((idx + 1) / screens.length) * 100}%` }} /></div>
        <span className="meta">{cur.section} · {idx + 1} / {screens.length}</span>
      </div>

      <section className="card" aria-live="polite">
        <h2 className="qtitle">{cur.title}</h2>
        {cur.kind === "single" && (
          <div className="opts" role="radiogroup" aria-label={cur.title}>
            {cur.opts.map((o) => <button key={o.code} type="button" className="opt" aria-pressed={cur.get(a) === o.code} onClick={() => pick(cur, o.code)}>{o.label}</button>)}
          </div>
        )}
        {cur.kind === "text" && (
          <>
            <input type="text" maxLength={100} value={a.jobText} onChange={(e) => setA((p) => ({ ...p, jobText: e.target.value }))} placeholder="예: 카페 운영, 중학교 교사, 회계 담당, 프리랜서 디자이너" aria-label="하시는 일" autoFocus />
            <p className="hint">직업이나 업무를 편하게 적어 주세요. 이름·회사명 같은 개인정보는 적지 마세요.</p>
          </>
        )}
        {cur.kind === "multi" && (
          <div className="opts" role="group" aria-label={cur.title}>
            {TOOLS.map((o) => <button key={o.code} type="button" className="opt" aria-pressed={a.tools.includes(o.code)} onClick={() => toggleTool(o.code)}>{o.label}</button>)}
          </div>
        )}
        {cur.kind === "final" && (
          <>
            <div className="q"><span className="lbl">선호하는 교육 방식</span><Chips value={a.mode} onChange={(v) => setA((p) => ({ ...p, mode: v }))} options={MODE} /></div>
            <div className="q">
              <label htmlFor="sd">AI를 쓰다 막혔던 순간을 한 줄로 알려 주세요 <span className="hint">(선택)</span></label>
              <textarea id="sd" rows={2} maxLength={200} value={a.stuckDetail} onChange={(e) => setA((p) => ({ ...p, stuckDetail: e.target.value }))} placeholder="예: 매주 견적서를 쓰는 데 시간이 너무 걸려요" />
            </div>
            <p className="hint">입력 내용은 저장하지 않아요. 진단을 위해 AI 분석 서비스로 전송돼요. 이름·연락처는 적지 마세요.</p>
          </>
        )}
      </section>

      {err && <p className="err" role="alert">{err}</p>}
      <div className="nav-row">
        {idx > 0 && <button className="btn ghost" type="button" onClick={() => setStep(idx - 1)}>이전</button>}
        {cur.kind !== "final" && cur.kind !== "single" && <button className="btn" type="button" disabled={!canNext} onClick={() => setStep(idx + 1)}>다음</button>}
        {cur.kind === "single" && canNext && <button className="btn" type="button" onClick={() => setStep(idx + 1)}>다음</button>}
        {cur.kind === "final" && <button className="btn" type="submit">진단 시작하기</button>}
      </div>
    </form>
  );
}

function ReportView({ r, source, notice, steps, onReset }: { r: Report; source: "agent" | "rules"; notice: string; steps: Step[]; onReset: () => void }) {
  const conf = { high: "근거 충분", medium: "근거 보통", low: "근거 약함" }[r.confidence];
  return (
    <>
      {notice && <div className="notice" role="status">{notice}</div>}
      {source === "rules" && !notice && <div className="notice">AI 분석 없이 규칙만으로 계산한 결과예요.</div>}
      <section className="card">
        <div className="level"><b>{r.level.code}</b><span><strong>{r.level.name} 단계</strong> · 막힘: {r.primaryStuck.name}</span><span className="badge">{conf}</span></div>
        <div className="bar" aria-hidden>{[0, 1, 2, 3, 4].map((n) => <i key={n} className={n <= Number(r.level.code) ? "on" : ""} />)}</div>
        <p>{r.summary}</p>
        <p className="meta">행동 단계 {r.behaviorLevel} · 과제 점수 {r.taskScore == null ? "건너뜀" : r.taskScore + "/5"} · 행동·과제 결과 {r.consistency}{r.ruleLevel.code !== r.level.code ? " · 규칙 단계 " + r.ruleLevel.code + "에서 AI가 조정" : ""}</p>
        <h2>진단 근거</h2>
        <ul className="plain">{r.evidence.map((e, i) => <li key={i}>{e}</li>)}</ul>
        {steps.length > 0 && <p className="meta">조사한 것: {steps.filter((s) => s.status === "done").map((s) => s.label).join(" → ")}</p>}
      </section>

      <section className="card">
        <h2>막힌 지점과 해결 방향</h2>
        {r.blockers.map((b, i) => (
          <div className="q" key={i}><strong>{b.title}</strong><div className="meta">{b.why}</div><div>→ {b.fix}</div></div>
        ))}
      </section>

      <section className="card">
        <h2>추천 교육 <span className="hint">(외부 교육기관 데이터 기준)</span></h2>
        <p className="hint">교육 제목을 클릭하면 해당 기관의 사이트가 새 창으로 열려요. 신청 전에 접수 일정과 대상을 꼭 확인하세요.</p>
        {r.recommendations.length === 0 && <p className="meta">지금 접수 중이면서 맞는 교육을 찾지 못했어요. 아래 학습 순서부터 시작하고, 행사 일정을 다시 확인해 보세요.</p>}
        {r.recommendations.map((rec) => {
          const a = APPLY[rec.course.applyState];
          const href = safeHref(rec.course.link);
          return (
            <div className="q course" key={rec.courseId}>
              <h3>{href ? <a href={href} target="_blank" rel="noopener noreferrer">{rec.course.title} <span aria-hidden>↗</span></a> : rec.course.title}</h3>
              {href && <div className="hint">제목을 클릭하면 해당 사이트로 넘어가요</div>}
              <div className="meta"><span className={`badge ${a.c}`}>{a.t}</span> {rec.verdict === "recommend" ? <span className="badge ok">추천</span> : <span className="badge warn">조건부 추천</span>} · {rec.course.org ?? "주최 미확인"}{rec.course.applyCloseAt ? ` · 접수 마감 ${rec.course.applyCloseAt}` : ""}{rec.course.venue ? ` · ${rec.course.venue}` : ""}{rec.course.cost ? ` · ${rec.course.cost}` : ""}</div>
              <div>{rec.reason}</div>
              {rec.cautions.length > 0 && <ul className="plain meta">{rec.cautions.map((c, i) => <li key={i}>{c}</li>)}</ul>}
            </div>
          );
        })}
      </section>

      <section className="card">
        <h2>배울 순서</h2>
        <ol className="plain">{r.roadmap.map((s, i) => <li key={i}><strong>{s.title}</strong>{s.minutes ? <span className="meta"> · 약 {s.minutes}분</span> : null}<div className="meta">{s.detail}</div></li>)}</ol>
      </section>

      <section className="card">
        <h2>오늘 해 볼 첫 실습</h2>
        <strong>{r.firstPractice.title}</strong>
        {r.firstPractice.prompt && <><div className="copy">{r.firstPractice.prompt}</div><button className="btn ghost" type="button" style={{ marginTop: 8 }} onClick={() => navigator.clipboard?.writeText(r.firstPractice.prompt ?? "")}>질문 복사</button></>}
      </section>

      {r.dataGaps.length > 0 && (
        <section className="card"><h2>확인되지 않은 정보</h2><ul className="plain meta">{r.dataGaps.map((g, i) => <li key={i}>{g}</li>)}</ul></section>
      )}
      <button className="btn ghost" type="button" onClick={onReset}>다시 진단하기</button>
    </>
  );
}
