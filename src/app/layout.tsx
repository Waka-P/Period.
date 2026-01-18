import { AppRouterCacheProvider } from "@mui/material-nextjs/v16-appRouter";
import { ThemeProvider } from "@mui/material/styles";
import "destyle.css";
import type { Metadata } from "next";
import { Zen_Maru_Gothic } from "next/font/google";
import theme from "../theme";
import "./globals.css";

const zenMaruGothic = Zen_Maru_Gothic({
  subsets: ["latin"],
  weight: ["300", "400", "500", "700", "900"],
  variable: "--font-zen-maru-gothic",
});

export const metadata: Metadata = {
  title: "Period.",
  description: "パートナーとココロでつながる",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className={zenMaruGothic.variable}>
        <AppRouterCacheProvider>
          <ThemeProvider theme={theme}>{children}</ThemeProvider>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
