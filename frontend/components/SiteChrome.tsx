import Link from "next/link";
import { ArrowUpRight, CheckCircle2 } from "lucide-react";

export function SiteHeader({ context = "NEWS DELIVERY PLATFORM" }: { context?: string }) {
  return (
    <header className="site-header">
      <Link className="site-brand" href="/"><i aria-hidden="true" />아침결<span>BRIEFING OS</span></Link>
      <nav aria-label="주요 메뉴">
        <Link href="/">브리핑</Link>
        <Link href="/studio">편집 스튜디오</Link>
        <Link href="/trust">신뢰센터</Link>
      </nav>
      <div className="site-context"><CheckCircle2 size={14} /> {context}</div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="enterprise-footer">
      <div><strong>아침결 Briefing OS</strong><p>뉴스 조직과 전문 커뮤니티를 위한 화이트라벨 AI 브리핑 제작·전송 플랫폼</p></div>
      <nav aria-label="정책 문서">
        <Link href="/trust">편집 원칙</Link>
        <Link href="/privacy">개인정보처리방침</Link>
        <Link href="/terms">이용약관</Link>
        <a href="mailto:editor@achim-gyeol.example">편집 문의 <ArrowUpRight size={12} /></a>
      </nav>
      <span>AI가 초안을 만들며, 발행 전 편집 검토를 전제로 설계되었습니다.</span>
    </footer>
  );
}
