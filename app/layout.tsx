import "./globals.css";
import { ReactNode } from "react";

export const metadata = {
  title: "Arrange Wiki",
  description: "Darts arrange dictionary",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <main className="container">{children}</main>
      </body>
    </html>
  );
}
