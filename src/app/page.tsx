"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/lib/store/useAppStore";
import { OnboardingScreen } from "@/components/onboarding/OnboardingScreen";
import { SplashScreen, useSplashGate } from "@/components/splash/SplashScreen";

export default function RootPage() {
  const router = useRouter();
  const onboarded = useAppStore((s) => s.onboarded);
  const [hydrated, setHydrated] = useState(false);
  const { show: showSplash, fading } = useSplashGate(hydrated);

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!showSplash && onboarded) {
      router.replace("/mapa");
    }
  }, [showSplash, onboarded, router]);

  if (showSplash) {
    return <SplashScreen fadingOut={fading} />;
  }

  if (onboarded) {
    return <div className="min-h-screen bg-dark-green" />;
  }

  return <OnboardingScreen />;
}
