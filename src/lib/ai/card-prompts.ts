// HLT Gift Platform — AI Card Text Prompts
// Used by Claude API to generate personalized card text

export const SYSTEM_PROMPT = `Bạn là một chuyên gia viết thiệp chúc mừng cao cấp cho Hoa Lang Thang — thương hiệu hoa premium tại Hà Nội.

Quy tắc:
- Viết bằng tiếng Việt, giọng văn trang trọng nhưng ấm áp
- Độ dài: 2-3 câu (40-80 từ). KHÔNG viết dài hơn.
- Không dùng emoji trong nội dung thiệp
- Không dùng từ "kính" quá nhiều lần
- Tùy mối quan hệ mà điều chỉnh: thân mật (vợ/chồng/bạn) vs trang trọng (đối tác/sếp)
- Nếu có ghi chú đặc biệt từ người gửi, lồng ghép tự nhiên
- Kết thúc bằng lời chúc ngắn gọn, không sáo rỗng`;

export const OCCASION_PROMPTS: Record<string, string> = {
  birthday: `Viết thiệp chúc mừng sinh nhật.
Người nhận: {recipient_name}
Mối quan hệ với người gửi: {relationship}
Người gửi: {sender_name}
Ghi chú: {note}

Yêu cầu: Ấm áp, chân thành, nhắc đến tuổi mới nếu biết. Nếu là đối tác kinh doanh, thêm chút chuyên nghiệp.`,

  opening: `Viết thiệp chúc mừng khai trương.
Người nhận: {recipient_name}
Công ty/cửa hàng: {company}
Người gửi: {sender_name}
Ghi chú: {note}

Yêu cầu: Trang trọng, chúc phát tài phát lộc nhưng không sáo rỗng. Thể hiện sự trân trọng mối quan hệ.`,

  congrats: `Viết thiệp chúc mừng thành công/thăng tiến.
Người nhận: {recipient_name}
Dịp: {occasion_label}
Người gửi: {sender_name}
Ghi chú: {note}

Yêu cầu: Thể hiện sự ngưỡng mộ chân thành, chúc thêm thành công.`,

  holiday: `Viết thiệp chúc mừng ngày lễ/Tết.
Người nhận: {recipient_name}
Dịp: {occasion_label}
Người gửi: {sender_name}
Ghi chú: {note}

Yêu cầu: Truyền thống nhưng không cũ kỹ. Chúc sức khỏe, bình an, thịnh vượng.`,

  women: `Viết thiệp chúc mừng ngày Phụ nữ (8/3 hoặc 20/10).
Người nhận: {recipient_name}
Mối quan hệ: {relationship}
Người gửi: {sender_name}
Ghi chú: {note}

Yêu cầu: Tinh tế, tôn vinh vẻ đẹp và sự mạnh mẽ. Nếu là vợ/bạn gái thì lãng mạn hơn.`,

  teacher: `Viết thiệp chúc mừng ngày Nhà giáo (20/11).
Người nhận: {recipient_name}
Người gửi: {sender_name}
Ghi chú: {note}

Yêu cầu: Tri ân, kính trọng, nhắc đến công lao dạy dỗ.`,

  anniversary: `Viết thiệp kỷ niệm.
Người nhận: {recipient_name}
Dịp: {occasion_label}
Người gửi: {sender_name}
Ghi chú: {note}

Yêu cầu: Nếu kỷ niệm cưới → lãng mạn. Nếu kỷ niệm hợp tác → chuyên nghiệp + trân trọng.`,

  custom: `Viết thiệp cho dịp đặc biệt.
Người nhận: {recipient_name}
Dịp: {occasion_label}
Người gửi: {sender_name}
Ghi chú: {note}

Yêu cầu: Linh hoạt theo dịp được mô tả. Giữ giọng văn ấm áp, chân thành.`,
};

export const RELATIONSHIP_MODIFIERS: Record<string, string> = {
  spouse: 'Giọng văn lãng mạn, thân mật, dùng "anh/em" hoặc "em/anh".',
  parent: 'Giọng văn kính trọng, hiếu thảo, dùng "con".',
  child: 'Giọng văn yêu thương, tự hào, dùng "bố/mẹ".',
  sibling: 'Giọng văn thân thiết, vui tươi.',
  friend: 'Giọng văn thân mật, hài hước nhẹ.',
  boss: 'Giọng văn trang trọng, kính trọng.',
  colleague: 'Giọng văn thân thiện, chuyên nghiệp.',
  partner: 'Giọng văn trang trọng, trân trọng mối quan hệ hợp tác.',
  client: 'Giọng văn lịch sự, chuyên nghiệp, cảm ơn sự tin tưởng.',
  other: 'Giọng văn lịch sự, ấm áp.',
};

export function buildCardPrompt(params: {
  occasion_type: string;
  recipient_name: string;
  relationship: string;
  sender_name: string;
  company?: string;
  occasion_label?: string;
  note?: string;
}): string {
  let template = OCCASION_PROMPTS[params.occasion_type] || OCCASION_PROMPTS.custom;

  template = template
    .replace('{recipient_name}', params.recipient_name)
    .replace('{relationship}', params.relationship)
    .replace('{sender_name}', params.sender_name)
    .replace('{company}', params.company || '')
    .replace('{occasion_label}', params.occasion_label || '')
    .replace('{note}', params.note || 'Không có ghi chú đặc biệt');

  const modifier = RELATIONSHIP_MODIFIERS[params.relationship] || RELATIONSHIP_MODIFIERS.other;

  return `${template}\n\nPhong cách: ${modifier}`;
}
