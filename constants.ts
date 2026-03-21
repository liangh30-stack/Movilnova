
import { Product, RepairJob } from './types';

export const BRAND_MODELS: Record<string, string[]> = {
  "Apple": [
    "iPhone 15 Pro Max", "iPhone 15 Pro", "iPhone 15 Plus", "iPhone 15",
    "iPhone 14 Pro Max", "iPhone 14 Pro", "iPhone 14 Plus", "iPhone 14",
    "iPhone 13 Pro Max", "iPhone 13 Pro", "iPhone 13", "iPhone 13 mini",
    "iPhone 12 Pro Max", "iPhone 12 Pro", "iPhone 12", "iPhone 12 mini",
    "iPhone 11 Pro Max", "iPhone 11 Pro", "iPhone 11",
    "iPhone SE (3rd gen)", "iPhone SE (2nd gen)",
    "iPhone XS Max", "iPhone XS", "iPhone XR", "iPhone X",
    "iPhone 8 Plus", "iPhone 8", "iPhone 7 Plus", "iPhone 7"
  ],
  "Samsung": [
    "Galaxy S24 Ultra", "Galaxy S24+", "Galaxy S24", 
    "Galaxy S23 Ultra", "Galaxy S23+", "Galaxy S23", "Galaxy S23 FE",
    "Galaxy S22 Ultra", "Galaxy S22+", "Galaxy S22",
    "Galaxy S21 Ultra", "Galaxy S21+", "Galaxy S21", "Galaxy S21 FE",
    "Galaxy Z Fold5", "Galaxy Z Flip5", "Galaxy Z Fold4", "Galaxy Z Flip4",
    "Galaxy A54", "Galaxy A34", "Galaxy A14", "Galaxy A73", "Galaxy A53"
  ],
  "Xiaomi": [
    "Xiaomi 14 Ultra", "Xiaomi 14", "Xiaomi 13T Pro", "Xiaomi 13T", "Xiaomi 13 Ultra", "Xiaomi 13 Pro", "Xiaomi 13",
    "Redmi Note 13 Pro+", "Redmi Note 13 Pro", "Redmi Note 13",
    "Redmi Note 12 Pro+", "Redmi Note 12 Pro", "Redmi Note 12",
    "POCO X6 Pro", "POCO X6", "POCO F5 Pro", "POCO F5", "POCO M6 Pro"
  ],
  "Huawei": [
    "P60 Pro", "P60", "Mate 60 Pro", "Mate 60", "Mate X3",
    "P50 Pro", "P50", "Mate 50 Pro", "Mate 50",
    "Nova 11 Pro", "Nova 11", "Nova 10 Pro", "Nova 10"
  ],
  "Oppo": [
    "Find X6 Pro", "Find X6", "Find N3 Flip", "Find N3",
    "Reno 11 Pro", "Reno 11", "Reno 10 Pro+", "Reno 10 Pro", "Reno 10",
    "Find X5 Pro", "Find X5"
  ],
  "Google": [
    "Pixel 8 Pro", "Pixel 8", "Pixel 7 Pro", "Pixel 7", "Pixel 7a",
    "Pixel 6 Pro", "Pixel 6", "Pixel 6a", "Pixel Fold"
  ]
};

export const MOCK_PRODUCTS: Product[] = [
  {
    id: 1,
    name: "Pink Marble Dream",
    price: 15.99,
    category: "Carcasa",
    brands: ["Apple"],
    compatibleModels: ["iPhone 15 Pro Max", "iPhone 15 Pro", "iPhone 15"],
    image: "https://images.unsplash.com/photo-1603313011101-320f26a4f6f6?auto=format&fit=crop&q=80&w=400",
    description: "Elegant marble finish with gold accents. Durable polycarbonate material provides excellent drop protection while maintaining a slim profile."
  },
  {
    id: 2,
    name: "Liquid Glitter Hearts",
    price: 19.99,
    category: "Carcasa",
    brands: ["Apple"],
    compatibleModels: ["iPhone 14", "iPhone 13"],
    image: "https://images.unsplash.com/photo-1585351608678-75b85a360655?auto=format&fit=crop&q=80&w=400",
    description: "Interactive liquid glitter that moves with you. Made with high-quality mineral oil and non-toxic glitter. Perfect for adding a touch of sparkle to your day."
  },
  {
    id: 3,
    name: "Matte Black Stealth",
    price: 12.99,
    category: "Carcasa",
    brands: ["Samsung"],
    compatibleModels: ["Galaxy S24 Ultra", "Galaxy S24"],
    image: "https://images.unsplash.com/photo-1601593346740-925612772716?auto=format&fit=crop&q=80&w=400",
    description: "Ultra-slim, soft-touch matte finish. Resists fingerprints and provides a secure grip. Minimalist design for those who prefer a clean look."
  },
  {
    id: 4,
    name: "Crystal Clear MagSafe",
    price: 24.99,
    category: "Carcasa",
    brands: ["Apple"],
    compatibleModels: ["iPhone 15 Pro Max", "iPhone 15 Pro", "iPhone 15"],
    image: "https://images.unsplash.com/photo-1616348436168-de43ad0db179?auto=format&fit=crop&q=80&w=400",
    description: "Show off your phone's color. Anti-yellowing technology keeps the case crystal clear over time. Integrated MagSafe magnets for seamless charging."
  },
  {
    id: 5,
    name: "Leopard Print Chic",
    price: 16.99,
    category: "Carcasa",
    brands: ["Xiaomi"],
    compatibleModels: ["Redmi Note 13", "Xiaomi 13T"],
    image: "https://images.unsplash.com/photo-1515347619252-60a6bf4fffce?auto=format&fit=crop&q=80&w=400",
    description: "Bold animal print for the fashion forward. High-resolution print that won't fade. Impact-resistant edges for extra security."
  },
  {
    id: 6,
    name: "Privacy Glass Pro",
    price: 14.99,
    category: "Protector de pantalla",
    brands: ["Apple"],
    compatibleModels: ["iPhone 15 Pro Max", "iPhone 15 Pro", "iPhone 15", "iPhone 14"],
    image: "https://images.unsplash.com/photo-1635443265749-c124e393a571?auto=format&fit=crop&q=80&w=400",
    description: "Keep your screen private from prying eyes. Viewable only from directly in front. 9H hardness tempered glass protects against scratches and impacts."
  },
  {
    id: 7,
    name: "Rope Crossbody Strap",
    price: 9.99,
    category: "Colgante",
    brands: ["Universal"],
    compatibleModels: ["iPhone 15", "Galaxy S24", "Redmi Note 13"],
    image: "https://images.unsplash.com/photo-1622434641406-a15810545060?auto=format&fit=crop&q=80&w=400",
    description: "Hands-free convenience with adjustable rope. Universal patch fits most phone cases. Perfect for travel, festivals, and busy days."
  },
  {
    id: 8,
    name: "Lavender Silicone",
    price: 18.99,
    category: "Carcasa",
    brands: ["Oppo"],
    compatibleModels: ["Reno 10", "Find X5"],
    image: "https://images.unsplash.com/photo-1622329786480-1a7428f52285?auto=format&fit=crop&q=80&w=400",
    description: "Soft pastel silicone with microfiber lining. Silky-smooth texture that feels great in hand. Easy to clean and provides great shock absorption."
  },
  {
    id: 9,
    name: "Heavy Duty Armor",
    price: 29.99,
    category: "Carcasa",
    brands: ["Samsung"],
    compatibleModels: ["Galaxy S24 Ultra", "Galaxy A54"],
    image: "https://images.unsplash.com/photo-1592890278983-18616401d4ed?auto=format&fit=crop&q=80&w=400",
    description: "Military grade drop protection. Dual-layer construction with a hard outer shell and soft inner core. Integrated kickstand for hands-free viewing."
  },
  {
    id: 10,
    name: "Disney Vibes",
    price: 22.99,
    category: "Carcasa",
    brands: ["Apple"],
    compatibleModels: ["iPhone 14", "iPhone 13"],
    image: "https://images.unsplash.com/photo-1534970028765-38ce47ef7d8d?auto=format&fit=crop&q=80&w=400",
    description: "Cute cartoon patterns. Licensed designs featuring your favorite characters. Bright, vibrant colors and high-quality construction."
  }
];

export const HOT_BUNDLE: Product = {
  id: 999,
  name: "Summer Vibes Bundle",
  price: 24.99,
  originalPrice: 35.99,
  category: "Bundle",
  image: "https://images.unsplash.com/photo-1523206489230-c012c64b2b48?auto=format&fit=crop&q=80&w=400",
  description: "Colorful Case + Matching Crossbody Strap. The perfect duo for your summer adventures. Save 30% by buying as a bundle!",
  isBundle: true
};

export const MOCK_REPAIRS: RepairJob[] = [
  {
    id: "WX-8888",
    customerName: "Demo Customer",
    device: "iPhone 14 Pro",
    issue: "Screen Replacement",
    status: "Picked Up",
    progress: 100,
    estimatedCompletion: "Completed",
    telefono: "600123456",
    fechaEntrada: "2023-10-25T10:00:00Z"
  }
];

