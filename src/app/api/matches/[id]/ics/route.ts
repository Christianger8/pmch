import { NextResponse } from "next/server";
import { getMatch } from "@/features/matches/queries";
import { buildMatchICS, icsFilename } from "@/lib/ics";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const match = await getMatch(id);

  if (!match) {
    return NextResponse.json({ error: "Partido no encontrado" }, { status: 404 });
  }

  const body = buildMatchICS(match);
  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${icsFilename(match)}"`,
      "Cache-Control": "private, max-age=300",
    },
  });
}
