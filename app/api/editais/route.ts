import { NextRequest, NextResponse } from "next/server";
import { all, ORDEM_POR_PRAZO } from "@/lib/db";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const q = searchParams.get("q");

  let sqlText = "SELECT * FROM editais WHERE 1=1";
  const params: unknown[] = [];
  if (status) {
    sqlText += " AND status = ?";
    params.push(status);
  }
  if (q) {
    sqlText += " AND (nome ILIKE ? OR orgao ILIKE ?)";
    params.push(`%${q}%`, `%${q}%`);
  }
  // mesma ordem por prazo da tela /editais (ver ORDEM_POR_PRAZO)
  sqlText += ORDEM_POR_PRAZO + " LIMIT 200";

  return NextResponse.json(await all(sqlText, params));
}
