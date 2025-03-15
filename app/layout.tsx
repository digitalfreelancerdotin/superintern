import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "./components/ui/toaster";
import ClientAuthProvider from "./components/client-auth-provider";
import { ThemeProvider } from "@/app/components/providers/theme-provider";

export const metadata: Metadata = {
  title: "SuperIntern - Intern Management Platform",
  description: "Platform for managing intern profiles and resumes",
};

export const dynamic = 'force-dynamic';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <body className="antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <ClientAuthProvider>
            {children}
          </ClientAuthProvider>
        </ThemeProvider>
        <Toaster />
      </body>
    </html>
  );
}
