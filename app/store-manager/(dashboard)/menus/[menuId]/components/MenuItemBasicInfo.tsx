"use client";

import styles from "../styles/menu-editor.module.css";

type Props = {
  nameJa: string;
  nameVi: string;
  nameEn: string;
  nameZh: string;

  descriptionJa: string;
  descriptionVi: string;
  descriptionEn: string;
  descriptionZh: string;

  price: string;

  saving: boolean;

  setNameJa: (value: string) => void;
  setNameVi: (value: string) => void;
  setNameEn: (value: string) => void;
  setNameZh: (value: string) => void;

  setDescriptionJa: (value: string) => void;
  setDescriptionVi: (value: string) => void;
  setDescriptionEn: (value: string) => void;
  setDescriptionZh: (value: string) => void;

  setPrice: (value: string) => void;
};

export default function MenuItemBasicInfo({
  nameJa,
  nameVi,
  nameEn,
  nameZh,

  descriptionJa,
  descriptionVi,
  descriptionEn,
  descriptionZh,

  price,

  saving,

  setNameJa,
  setNameVi,
  setNameEn,
  setNameZh,

  setDescriptionJa,
  setDescriptionVi,
  setDescriptionEn,
  setDescriptionZh,

  setPrice,
}: Props) {
  return (
    <>
      {/* ==========================================================
          BASIC INFORMATION
          ========================================================== */}

      <section className={styles.formSection}>
        <div className={styles.formSectionTitle}>
          <span className="material-symbols-outlined">
            info
          </span>

          <div>
            <h3>基本情報</h3>

            <p>
              商品の名前・価格を設定します。
            </p>
          </div>
        </div>

        {/* --------------------------------------------------------
            PRODUCT NAME
            -------------------------------------------------------- */}

        <div className={styles.formGridTwo}>
          <label className={styles.field}>
            <span>
              商品名（日本語）
            </span>

            <input
              value={nameJa}
              onChange={(e) =>
                setNameJa(e.target.value)
              }
              placeholder="例：牛肉バインミー"
              disabled={saving}
            />
          </label>

          <label className={styles.field}>
            <span>
              商品名（Tiếng Việt）
            </span>

            <input
              value={nameVi}
              onChange={(e) =>
                setNameVi(e.target.value)
              }
              placeholder="Bánh mì bò"
              disabled={saving}
            />
          </label>

          <label className={styles.field}>
            <span>
              商品名（English）
            </span>

            <input
              value={nameEn}
              onChange={(e) =>
                setNameEn(e.target.value)
              }
              placeholder="Beef Banh Mi"
              disabled={saving}
            />
          </label>

          <label className={styles.field}>
            <span>
              商品名（中文）
            </span>

            <input
              value={nameZh}
              onChange={(e) =>
                setNameZh(e.target.value)
              }
              placeholder="牛肉越南三明治"
              disabled={saving}
            />
          </label>
        </div>

        {/* --------------------------------------------------------
            PRICE
            -------------------------------------------------------- */}

        <div className={styles.priceField}>
          <label className={styles.field}>
            <span>
              価格（円）
            </span>

            <div className={styles.priceInputWrapper}>
              <span className={styles.pricePrefix}>
                ￥
              </span>

              <input
                type="number"
                min="0"
                step="1"
                value={price}
                onChange={(e) =>
                  setPrice(e.target.value)
                }
                placeholder="650"
                disabled={saving}
              />
            </div>
          </label>
        </div>
      </section>


      {/* ==========================================================
          DESCRIPTION
          ========================================================== */}

      <section className={styles.formSection}>
        <div className={styles.formSectionTitle}>
          <span className="material-symbols-outlined">
            description
          </span>

          <div>
            <h3>商品説明</h3>

            <p>
              各言語の商品説明を設定します。
            </p>
          </div>
        </div>

        <div className={styles.formGridTwo}>
          <label className={styles.field}>
            <span>
              説明（日本語）
            </span>

            <textarea
              value={descriptionJa}
              onChange={(e) =>
                setDescriptionJa(
                  e.target.value
                )
              }
              rows={4}
              placeholder="商品の説明を入力してください。"
              disabled={saving}
            />
          </label>

          <label className={styles.field}>
            <span>
              説明（Tiếng Việt）
            </span>

            <textarea
              value={descriptionVi}
              onChange={(e) =>
                setDescriptionVi(
                  e.target.value
                )
              }
              rows={4}
              placeholder="Nhập mô tả món ăn."
              disabled={saving}
            />
          </label>

          <label className={styles.field}>
            <span>
              説明（English）
            </span>

            <textarea
              value={descriptionEn}
              onChange={(e) =>
                setDescriptionEn(
                  e.target.value
                )
              }
              rows={4}
              placeholder="Enter product description."
              disabled={saving}
            />
          </label>

          <label className={styles.field}>
            <span>
              説明（中文）
            </span>

            <textarea
              value={descriptionZh}
              onChange={(e) =>
                setDescriptionZh(
                  e.target.value
                )
              }
              rows={4}
              placeholder="请输入商品说明。"
              disabled={saving}
            />
          </label>
        </div>
      </section>
    </>
  );
}