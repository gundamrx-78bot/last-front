import taxonomyJson from "@/data/taxonomy.json";

// 화면에서 쓰는 분류 기준표(질문 선택지)만 읽는다. 교육·행사 데이터와 판정 규칙은 백엔드(jejuax-back)에 있다.
export interface Taxon { code: string; name: string; label?: string }

export const TAX = taxonomyJson as unknown as { stuck: Taxon[]; job: Taxon[]; level: Taxon[] };
