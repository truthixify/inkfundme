import { Geist_Mono as FontMono, Geist as FontSans, Roboto } from "next/font/google"
import { cn } from "../lib/utils"

export const fontSans = FontSans({
  variable: "--font-sans",
  subsets: ["latin"],
  style: ["normal"],
})

export const fontMono = FontMono({
  variable: "--font-mono",
  subsets: ["latin"],
})

export const fontRoboto = Roboto({
  variable: "--font-roboto",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
})

export const fontStyles = cn(fontSans.variable, fontMono.variable, fontRoboto.variable)
