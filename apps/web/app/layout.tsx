import type { Metadata } from "next";
import "./globals.css";
import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";

export const metadata: Metadata = {
  title: "DeploySense - DevOps Intelligence",
  description: "Scan Docker, Kubernetes, GitHub Actions, Compose configs, and logs before deployments break production.",
  openGraph: {
    title: "DeploySense - Fix deployments before they break production",
    description: "Health scores, risk analysis, and plain-English fixes for deployment configs.",
    type: "website"
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body>
        <Navbar />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
