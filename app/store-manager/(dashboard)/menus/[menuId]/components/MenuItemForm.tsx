"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";

import styles from "../styles/MenuItemForm.module.css";

import MenuItemBasicInfo from "./MenuItemBasicInfo";
import MenuItemTags from "./MenuItemTags";
import MenuItemAllergens from "./MenuItemAllergens";
import MenuItemOptions from "./MenuItemOptions";
import MenuItemImageUpload from "./MenuItemImageUpload";
import MenuItemVariants from "./MenuItemVariants";

// ✅ SỬA: thêm MenuItem vào import
import type {
  MenuItem,
  ItemOptionGroup,
  ItemOptionItem,
  MenuOptionGroup,
  OptionGroup,
  OptionItem,
} from "../MenuEditorClient";


/* ============================================================
   TYPES
   ============================================================ */

type Props = {
  menuId: number | null;
  categoryId: number | null;

  item: MenuItem | null;

  itemOptionGroups: ItemOptionGroup[];
  itemOptionItems: ItemOptionItem[];

  optionGroups: OptionGroup[];
  optionItems: OptionItem[];
  menuOptionGroups: MenuOptionGroup[];

  onClose: () => void;
  onSaved: (item: MenuItem) => void;
};

type MenuCategory = {
  id: number;
  menu_id: number;
  name_ja: string;
  name_vi: string | null;
  name_en: string | null;
  name_zh: string | null;
  display_order: number | null;
  is_active: boolean | null;
};

/* ============================================================
   COMPONENT
   ============================================================ */

export default function MenuItemForm({
  menuId,
  categoryId,
  item,
  itemOptionGroups,
  itemOptionItems,
  optionGroups,
  optionItems,
  menuOptionGroups,
  onClose,
  onSaved,
}: Props) {

  // ... (phần còn lại giữ nguyên, không thay đổi)

  /* ============================================================
     BASIC STATE
     ============================================================ */

  const [nameJa, setNameJa] = useState(
    item?.name_ja ?? ""
  );

  const [nameVi, setNameVi] = useState(
    item?.name_vi ?? ""
  );

  const [nameEn, setNameEn] = useState(
    item?.name_en ?? ""
  );

  const [nameZh, setNameZh] = useState(
    item?.name_zh ?? ""
  );


  const [descriptionJa, setDescriptionJa] =
    useState(
      item?.description_ja ?? ""
    );

  const [descriptionVi, setDescriptionVi] =
    useState(
      item?.description_vi ?? ""
    );

  const [descriptionEn, setDescriptionEn] =
    useState(
      item?.description_en ?? ""
    );

  const [descriptionZh, setDescriptionZh] =
    useState(
      item?.description_zh ?? ""
    );


  const [price, setPrice] = useState(
    item?.price?.toString() ?? ""
  );


  const originalImageUrl = item?.image_url ?? "";

  const savedImageUrlRef = useRef(
    originalImageUrl
  );

  const [imageUrl, setImageUrl] = useState(
    originalImageUrl
  );

  const [
    selectedCategoryId,
    setSelectedCategoryId,
  ] = useState<number | null>(
    item?.category_id ??
      categoryId ??
      null
  );

  const [
    categories,
    setCategories,
  ] = useState<MenuCategory[]>([]);

  const [
    loadingCategories,
    setLoadingCategories,
  ] = useState(true);


  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");


    /* ============================================================
     SYNC FORM STATE WHEN ITEM CHANGES
     ============================================================ */

  useEffect(() => {
    setNameJa(item?.name_ja ?? "");
    setNameVi(item?.name_vi ?? "");
    setNameEn(item?.name_en ?? "");
    setNameZh(item?.name_zh ?? "");

    setDescriptionJa(
      item?.description_ja ?? ""
    );

    setDescriptionVi(
      item?.description_vi ?? ""
    );

    setDescriptionEn(
      item?.description_en ?? ""
    );

    setDescriptionZh(
      item?.description_zh ?? ""
    );

    setPrice(
      item?.price?.toString() ?? ""
    );

    setImageUrl(
      item?.image_url ?? ""
    );

    setSelectedCategoryId(
      item?.category_id ??
        categoryId ??
        null
    );

    setError("");
  }, [
    item,
    categoryId,
  ]);

  useEffect(() => {
    savedImageUrlRef.current =
      item?.image_url ?? "";
  }, [item]);


  useEffect(() => {
    let cancelled = false;

    async function loadCategories() {
      setLoadingCategories(true);

      try {
        const response = await fetch(
          `/api/store-manager/menu-categories?menu_id=${menuId}`,
          {
            method: "GET",
            cache: "no-store",
          }
        );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data?.error ??
              "カテゴリの取得に失敗しました。"
          );
        }

        if (cancelled) {
          return;
        }

        setCategories(
          Array.isArray(data.categories)
            ? data.categories
            : []
        );

        /*
        * For existing item:
        * keep its category.
        *
        * For new item:
        * use the category coming from parent
        * if it exists.
        */

        const initialCategoryId =
          item?.category_id ??
          categoryId ??
          null;

        if (
          initialCategoryId !== null
        ) {
          setSelectedCategoryId(
            initialCategoryId
          );
        }
      } catch (error) {
        if (cancelled) {
          return;
        }

        console.error(
          "[MenuItemForm] Category load error:",
          error
        );

        setError(
          error instanceof Error
            ? error.message
            : "カテゴリの取得に失敗しました。"
        );
      } finally {
        if (!cancelled) {
          setLoadingCategories(false);
        }
      }
    }

    loadCategories();

    return () => {
      cancelled = true;
    };
  }, [menuId]);



  /* ============================================================
   DELETE CLOUDINARY IMAGE
   ============================================================ */

  async function deleteCloudinaryImage(imageUrlToDelete: string) {
    if (!imageUrlToDelete) {
      return true;
    }

    try {
      const response = await fetch(
        "/api/store-manager/cloudinary-delete",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          cache: "no-store",
          body: JSON.stringify({
            imageUrl: imageUrlToDelete,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        console.error(
          "[MenuItemForm] Cloudinary delete failed:",
          data
        );

        return false;
      }

      console.log(
        "[MenuItemForm] Cloudinary image deleted:",
        imageUrlToDelete
      );

      return true;
    } catch (error) {
      console.error(
        "[MenuItemForm] Cloudinary delete error:",
        error
      );

      return false;
    }
  }


  async function handleClose() {
    if (saving) {
      return;
    }

    /*
    * Nếu ảnh hiện tại khác ảnh ban đầu
    * thì ảnh hiện tại là ảnh mới upload lên Cloudinary.
    *
    * Khi người dùng Cancel:
    * → không lưu DB
    * → phải xóa ảnh mới.
    */
    const hasNewImage =
      imageUrl.trim() !== originalImageUrl.trim();

    if (hasNewImage && imageUrl.trim()) {
      await deleteCloudinaryImage(
        imageUrl.trim()
      );
    }

    onClose();
  }


  /* ============================================================
     SAVE
     ============================================================ */

  async function handleSave() {
    /* ----------------------------------------------------------
      CATEGORY
      ---------------------------------------------------------- */

    if (!selectedCategoryId) {
      setError(
        "カテゴリが選択されていません。"
      );

      return;
    }

    /* ----------------------------------------------------------
      NAME
      ---------------------------------------------------------- */

    if (!nameJa.trim()) {
      setError(
        "商品名を入力してください。"
      );

      return;
    }

    /* ----------------------------------------------------------
      PRICE
      ---------------------------------------------------------- */

    const numericPrice =
      Number(price);

    if (
      !Number.isFinite(
        numericPrice
      ) ||
      numericPrice < 0
    ) {
      setError(
        "価格を正しく入力してください。"
      );

      return;
    }

    /* ----------------------------------------------------------
      SAVE
      ---------------------------------------------------------- */

    setSaving(true);
    setError("");

    try {
      const response =
        await fetch(
          "/api/store-manager/menu-items",
          {
            method: item
              ? "PATCH"
              : "POST",

            headers: {
              "Content-Type":
                "application/json",

              Accept:
                "application/json",
            },

            body: JSON.stringify({
              id:
                item?.id ??
                undefined,

              menu_id:
                menuId,

              category_id:
                selectedCategoryId,

              name_ja:
                nameJa.trim(),

              name_vi:
                nameVi.trim() ||
                null,

              name_en:
                nameEn.trim() ||
                null,

              name_zh:
                nameZh.trim() ||
                null,

              description_ja:
                descriptionJa.trim() ||
                null,

              description_vi:
                descriptionVi.trim() ||
                null,

              description_en:
                descriptionEn.trim() ||
                null,

              description_zh:
                descriptionZh.trim() ||
                null,

              price:
                numericPrice,

              image_url:
                imageUrl.trim() ||
                null,
            }),
          }
        );

      /* --------------------------------------------------------
        READ RESPONSE
        -------------------------------------------------------- */

      const contentType =
        response.headers.get(
          "content-type"
        ) ?? "";

      const responseText =
        await response.text();

      let data: {
        item?: MenuItem;
        error?: string;
        message?: string;
      } = {};

      if (
        contentType.includes(
          "application/json"
        )
      ) {
        try {
          data =
            JSON.parse(
              responseText
            );
        } catch (parseError) {
          console.error(
            "[MenuItemForm] JSON parse error:",
            parseError
          );

          console.error(
            "[MenuItemForm] Response:",
            responseText
          );

          throw new Error(
            "サーバーから正しいJSONレスポンスを取得できませんでした。"
          );
        }
      } else {
        console.error(
          "[MenuItemForm] Invalid API response"
        );

        console.error(
          "[MenuItemForm] Status:",
          response.status
        );

        console.error(
          "[MenuItemForm] Content-Type:",
          contentType
        );

        console.error(
          "[MenuItemForm] Response:",
          responseText
        );

        throw new Error(
          `商品を保存できませんでした。サーバーエラー (${response.status})`
        );
      }

      /* --------------------------------------------------------
        API ERROR
        -------------------------------------------------------- */

      if (!response.ok) {
        throw new Error(
          data.error ??
            data.message ??
            "商品を保存できません。"
        );
      }

      /* --------------------------------------------------------
        SUCCESS
        -------------------------------------------------------- */

      if (!data.item) {
        console.error(
          "[MenuItemForm] API response does not contain item:",
          data
        );

        throw new Error(
          "商品データがサーバーから返されませんでした。"
        );
      }

      /*
      * DB đã save thành công.
      *
      * Nếu đây là edit và ảnh đã thay đổi:
      * → xóa ảnh cũ khỏi Cloudinary.
      *
      * Không xóa nếu:
      * - tạo món mới
      * - không thay đổi ảnh
      * - ảnh cũ không tồn tại
      */
      const previousImageUrl =
        originalImageUrl.trim();

      const newImageUrl =
        imageUrl.trim();

      const imageChanged =
        Boolean(item?.id) &&
        previousImageUrl &&
        previousImageUrl !== newImageUrl;

      if (imageChanged) {
        const deleted =
          await deleteCloudinaryImage(
            previousImageUrl
          );

        if (!deleted) {
          console.warn(
            "[MenuItemForm] DB saved successfully, but old Cloudinary image could not be deleted:",
            previousImageUrl
          );
        }
      }

      savedImageUrlRef.current =
      data.item.image_url ?? "";

      onSaved(data.item);
    } catch (error) {
      console.error(
        "[MenuItemForm]",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "商品を保存できません。"
      );
    } finally {
      setSaving(false);
    }
  }


  /* ============================================================
     OPTION DATA
     ============================================================ */

  const currentItemOptionGroups =
    item?.id
      ? itemOptionGroups.filter(
          (row) =>
            row.menu_item_id ===
            item.id
        )
      : [];


  /* ============================================================
     RENDER
     ============================================================ */

  return (
    <div className={styles.modalBackdrop}>

      <section
        className={styles.itemFormModal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="menu-item-form-title"
      >

        {/* ======================================================
            HEADER
            ====================================================== */}

        <header
          className={
            styles.formModalHeader
          }
        >

          <div
            className={
              styles.formModalHeading
            }
          >

            <div
              className={
                styles.itemsEyebrow
              }
            >
              {item
                ? "商品編集"
                : "商品追加"}
            </div>


            <h2
              id="menu-item-form-title"
            >
              {item?.name_ja ||
                "新しい商品"}
            </h2>

          </div>


          <button
            type="button"
            className={
              styles.iconButton
            }
            onClick={handleClose}
            disabled={saving}
            aria-label="閉じる"
          >
            <span className="material-symbols-outlined">
              close
            </span>
          </button>

        </header>



        {/* ======================================================
            SCROLL AREA
            ====================================================== */}

        <div
          className={
            styles.formScroll
          }
        >

          <section className={styles.formSection}>
            <div className={styles.sectionHeader}>
              <div>
                <h3>カテゴリ</h3>

                <p>
                  この商品を表示するカテゴリを選択してください。
                </p>
              </div>
            </div>

            <div className={styles.categoryField}>
              <label htmlFor="menu-item-category">
                商品カテゴリ
              </label>

              <select
                id="menu-item-category"
                value={
                  selectedCategoryId ?? ""
                }
                onChange={(event) => {
                  const value =
                    Number(event.target.value);

                  setSelectedCategoryId(
                    Number.isInteger(value) &&
                      value > 0
                      ? value
                      : null
                  );

                  setError("");
                }}
                disabled={
                  saving ||
                  loadingCategories
                }
              >
                <option value="">
                  {loadingCategories
                    ? "カテゴリを読み込み中..."
                    : "カテゴリを選択してください"}
                </option>

                {categories.map(
                  (category) => (
                    <option
                      key={category.id}
                      value={category.id}
                    >
                      {category.name_ja}
                    </option>
                  )
                )}
              </select>

              {!loadingCategories &&
                categories.length === 0 && (
                  <p
                    className={
                      styles.fieldHint
                    }
                  >
                    先にカテゴリを作成してください。
                  </p>
                )}
            </div>
          </section>

          {/* ====================================================
              BASIC INFORMATION
              ==================================================== */}

          <MenuItemBasicInfo
            nameJa={nameJa}
            nameVi={nameVi}
            nameEn={nameEn}
            nameZh={nameZh}

            descriptionJa={
              descriptionJa
            }

            descriptionVi={
              descriptionVi
            }

            descriptionEn={
              descriptionEn
            }

            descriptionZh={
              descriptionZh
            }

            price={price}

            saving={saving}

            setNameJa={
              setNameJa
            }

            setNameVi={
              setNameVi
            }

            setNameEn={
              setNameEn
            }

            setNameZh={
              setNameZh
            }

            setDescriptionJa={
              setDescriptionJa
            }

            setDescriptionVi={
              setDescriptionVi
            }

            setDescriptionEn={
              setDescriptionEn
            }

            setDescriptionZh={
              setDescriptionZh
            }

            setPrice={
              setPrice
            }
          />

          <MenuItemImageUpload
            imageUrl={imageUrl}
            saving={saving}
            onChange={setImageUrl}
          />



          {/* ====================================================
              AFTER SAVE
              ==================================================== */}

          {!item?.id ? (

            <section
              className={
                styles.afterSaveNotice
              }
            >

              <span className="material-symbols-outlined">
                info
              </span>

              <div>

                <strong>
                  まず商品を保存してください
                </strong>

                <p>
                  商品を保存すると、
                  タグ・アレルゲン・オプションを設定できます。
                </p>

              </div>

            </section>

          ) : (

            <>

              {/* ==================================================
                  TAGS
                  ================================================== */}

              <section
                className={
                  styles.formSection
                }
              >

                <MenuItemTags
                  itemId={item.id}
                />

              </section>


              {/* ==================================================
                  ALLERGENS
                  ================================================== */}

              <section
                className={
                  styles.formSection
                }
              >

                <MenuItemAllergens
                  itemId={item.id}
                />

              </section>

              {/* ==================================================
                  OPTIONS
                  ================================================== */}

              <section 
                className={ 
                  styles.formSection 
                } 
              > 
                {item?.id && (
                  <MenuItemVariants
                    menuItemId={item.id}
                  />
                )}

                <MenuItemOptions
                  menuId={menuId}
                  itemId={item?.id ?? null}

                  itemOptionGroups={itemOptionGroups}
                  itemOptionItems={itemOptionItems}

                  optionGroups={optionGroups}
                  optionItems={optionItems}
                  menuOptionGroups={menuOptionGroups}
                  
                />


              </section>

            </>
          )}


          {/* ====================================================
              ERROR
              ==================================================== */}

          {error && (
            <div
              className={styles.error}
              role="alert"
            >

              <span className="material-symbols-outlined">
                error
              </span>

              <span>
                {error}
              </span>

            </div>
          )}

        </div>


        {/* ======================================================
            FOOTER
            ====================================================== */}

        <footer
          className={
            styles.formFooter
          }
        >

          <button
            type="button"
            className={
              styles.cancelButton
            }
            onClick={handleClose}
            disabled={saving}
          >
            キャンセル
          </button>


          <button
            type="button"
            className={
              styles.primaryButton
            }
            onClick={handleSave}
            disabled={saving}
          >

            <span className="material-symbols-outlined">
              {saving
                ? "sync"
                : "save"}
            </span>

            {saving
              ? "保存中..."
              : "保存する"}

          </button>

        </footer>

      </section>

    </div>
  );
}