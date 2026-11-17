# jejuax-front — 제주AX단 AI 활용 진단 화면

`/diagnosis` 화면입니다. 진단 계산은 `jejuax-back` API가 합니다.

## 실행
```bash
npm install
cp .env.example .env.local   # NEXT_PUBLIC_API_BASE 에 백엔드 주소
npm run dev                  # http://localhost:3000/diagnosis
npm run typecheck
```
백엔드(`jejuax-back`)를 먼저 켜 두세요(기본 http://localhost:4000).

## 구조
| 경로 | 역할 |
|---|---|
| `app/diagnosis/` | 진단표(입력)·진행 단계·결과 화면 |
| `app/layout.tsx`, `Nav.tsx` | 레이아웃과 메뉴 |
| `lib/data.ts` | 질문 선택지용 분류표(`data/taxonomy.json`) |
| `lib/types.ts` | 백엔드 보고서 모양(백엔드와 같아야 함) |

`NEXT_PUBLIC_` 값은 브라우저에 공개되므로 비밀 키를 넣지 않습니다. 분류표를 바꾸면 백엔드 `data/taxonomy.json`과 같이 고칩니다.
