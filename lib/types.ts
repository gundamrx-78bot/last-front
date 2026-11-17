// 백엔드 /api/diagnosis 가 보내는 보고서 모양(jejuax-back/lib/agent/report.ts 의 Report 와 같아야 한다).
export interface CourseSummary {
  id: string; title: string; org: string | null; mode: "online" | "offline" | "hybrid" | null; region: string | null;
  applyState: string; applyOpenAt: string | null; applyCloseAt: string | null; classDate: string | null; venue: string | null;
  cost: string | null; needsPaidSubscription: boolean; jobTags: string[]; prerequisites: string | null;
  infoGaps: string[]; source: string | undefined; link: string | null;
}
export interface Report {
  level: { code: string; name: string; next: string };
  ruleLevel: { code: string; name: string };
  behaviorLevel: number;
  taskScore: number | null;
  consistency: "과제 없음" | "일치" | "행동>과제" | "과제>행동";
  primaryStuck: { code: string; name: string };
  confidence: "high" | "medium" | "low";
  summary: string; evidence: string[];
  blockers: { title: string; why: string; fix: string }[];
  recommendations: { courseId: string; verdict: "recommend" | "conditional"; reason: string; cautions: string[]; course: CourseSummary }[];
  roadmap: { title: string; detail: string; minutes?: number }[];
  firstPractice: { title: string; prompt?: string };
  dataGaps: string[];
  droppedCourseIds: string[];
}
