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
              我爱你王新婷！
            </p>
            <p className="text-base md:text-lg splash-subtitle">
              为你特别制作的开屏礼花彩蛋，点击或稍等片刻即可进入博客世界~
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
