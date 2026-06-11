"use client";

import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { useTheme } from "next-themes";

export function ClerkThemeProvider({ children }: { children: React.ReactNode }) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  return (
    <ClerkProvider
      appearance={{
        baseTheme: isDark ? dark : undefined,
        variables: {
          colorPrimary: "#10b981",
          colorBackground: isDark ? "#0B0D14" : "#ffffff",
          colorText: isDark ? "#F5F7FA" : "#0f172a",
          colorInputBackground: isDark ? "#11141D" : "#f8fafc",
          borderRadius: "0.75rem",
          fontFamily: "var(--font-inter), system-ui, sans-serif",
        },
      }}
    >
      {children}
    </ClerkProvider>
  );
}
