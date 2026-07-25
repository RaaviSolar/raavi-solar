import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";

export const metadata: Metadata = {
  title: "Raavi Solar | Solar Design Studio",
  description: "Raavi Solar - Jaipur's premium solar design software. OpenSolar alternative - 3D design, shade analysis, CRM, proposals. www.raavisolar.com | 9214567383",
  icons: {
    icon: "/raavi-logo.png",
  },
  openGraph: {
    title: "Raavi Solar",
    description: "Professional solar design studio for Rajasthan - 3D, Shade Heatmap, CRM, Proposals",
    images: ["/raavi-logo.png"],
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="hi" className="h-full">
      <body className="h-full antialiased">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
