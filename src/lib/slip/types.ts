/** สิ่งที่ทุกผู้ให้บริการตรวจสลิปต้องคืนกลับมาให้เหมือนกัน */
export interface SlipDetails {
  /** เลขอ้างอิงของธนาคาร ไม่ซ้ำต่อหนึ่งการโอน — ตัวนี้คือสิ่งที่กันสลิปซ้ำ */
  transRef: string;
  /** จำนวนเงินหน่วยบาท ปรับตาม *_AMOUNT_UNIT ของผู้ให้บริการนั้นแล้ว */
  amount: number;
  sendingBank?: string;
  receivingBank?: string;
  senderName?: string;
  receiverName?: string;
  /** อะไรก็ตามที่ระบุบัญชีปลายทางได้: เลขบัญชี, พร้อมเพย์, … */
  receiverAccounts: string[];
  transferredAt?: string;
  raw: Record<string, unknown>;
  /** ผู้ให้บริการที่ตรวจสลิปใบนี้สำเร็จ เก็บไว้ดูย้อนหลังว่ามาจากเจ้าไหน */
  provider: string;
}

export type SlipInput = { payload: string } | { file: File };

export class SlipVerifyError extends Error {
  readonly code: string;
  readonly status: number;
  /**
   * `true` = ปัญหาอยู่ฝั่งผู้ให้บริการ (โควตาหมด, คีย์ผิด, ล่ม) ลองเจ้าถัดไปได้
   * `false` = ธนาคารตอบแล้วว่าสลิปใบนี้ใช้ไม่ได้ ลองกี่เจ้าก็ได้คำตอบเดิม
   *
   * ตัวนี้สำคัญ: ถ้าจัดผิดเป็น retryable จะเผาโควตาเจ้าอื่นฟรี ๆ
   * ถ้าจัดผิดเป็น terminal ระบบจะหยุดทั้งที่ยังมีเจ้าอื่นใช้ได้อยู่
   */
  readonly retryable: boolean;

  constructor(
    code: string,
    message: string,
    status = 400,
    options: { retryable?: boolean } = {}
  ) {
    super(message);
    this.name = 'SlipVerifyError';
    this.code = code;
    this.status = status;
    this.retryable = options.retryable ?? false;
  }
}

export interface SlipProvider {
  /** ชื่อสั้น ๆ ที่ใช้อ้างใน SLIP_PROVIDERS */
  readonly name: string;
  /** ตั้งค่าคีย์ครบหรือยัง — ถ้ายัง ตัวจัดคิวจะข้ามไปโดยไม่ยิงเน็ต */
  isConfigured(): boolean;
  verify(input: SlipInput): Promise<SlipDetails>;
}
