"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/lib/store/useAppStore";
import { OnboardingScreen } from "@/components/onboarding/OnboardingScreen";

export default function RootPage() {
  const router = useRouter();
  const onboarded = useAppStore((s) => s.onboarded);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated && onboarded) {
      router.replace("/mapa");
    }
  }, [hydrated, onboarded, router]);

  if (!hydrated || onboarded) {
    return <div className="min-h-screen bg-dark-green" />;
  }

  return <OnboardingScreen />;
}
