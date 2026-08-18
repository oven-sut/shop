/**
 * แปะ structured data ลงหน้า
 *
 * `dangerouslySetInnerHTML` เป็นทางเดียวที่ React ยอมให้ใส่เนื้อใน <script> —
 * ถ้าเขียนเป็น children ปกติ React จะ escape เครื่องหมายคำพูดจน JSON เสีย
 * ค่าที่ส่งเข้ามาต้องมาจากฝั่งเราเท่านั้น (`</script>` ถูกตัดทิ้งกันไว้อีกชั้น
 * เผื่อวันที่มีข้อความจากแอดมินหลุดเข้ามา)
 */
export function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, '\u003c'),
      }}
    />
  );
}
