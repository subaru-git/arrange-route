import "./globals.css";
import Link from "next/link";
import { ReactNode } from "react";

export const metadata = {
  title: "Arrange Wiki",
  description: "Darts arrange dictionary",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="app-header">
          <Link href="/scores" className="app-header-title">
            Arrange Wiki
          </Link>
        </header>
        <main className="container">{children}</main>
      </body>
    </html>
  );
}
