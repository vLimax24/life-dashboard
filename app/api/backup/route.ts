import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");

    const filename = `backup-${timestamp}.json`;

    const json = JSON.stringify(body, null, 2);

    const { error } = await supabaseServer.storage
      .from("backups")
      .upload(filename, json, {
        contentType: "application/json",
      });

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      filename,
    });
  } catch (err) {
    console.error(err);

    return NextResponse.json(
      {
        success: false,
      },
      {
        status: 500,
      },
    );
  }
}
