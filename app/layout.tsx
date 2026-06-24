import "./globals.css";
import { AuthStatus } from "@/components/auth-status";
import Image from "next/image";
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
            <Image
              className="app-header-mark"
              src="/arrange-wiki-icon.png"
              alt=""
              width={40}
              height={40}
              priority
            />
            <span>
              <strong>Arrange Wiki</strong>
              <small>ダーツのアレンジ辞典</small>
            </span>
          </Link>
          <AuthStatus />
        </header>
        <main className="container">{children}</main>
      </body>
    </html>
  );
}
