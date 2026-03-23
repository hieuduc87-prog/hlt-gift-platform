import { createServerSupabase } from "@/lib/supabase/server";
import { parseExcelBuffer } from "@/lib/excel-parser";

export async function POST(request: Request) {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "Chua dang nhap" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return Response.json({ error: "Chua chon file" }, { status: 400 });
  }

  const validTypes = [
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-excel",
  ];
  if (!validTypes.includes(file.type) && !file.name.endsWith(".xlsx") && !file.name.endsWith(".xls")) {
    return Response.json(
      { error: "Chi chap nhan file Excel (.xlsx, .xls)" },
      { status: 400 }
    );
  }

  const buffer = await file.arrayBuffer();
  const { rows, errors } = parseExcelBuffer(buffer);

  let successCount = 0;
  const insertErrors: { row: number; message: string }[] = [...errors];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const excelRow = i + 2 + errors.filter((e) => e.row <= i + 2).length;

    // Insert recipient
    const { data: recipient, error: recipientError } = await supabase
      .from("gift_recipients")
      .insert({
        profile_id: user.id,
        full_name: row.full_name,
        phone: row.phone,
        email: row.email,
        relationship: row.relationship,
        address: row.address,
        district: row.district,
        city: "Ha Noi",
        note: row.note,
        tags: [],
      })
      .select("id")
      .single();

    if (recipientError) {
      insertErrors.push({
        row: excelRow,
        message: `Loi khi them: ${recipientError.message}`,
      });
      continue;
    }

    // Auto-create birthday occasion if birthday data present
    if (row.birthday_day && row.birthday_month && recipient) {
      const { error: occasionError } = await supabase
        .from("gift_occasions")
        .insert({
          recipient_id: recipient.id,
          profile_id: user.id,
          type: "birthday",
          label: "Sinh nhat",
          date_day: row.birthday_day,
          date_month: row.birthday_month,
          is_lunar: false,
          remind_days_before: 7,
          auto_order: false,
        });

      if (occasionError) {
        insertErrors.push({
          row: excelRow,
          message: `Da them nguoi nhan nhung loi khi tao dip sinh nhat: ${occasionError.message}`,
        });
      }
    }

    successCount++;
  }

  return Response.json({
    success: successCount,
    failed: insertErrors.length,
    total: rows.length + errors.length,
    errors: insertErrors,
  });
}
