import { ReaderArchive } from "@/components/ReaderArchive";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import "../reader-system.css";

export default function ArchivePage() { return <main className="enterprise-shell reader-system"><SiteHeader context="무료 알림 받기" /><ReaderArchive /><SiteFooter /></main>; }
