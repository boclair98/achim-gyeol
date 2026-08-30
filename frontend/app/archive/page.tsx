import { ReaderArchive } from "@/components/ReaderArchive";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import "../enterprise.css";

export default function ArchivePage() { return <main className="enterprise-shell"><SiteHeader context="무료 알림 받기" /><ReaderArchive /><SiteFooter /></main>; }
