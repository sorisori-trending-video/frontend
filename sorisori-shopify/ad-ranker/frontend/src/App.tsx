import MetaApifyPage from "./pages/MetaApifyPage";
import HomePage from "./pages/HomePage";
import IgGraphPage from "./pages/IgGraphPage";
import TiktokApifyPage from "./pages/TiktokApifyPage";
import TiktokScraperPage from "./pages/TiktokScraperPage";
import TiktokCreativeCenterPage from "./pages/TiktokCreativeCenterPage";
import TiktokCreativeCenterTopAdsDashboardPage from "./pages/TiktokCreativeCenterTopAdsDashboardPage";

export default function App() {
  const rawPath = window.location.pathname;
  const path = rawPath !== "/" && rawPath.endsWith("/") ? rawPath.slice(0, -1) : rawPath;

  if (path === "/meta-apify") return <MetaApifyPage />;
  if (path === "/tiktok-apify") return <TiktokApifyPage />;
  if (path === "/tiktok-scraper") return <TiktokScraperPage />;
  if (path === "/tiktok-creative-center") return <TiktokCreativeCenterPage />;
  if (path === "/tiktok-creative-center/top-ads-dashboard") return <TiktokCreativeCenterTopAdsDashboardPage />;
  if (path === "/ig-graph") return <IgGraphPage />;
  return <HomePage />;
}