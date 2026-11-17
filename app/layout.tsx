import type { Metadata } from "next";
import "./globals.css";
import Nav from "./Nav";

export const metadata: Metadata = {
  title: "AI 활용 진단 | 제주AX단",
  description: "내 업무와 AI 활용 수준을 진단하고, 외부 교육기관 교육 데이터로 맞는 학습 경로를 제안받아 보세요.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>
        <header className="site-header">
          <div className="wrap">
            <a className="brand" href="https://jejuaxdan.com/">제주AX단</a>
            <Nav />
          </div>
        </header>
        <main><div className="wrap">{children}</div></main>
      </body>
    </html>
  );
}
