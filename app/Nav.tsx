"use client";
import { usePathname } from "next/navigation";

// 기존 메뉴는 실제 사이트로 연결하고, 새로 추가하는 'AI 진단'만 이 앱의 페이지다.
const ITEMS = [
  { href: "https://jejuaxdan.com/courses", label: "교육" },
  { href: "https://jejuaxdan.com/events", label: "행사 일정" },
  { href: "https://jejuaxdan.com/roadmaps", label: "로드맵" },
  { href: "https://jejuaxdan.com/about", label: "소개" },
  { href: "/diagnosis", label: "AI 진단", internal: true },
  { href: "https://jejuaxdan.com/contact", label: "문의" },
];

export default function Nav() {
  const path = usePathname();
  return (
    <nav className="nav" aria-label="주 메뉴">
      {ITEMS.map((i) => (
        <a key={i.href} href={i.href} aria-current={i.internal && path.startsWith(i.href) ? "page" : undefined}>{i.label}</a>
      ))}
    </nav>
  );
}
