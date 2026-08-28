import { v2 as cloudinary } from "cloudinary";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    const timestamp = Math.floor(
      Date.now() / 1000
    );

    const signature =
      cloudinary.utils.api_sign_request(
        {
          timestamp,
          folder: "menu-items",
        },
        process.env.CLOUDINARY_API_SECRET!
      );

    return NextResponse.json({
      signature,
      timestamp,
      apiKey:
        process.env.CLOUDINARY_API_KEY,
      cloudName:
        process.env.CLOUDINARY_CLOUD_NAME,
    });

  } catch (error) {
    console.error(
      "[Cloudinary Signature]",
      error
    );

    return NextResponse.json(
      {
        error:
          "Cloudinary署名の生成に失敗しました。",
      },
      {
        status: 500,
      }
    );
  }
}