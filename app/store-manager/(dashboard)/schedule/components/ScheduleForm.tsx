"use client";

import styles from "../styles/schedule.module.css";

import type {
  Location,
  Menu,
  ScheduleStatus,
  ScheduleType,
} from "../types";

type Props = {
  selectedDate: string | null;

  editingId: number | null;

  scheduleType: ScheduleType;
  locationId: string;
  menuId: string;

  locationName: string;
  address: string;
  googleMapUrl: string;

  openTime: string;
  closeTime: string;

  acceptingOrders: boolean;
  status: ScheduleStatus;

  closeReason: string;
  note: string;
  pickupNote: string;

  locations: Location[];
  menus: Menu[];

  saving: boolean;

  onScheduleTypeChange: (
    value: ScheduleType
  ) => void;

  onLocationChange: (
    value: string
  ) => void;

  onMenuChange: (
    value: string
  ) => void;

  onLocationNameChange: (
    value: string
  ) => void;

  onAddressChange: (
    value: string
  ) => void;

  onGoogleMapUrlChange: (
    value: string
  ) => void;

  onOpenTimeChange: (
    value: string
  ) => void;

  onCloseTimeChange: (
    value: string
  ) => void;

  onAcceptingOrdersChange: (
    value: boolean
  ) => void;

  onStatusChange: (
    value: ScheduleStatus
  ) => void;

  onCloseReasonChange: (
    value: string
  ) => void;

  onNoteChange: (
    value: string
  ) => void;

  onPickupNoteChange: (
    value: string
  ) => void;

  onSave: () => void;
  onDelete: () => void;
  onReset: () => void;
};

export default function ScheduleForm({
  selectedDate,
  editingId,

  scheduleType,
  locationId,
  menuId,

  locationName,
  address,
  googleMapUrl,

  openTime,
  closeTime,

  acceptingOrders,
  status,

  closeReason,
  note,
  pickupNote,

  locations,
  menus,

  saving,

  onScheduleTypeChange,
  onLocationChange,
  onMenuChange,

  onLocationNameChange,
  onAddressChange,
  onGoogleMapUrlChange,

  onOpenTimeChange,
  onCloseTimeChange,

  onAcceptingOrdersChange,
  onStatusChange,

  onCloseReasonChange,
  onNoteChange,
  onPickupNoteChange,

  onSave,
  onDelete,
  onReset,
}: Props) {
  return (
    <section
      className={styles.formCard}
    >
      {/* HEADER */}

      <div
        className={
          styles.formHeader
        }
      >
        <div>
          <h2>
            {editingId
              ? "予定を編集"
              : "営業予定を追加"}
          </h2>

          <p>
            {selectedDate ||
              "カレンダーから日付を選択してください。"}
          </p>
        </div>
      </div>

      {/* EMPTY */}

      {!selectedDate ? (
        <div
          className={
            styles.emptyForm
          }
        >
          <span className="material-symbols-outlined">
            event
          </span>

          <p>
            カレンダーから営業日を選択してください。
          </p>
        </div>
      ) : (
        <div
          className={styles.form}
        >
          {/* ==================================================
              TYPE
          ================================================== */}

          <div
            className={
              styles.field
            }
          >
            <label>
              営業区分
            </label>

            <div
              className={
                styles.typeGrid
              }
            >
              {/* LOCATION */}

              <button
                type="button"
                className={
                  scheduleType ===
                  "LOCATION"
                    ? styles.activeType
                    : ""
                }
                onClick={() =>
                  onScheduleTypeChange(
                    "LOCATION"
                  )
                }
              >
                <span className="material-symbols-outlined">
                  location_on
                </span>

                <strong>
                  通常営業
                </strong>

                <small>
                  登録済みの販売場所
                </small>
              </button>

              {/* EVENT */}

              <button
                type="button"
                className={
                  scheduleType ===
                  "EVENT"
                    ? styles.activeType
                    : ""
                }
                onClick={() =>
                  onScheduleTypeChange(
                    "EVENT"
                  )
                }
              >
                <span className="material-symbols-outlined">
                  festival
                </span>

                <strong>
                  イベント
                </strong>

                <small>
                  臨時イベント
                </small>
              </button>

              {/* CLOSED */}

              <button
                type="button"
                className={
                  scheduleType ===
                  "CLOSED"
                    ? styles.activeType
                    : ""
                }
                onClick={() =>
                  onScheduleTypeChange(
                    "CLOSED"
                  )
                }
              >
                <span className="material-symbols-outlined">
                  event_busy
                </span>

                <strong>
                  休業
                </strong>

                <small>
                  雨天・休暇など
                </small>
              </button>
            </div>
          </div>

          {/* ==================================================
              LOCATION
          ================================================== */}

          {scheduleType ===
            "LOCATION" && (
            <div
              className={
                styles.field
              }
            >
              <label>
                販売場所
              </label>

              <select
                value={locationId}
                onChange={(e) =>
                  onLocationChange(
                    e.target.value
                  )
                }
              >
                <option value="">
                  販売場所を選択
                </option>

                {locations.map(
                  (location) => (
                    <option
                      key={
                        location.id
                      }
                      value={
                        location.id
                      }
                    >
                      {
                        location.name
                      }
                    </option>
                  )
                )}
              </select>
            </div>
          )}

          {/* ==================================================
              EVENT
          ================================================== */}

          {scheduleType ===
            "EVENT" && (
            <div
              className={
                styles.field
              }
            >
              <label>
                イベント名・場所
              </label>

              <input
                type="text"
                value={
                  locationName
                }
                onChange={(e) =>
                  onLocationNameChange(
                    e.target.value
                  )
                }
                placeholder="例：ベトナムフェスティバル"
              />
            </div>
          )}

          {/* ==================================================
              MENU
          ================================================== */}

          {scheduleType !==
            "CLOSED" && (
            <div
              className={
                styles.field
              }
            >
              <label>
                メニュー
              </label>

              <select
                value={menuId}
                onChange={(e) =>
                  onMenuChange(
                    e.target.value
                  )
                }
              >
                <option value="">
                  通常メニュー
                </option>

                {menus.map((menu) => (
                  <option
                    key={menu.id}
                    value={menu.id}
                  >
                    {menu.name}
                    {menu.is_default
                      ? "（通常）"
                      : ""}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* ==================================================
              ADDRESS
          ================================================== */}

          {scheduleType !==
            "CLOSED" && (
            <>
              <div
                className={
                  styles.field
                }
              >
                <label>
                  住所
                </label>

                <input
                  type="text"
                  value={address}
                  onChange={(e) =>
                    onAddressChange(
                      e.target.value
                    )
                  }
                />
              </div>

              <div
                className={
                  styles.field
                }
              >
                <label>
                  Google Map URL
                </label>

                <input
                  type="url"
                  value={
                    googleMapUrl
                  }
                  onChange={(e) =>
                    onGoogleMapUrlChange(
                      e.target.value
                    )
                  }
                />
              </div>
            </>
          )}

          {/* ==================================================
              TIME
              
          ================================================== */}

          {scheduleType !==
            "CLOSED" && (
            <div
              className={
                styles.timeGrid
              }
            >
              <div
                className={
                  styles.field
                }
              >
                <label>
                  開店
                </label>

                <input
                  type="time"
                  value={openTime}
                  onChange={(e) =>
                    onOpenTimeChange(
                      e.target.value
                    )
                  }
                />
              </div>

              <div
                className={
                  styles.field
                }
              >
                <label>
                  閉店
                </label>

                <input
                  type="time"
                  value={closeTime}
                  onChange={(e) =>
                    onCloseTimeChange(
                      e.target.value
                    )
                  }
                />
              </div>
            </div>
          )}

          {/* ==================================================
              CLOSED
          ================================================== */}

          {scheduleType ===
            "CLOSED" && (
            <div
              className={
                styles.field
              }
            >
              <label>
                休業理由
              </label>

              <input
                type="text"
                value={
                  closeReason
                }
                onChange={(e) =>
                  onCloseReasonChange(
                    e.target.value
                  )
                }
                placeholder="例：雨天のため休業"
              />
            </div>
          )}

          {/* ==================================================
              STATUS
          ================================================== */}

          <div
            className={
              styles.field
            }
          >
            <label>
              ステータス
            </label>

            <select
              value={status}
              onChange={(e) =>
                onStatusChange(
                  e.target
                    .value as ScheduleStatus
                )
              }
            >
              <option value="SCHEDULED">
                予定
              </option>

              <option value="OPEN">
                営業中
              </option>

              <option value="CLOSED">
                休業
              </option>

              <option value="CANCELLED">
                中止
              </option>

              <option value="COMPLETED">
                営業終了
              </option>
            </select>
          </div>

          {/* ==================================================
              ACCEPTING ORDERS
          ================================================== */}

          {scheduleType !==
            "CLOSED" && (
            <label
              className={
                styles.checkboxRow
              }
            >
              <input
                type="checkbox"
                checked={
                  acceptingOrders
                }
                onChange={(e) =>
                  onAcceptingOrdersChange(
                    e.target.checked
                  )
                }
              />

              <span>
                注文受付を有効にする
              </span>
            </label>
          )}

          {/* ==================================================
              NOTE
          ================================================== */}

          <div
            className={
              styles.field
            }
          >
            <label>
              メモ
            </label>

            <textarea
              value={note}
              onChange={(e) =>
                onNoteChange(
                  e.target.value
                )
              }
              rows={3}
              placeholder="スタッフ向けメモ"
            />
          </div>

          {/* ==================================================
              PICKUP NOTE
          ================================================== */}

          {scheduleType !==
            "CLOSED" && (
            <div
              className={
                styles.field
              }
            >
              <label>
                受取案内
              </label>

              <textarea
                value={
                  pickupNote
                }
                onChange={(e) =>
                  onPickupNoteChange(
                    e.target.value
                  )
                }
                rows={3}
                placeholder="お客様への受取案内"
              />
            </div>
          )}

          {/* ==================================================
              ACTIONS
          ================================================== */}

          <div
            className={
              styles.actions
            }
          >
            {editingId && (
              <button
                type="button"
                className={
                  styles.deleteButton
                }
                onClick={onDelete}
                disabled={saving}
              >
                <span className="material-symbols-outlined">
                  delete
                </span>

                削除
              </button>
            )}

            <button
              type="button"
              className={
                styles.cancelButton
              }
              onClick={onReset}
              disabled={saving}
            >
              クリア
            </button>

            <button
              type="button"
              className={
                styles.saveButton
              }
              onClick={onSave}
              disabled={saving}
            >
              <span className="material-symbols-outlined">
                {saving
                  ? "progress_activity"
                  : "save"}
              </span>

              {saving
                ? "保存中..."
                : editingId
                ? "更新する"
                : "登録する"}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}