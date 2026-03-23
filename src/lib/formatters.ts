const priceFormatter = new Intl.NumberFormat("vi-VN");

export function formatPrice(amount: number): string {
  if (amount === 0) return "0đ";
  return priceFormatter.format(amount) + "đ";
}

export function formatDate(d: string | Date): string {
  const date = typeof d === "string" ? new Date(d) : d;
  const day = date.getDate().toString().padStart(2, "0");
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

export function formatDateShort(d: string | Date): string {
  const date = typeof d === "string" ? new Date(d) : d;
  const day = date.getDate().toString().padStart(2, "0");
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  return `${day}/${month}`;
}

export function formatRelativeDate(d: string | Date): string {
  const date = typeof d === "string" ? new Date(d) : d;
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Hôm nay";
  if (diffDays === 1) return "Ngày mai";
  if (diffDays < 0) return `${Math.abs(diffDays)} ngày trước`;
  return `Còn ${diffDays} ngày`;
}
