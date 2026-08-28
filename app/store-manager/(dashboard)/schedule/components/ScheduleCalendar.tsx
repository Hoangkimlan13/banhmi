"use client";

import styles from "../styles/ScheduleCalendar.module.css";

import type {
  Schedule,
  ScheduleStatus,
} from "../types";

import {
  buildCalendarDays,
  dateToKey,
  formatDate,
  formatTime,
  isSameMonth,
} from "../utils/dateUtils";

type Props = {
  currentMonth: Date;
  schedules: Schedule[];
  selectedDate: string | null;

  onSelectDate: (date: Date) => void;

  onChangeMonth: (offset: number) => void;
};

/**
 * ============================================================
 * STATUS LABEL
 * ============================================================
 */

function getStatusLabel(
  status: ScheduleStatus | undefined
): string {
  switch (status) {
    case "OPEN":
      return "営業中";

    case "CLOSED":
      return "休業";

    case "CANCELLED":
      return "中止";

    case "COMPLETED":
      return "営業終了";

    case "SCHEDULED":
      return "予定";

    default:
      return "";
  }
}




export default function ScheduleCalendar({
  currentMonth,
  schedules,
  selectedDate,
  onSelectDate,
  onChangeMonth,
}: Props) {
  const calendarDays =
    buildCalendarDays(currentMonth);


  /**
   * ============================================================
   * TODAY
   * ============================================================
   */

  const todayKey = dateToKey(
    new Date()
  );


  /**
   * ============================================================
   * SCHEDULE MAP
   * ============================================================
   */

  const scheduleMap =
    new Map<string, Schedule>();

  schedules.forEach(
    (schedule) => {
      scheduleMap.set(
        formatDate(
          schedule.work_date
        ),
        schedule
      );
    }
  );


  return (
    <section
      className={
        styles.calendarCard
      }
    >
      {/* ======================================================
          HEADER
          ====================================================== */}

      <div
        className={
          styles.calendarHeader
        }
      >
        <button
          type="button"
          onClick={() =>
            onChangeMonth(-1)
          }
          aria-label="前月"
        >
          <span className="material-symbols-outlined">
            chevron_left
          </span>
        </button>

        <h2>
          {currentMonth.getFullYear()}
          年{" "}
          {currentMonth.getMonth() + 1}
          月
        </h2>

        <button
          type="button"
          onClick={() =>
            onChangeMonth(1)
          }
          aria-label="翌月"
        >
          <span className="material-symbols-outlined">
            chevron_right
          </span>
        </button>
      </div>


      {/* ======================================================
          WEEK
          ====================================================== */}

      <div
        className={
          styles.weekHeader
        }
      >
        {[
          "日",
          "月",
          "火",
          "水",
          "木",
          "金",
          "土",
        ].map((day) => (
          <div key={day}>
            {day}
          </div>
        ))}
      </div>


      {/* ======================================================
          CALENDAR
          ====================================================== */}

      <div
        className={
          styles.calendarGrid
        }
      >
        {calendarDays.map(
          (date) => {
            const key =
              dateToKey(date);

            const schedule =
              scheduleMap.get(key);

            const current =
              isSameMonth(
                date,
                currentMonth
              );

            const today =
              key === todayKey;

            const selected =
              selectedDate === key;


            /**
             * ==================================================
             * STATUS
             * ==================================================
             */

            const status =
              schedule?.status;


            /**
             * ==================================================
             * STATUS CLASS
             * ==================================================
             */

            const statusClass =
              status === "OPEN"
                ? styles.statusOpen
                : status === "CANCELLED"
                ? styles.statusCancelled
                : status === "COMPLETED"
                ? styles.statusCompleted
                : status === "CLOSED"
                ? styles.statusClosed
                : styles.statusScheduled;


            /**
             * ==================================================
             * LOCATION / EVENT
             * ==================================================
             */

            const locationName =
              schedule?.location_name ||
              (
                schedule?.schedule_type ===
                "EVENT"
                  ? "イベント"
                  : ""
              );


            /**
             * ==================================================
             * TIME
             * ==================================================
             *
             * CLOSED:
             *     Không hiển thị giờ
             *
             * CANCELLED:
             *     Có thể vẫn hiển thị giờ cũ
             *
             * LOCATION / EVENT:
             *     Hiển thị giờ mở - đóng
             */

            const openTime =
              schedule?.schedule_type !== "CLOSED"
                ? formatTime(schedule?.open_time ?? null)
                : "";

            const closeTime =
              schedule?.schedule_type !== "CLOSED"
                ? formatTime(schedule?.close_time ?? null)
                : "";

            const hasTime =
              Boolean(openTime || closeTime);


            return (
              <button
                key={key}
                type="button"
                className={[
                  styles.day,

                  !current
                    ? styles.otherMonth
                    : "",

                  today
                    ? styles.today
                    : "",

                  selected
                    ? styles.selectedDay
                    : "",

                  status === "CANCELLED"
                    ? styles.cancelledDay
                    : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                onClick={() =>
                  onSelectDate(date)
                }
                aria-current={
                  today
                    ? "date"
                    : undefined
                }
                aria-pressed={
                  selected
                }
              >
                {/* ==================================================
                    DATE
                    ================================================== */}

                <span
                  className={
                    styles.dayNumber
                  }
                >
                  {date.getDate()}
                </span>


                {schedule && (
                  <div
                    className={
                      styles.scheduleContent
                    }
                  >
                    {/* ==============================================
                        STATUS
                        ============================================== */}

                    <div
                      className={`${styles.statusBadge} ${statusClass}`}
                    >
                      {status ===
                        "CANCELLED" && (
                        <span className="material-symbols-outlined">
                          block
                        </span>
                      )}

                      {status ===
                        "OPEN" && (
                        <span className="material-symbols-outlined">
                          circle
                        </span>
                      )}

                      {status ===
                        "COMPLETED" && (
                        <span className="material-symbols-outlined">
                          check
                        </span>
                      )}

                      {getStatusLabel(
                        status
                      )}
                    </div>


                    {/* ==============================================
                        LOCATION / EVENT
                        ============================================== */}

                    {locationName && (
                      <div
                        className={
                          styles.locationName
                        }
                      >
                        {locationName}
                      </div>
                    )}


                    {/* ==============================================
                        TIME
                        ============================================== */}

                    {hasTime && (
                      <div
                        className={styles.scheduleTime}
                      >

                        <span>
                          {openTime && closeTime
                            ? `${openTime} – ${closeTime}`
                            : openTime
                            ? `${openTime}～`
                            : closeTime
                            ? `～${closeTime}`
                            : ""}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </button>
            );
          }
        )}
      </div>
    </section>
  );
}