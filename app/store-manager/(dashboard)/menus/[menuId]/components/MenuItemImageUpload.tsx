"use client";

import Image from "next/image";

import {
  ChangeEvent,
  DragEvent,
  useRef,
  useState,
} from "react";

import styles from "../styles/MenuItemImageUpload.module.css";

type Props = {
  imageUrl: string;
  saving: boolean;
  onChange: (url: string) => void;
};

export default function MenuItemImageUpload({
  imageUrl,
  saving,
  onChange,
}: Props) {
  const inputRef =
    useRef<HTMLInputElement | null>(null);

  const [uploading, setUploading] =
    useState(false);

  const [isDragging, setIsDragging] =
    useState(false);

  const [error, setError] =
    useState("");

  const disabled =
    saving || uploading;

  /* ==========================================================
     DELETE IMAGE FROM CLOUDINARY
     ========================================================== */

  async function deleteCloudinaryImage(
    url: string
  ): Promise<boolean> {
    if (!url) {
      return true;
    }

    try {
      const response =
        await fetch(
          "/api/store-manager/cloudinary-delete",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
              Accept:
                "application/json",
            },

            cache: "no-store",

            body: JSON.stringify({
              imageUrl: url,
            }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        console.error(
          "[MenuItemImageUpload] Cloudinary delete failed:",
          data
        );

        throw new Error(
          data?.error ??
            "Cloudinaryから画像を削除できませんでした。"
        );
      }

      console.log(
        "[MenuItemImageUpload] Cloudinary image deleted:",
        data
      );

      return true;
    } catch (error) {
      console.error(
        "[MenuItemImageUpload] Delete error:",
        error
      );

      throw error;
    }
  }

  /* ==========================================================
     IMAGE OPTIMIZATION
     CROP 4:3 + RESIZE + WEBP
     ========================================================== */

  async function optimizeImage(
    file: File
  ): Promise<File> {
    return new Promise(
      (resolve, reject) => {
        const img =
          new window.Image();

        const objectUrl =
          URL.createObjectURL(file);

        img.onload = () => {
          URL.revokeObjectURL(
            objectUrl
          );

          const TARGET_WIDTH =
            1200;

          const TARGET_HEIGHT =
            900;

          const TARGET_RATIO =
            TARGET_WIDTH /
            TARGET_HEIGHT;

          const srcWidth =
            img.width;

          const srcHeight =
            img.height;

          const srcRatio =
            srcWidth / srcHeight;

          let cropX = 0;
          let cropY = 0;

          let cropWidth =
            srcWidth;

          let cropHeight =
            srcHeight;

          /* --------------------------------------------------
             CROP CENTER 4:3
             -------------------------------------------------- */

          if (
            srcRatio >
            TARGET_RATIO
          ) {
            cropWidth =
              srcHeight *
              TARGET_RATIO;

            cropX =
              (srcWidth -
                cropWidth) /
              2;
          } else {
            cropHeight =
              srcWidth /
              TARGET_RATIO;

            cropY =
              (srcHeight -
                cropHeight) /
              2;
          }

          /* --------------------------------------------------
             CANVAS
             -------------------------------------------------- */

          const canvas =
            document.createElement(
              "canvas"
            );

          canvas.width =
            TARGET_WIDTH;

          canvas.height =
            TARGET_HEIGHT;

          const ctx =
            canvas.getContext("2d");

          if (!ctx) {
            reject(
              new Error(
                "画像の処理に失敗しました。"
              )
            );

            return;
          }

          ctx.imageSmoothingEnabled =
            true;

          ctx.imageSmoothingQuality =
            "high";

          /* --------------------------------------------------
             DRAW
             -------------------------------------------------- */

          ctx.drawImage(
            img,

            cropX,
            cropY,

            cropWidth,
            cropHeight,

            0,
            0,

            TARGET_WIDTH,
            TARGET_HEIGHT
          );

          /* --------------------------------------------------
             WEBP
             -------------------------------------------------- */

          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(
                  new Error(
                    "画像の変換に失敗しました。"
                  )
                );

                return;
              }

              const baseName =
                file.name.replace(
                  /\.[^/.]+$/,
                  ""
                );

              const optimizedFile =
                new File(
                  [blob],
                  `${baseName}.webp`,
                  {
                    type:
                      "image/webp",
                  }
                );

              resolve(
                optimizedFile
              );
            },

            "image/webp",

            0.82
          );
        };

        img.onerror = () => {
          URL.revokeObjectURL(
            objectUrl
          );

          reject(
            new Error(
              "画像の読み込みに失敗しました。"
            )
          );
        };

        img.src = objectUrl;
      }
    );
  }

  /* ==========================================================
     VALIDATE & UPLOAD
     ========================================================== */

  async function processFile(
    file: File
  ) {
    if (
      !file.type.startsWith(
        "image/"
      )
    ) {
      setError(
        "画像ファイルを選択してください。"
      );

      return;
    }

    const maxSize =
      10 * 1024 * 1024;

    if (file.size > maxSize) {
      setError(
        "画像サイズは10MB以下にしてください。"
      );

      return;
    }

    setUploading(true);
    setError("");

    /*
     * 保存しておく。
     *
     * upload後に onChange(newUrl) すると
     * imageUrl が変わるため、
     * 必ず oldImageUrl を使って削除する。
     */
    const oldImageUrl =
      imageUrl;

    try {
      /* ======================================================
         1. OPTIMIZE
         ====================================================== */

      const optimizedFile =
        await optimizeImage(
          file
        );

      console.log(
        "[MenuItemImageUpload] Original:",
        Math.round(
          file.size / 1024
        ),
        "KB"
      );

      console.log(
        "[MenuItemImageUpload] Optimized:",
        Math.round(
          optimizedFile.size /
            1024
        ),
        "KB"
      );

      /* ======================================================
         2. GET CLOUDINARY SIGNATURE
         ====================================================== */

      const signatureResponse =
        await fetch(
          "/api/store-manager/cloudinary-sign",
          {
            method: "POST",
            cache: "no-store",
          }
        );

      const signatureData =
        await signatureResponse.json();

      if (
        !signatureResponse.ok
      ) {
        throw new Error(
          signatureData?.error ??
            "画像アップロードの準備に失敗しました。"
        );
      }

      /* ======================================================
         3. FORM DATA
         ====================================================== */

      const formData =
        new FormData();

      formData.append(
        "file",
        optimizedFile
      );

      formData.append(
        "api_key",
        signatureData.apiKey
      );

      formData.append(
        "timestamp",
        String(
          signatureData.timestamp
        )
      );

      formData.append(
        "signature",
        signatureData.signature
      );

      formData.append(
        "folder",
        "menu-items"
      );

      /* ======================================================
         4. UPLOAD NEW IMAGE
         ====================================================== */

      const uploadResponse =
        await fetch(
          `https://api.cloudinary.com/v1_1/${signatureData.cloudName}/image/upload`,
          {
            method: "POST",
            body: formData,
          }
        );

      const uploadData =
        await uploadResponse.json();

      if (
        !uploadResponse.ok
      ) {
        throw new Error(
          uploadData?.error
            ?.message ??
            "画像のアップロードに失敗しました。"
        );
      }

      /* ======================================================
         5. GET NEW URL
         ====================================================== */

      const secureUrl =
        uploadData.secure_url;

      if (!secureUrl) {
        throw new Error(
          "Cloudinary URLを取得できませんでした。"
        );
      }

      /* ======================================================
         6. DELETE OLD IMAGE
         ====================================================== */

      if (
        oldImageUrl &&
        oldImageUrl !==
          secureUrl
      ) {
        try {
          await deleteCloudinaryImage(
            oldImageUrl
          );
        } catch (deleteError) {
          /*
           * 新しい画像のuploadは成功している。
           *
           * そのためUIは新しい画像に変更する。
           *
           * ただし古い画像削除に失敗したことは
           * ユーザーに通知する。
           */

          console.error(
            "[MenuItemImageUpload] Old image deletion failed:",
            deleteError
          );

          setError(
            "新しい画像はアップロードされましたが、古い画像の削除に失敗しました。"
          );
        }
      }

      /* ======================================================
         7. UPDATE PARENT STATE
         ====================================================== */

      onChange(
        secureUrl
      );
    } catch (err) {
      console.error(
        "[MenuItemImageUpload]",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "画像のアップロードに失敗しました。"
      );
    } finally {
      setUploading(false);

      if (
        inputRef.current
      ) {
        inputRef.current.value =
          "";
      }
    }
  }

  /* ==========================================================
     FILE INPUT
     ========================================================== */

  function handleFileChange(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const file =
      event.target.files?.[0];

    if (file) {
      processFile(file);
    }
  }

  /* ==========================================================
     DRAG
     ========================================================== */

  function handleDragOver(
    e: DragEvent<HTMLDivElement>
  ) {
    e.preventDefault();
    e.stopPropagation();

    if (
      !disabled &&
      !isDragging
    ) {
      setIsDragging(true);
    }
  }

  function handleDragLeave(
    e: DragEvent<HTMLDivElement>
  ) {
    e.preventDefault();
    e.stopPropagation();

    setIsDragging(false);
  }

  function handleDrop(
    e: DragEvent<HTMLDivElement>
  ) {
    e.preventDefault();
    e.stopPropagation();

    setIsDragging(false);

    if (disabled) {
      return;
    }

    const file =
      e.dataTransfer.files?.[0];

    if (file) {
      processFile(file);
    }
  }

  /* ==========================================================
     REMOVE IMAGE
     ========================================================== */

  async function removeImage() {
    if (
      disabled ||
      !imageUrl
    ) {
      return;
    }

    setUploading(true);
    setError("");

    try {
      /*
       * 1. Cloudinaryから削除
       */
      await deleteCloudinaryImage(
        imageUrl
      );

      /*
       * 2. Parent stateからも削除
       */
      onChange("");

      setError("");
    } catch (error) {
      console.error(
        "[MenuItemImageUpload] Remove image error:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "画像の削除に失敗しました。"
      );
    } finally {
      setUploading(false);
    }
  }

  /* ==========================================================
     RENDER
     ========================================================== */

  return (
    <section
      className={
        styles.container
      }
    >
      <div
        className={
          styles.header
        }
      >
        <div
          className={
            styles.iconWrapper
          }
        >
          <span className="material-symbols-outlined">
            image
          </span>
        </div>

        <div
          className={
            styles.headerText
          }
        >
          <h3>
            商品画像
          </h3>

          <p>
            商品一覧・メニューに表示されるメイン画像です
          </p>
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={
          handleFileChange
        }
        disabled={disabled}
        className={
          styles.hiddenFileInput
        }
      />

      {imageUrl ? (
        <div
          className={
            styles.previewCard
          }
        >
          <div
            className={
              styles.imageWrapper
            }
          >
            <Image
              src={imageUrl}
              alt="商品画像"
              fill
              sizes="(max-width: 640px) 100vw, 800px"
              className={
                styles.previewImage
              }
            />
          </div>

          <div
            className={
              styles.previewActions
            }
          >
            <button
              type="button"
              className={
                styles.changeButton
              }
              onClick={() =>
                inputRef.current?.click()
              }
              disabled={
                disabled
              }
            >
              <span
                className={`material-symbols-outlined ${
                  uploading
                    ? styles.spin
                    : ""
                }`}
              >
                {uploading
                  ? "sync"
                  : "photo_camera"}
              </span>

              <span>
                {uploading
                  ? "変更中..."
                  : "画像を変更"}
              </span>
            </button>

            <button
              type="button"
              className={
                styles.removeButton
              }
              onClick={
                removeImage
              }
              disabled={
                disabled
              }
            >
              <span className="material-symbols-outlined">
                {uploading
                  ? "sync"
                  : "delete"}
              </span>

              <span>
                {uploading
                  ? "削除中..."
                  : "削除"}
              </span>
            </button>
          </div>
        </div>
      ) : (
        <div
          className={`${styles.dropzone} ${
            isDragging
              ? styles.dragging
              : ""
          }`}
          onDragOver={
            handleDragOver
          }
          onDragLeave={
            handleDragLeave
          }
          onDrop={handleDrop}
          onClick={() =>
            !disabled &&
            inputRef.current?.click()
          }
        >
          <div
            className={
              styles.dropzoneIconWrapper
            }
          >
            <span
              className={`material-symbols-outlined ${
                uploading
                  ? styles.spin
                  : ""
              }`}
            >
              {uploading
                ? "sync"
                : "add_a_photo"}
            </span>
          </div>

          <div
            className={
              styles.dropzoneText
            }
          >
            <strong>
              {uploading
                ? "ファイルを最適化中..."
                : isDragging
                ? "ここに画像をドロップ"
                : "クリックまたは画像をドラッグ＆ドロップ"}
            </strong>

            <p>
              JPG, PNG, WEBP（4:3 に自動最適化されます）
            </p>
          </div>
        </div>
      )}

      {error && (
        <div
          className={
            styles.errorMessage
          }
        >
          <span className="material-symbols-outlined">
            error
          </span>

          <span>
            {error}
          </span>
        </div>
      )}
    </section>
  );
}