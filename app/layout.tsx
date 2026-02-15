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
        <header className="site-header">
          <Link href="/scores/70">Arrange Wiki</Link>
          <Link href="/new">New Post</Link>
        </header>
        <main className="container">{children}</main>
      </body>
    </html>
  );
}
