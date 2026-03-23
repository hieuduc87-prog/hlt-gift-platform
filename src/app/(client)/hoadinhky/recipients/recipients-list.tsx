"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  Plus,
  Upload,
  Trash2,
  Pencil,
  CalendarDays,
  User,
  Phone,
  MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Modal } from "@/components/ui/Modal";
import type {
  GiftRecipientWithOccasions,
  GiftOccasion,
  RelationshipTag,
} from "@/types/index";
import { RELATIONSHIP_CONFIG, OCCASION_CONFIG } from "@/types/index";
import { formatDateShort } from "@/lib/formatters";

interface Props {
  initialRecipients: GiftRecipientWithOccasions[];
}

function getNextOccasion(
  occasions: GiftOccasion[]
): { occasion: GiftOccasion; daysUntil: number } | null {
  if (!occasions.length) return null;

  const now = new Date();
  const currentYear = now.getFullYear();

  let closest: { occasion: GiftOccasion; daysUntil: number } | null = null;

  for (const occ of occasions) {
    // Build next date for this year
    let nextDate = new Date(currentYear, occ.date_month - 1, occ.date_day);
    if (nextDate < now) {
      nextDate = new Date(currentYear + 1, occ.date_month - 1, occ.date_day);
    }
    const daysUntil = Math.ceil(
      (nextDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (!closest || daysUntil < closest.daysUntil) {
      closest = { occasion: occ, daysUntil };
    }
  }

  return closest;
}

export function RecipientsList({ initialRecipients }: Props) {
  const router = useRouter();
  const [recipients, setRecipients] =
    useState<GiftRecipientWithOccasions[]>(initialRecipients);
  const [search, setSearch] = useState("");
  const [filterRelationship, setFilterRelationship] = useState<
    RelationshipTag | ""
  >("");
  const [deleteTarget, setDeleteTarget] =
    useState<GiftRecipientWithOccasions | null>(null);
  const [deleting, setDeleting] = useState(false);

  const filtered = useMemo(() => {
    let result = recipients;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (r) =>
          r.full_name.toLowerCase().includes(q) ||
          r.phone?.toLowerCase().includes(q) ||
          r.email?.toLowerCase().includes(q)
      );
    }
    if (filterRelationship) {
      result = result.filter((r) => r.relationship === filterRelationship);
    }
    return result;
  }, [recipients, search, filterRelationship]);

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/recipients/${deleteTarget.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setRecipients((prev) =>
          prev.filter((r) => r.id !== deleteTarget.id)
        );
        setDeleteTarget(null);
      }
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-display text-foreground">
            Nguoi nhan
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            {recipients.length} nguoi nhan
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/hoadinhky/recipients/upload">
            <Button variant="secondary" size="sm">
              <Upload size={16} />
              Nhap Excel
            </Button>
          </Link>
          <Link href="/hoadinhky/recipients/new">
            <Button size="sm">
              <Plus size={16} />
              Them moi
            </Button>
          </Link>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
          />
          <input
            type="text"
            placeholder="Tim kiem theo ten, SDT, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-10 pl-9 pr-3 rounded-lg border border-border bg-surface text-sm text-foreground placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold"
          />
        </div>
        <select
          value={filterRelationship}
          onChange={(e) =>
            setFilterRelationship(e.target.value as RelationshipTag | "")
          }
          className="h-10 px-3 rounded-lg border border-border bg-surface text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold"
        >
          <option value="">Tat ca quan he</option>
          {Object.entries(RELATIONSHIP_CONFIG).map(([key, cfg]) => (
            <option key={key} value={key}>
              {cfg.icon} {cfg.label}
            </option>
          ))}
        </select>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={<User />}
          title={
            search || filterRelationship
              ? "Khong tim thay ket qua"
              : "Chua co nguoi nhan nao"
          }
          description={
            search || filterRelationship
              ? "Thu thay doi bo loc hoac tu khoa tim kiem"
              : "Bat dau them nguoi nhan de quan ly qua tang"
          }
          action={
            !search &&
            !filterRelationship && (
              <Link href="/hoadinhky/recipients/new">
                <Button size="sm">
                  <Plus size={16} />
                  Them nguoi nhan
                </Button>
              </Link>
            )
          }
        />
      ) : (
        <div className="grid gap-3">
          {filtered.map((recipient) => {
            const relCfg = RELATIONSHIP_CONFIG[recipient.relationship];
            const next = getNextOccasion(recipient.gift_occasions);
            const occCfg = next
              ? OCCASION_CONFIG[next.occasion.type]
              : null;

            return (
              <Card
                key={recipient.id}
                variant="hover"
                className="cursor-pointer"
                onClick={() => router.push(`/hoadinhky/recipients/${recipient.id}`)}
              >
                <div className="flex items-start justify-between gap-4">
                  {/* Left: Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-foreground truncate">
                        {recipient.full_name}
                      </h3>
                      <Badge variant="neutral" size="sm">
                        {relCfg.icon} {relCfg.label}
                      </Badge>
                    </div>

                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-text-secondary">
                      {recipient.phone && (
                        <span className="flex items-center gap-1">
                          <Phone size={13} />
                          {recipient.phone}
                        </span>
                      )}
                      {(recipient.district || recipient.city) && (
                        <span className="flex items-center gap-1">
                          <MapPin size={13} />
                          {[recipient.district, recipient.city]
                            .filter(Boolean)
                            .join(", ")}
                        </span>
                      )}
                    </div>

                    {/* Next occasion */}
                    {next && occCfg && (
                      <div className="mt-2 flex items-center gap-1.5 text-sm">
                        <CalendarDays size={14} className="text-gold" />
                        <span style={{ color: occCfg.color }}>
                          {occCfg.icon} {occCfg.label}
                        </span>
                        <span className="text-text-muted">
                          {formatDateShort(
                            new Date(
                              new Date().getFullYear(),
                              next.occasion.date_month - 1,
                              next.occasion.date_day
                            )
                          )}
                        </span>
                        {next.daysUntil <= 7 && (
                          <Badge variant="warning" size="sm">
                            Con {next.daysUntil} ngay
                          </Badge>
                        )}
                        {next.daysUntil > 7 && next.daysUntil <= 30 && (
                          <span className="text-text-muted text-xs">
                            (con {next.daysUntil} ngay)
                          </span>
                        )}
                      </div>
                    )}

                    {recipient.gift_occasions.length === 0 && (
                      <p className="mt-2 text-xs text-text-muted">
                        Chua co dip nao
                      </p>
                    )}
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/hoadinhky/recipients/${recipient.id}`);
                      }}
                      className="p-2 rounded-lg text-text-muted hover:bg-surface-hover hover:text-foreground transition-colors"
                      title="Chinh sua"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteTarget(recipient);
                      }}
                      className="p-2 rounded-lg text-text-muted hover:bg-error-bg hover:text-error transition-colors"
                      title="Xoa"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Delete confirmation modal */}
      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Xac nhan xoa"
        size="sm"
      >
        <p className="text-sm text-text-secondary mb-4">
          Ban co chac chan muon xoa{" "}
          <strong className="text-foreground">
            {deleteTarget?.full_name}
          </strong>{" "}
          va tat ca cac dip lien quan khong?
        </p>
        <div className="flex justify-end gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDeleteTarget(null)}
          >
            Huy
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting ? "Dang xoa..." : "Xoa"}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
