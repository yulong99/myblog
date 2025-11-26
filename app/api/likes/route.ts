import { NextRequest, NextResponse } from "next/server";
import { sql } from "@vercel/postgres";

async function ensureTable() {
  try {
    await sql`CREATE TABLE IF NOT EXISTS likes (slug TEXT PRIMARY KEY, count INT NOT NULL DEFAULT 0);`;
  } catch {
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get("slug");

  if (!slug) {
    return NextResponse.json({ error: "Missing slug" }, { status: 400 });
  }

  try {
    await ensureTable();
    const result = await sql`SELECT count FROM likes WHERE slug = ${slug};`;
    const count = result.rows[0]?.count ?? 0;
    return NextResponse.json({ slug, count });
  } catch (error) {
    return NextResponse.json({ slug, count: 0 }, { status: 200 });
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const slug = body?.slug as string | undefined;

  if (!slug) {
    return NextResponse.json({ error: "Missing slug" }, { status: 400 });
  }

  try {
    await ensureTable();
    const result = await sql`
      INSERT INTO likes (slug, count) VALUES (${slug}, 1)
      ON CONFLICT (slug) DO UPDATE SET count = likes.count + 1
      RETURNING count;
    `;

    const count = result.rows[0]?.count ?? 1;
    return NextResponse.json({ slug, count });
  } catch (error) {
    return NextResponse.json({ slug, count: 1 }, { status: 200 });
  }
}
