import "./globals.css";
import Link from "next/link";
import { ReactNode } from "react";

export const metadata = {
  title: "Arrange Wiki｜ダーツのアレンジ辞典",
  description: "ダーツの上がり方をツリーで探せるアレンジ辞典",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ja">
      <body>
        <header className="app-header">
          <Link href="/scores" className="app-header-title">
            <span className="app-header-mark" aria-hidden="true">
              AW
            </span>
            <span>
              <strong>Arrange Wiki</strong>
              <small>ダーツのアレンジ辞典</small>
            </span>
          </Link>
        </header>
        <main className="container">{children}</main>
      </body>
    </html>
  );
}
