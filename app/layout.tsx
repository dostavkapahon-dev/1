import type { Metadata } from "next";
import "./styles.css";

export const metadata: Metadata = {
  title: "Идеальный год",
  description: "Спокойная система ежедневных шагов",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ru"><body>{children}</body></html>;
}
