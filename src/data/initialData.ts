import { Product, Order, Coupon } from '../types/ecommerce';

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod-1',
    name: 'AuraSound Pro Wireless Headphones',
    category: 'หูฟัง & แอคเซสซอรี',
    price: 4990,
    originalPrice: 6500,
    stock: 18,
    description: 'หูฟังไร้สายระดับพรีเมียมพร้อมระบบตัดเสียงรบกวน Active Noise Cancelling (ANC) แบตเตอรี่ใช้งานยาวนาน 40 ชั่วโมง ให้มิติเสียงคมชัด เบสนุ่มลึก',
    specs: {
      'การเชื่อมต่อ': 'Bluetooth 5.3',
      'แบตเตอรี่': 'สูงสุด 40 ชั่วโมง',
      'ระบบตัดเสียง': 'Hybrid Active Noise Cancellation',
      'น้ำหนัก': '250 กรัม',
      'ประกัน': '1 ปี ศูนย์ไทย'
    },
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=800&auto=format&fit=crop',
    gallery: [
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1484704849700-f032a568e944?q=80&w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1546435770-a3e426bf472b?q=80&w=800&auto=format&fit=crop'
    ],
    rating: 4.9,
    reviewsCount: 38,
    badge: 'HOT',
    isFeatured: true,
    reviews: [
      {
        id: 'rev-1',
        userName: 'สมชาย สายไอที',
        rating: 5,
        comment: 'ตัดเสียงรบกวนดีมากครับ ใส่สบายไม่เจ็บหู เบสแน่นสะใจ ส่งไวมากๆ',
        date: '2026-08-10'
      },
      {
        id: 'rev-2',
        userName: 'นภาวรรณ K.',
        rating: 5,
        comment: 'ดีไซน์สวยหรู วัสดุจับแล้วดูแพง แบตอึดจริง ใช้มา 3 วันยังไม่ได้ชาร์จเลย',
        date: '2026-08-08'
      }
    ]
  },
  {
    id: 'prod-2',
    name: 'TitanWatch Ultra OLED Smartwatch',
    category: 'สมาร์ทวอทช์ & แกดเจ็ต',
    price: 7900,
    originalPrice: 9900,
    stock: 12,
    description: 'สมาร์ทวอทช์จอ AMOLED ความละเอียดสูง วัดอัตราการเต้นหัวใจ ตรวจจับการนอน รองรับโหมดออกกำลังกายกว่า 100+ โหมด กันน้ำระดับ 5ATM',
    specs: {
      'หน้าจอ': '1.43" AMOLED Full Touch',
      'กันน้ำ': '5ATM (ลึก 50 เมตร)',
      'เซนเซอร์': 'Heart Rate, SpO2, GPS in-built',
      'แบตเตอรี่': '14 วันสำหรับการใช้งานทั่วไป',
      'การรับประกัน': '1 ปี'
    },
    image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=800&auto=format&fit=crop',
    rating: 4.8,
    reviewsCount: 29,
    badge: 'NEW',
    isFeatured: true,
    reviews: [
      {
        id: 'rev-3',
        userName: 'กิตติศักดิ์ R.',
        rating: 5,
        comment: 'จอสวยคมชัด สู้แสงแดดเมืองไทยได้สบาย ฟังก์ชันวัดค่าสุขภาพค่อนข้างแม่นยำครับ',
        date: '2026-08-11'
      }
    ]
  },
  {
    id: 'prod-3',
    name: 'CyberMech RGB Mechanical Keyboard Wireless',
    category: 'เกมมิ่ง & ไอที',
    price: 3290,
    originalPrice: 4200,
    stock: 4,
    description: 'คีย์บอร์ดกลไกไร้สาย 75% Layout สวิตช์ Custom Pre-lubed พิมพ์สัมผัสนุ่มละมุน เสียง Thock แน่นๆ ไฟ RGB ปรับแต่งได้ 18 โหมด รองรับ Hot-swappable',
    specs: {
      'การเชื่อมต่อ': 'Tri-Mode (Bluetooth 5.0, 2.4G, Type-C)',
      'สวิตช์': 'Custom Linear Yellow Switches',
      'แบตเตอรี่': '4000 mAh',
      'คีย์แคป': 'PBT Double-shot โปรไฟล์ Cherry',
      'น้ำหนัก': '980 กรัม'
    },
    image: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?q=80&w=800&auto=format&fit=crop',
    rating: 4.9,
    reviewsCount: 45,
    badge: 'SALE',
    isFeatured: true,
    reviews: []
  },
  {
    id: 'prod-4',
    name: 'Vortex Precision Wireless Gaming Mouse',
    category: 'เกมมิ่ง & ไอที',
    price: 2190,
    originalPrice: 2890,
    stock: 25,
    description: 'เมาส์เกมมิ่งไร้สายน้ำหนักเบาเพียง 55 กรัม เซนเซอร์ความแม่นยำสูง 26,000 DPI ค่า Polling Rate 4,000Hz ตอบสนองรวดเร็วระดับมือโปร',
    specs: {
      'น้ำหนัก': '55 กรัม',
      'เซนเซอร์': 'PAW3395 Optical',
      'DPI Max': '26,000 DPI',
      'การเชื่อมต่อ': '2.4GHz Wireless & Wired',
      'อายุการใช้งานสวิตช์': '80 ล้านคลิก'
    },
    image: 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?q=80&w=800&auto=format&fit=crop',
    rating: 4.7,
    reviewsCount: 19,
    badge: 'HOT',
    reviews: []
  },
  {
    id: 'prod-5',
    name: 'Lumina Desk Lamp LED Minimalist',
    category: 'ไลฟ์สไตล์ & เดสก์ท็อป',
    price: 1490,
    originalPrice: 1990,
    stock: 15,
    description: 'โคมไฟตั้งโต๊ะมินิมอล ปรับอุณหภูมิแสงได้ 5 ระดับ มีที่ชาร์จไร้สาย Fast Wireless Charge 15W ในตัว ดีไซน์เรียบหรู ถนอมสายตา',
    specs: {
      'กำลังไฟ': '12W LED',
      'การปรับแสง': '2700K - 6500K (5 โหมด)',
      'การชาร์จไร้สาย': 'Qi Wireless 15W Max',
      'วัสดุ': 'อลูมิเนียมอัลลอยด์',
      'ขนาด': '40 x 12 x 42 ซม.'
    },
    image: 'https://images.unsplash.com/photo-1534073828943-f801091bb18c?q=80&w=800&auto=format&fit=crop',
    rating: 4.8,
    reviewsCount: 14,
    reviews: []
  },
  {
    id: 'prod-6',
    name: 'PulseBeats Studio Monitor Speaker Pair',
    category: 'หูฟัง & แอคเซสซอรี',
    price: 8900,
    originalPrice: 10900,
    stock: 7,
    description: 'ลำโพงสตูดิโอมอนิเตอร์คู่ เสียงคมชัดระดับ Hi-Res Audio เหมาะสำหรับฟังเพลง ทำเพลง และการใช้งานระดับมืออาชีพ รองรับ Bluetooth & Optical Input',
    specs: {
      'กำลังขับรวม': '80W RMS',
      'ดอกลำโพง': '4 นิ้ว Woofer + 0.75 นิ้ว Silk Dome Tweeter',
      'การเชื่อมต่อ': 'Bluetooth 5.0, AUX, Optical, Coaxial',
      'ตอบสนองความถี่': '52Hz - 20kHz',
      'ประกัน': '1 ปี'
    },
    image: 'https://images.unsplash.com/photo-1545454675-3531b543be5d?q=80&w=800&auto=format&fit=crop',
    rating: 5.0,
    reviewsCount: 22,
    badge: 'LIMITED',
    isFeatured: true,
    reviews: []
  },
  {
    id: 'prod-7',
    name: 'EcoPod True Wireless Earbuds',
    category: 'หูฟัง & แอคเซสซอรี',
    price: 1890,
    originalPrice: 2490,
    stock: 30,
    description: 'หูฟังบลูทูธไร้สายทรง Earbuds น้ำหนักเบาเพียง 3.5 กรัม ไมค์ตัดเสียงรบกวน ENC สนทนาชัดเจน กันน้ำกันเหงื่อระดับ IPX5',
    specs: {
      'เวอร์ชัน Bluetooth': '5.3',
      'ไมโครโฟน': 'Dual Mic ENC',
      'แบตเตอรี่': '6 ชม. (รวมกล่อง 28 ชม.)',
      'มาตรฐานกันน้ำ': 'IPX5',
      'พอร์ตชาร์จ': 'Type-C Fast Charge'
    },
    image: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?q=80&w=800&auto=format&fit=crop',
    rating: 4.6,
    reviewsCount: 51,
    reviews: []
  },
  {
    id: 'prod-8',
    name: 'StreamCam 4K HDR Webcam with Ring Light',
    category: 'เกมมิ่ง & ไอที',
    price: 3590,
    originalPrice: 4500,
    stock: 3,
    description: 'เว็บแคมระดับ 4K 60FPS มีไฟริงไลท์ปรับระดับความสว่างในตัว ออโต้โฟกัสรวดเร็ว ระบบไมค์คู่ตัดเสียงรบกวน เหมาะสำหรับสายสตรีมและประชุมออนไลน์',
    specs: {
      'ความละเอียด': '4K @ 30FPS / 1080p @ 60FPS',
      'มุมมองภาพ (FOV)': '90 องศา ปรับได้',
      'ไฟในตัว': 'LED Ring Light ปรับได้ 3 ระดับ',
      'การเชื่อมต่อ': 'USB 3.0 Plug & Play',
      'ประกัน': '1 ปี'
    },
    image: 'https://images.unsplash.com/photo-1585060544812-6b45742d762f?q=80&w=800&auto=format&fit=crop',
    rating: 4.9,
    reviewsCount: 16,
    badge: 'NEW',
    reviews: []
  }
];

export const INITIAL_ORDERS: Order[] = [
  {
    id: 'ORD-9821',
    createdAt: '2026-08-13 14:30',
    customer: {
      name: 'คุณธนกฤต วิเศษศิลป์',
      email: 'thanakrit@example.com',
      phone: '081-234-5678',
      address: '99/123 หมู่บ้านพฤกษา วิลล์ ถนนสุขุมวิท',
      district: 'วัฒนา',
      province: 'กรุงเทพมหานคร',
      postalCode: '10110',
      note: 'ฝากไว้ที่นิติบุคคลด้วยครับ'
    },
    items: [
      {
        product: INITIAL_PRODUCTS[0],
        quantity: 1,
        selectedColor: 'Matte Black'
      },
      {
        product: INITIAL_PRODUCTS[3],
        quantity: 1
      }
    ],
    subtotal: 7180,
    discount: 500,
    shippingFee: 0,
    totalAmount: 6680,
    status: 'กำลังจัดเตรียม',
    paymentMethod: 'promptpay',
    isPaid: true,
    couponCode: 'DISCOUNT500'
  },
  {
    id: 'ORD-9820',
    createdAt: '2026-08-12 18:15',
    customer: {
      name: 'คุณพิมพ์ใจ ตั้งเจริญ',
      email: 'pimjai@example.com',
      phone: '089-876-5432',
      address: '45/8 ถนนพหลโยธิน แขวงลาดยาว',
      district: 'จตุจักร',
      province: 'กรุงเทพมหานคร',
      postalCode: '10900'
    },
    items: [
      {
        product: INITIAL_PRODUCTS[1],
        quantity: 1
      }
    ],
    subtotal: 7900,
    discount: 0,
    shippingFee: 0,
    totalAmount: 7900,
    status: 'จัดส่งแล้ว',
    paymentMethod: 'credit_card',
    isPaid: true,
    trackingNumber: 'TH8492019482TH'
  },
  {
    id: 'ORD-9819',
    createdAt: '2026-08-11 10:45',
    customer: {
      name: 'คุณณัฐพล มีสุข',
      email: 'nattapol@example.com',
      phone: '086-111-2233',
      address: '12/4 ซอยอารีย์ 3 ถนนพหลโยธิน',
      district: 'พญาไท',
      province: 'กรุงเทพมหานคร',
      postalCode: '10400'
    },
    items: [
      {
        product: INITIAL_PRODUCTS[2],
        quantity: 1
      }
    ],
    subtotal: 3290,
    discount: 0,
    shippingFee: 50,
    totalAmount: 3340,
    status: 'สำเร็จ',
    paymentMethod: 'promptpay',
    isPaid: true,
    trackingNumber: 'TH1029384756TH'
  }
];

export const INITIAL_COUPONS: Coupon[] = [
  {
    code: 'NEO10',
    discountPercent: 10,
    minSpend: 1000,
    description: 'ส่วนลด 10% สำหรับยอดซื้อขั้นต่ำ ฿1,000'
  },
  {
    code: 'FREESHIP',
    discountPercent: 0,
    minSpend: 500,
    description: 'จัดส่งฟรีทั่วประเทศ เมื่อสั่งซื้อ ฿500 ขึ้นไป'
  },
  {
    code: 'DISCOUNT500',
    discountPercent: 15,
    minSpend: 3000,
    description: 'ส่วนลดพิเศษ 15% เมื่อซื้อสินค้าครบ ฿3,000'
  }
];
