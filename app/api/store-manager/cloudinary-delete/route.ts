import { NextRequest, NextResponse } from "next/server";

import { v2 as cloudinary } from "cloudinary";

import { getStoreSession } from "@/lib/store-session";

/* ============================================================
   CLOUDINARY CONFIG
   ============================================================ */

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/* ============================================================
   TYPES
   ============================================================ */

type DeleteBody = {
  imageUrl?: unknown;
};

/* ============================================================
   HELPERS
   ============================================================ */

/**
 * Cloudinary URL:
 *
 * https://res.cloudinary.com/dvivq/image/upload/v123456789/menu-items/abc.webp
 *
 * => menu-items/abc
 *
 * Cloudinary destroy cần public_id, không cần extension.
 */
function extractPublicId(imageUrl: string): string | null {
  try {
    const url = new URL(imageUrl);

    if (!url.hostname.includes("cloudinary.com")) {
      return null;
    }

    const pathname = url.pathname;

    const uploadIndex =
      pathname.indexOf("/upload/");

    if (uploadIndex === -1) {
      return null;
    }

    let publicPath = pathname.slice(
      uploadIndex + "/upload/".length
    );

    /* --------------------------------------------------------
       REMOVE TRANSFORMATION PART
       Ví dụ:

       /image/upload/c_fill,w_1200/menu-items/abc.webp

       => menu-items/abc.webp
       -------------------------------------------------------- */

    const parts = publicPath.split("/");

    const firstPart = parts[0] ?? "";

    if (
      firstPart.includes("_") ||
      firstPart.startsWith("c_") ||
      firstPart.startsWith("w_") ||
      firstPart.startsWith("h_") ||
      firstPart.startsWith("q_") ||
      firstPart.startsWith("f_")
    ) {
      parts.shift();
    }

    publicPath = parts.join("/");

    /* --------------------------------------------------------
       REMOVE VERSION

       v123456789/menu-items/abc.webp
       =>
       menu-items/abc.webp
       -------------------------------------------------------- */

    publicPath = publicPath.replace(
      /^v\d+\//,
      ""
    );

    /* --------------------------------------------------------
       REMOVE FILE EXTENSION

       abc.webp
       =>
       abc
       -------------------------------------------------------- */

    publicPath = publicPath.replace(
      /\.[^/.]+$/,
      ""
    );

    return publicPath || null;
  } catch {
    return null;
  }
}

/* ============================================================
   POST
   ============================================================ */

export async function POST(
  request: NextRequest
) {
  try {
    /* --------------------------------------------------------
       STORE SESSION
       -------------------------------------------------------- */

    const session =
      await getStoreSession();

    if (!session?.storeId) {
      return NextResponse.json(
        {
          success: false,
          error:
            "店舗ログイン情報がありません。",
        },
        {
          status: 401,
        }
      );
    }

    /* --------------------------------------------------------
       BODY
       -------------------------------------------------------- */

    const body =
      (await request.json()) as DeleteBody;

    if (
      typeof body.imageUrl !==
        "string" ||
      !body.imageUrl.trim()
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "画像URLが指定されていません。",
        },
        {
          status: 400,
        }
      );
    }

    const imageUrl =
      body.imageUrl.trim();

    /* --------------------------------------------------------
       EXTRACT PUBLIC ID
       -------------------------------------------------------- */

    const publicId =
      extractPublicId(imageUrl);

    if (!publicId) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Cloudinary画像URLが正しくありません。",
        },
        {
          status: 400,
        }
      );
    }

    /* --------------------------------------------------------
       SECURITY
       --------------------------------------------------------
       このAPIは menu-items フォルダのみ削除可能にする。
       -------------------------------------------------------- */

    if (
      !publicId.startsWith(
        "menu-items/"
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "削除できない画像です。",
        },
        {
          status: 403,
        }
      );
    }

    /* --------------------------------------------------------
       DELETE FROM CLOUDINARY
       -------------------------------------------------------- */

    const result =
      await cloudinary.uploader.destroy(
        publicId,
        {
          resource_type: "image",
          invalidate: true,
        }
      );

    console.log(
      "[Cloudinary Delete]",
      {
        storeId: session.storeId,
        publicId,
        result: result.result,
      }
    );

    /* --------------------------------------------------------
       CLOUDINARY RESULT
       -------------------------------------------------------- */

    if (
      result.result !== "ok" &&
      result.result !== "not found"
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Cloudinaryから画像を削除できませんでした。",
          result: result.result,
        },
        {
          status: 500,
        }
      );
    }

    return NextResponse.json(
      {
        success: true,
        deleted:
          result.result === "ok",
        result: result.result,
        publicId,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "[Cloudinary Delete API]",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "画像の削除に失敗しました。",
      },
      {
        status: 500,
      }
    );
  }
}