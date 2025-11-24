"use client";

import React, { useEffect, useState } from "react";

interface SplashScreenProps {
  children: React.ReactNode;
}

export default function SplashScreen({ children }: SplashScreenProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const hasSeen = window.sessionStorage.getItem("seen_splash_wxt") === "1";
    if (hasSeen) {
      setVisible(false);
      return;
    }

    const timer = setTimeout(() => {
      setVisible(false);
      window.sessionStorage.setItem("seen_splash_wxt", "1");
    }, 2500);

    return () => {
      clearTimeout(timer);
    };
  }, []);

  return (
    <div className="relative min-h-screen flex flex-col">
      {children}
      {visible && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
          <div
            className="text-center px-6 py-8 rounded-2xl border border-white/20 shadow-2xl backdrop-blur-md"
            onClick={() => setVisible(false)}
          >
            <p className="text-3xl md:text-5xl font-bold text-white mb-4 tracking-wide">
              我爱你王新婷！
            </p>
            <p className="text-sm md:text-base text-gray-200">
              为你特别制作的开屏小彩蛋，点击即可进入博客~
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
