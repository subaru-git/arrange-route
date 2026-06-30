import "./globals.css";
import { AuthStatus } from "@/components/auth-status";
import Image from "next/image";
import Link from "next/link";
import { ReactNode } from "react";

export const metadata = {
  title: "アレンジルート｜ダーツの上がり方をルートで探せる",
  description: "ダーツのアレンジを投稿・投票で探せるルート集",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ja">
      <body>
        <header className="app-header">
          <Link href="/scores" className="app-header-title">
            <Image
              className="app-header-mark"
              src="/arrange-route-icon.png"
              alt=""
              width={40}
              height={40}
              priority
            />
            <span>
              <strong>アレンジルート</strong>
              <small>Arrange Route</small>
            </span>
          </Link>
          <AuthStatus />
        </header>
        <main className="container">{children}</main>
      </body>
    </html>
  );
}
