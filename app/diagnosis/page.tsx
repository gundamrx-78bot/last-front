import { TAX } from "@/lib/data";
import DiagnosisClient from "./DiagnosisClient";

export default function DiagnosisPage() {
  const options = {
    job: TAX.job.map((j) => ({ code: j.code, label: j.name })),
    level: TAX.level.map((l) => ({ code: l.code, label: l.label ?? l.name })),
    stuck: TAX.stuck.filter((s) => s.code !== "other").map((s) => ({ code: s.code, label: s.label ?? s.name })),
  };
  return (
    <>
      <h1>AI 활용 진단</h1>
      <p className="lead">몇 가지만 답해 주세요. 진단 agent가 답변을 분석하고, 외부 교육기관의 교육 정보를 직접 조회해 맞는 학습 경로를 제안해요. (약 2~3분)</p>
      <DiagnosisClient options={options} />
    </>
  );
}
