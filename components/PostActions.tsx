"use client";

import { useEffect, useState } from "react";
import { Heart, Share2, Link as LinkIcon } from "lucide-react";

interface PostActionsProps {
  slug: string;
  title: string;
}

interface LikesResponse {
  slug: string;
  count: number;
}

export default function PostActions({ slug, title }: PostActionsProps) {
  const [likes, setLikes] = useState<number | null>(null);
  const [liked, setLiked] = useState(false);
  const [pending, setPending] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const key = `liked:${slug}`;
    if (typeof window !== "undefined") {
      const stored = window.localStorage.getItem(key);
      if (stored === "1") {
        setLiked(true);
      }
    }

    const controller = new AbortController();

    async function fetchLikes() {
      try {
        const res = await fetch(`/api/likes?slug=${encodeURIComponent(slug)}`, {
          signal: controller.signal,
        });
        if (!res.ok) {
          setLikes(0);
          return;
        }
        const data = (await res.json()) as LikesResponse;
        setLikes(typeof data.count === "number" ? data.count : 0);
      } catch {
        setLikes(0);
      }
    }

    fetchLikes();

    return () => {
      controller.abort();
    };
  }, [slug]);

  async function handleLike() {
    if (pending || liked) return;
    setPending(true);
    try {
      const res = await fetch("/api/likes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ slug }),
      });
      if (!res.ok) {
        setPending(false);
        return;
      }
      const data = (await res.json()) as LikesResponse;
      setLikes(typeof data.count === "number" ? data.count : (likes ?? 0) + 1);
      setLiked(true);
      if (typeof window !== "undefined") {
        window.localStorage.setItem(`liked:${slug}`, "1");
      }
    } catch {
    } finally {
      setPending(false);
    }
  }

  async function handleCopyLink() {
    if (typeof window === "undefined") return;
    try {
      await window.navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      window.setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch {
    }
  }

  async function handleShare() {
    if (typeof window === "undefined") return;
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          url,
        });
        return;
      } catch {
      }
    }
    await handleCopyLink();
  }

  return (
    <div className="flex flex-col items-center gap-4 text-sm text-gray-600">
      <div className="flex flex-wrap items-center justify-center gap-4">
        <button
          type="button"
          onClick={handleLike}
          disabled={pending || liked}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium transition-colors ${
            liked
              ? "border-pink-500 bg-pink-50 text-pink-600"
              : "border-gray-200 bg-white hover:bg-pink-50 hover:border-pink-300 hover:text-pink-600"
          }`}
        >
          <Heart
            className={`w-4 h-4 ${liked ? "fill-pink-500 text-pink-500" : ""}`}
          />
          <span>{liked ? "已点赞" : "点赞"}</span>
          <span className="ml-1 text-xs text-gray-500">
            {likes === null ? "..." : likes}
          </span>
        </button>

        <button
          type="button"
          onClick={handleShare}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-gray-200 bg-white text-sm font-medium hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-600 transition-colors"
        >
          <Share2 className="w-4 h-4" />
          <span>分享</span>
        </button>

        <button
          type="button"
          onClick={handleCopyLink}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-gray-200 bg-white text-sm font-medium hover:bg-gray-50 hover:border-gray-300 transition-colors"
        >
          <LinkIcon className="w-4 h-4" />
          <span>{copied ? "链接已复制" : "复制链接"}</span>
        </button>
      </div>

      <p className="text-center text-xs text-gray-500">
        如果你喜欢这篇文章，欢迎点个赞或分享给更多人。
      </p>
    </div>
  );
}
