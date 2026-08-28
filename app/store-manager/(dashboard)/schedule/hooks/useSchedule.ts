"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import type {
  Location,
  Menu,
  Schedule,
  ScheduleStatus,
  ScheduleType,
  ToastState,
} from "../types";

import {
  dateToKey,
  formatDate,
  formatTime,
  monthEnd,
  monthStart,
} from "../utils/dateUtils";

export function useSchedule() {
  // ==========================================================
  // MONTH
  // ==========================================================

  const [
    currentMonth,
    setCurrentMonth,
  ] = useState(
    monthStart(new Date())
  );

  // ==========================================================
  // DATA
  // ==========================================================

  const [
    schedules,
    setSchedules,
  ] = useState<Schedule[]>([]);

  const [
    locations,
    setLocations,
  ] = useState<Location[]>([]);

  const [
    menus,
    setMenus,
  ] = useState<Menu[]>([]);

  // ==========================================================
  // UI STATE
  // ==========================================================

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  const [
    selectedDate,
    setSelectedDate,
  ] = useState<string | null>(
    null
  );

  const [
    editingId,
    setEditingId,
  ] = useState<number | null>(
    null
  );

  const [
    toast,
    setToast,
  ] = useState<ToastState>({
    show: false,
    message: "",
    type: "success",
  });

  // ==========================================================
  // FORM
  // ==========================================================

  const [
    scheduleType,
    setScheduleTypeState,
  ] = useState<ScheduleType>(
    "LOCATION"
  );

  const [
    locationId,
    setLocationId,
  ] = useState("");

  const [
    menuId,
    setMenuId,
  ] = useState("");

  const [
    locationName,
    setLocationName,
  ] = useState("");

  const [
    address,
    setAddress,
  ] = useState("");

  const [
    googleMapUrl,
    setGoogleMapUrl,
  ] = useState("");

  const [
    openTime,
    setOpenTime,
  ] = useState("");

  const [
    closeTime,
    setCloseTime,
  ] = useState("");

  const [
    acceptingOrders,
    setAcceptingOrders,
  ] = useState(true);

  const [
    status,
    setStatus,
  ] = useState<ScheduleStatus>(
    "SCHEDULED"
  );

  const [
    closeReason,
    setCloseReason,
  ] = useState("");

  const [
    note,
    setNote,
  ] = useState("");

  const [
    pickupNote,
    setPickupNote,
  ] = useState("");

  // ==========================================================
  // TOAST
  // ==========================================================

  const showToast = useCallback(
    (
      message: string,
      type:
        | "success"
        | "error" = "success"
    ) => {
      setToast({
        show: true,
        message,
        type,
      });

      window.setTimeout(() => {
        setToast((prev) => ({
          ...prev,
          show: false,
        }));
      }, 3000);
    },
    []
  );

  // ==========================================================
  // LOAD
  // ==========================================================

  const loadSchedules =
    useCallback(async () => {
      try {
        setLoading(true);
        setError("");

        const firstDay =
          monthStart(currentMonth);

        const lastDay =
          monthEnd(currentMonth);

        const from =
          dateToKey(firstDay);

        const to =
          dateToKey(lastDay);

        const response =
          await fetch(
            `/api/store-manager/schedule?from=${from}&to=${to}`,
            {
              method: "GET",
              cache: "no-store",
            }
          );

        const result =
          await response.json();

        if (
          !response.ok ||
          !result.success
        ) {
          throw new Error(
            result.message ||
              "営業スケジュールの取得に失敗しました。"
          );
        }

        setSchedules(
          Array.isArray(
            result.schedules
          )
            ? result.schedules
            : []
        );

        setLocations(
          Array.isArray(
            result.locations
          )
            ? result.locations
            : []
        );

        setMenus(
          Array.isArray(
            result.menus
          )
            ? result.menus
            : []
        );
      } catch (err) {
        console.error(err);

        setError(
          err instanceof Error
            ? err.message
            : "営業スケジュールの取得に失敗しました。"
        );
      } finally {
        setLoading(false);
      }
    }, [currentMonth]);

  useEffect(() => {
    loadSchedules();
  }, [loadSchedules]);

  // ==========================================================
  // SCHEDULE MAP
  // ==========================================================

  const scheduleMap = useMemo(() => {
    const map =
      new Map<
        string,
        Schedule
      >();

    schedules.forEach(
      (schedule) => {
        map.set(
          formatDate(
            schedule.work_date
          ),
          schedule
        );
      }
    );

    return map;
  }, [schedules]);

  // ==========================================================
  // LOCATION CHANGE
  // ==========================================================

  const handleLocationChange =
    useCallback(
      (value: string) => {
        setLocationId(value);

        if (!value) {
          setLocationName("");
          setAddress("");
          setGoogleMapUrl("");
          setOpenTime("");
          setCloseTime("");
          setPickupNote("");

          return;
        }

        const location =
          locations.find(
            (item) =>
              item.id ===
              Number(value)
          );

        if (!location) {
          return;
        }

        setLocationName(
          location.name
        );

        setAddress(
          location.address ?? ""
        );

        setGoogleMapUrl(
          location.google_map_url ??
            ""
        );

        setOpenTime(
          formatTime(
            location.default_open_time
          )
        );

        setCloseTime(
          formatTime(
            location.default_close_time
          )
        );

        setPickupNote(
          location.pickup_note ?? ""
        );
      },
      [locations]
    );

  // ==========================================================
  // SCHEDULE TYPE
  // ==========================================================

  const handleScheduleTypeChange =
    useCallback(
      (value: ScheduleType) => {
        setScheduleTypeState(
          value
        );

        if (value === "LOCATION") {
          setAcceptingOrders(true);
        }

        if (value === "EVENT") {
          setLocationId("");
        }

        if (value === "CLOSED") {
          setAcceptingOrders(false);
        }
      },
      []
    );

  // ==========================================================
  // RESET FORM
  // ==========================================================

  const resetForm =
    useCallback(() => {
      setEditingId(null);

      setScheduleTypeState(
        "LOCATION"
      );

      setLocationId("");
      setMenuId("");

      setLocationName("");
      setAddress("");
      setGoogleMapUrl("");

      setOpenTime("");
      setCloseTime("");

      setAcceptingOrders(true);

      setStatus("SCHEDULED");

      setCloseReason("");
      setNote("");
      setPickupNote("");
    }, []);

  // ==========================================================
  // SELECT DATE
  // ==========================================================

  const selectDate =
    useCallback(
      (date: Date) => {
        const key =
          dateToKey(date);

        setSelectedDate(key);

        const schedule =
          scheduleMap.get(key);

        if (!schedule) {
          resetForm();
          setSelectedDate(key);

          return;
        }

        setEditingId(
          schedule.id
        );

        setScheduleTypeState(
          schedule.schedule_type
        );

        setLocationId(
          schedule.location_id
            ? String(
                schedule.location_id
              )
            : ""
        );

        setMenuId(
          schedule.menu_id
            ? String(
                schedule.menu_id
              )
            : ""
        );

        setLocationName(
          schedule.location_name ??
            ""
        );

        setAddress(
          schedule.address ?? ""
        );

        setGoogleMapUrl(
          schedule.google_map_url ??
            ""
        );

        setOpenTime(
          formatTime(
            schedule.open_time
          )
        );

        setCloseTime(
          formatTime(
            schedule.close_time
          )
        );

        setAcceptingOrders(
          schedule.accepting_orders
        );

        setStatus(
          schedule.status
        );

        setCloseReason(
          schedule.close_reason ??
            ""
        );

        setNote(
          schedule.note ?? ""
        );

        setPickupNote(
          schedule.pickup_note ??
            ""
        );
      },
      [
        resetForm,
        scheduleMap,
      ]
    );

  // ==========================================================
  // SAVE
  // ==========================================================

  const handleSave =
    useCallback(async () => {
      if (!selectedDate) {
        showToast(
          "営業日を選択してください。",
          "error"
        );

        return;
      }

      if (
        scheduleType ===
          "LOCATION" &&
        !locationId
      ) {
        showToast(
          "販売場所を選択してください。",
          "error"
        );

        return;
      }

      if (
        scheduleType === "EVENT" &&
        !locationName.trim()
      ) {
        showToast(
          "イベント名を入力してください。",
          "error"
        );

        return;
      }

      if (
        scheduleType !==
          "CLOSED" &&
        (!openTime || !closeTime)
      ) {
        showToast(
          "営業時間を入力してください。",
          "error"
        );

        return;
      }

      if (
        scheduleType !==
          "CLOSED" &&
        openTime &&
        closeTime &&
        openTime >= closeTime
      ) {
        showToast(
          "閉店時間は開店時間より後にしてください。",
          "error"
        );

        return;
      }

      try {
        setSaving(true);

        const payload = {
          ...(editingId
            ? {
                id: editingId,
              }
            : {}),

          work_date:
            selectedDate,

          schedule_type:
            scheduleType,

          location_id:
            scheduleType ===
            "LOCATION"
              ? Number(locationId)
              : null,

          menu_id: menuId
            ? Number(menuId)
            : null,

          location_name:
            locationName.trim() ||
            null,

          address:
            address.trim() ||
            null,

          google_map_url:
            googleMapUrl.trim() ||
            null,

          open_time:
            scheduleType !==
            "CLOSED"
              ? openTime || null
              : null,

          close_time:
            scheduleType !==
            "CLOSED"
              ? closeTime || null
              : null,

          // ラストオーダーは
          // UIから削除したため送信しない

          accepting_orders:
            scheduleType ===
            "CLOSED"
              ? false
              : acceptingOrders,

          status,

          close_reason:
            closeReason.trim() ||
            null,

          note:
            note.trim() || null,

          pickup_note:
            pickupNote.trim() ||
            null,

          latitude: null,
          longitude: null,
        };

        const response =
          await fetch(
            "/api/store-manager/schedule",
            {
              method: editingId
                ? "PUT"
                : "POST",
              headers: {
                "Content-Type":
                  "application/json",
              },
              body: JSON.stringify(
                payload
              ),
            }
          );

        const result =
          await response.json();

        if (
          !response.ok ||
          !result.success
        ) {
          throw new Error(
            result.message ||
              "営業スケジュールの保存に失敗しました。"
          );
        }

        showToast(
          result.message ||
            "営業スケジュールを保存しました。",
          "success"
        );

        await loadSchedules();
      } catch (err) {
        console.error(err);

        showToast(
          err instanceof Error
            ? err.message
            : "営業スケジュールの保存に失敗しました。",
          "error"
        );
      } finally {
        setSaving(false);
      }
    }, [
      selectedDate,
      scheduleType,
      locationId,
      locationName,
      openTime,
      closeTime,
      editingId,
      menuId,
      address,
      googleMapUrl,
      acceptingOrders,
      status,
      closeReason,
      note,
      pickupNote,
      showToast,
      loadSchedules,
    ]);

  // ==========================================================
  // DELETE
  // ==========================================================

  const handleDelete =
    useCallback(async () => {
      if (!editingId) {
        return;
      }

      if (
        !window.confirm(
          "この営業スケジュールを削除しますか？"
        )
      ) {
        return;
      }

      try {
        setSaving(true);

        const response =
          await fetch(
            `/api/store-manager/schedule?id=${editingId}`,
            {
              method: "DELETE",
            }
          );

        const result =
          await response.json();

        if (
          !response.ok ||
          !result.success
        ) {
          throw new Error(
            result.message ||
              "営業スケジュールの削除に失敗しました。"
          );
        }

        showToast(
          result.message ||
            "営業スケジュールを削除しました。",
          "success"
        );

        resetForm();

        await loadSchedules();
      } catch (err) {
        console.error(err);

        showToast(
          err instanceof Error
            ? err.message
            : "営業スケジュールの削除に失敗しました。",
          "error"
        );
      } finally {
        setSaving(false);
      }
    }, [
      editingId,
      showToast,
      resetForm,
      loadSchedules,
    ]);

  // ==========================================================
  // MONTH NAVIGATION
  // ==========================================================

  const changeMonth =
    useCallback(
      (offset: number) => {
        setCurrentMonth(
          new Date(
            currentMonth.getFullYear(),
            currentMonth.getMonth() +
              offset,
            1
          )
        );

        setSelectedDate(null);

        resetForm();
      },
      [
        currentMonth,
        resetForm,
      ]
    );

  // ==========================================================
  // NEW SCHEDULE
  // ==========================================================

  const handleNew =
    useCallback(() => {
      resetForm();
      setSelectedDate(null);
    }, [resetForm]);

  // ==========================================================
  // RETURN
  // ==========================================================

  return {
    // Data
    currentMonth,
    schedules,
    locations,
    menus,

    // UI
    loading,
    saving,
    error,
    selectedDate,
    editingId,
    toast,

    // Form
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

    // Actions
    showToast,
    loadSchedules,

    handleScheduleTypeChange,
    handleLocationChange,

    resetForm,
    selectDate,

    handleSave,
    handleDelete,

    changeMonth,
    handleNew,

    // Setters
    setMenuId,
    setLocationName,
    setAddress,
    setGoogleMapUrl,
    setOpenTime,
    setCloseTime,
    setAcceptingOrders,
    setStatus,
    setCloseReason,
    setNote,
    setPickupNote,
  };
}