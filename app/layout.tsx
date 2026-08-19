import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Bánh Mì",
  description: "Bánh Mì",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,300,0,0"
        />
      </head>

      <body>{children}</body>
    </html>
  );
}