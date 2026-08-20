import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { getStoreSession } from "@/lib/store-session";

export async function GET() {
  try {
    const session = await getStoreSession();

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          status: "OFFLINE",
        },
        { status: 401 }
      );
    }

    const printer = await db.tbl_printer_status.findFirst({
      where: {
        store_id: session.storeId,
      },
      select: {
        status: true,
        last_heartbeat: true,
        last_error: true,
        last_print_at: true,
        printer_ip: true,
        printer_port: true,
      },
    });

    if (!printer) {
      return NextResponse.json({
        success: true,
        status: "OFFLINE",
        lastError: null,
      });
    }

    // Worker phải heartbeat liên tục.
    // Nếu quá 10 giây không heartbeat
    // thì coi như worker đã mất kết nối.
    const heartbeatTimeout = 10 * 1000;

    const lastHeartbeat = printer.last_heartbeat
      ? new Date(printer.last_heartbeat).getTime()
      : 0;

    const now = Date.now();

    const heartbeatAlive =
      lastHeartbeat > 0 &&
      now - lastHeartbeat <= heartbeatTimeout;

    let status: "ONLINE" | "OFFLINE" | "ERROR";

    if (!heartbeatAlive) {
      status = "OFFLINE";
    } else if (printer.status === "ERROR") {
      status = "ERROR";
    } else if (printer.status === "ONLINE") {
      status = "ONLINE";
    } else {
      status = "OFFLINE";
    }

    return NextResponse.json({
      success: true,
      status,
      lastError: printer.last_error,
      lastHeartbeat: printer.last_heartbeat,
      lastPrintAt: printer.last_print_at,
      printerIp: printer.printer_ip,
      printerPort: printer.printer_port,
    });

  } catch (error) {
    console.error(
      "PRINTER STATUS API ERROR:",
      error
    );

    return NextResponse.json({
      success: false,
      status: "OFFLINE",
      lastError: "プリンター状態を取得できません。",
    });
  }
}