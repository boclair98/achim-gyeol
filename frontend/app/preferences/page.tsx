import { PreferenceCenter } from "@/components/PreferenceCenter";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import "../reader-system.css";

export default function PreferencesPage() { return <main className="enterprise-shell reader-system"><SiteHeader context="무료 알림 받기" /><PreferenceCenter /><SiteFooter /></main>; }
