"use client";

import React, { useEffect, useState } from "react";

interface TimeDiff {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

const ANNIVERSARY_DATE = new Date("2025-02-11T00:00:00+08:00");

function computeDiff(): TimeDiff {
  const now = new Date();
  let diffMs = now.getTime() - ANNIVERSARY_DATE.getTime();
  if (diffMs < 0) diffMs = 0;

  const totalSeconds = Math.floor(diffMs / 1000);
  const days = Math.floor(totalSeconds / (24 * 60 * 60));
  const remainder = totalSeconds % (24 * 60 * 60);
  const hours = Math.floor(remainder / 3600);
  const minutes = Math.floor((remainder % 3600) / 60);
  const seconds = remainder % 60;

  return { days, hours, minutes, seconds };
}

function pad(num: number): string {
  return num.toString().padStart(2, "0");
}

const AnniversaryCounter: React.FC = () => {
  const [diff, setDiff] = useState<TimeDiff>(() => computeDiff());

  useEffect(() => {
    const timer = setInterval(() => {
      setDiff(computeDiff());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="mb-12">
      <div className="anniv-card px-6 py-5 md:px-8 md:py-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <p className="text-xs md:text-sm font-semibold tracking-[0.3em] text-pink-600 uppercase">
              纪念日
            </p>
            <p className="text-xl md:text-2xl font-bold text-slate-900 mt-1">2025.02.11</p>
            <p className="text-sm text-slate-600 mt-2">
              从那一天到现在，我们已经一起走过：
            </p>
          </div>
          <div className="flex flex-col items-start md:items-end gap-1 anniv-number-group">
            <div className="flex items-baseline gap-2">
              <span className="anniv-number text-3xl md:text-4xl font-extrabold text-pink-600">
                {diff.days}
              </span>
              <span className="text-sm md:text-base text-slate-700">天</span>
            </div>
            <div className="text-lg md:text-2xl font-semibold text-indigo-600 anniv-number">
              {pad(diff.hours)}:{pad(diff.minutes)}:{pad(diff.seconds)}
            </div>
          </div>
        </div>
        <div className="anniv-heart" />
      </div>
    </div>
  );
};

export default AnniversaryCounter;
