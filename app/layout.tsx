import type { Metadata } from "next";
import "./globals.css";
import { Inter } from "next/font/google";

export const metadata: Metadata = {
  title: "Mein Life Dashboard",
  description: "Personal life dashboard for school, fitness and goals",
  themeColor: "#0f1117",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Mein Dashboard",
  },
};

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="de" className={inter.className}>
      <head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0, viewport-fit=cover"
        />
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
