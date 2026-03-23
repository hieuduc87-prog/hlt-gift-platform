"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Truck,
  MapPin,
  Plus,
  Loader2,
  Calendar,
  X,
  UserPlus,
} from "lucide-react";
import { formatPrice } from "@/lib/formatters";
import type { GiftDeliveryStaff, GiftDeliveryZone } from "@/types";

export default function AdminDeliveryPage() {
  const [staff, setStaff] = useState<GiftDeliveryStaff[]>([]);
  const [zones, setZones] = useState<GiftDeliveryZone[]>([]);
  const [loading, setLoading] = useState(true);

  // Add staff form state
  const [showStaffForm, setShowStaffForm] = useState(false);
  const [staffName, setStaffName] = useState("");
  const [staffPhone, setStaffPhone] = useState("");
  const [staffMax, setStaffMax] = useState("10");
  const [submitting, setSubmitting] = useState(false);

  // Zone edit state
  const [editingZone, setEditingZone] = useState<string | null>(null);
  const [zoneEditData, setZoneEditData] = useState<{
    delivery_fee: number;
    max_daily_capacity: number;
    same_day_cutoff: string;
    is_active: boolean;
  } | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [staffRes, zonesRes] = await Promise.all([
        fetch("/api/admin/delivery/staff"),
        fetch("/api/admin/delivery/zones"),
      ]);
      const staffData = await staffRes.json();
      const zonesData = await zonesRes.json();
      setStaff(Array.isArray(staffData) ? staffData : []);
      setZones(Array.isArray(zonesData) ? zonesData : []);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAddStaff = async () => {
    if (!staffName.trim() || !staffPhone.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/delivery/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: staffName.trim(),
          phone: staffPhone.trim(),
          max_daily_orders: Number(staffMax) || 10,
        }),
      });
      if (res.ok) {
        setStaffName("");
        setStaffPhone("");
        setStaffMax("10");
        setShowStaffForm(false);
        fetchData();
      }
    } catch {
      // silently fail
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStaffActive = async (s: GiftDeliveryStaff) => {
    await fetch("/api/admin/delivery/staff", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: s.id, is_active: !s.is_active }),
    });
    fetchData();
  };

  const handleStartEditZone = (z: GiftDeliveryZone) => {
    setEditingZone(z.id);
    setZoneEditData({
      delivery_fee: z.delivery_fee,
      max_daily_capacity: z.max_daily_capacity,
      same_day_cutoff: z.same_day_cutoff,
      is_active: z.is_active,
    });
  };

  const handleSaveZone = async () => {
    if (!editingZone || !zoneEditData) return;
    await fetch("/api/admin/delivery/zones", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: editingZone, ...zoneEditData }),
    });
    setEditingZone(null);
    setZoneEditData(null);
    fetchData();
  };

  const handleToggleZoneActive = async (z: GiftDeliveryZone) => {
    await fetch("/api/admin/delivery/zones", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: z.id, is_active: !z.is_active }),
    });
    fetchData();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={24} className="text-gold animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display text-gold">Giao hàng</h1>
          <p className="mt-1 text-admin-text-secondary">
            Quản lý shipper và khu vực giao hàng
          </p>
        </div>
        <Link
          href="/admin/b2bgifting/delivery/today"
          className="flex items-center gap-2 px-4 py-2.5 bg-gold text-white rounded-lg text-sm font-medium hover:bg-gold/90 transition-colors"
        >
          <Calendar size={16} />
          Bảng giao hàng hôm nay
        </Link>
      </div>

      {/* ═══════════════════════════════════════════ */}
      {/* Staff Section */}
      {/* ═══════════════════════════════════════════ */}
      <div className="bg-admin-surface border border-admin-border rounded-xl">
        <div className="px-5 py-4 border-b border-admin-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Truck size={18} className="text-gold" />
            <h2 className="text-lg font-display text-admin-text">
              Đội ngũ shipper
            </h2>
            <span className="text-sm text-admin-text-secondary">
              ({staff.length})
            </span>
          </div>
          <button
            onClick={() => setShowStaffForm(!showStaffForm)}
            className="flex items-center gap-1.5 px-3 py-2 bg-gold text-white rounded-lg text-sm font-medium hover:bg-gold/90 transition-colors"
          >
            {showStaffForm ? <X size={14} /> : <UserPlus size={14} />}
            {showStaffForm ? "Đóng" : "Thêm shipper"}
          </button>
        </div>

        {/* Inline add form */}
        {showStaffForm && (
          <div className="px-5 py-4 border-b border-admin-border bg-admin-bg/50">
            <div className="flex items-end gap-3 flex-wrap">
              <div>
                <label className="block text-xs text-admin-text-secondary mb-1">
                  Họ tên *
                </label>
                <input
                  type="text"
                  value={staffName}
                  onChange={(e) => setStaffName(e.target.value)}
                  placeholder="Nguyễn Văn A"
                  className="px-3 py-2 bg-admin-surface border border-admin-border rounded-lg text-sm text-admin-text placeholder:text-admin-text-secondary focus:outline-none focus:border-gold/50 w-52"
                />
              </div>
              <div>
                <label className="block text-xs text-admin-text-secondary mb-1">
                  Số điện thoại *
                </label>
                <input
                  type="tel"
                  value={staffPhone}
                  onChange={(e) => setStaffPhone(e.target.value)}
                  placeholder="0912345678"
                  className="px-3 py-2 bg-admin-surface border border-admin-border rounded-lg text-sm text-admin-text placeholder:text-admin-text-secondary focus:outline-none focus:border-gold/50 w-40"
                />
              </div>
              <div>
                <label className="block text-xs text-admin-text-secondary mb-1">
                  Max đơn/ngày
                </label>
                <input
                  type="number"
                  value={staffMax}
                  onChange={(e) => setStaffMax(e.target.value)}
                  className="px-3 py-2 bg-admin-surface border border-admin-border rounded-lg text-sm text-admin-text focus:outline-none focus:border-gold/50 w-24"
                />
              </div>
              <button
                onClick={handleAddStaff}
                disabled={submitting || !staffName.trim() || !staffPhone.trim()}
                className="flex items-center gap-1.5 px-4 py-2 bg-gold text-white rounded-lg text-sm font-medium hover:bg-gold/90 transition-colors disabled:opacity-50"
              >
                {submitting ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Plus size={14} />
                )}
                Thêm
              </button>
            </div>
          </div>
        )}

        {staff.length === 0 ? (
          <div className="p-8 text-center text-admin-text-secondary">
            Chưa có shipper nào
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-admin-border text-admin-text-secondary text-left">
                  <th className="px-5 py-3 font-medium">Họ tên</th>
                  <th className="px-5 py-3 font-medium">Số điện thoại</th>
                  <th className="px-5 py-3 font-medium">Khu vực</th>
                  <th className="px-5 py-3 font-medium text-right">
                    Max đơn/ngày
                  </th>
                  <th className="px-5 py-3 font-medium text-center">
                    Trạng thái
                  </th>
                </tr>
              </thead>
              <tbody>
                {staff.map((s) => (
                  <tr
                    key={s.id}
                    className="border-b border-admin-border last:border-b-0 hover:bg-admin-surface-hover transition-colors"
                  >
                    <td className="px-5 py-3 text-admin-text font-medium">
                      {s.name}
                    </td>
                    <td className="px-5 py-3 text-admin-text-secondary">
                      {s.phone}
                    </td>
                    <td className="px-5 py-3">
                      {s.assigned_zones && s.assigned_zones.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {s.assigned_zones.map((z) => (
                            <span
                              key={z}
                              className="inline-block px-2 py-0.5 bg-admin-surface-hover rounded text-xs text-admin-text-secondary"
                            >
                              {z}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-admin-text-secondary">
                          Chưa gán
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-admin-text text-right">
                      {s.max_daily_orders}
                    </td>
                    <td className="px-5 py-3 text-center">
                      <button
                        onClick={() => handleToggleStaffActive(s)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                          s.is_active
                            ? "bg-[#E8F5ED] text-[#3A7D54]"
                            : "bg-[#F5F3F0] text-[#9A9490]"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            s.is_active ? "bg-[#3A7D54]" : "bg-[#9A9490]"
                          }`}
                        />
                        {s.is_active ? "Hoạt động" : "Nghỉ"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════ */}
      {/* Zones Section */}
      {/* ═══════════════════════════════════════════ */}
      <div className="bg-admin-surface border border-admin-border rounded-xl">
        <div className="px-5 py-4 border-b border-admin-border flex items-center gap-2">
          <MapPin size={18} className="text-gold" />
          <h2 className="text-lg font-display text-admin-text">
            Khu vực giao hàng
          </h2>
          <span className="text-sm text-admin-text-secondary">
            ({zones.length} quận)
          </span>
        </div>

        {zones.length === 0 ? (
          <div className="p-8 text-center text-admin-text-secondary">
            Chưa có khu vực nào
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-admin-border text-admin-text-secondary text-left">
                  <th className="px-5 py-3 font-medium">Quận/Huyện</th>
                  <th className="px-5 py-3 font-medium text-right">
                    Phí giao
                  </th>
                  <th className="px-5 py-3 font-medium text-center">
                    Giao trong ngày
                  </th>
                  <th className="px-5 py-3 font-medium">
                    Cutoff giao trong ngày
                  </th>
                  <th className="px-5 py-3 font-medium text-right">
                    Công suất/ngày
                  </th>
                  <th className="px-5 py-3 font-medium text-center">
                    Trạng thái
                  </th>
                  <th className="px-5 py-3 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {zones.map((z) => {
                  const isEditing = editingZone === z.id;
                  return (
                    <tr
                      key={z.id}
                      className="border-b border-admin-border last:border-b-0 hover:bg-admin-surface-hover transition-colors"
                    >
                      <td className="px-5 py-3 text-admin-text font-medium">
                        {z.district_name}
                      </td>
                      <td className="px-5 py-3 text-right">
                        {isEditing ? (
                          <input
                            type="number"
                            value={zoneEditData?.delivery_fee ?? 0}
                            onChange={(e) =>
                              setZoneEditData((prev) =>
                                prev
                                  ? { ...prev, delivery_fee: Number(e.target.value) }
                                  : prev
                              )
                            }
                            className="w-24 px-2 py-1 bg-admin-bg border border-admin-border rounded text-sm text-admin-text text-right focus:outline-none focus:border-gold/50"
                          />
                        ) : (
                          <span className="text-gold font-medium">
                            {formatPrice(z.delivery_fee)}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                            z.same_day_available
                              ? "bg-[#E8F5ED] text-[#3A7D54]"
                              : "bg-[#F5F3F0] text-[#9A9490]"
                          }`}
                        >
                          {z.same_day_available ? "Có" : "Không"}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-admin-text-secondary">
                        {isEditing ? (
                          <input
                            type="time"
                            value={zoneEditData?.same_day_cutoff ?? ""}
                            onChange={(e) =>
                              setZoneEditData((prev) =>
                                prev
                                  ? { ...prev, same_day_cutoff: e.target.value }
                                  : prev
                              )
                            }
                            className="px-2 py-1 bg-admin-bg border border-admin-border rounded text-sm text-admin-text focus:outline-none focus:border-gold/50"
                          />
                        ) : (
                          z.same_day_cutoff || "\u2014"
                        )}
                      </td>
                      <td className="px-5 py-3 text-right">
                        {isEditing ? (
                          <input
                            type="number"
                            value={zoneEditData?.max_daily_capacity ?? 0}
                            onChange={(e) =>
                              setZoneEditData((prev) =>
                                prev
                                  ? {
                                      ...prev,
                                      max_daily_capacity: Number(e.target.value),
                                    }
                                  : prev
                              )
                            }
                            className="w-20 px-2 py-1 bg-admin-bg border border-admin-border rounded text-sm text-admin-text text-right focus:outline-none focus:border-gold/50"
                          />
                        ) : (
                          <span className="text-admin-text">
                            {z.max_daily_capacity}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-center">
                        <button
                          onClick={() => handleToggleZoneActive(z)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                            z.is_active
                              ? "bg-[#E8F5ED] text-[#3A7D54]"
                              : "bg-[#F5F3F0] text-[#9A9490]"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              z.is_active ? "bg-[#3A7D54]" : "bg-[#9A9490]"
                            }`}
                          />
                          {z.is_active ? "Bật" : "Tắt"}
                        </button>
                      </td>
                      <td className="px-5 py-3 text-right">
                        {isEditing ? (
                          <div className="flex items-center gap-1.5 justify-end">
                            <button
                              onClick={handleSaveZone}
                              className="px-3 py-1 bg-gold text-white rounded text-xs font-medium hover:bg-gold/90"
                            >
                              Lưu
                            </button>
                            <button
                              onClick={() => {
                                setEditingZone(null);
                                setZoneEditData(null);
                              }}
                              className="px-3 py-1 bg-admin-surface-hover text-admin-text-secondary rounded text-xs hover:text-admin-text"
                            >
                              Huỷ
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleStartEditZone(z)}
                            className="text-xs text-gold hover:underline"
                          >
                            Sửa
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
