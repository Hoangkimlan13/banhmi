"use client";

import styles from "./styles/schedule.module.css";

import ScheduleToast from "./components/ScheduleToast";
import ScheduleHeader from "./components/ScheduleHeader";
import ScheduleCalendar from "./components/ScheduleCalendar";
import ScheduleForm from "./components/ScheduleForm";

import { useSchedule } from "./hooks/useSchedule";

export default function SchedulePage() {
  const schedule =
    useSchedule();

  // ==========================================================
  // LOADING
  // ==========================================================

  if (schedule.loading) {
    return (
      <main
        className={
          styles.page
        }
      >
        <div
          className={
            styles.loading
          }
        >
          読み込み中...
        </div>
      </main>
    );
  }

  // ==========================================================
  // UI
  // ==========================================================

  return (
    <main
      className={
        styles.page
      }
    >
      {/* TOAST */}

      <ScheduleToast
        toast={schedule.toast}
      />

      <div
        className={
          styles.container
        }
      >
        {/* HEADER */}

        <ScheduleHeader
          onNew={
            schedule.handleNew
          }
        />

        {/* ERROR */}

        {schedule.error && (
          <div
            className={
              styles.errorBox
            }
          >
            {schedule.error}
          </div>
        )}

        {/* CONTENT */}

        <div
          className={
            styles.contentGrid
          }
        >
          {/* CALENDAR */}

          <ScheduleCalendar
            currentMonth={
              schedule.currentMonth
            }
            schedules={
              schedule.schedules
            }
            selectedDate={
              schedule.selectedDate
            }
            onSelectDate={
              schedule.selectDate
            }
            onChangeMonth={
              schedule.changeMonth
            }
          />

          {/* FORM */}

          <ScheduleForm
            selectedDate={
              schedule.selectedDate
            }
            editingId={
              schedule.editingId
            }

            scheduleType={
              schedule.scheduleType
            }
            locationId={
              schedule.locationId
            }
            menuId={
              schedule.menuId
            }

            locationName={
              schedule.locationName
            }
            address={
              schedule.address
            }
            googleMapUrl={
              schedule.googleMapUrl
            }

            openTime={
              schedule.openTime
            }
            closeTime={
              schedule.closeTime
            }

            acceptingOrders={
              schedule.acceptingOrders
            }
            status={
              schedule.status
            }

            closeReason={
              schedule.closeReason
            }
            note={
              schedule.note
            }
            pickupNote={
              schedule.pickupNote
            }

            locations={
              schedule.locations
            }
            menus={
              schedule.menus
            }

            saving={
              schedule.saving
            }

            onScheduleTypeChange={
              schedule.handleScheduleTypeChange
            }

            onLocationChange={
              schedule.handleLocationChange
            }

            onMenuChange={
              schedule.setMenuId
            }

            onLocationNameChange={
              schedule.setLocationName
            }

            onAddressChange={
              schedule.setAddress
            }

            onGoogleMapUrlChange={
              schedule.setGoogleMapUrl
            }

            onOpenTimeChange={
              schedule.setOpenTime
            }

            onCloseTimeChange={
              schedule.setCloseTime
            }

            onAcceptingOrdersChange={
              schedule.setAcceptingOrders
            }

            onStatusChange={
              schedule.setStatus
            }

            onCloseReasonChange={
              schedule.setCloseReason
            }

            onNoteChange={
              schedule.setNote
            }

            onPickupNoteChange={
              schedule.setPickupNote
            }

            onSave={
              schedule.handleSave
            }

            onDelete={
              schedule.handleDelete
            }

            onReset={
              schedule.resetForm
            }
          />
        </div>
      </div>
    </main>
  );
}