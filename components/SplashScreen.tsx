"use client";

import React, { useEffect, useState } from "react";

interface SplashScreenProps {
  children: React.ReactNode;
}

export default function SplashScreen({ children }: SplashScreenProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
    }, 3200);

    return () => {
      clearTimeout(timer);
    };
  }, []);

  return (
    <div className="relative min-h-screen flex flex-col">
      {children}
      {visible && (
        <div className="fixed inset-0 z-50 flex items-center justify-center splash-backdrop">
          <div className="confetti">
            {Array.from({ length: 30 }).map((_, index) => (
              <span key={index} className="confetti-piece" />
            ))}
          </div>
          <div
            className="splash-card text-center px-8 py-10 rounded-3xl border border-white/30 shadow-[0_25px_80px_rgba(0,0,0,0.5)] backdrop-blur-2xl bg-white/10"
            onClick={() => setVisible(false)}
          >
            <p className="text-4xl md:text-6xl font-extrabold mb-5 tracking-wide splash-gradient-text">
              欢迎来到我的博客！
            </p>
            <p className="text-base md:text-lg splash-subtitle">
              坚持！
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
