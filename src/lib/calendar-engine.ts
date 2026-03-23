import type { GiftOccasion, GiftRecipient, UpcomingOccasion } from "@/types";

export function getUpcomingOccasions(
  occasions: GiftOccasion[],
  recipients: Map<string, GiftRecipient>,
  withinDays: number = 30
): UpcomingOccasion[] {
  const now = new Date();
  const results: UpcomingOccasion[] = [];

  for (const occ of occasions) {
    if (!occ.date_day || !occ.date_month) continue;

    const recipient = recipients.get(occ.recipient_id);
    if (!recipient) continue;

    // Calculate next occurrence
    const thisYear = now.getFullYear();
    let nextDate = new Date(thisYear, occ.date_month - 1, occ.date_day);

    // Handle invalid dates (e.g. Feb 30) — skip
    if (
      nextDate.getMonth() !== occ.date_month - 1 ||
      nextDate.getDate() !== occ.date_day
    ) {
      continue;
    }

    // If date has passed this year, use next year (unless it's a one-time event)
    if (nextDate < now && !occ.date_year) {
      nextDate = new Date(thisYear + 1, occ.date_month - 1, occ.date_day);
    }

    // For one-time events (date_year set), skip if already passed
    if (occ.date_year && nextDate < now) continue;

    const diffMs = nextDate.getTime() - now.getTime();
    const daysUntil = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (daysUntil >= 0 && daysUntil <= withinDays) {
      results.push({
        occasion: occ,
        recipient,
        days_until: daysUntil,
        next_date: nextDate,
      });
    }
  }

  return results.sort((a, b) => a.days_until - b.days_until);
}
