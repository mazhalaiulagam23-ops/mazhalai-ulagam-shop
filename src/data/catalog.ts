import giftset from "@/assets/p-giftset.jpg";
import sipper from "@/assets/p-sipper.jpg";
import cube from "@/assets/p-cube.jpg";
import teddy from "@/assets/p-teddy.jpg";
import returngift from "@/assets/p-returngift.jpg";
import organic from "@/assets/p-organic.jpg";
import stroller from "@/assets/p-stroller.jpg";
import fashion from "@/assets/p-fashion.jpg";
import stationery from "@/assets/p-stationery.jpg";

export type Category = {
  slug: string;
  name: string;
  tagline: string;
  image: string;
};

export const categories: Category[] = [
  {
    slug: "baby-products",
    name: "Baby Products",
    tagline: "Feeding, bathing & daily care essentials",
    image: sipper,
  },
  {
    slug: "return-gifts",
    name: "Return Gifts",
    tagline: "Birthday, naming ceremony & festival gifting",
    image: returngift,
  },
  { slug: "toys-games", name: "Toys & Games", tagline: "Soft toys, ride-ons & fun", image: teddy },
  {
    slug: "educational-toys",
    name: "Educational Toys",
    tagline: "Montessori & skill building play",
    image: cube,
  },
  { slug: "baby-gear", name: "Baby Gear", tagline: "Strollers, carriers & walkers", image: stroller },
  { slug: "kids-fashion", name: "Kids Fashion", tagline: "Rompers, sets & festive wear", image: fashion },
  {
    slug: "organic-baby-care",
    name: "Organic Baby Care",
    tagline: "Gentle, chemical-free skincare",
    image: organic,
  },
  { slug: "stationery", name: "Stationery", tagline: "Colouring, craft & school kits", image: stationery },
];

export type Product = {
  id: string;
  slug: string;
  name: string;
  category: string;
  images: string[];
  price: number;
  mrp: number;
  rating: number;
  reviews: number;
  stock: number;
  ageGroup: "0-6m" | "6-12m" | "1-3y" | "3-6y" | "6y+";
  badge?: "Bestseller" | "New" | "Offer";
  tags: string[];
  createdAt: string;
  shortDescription: string;
  description: string;
  specs: { label: string; value: string }[];
};

const make = (p: Omit<Product, "id" | "slug">): Product => ({
  ...p,
  id: p.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
  slug: p.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
});

export const products: Product[] = [
  make({
    name: "Newborn Baby Gift Set",
    category: "baby-products",
    images: [giftset, teddy, returngift],
    price: 699,
    mrp: 999,
    rating: 4.6,
    reviews: 125,
    stock: 24,
    ageGroup: "0-6m",
    badge: "Bestseller",
    tags: ["newborn", "gifting", "hamper"],
    createdAt: "2026-05-11",
    shortDescription: "A complete welcome-home hamper for a newborn baby.",
    description:
      "A thoughtfully curated newborn gift set with soft cotton clothing, a plush companion and daily-care basics, packed in a reusable keepsake box. Skin-friendly fabrics, tested for infant safety and perfect for baby showers and naming ceremonies.",
    specs: [
      { label: "Material", value: "100% combed cotton" },
      { label: "Pack contents", value: "7 pieces" },
      { label: "Wash care", value: "Machine wash cold" },
      { label: "Country of origin", value: "India" },
    ],
  }),
  make({
    name: "Baby Sipper Bottle 250ml",
    category: "baby-products",
    images: [sipper, giftset],
    price: 299,
    mrp: 399,
    rating: 4.8,
    reviews: 98,
    stock: 60,
    ageGroup: "6-12m",
    badge: "New",
    tags: ["feeding", "bpa-free"],
    createdAt: "2026-07-02",
    shortDescription: "BPA-free sipper with anti-colic nipple and easy-grip handles.",
    description:
      "An easy-grip training sipper designed for little hands. The anti-colic valve reduces gas and the wide neck makes cleaning simple. BPA-free, boil-safe and leak-proof.",
    specs: [
      { label: "Capacity", value: "250 ml" },
      { label: "Material", value: "Food-grade PP, BPA-free" },
      { label: "Flow", value: "Medium" },
      { label: "Sterilisation", value: "Boil / steam safe" },
    ],
  }),
  make({
    name: "Educational Activity Cube",
    category: "educational-toys",
    images: [cube, teddy],
    price: 599,
    mrp: 899,
    rating: 4.5,
    reviews: 76,
    stock: 18,
    ageGroup: "1-3y",
    badge: "Bestseller",
    tags: ["montessori", "wooden", "learning"],
    createdAt: "2026-04-18",
    shortDescription: "Wooden multi-activity cube for shapes, colours and motor skills.",
    description:
      "A six-sided wooden activity cube packed with sorting, counting and matching games. Non-toxic water-based paint and smooth sanded edges make it safe for toddlers while building fine motor and problem-solving skills.",
    specs: [
      { label: "Material", value: "Pine wood, water-based paint" },
      { label: "Dimensions", value: "18 x 18 x 18 cm" },
      { label: "Skills", value: "Motor, logic, colour recognition" },
      { label: "Certification", value: "Non-toxic, EN71 style testing" },
    ],
  }),
  make({
    name: "Return Gift Combo Pack of 12",
    category: "return-gifts",
    images: [returngift, giftset],
    price: 499,
    mrp: 799,
    rating: 4.4,
    reviews: 64,
    stock: 120,
    ageGroup: "3-6y",
    badge: "Offer",
    tags: ["bulk", "birthday", "wholesale"],
    createdAt: "2026-06-21",
    shortDescription: "Ready-to-gift pack of 12 with wrapping and ribbons included.",
    description:
      "Save time on party planning with a ready-to-hand-out combo of 12 return gifts, individually wrapped with ribbons. Ideal for birthdays, naming ceremonies and school events. Bulk pricing available on wholesale enquiry.",
    specs: [
      { label: "Pack size", value: "12 units" },
      { label: "Wrapping", value: "Included" },
      { label: "Customisation", value: "Name tags on request" },
      { label: "Bulk orders", value: "50+ units at wholesale rate" },
    ],
  }),
  make({
    name: "Soft Teddy Bear 40cm",
    category: "toys-games",
    images: [teddy, cube],
    price: 399,
    mrp: 649,
    rating: 4.7,
    reviews: 112,
    stock: 42,
    ageGroup: "1-3y",
    badge: "Bestseller",
    tags: ["plush", "cuddly"],
    createdAt: "2026-03-30",
    shortDescription: "Huggable plush teddy with hypoallergenic fibre filling.",
    description:
      "An extra-soft 40 cm teddy with premium velvet fur and hypoallergenic filling. Double-stitched seams and embroidered eyes make it safe for babies and toddlers.",
    specs: [
      { label: "Height", value: "40 cm" },
      { label: "Filling", value: "Hypoallergenic polyfill" },
      { label: "Wash care", value: "Surface wash only" },
      { label: "Safety", value: "Embroidered eyes, no loose parts" },
    ],
  }),
  make({
    name: "Organic Baby Lotion & Wash Duo",
    category: "organic-baby-care",
    images: [organic, giftset],
    price: 549,
    mrp: 699,
    rating: 4.6,
    reviews: 53,
    stock: 35,
    ageGroup: "0-6m",
    badge: "New",
    tags: ["organic", "skincare", "paraben-free"],
    createdAt: "2026-07-15",
    shortDescription: "Paraben-free lotion and hair-and-body wash for delicate skin.",
    description:
      "A gentle daily duo made with cold-pressed oils and plant extracts. Free from parabens, sulphates and artificial fragrance, dermatologically tested for newborn skin.",
    specs: [
      { label: "Volume", value: "2 x 200 ml" },
      { label: "Free from", value: "Parabens, SLS, mineral oil" },
      { label: "Skin type", value: "Sensitive, newborn safe" },
      { label: "Shelf life", value: "24 months" },
    ],
  }),
  make({
    name: "Convertible Baby Stroller",
    category: "baby-gear",
    images: [stroller, fashion],
    price: 6499,
    mrp: 8999,
    rating: 4.5,
    reviews: 41,
    stock: 8,
    ageGroup: "0-6m",
    badge: "Offer",
    tags: ["stroller", "travel"],
    createdAt: "2026-02-14",
    shortDescription: "Reversible pram with 5-point harness and one-hand fold.",
    description:
      "A convertible pram-to-stroller with a reversible seat, adjustable canopy, 5-point safety harness and shock-absorbing wheels. Folds with one hand and fits most car boots.",
    specs: [
      { label: "Weight capacity", value: "Up to 15 kg" },
      { label: "Frame", value: "Aluminium alloy" },
      { label: "Folded size", value: "60 x 45 x 30 cm" },
      { label: "Warranty", value: "12 months" },
    ],
  }),
  make({
    name: "Cotton Romper & Cap Set",
    category: "kids-fashion",
    images: [fashion, giftset],
    price: 449,
    mrp: 649,
    rating: 4.3,
    reviews: 87,
    stock: 55,
    ageGroup: "0-6m",
    tags: ["clothing", "cotton"],
    createdAt: "2026-06-05",
    shortDescription: "Breathable cotton romper with matching knot cap.",
    description:
      "Soft breathable cotton romper with side snap buttons for quick changes, paired with a matching knot cap. Pre-shrunk and colour-fast for everyday wear in Coimbatore's warm weather.",
    specs: [
      { label: "Fabric", value: "100% cotton, 180 GSM" },
      { label: "Sizes", value: "0-3m, 3-6m, 6-12m" },
      { label: "Closure", value: "Snap buttons" },
      { label: "Wash care", value: "Machine wash gentle" },
    ],
  }),
  make({
    name: "Kids Colouring & Craft Kit",
    category: "stationery",
    images: [stationery, cube],
    price: 349,
    mrp: 499,
    rating: 4.4,
    reviews: 69,
    stock: 90,
    ageGroup: "3-6y",
    tags: ["craft", "school", "gifting"],
    createdAt: "2026-05-28",
    shortDescription: "All-in-one colouring kit with crayons, sketch pens and notebooks.",
    description:
      "A complete creativity kit with wax crayons, washable sketch pens, colour pencils and two drawing notebooks in a zip pouch. Non-toxic inks safe for school-going children.",
    specs: [
      { label: "Pack contents", value: "46 pieces" },
      { label: "Safety", value: "Non-toxic, washable" },
      { label: "Age", value: "3 years and above" },
      { label: "Pouch", value: "Water-resistant zip case" },
    ],
  }),
  make({
    name: "Wooden Stacking Rings",
    category: "educational-toys",
    images: [cube, teddy],
    price: 379,
    mrp: 549,
    rating: 4.5,
    reviews: 58,
    stock: 30,
    ageGroup: "6-12m",
    tags: ["wooden", "montessori"],
    createdAt: "2026-07-20",
    badge: "New",
    shortDescription: "Classic ring stacker for size and colour learning.",
    description:
      "A timeless wooden stacker with five graded rings in natural pastel tones. Encourages hand-eye coordination and early size sequencing.",
    specs: [
      { label: "Material", value: "Rubberwood" },
      { label: "Rings", value: "5 graded" },
      { label: "Finish", value: "Non-toxic water paint" },
      { label: "Age", value: "6 months+" },
    ],
  }),
  make({
    name: "Baby Bath Essentials Basket",
    category: "baby-products",
    images: [organic, sipper],
    price: 899,
    mrp: 1299,
    rating: 4.2,
    reviews: 34,
    stock: 16,
    ageGroup: "0-6m",
    tags: ["bath", "hamper"],
    createdAt: "2026-04-02",
    shortDescription: "Bath-time hamper with towel, wash, lotion and sponge.",
    description:
      "Everything needed for a calm bath routine, arranged in a woven basket that doubles as nursery storage. Gentle formulations and an ultra-soft muslin towel.",
    specs: [
      { label: "Contents", value: "6 pieces" },
      { label: "Towel", value: "Muslin cotton, 6 layer" },
      { label: "Basket", value: "Handwoven seagrass" },
      { label: "Gift wrap", value: "Available at checkout" },
    ],
  }),
  make({
    name: "Personalised Return Gift Boxes",
    category: "return-gifts",
    images: [returngift, stationery],
    price: 259,
    mrp: 349,
    rating: 4.6,
    reviews: 47,
    stock: 200,
    ageGroup: "3-6y",
    tags: ["personalised", "bulk"],
    createdAt: "2026-06-30",
    badge: "Offer",
    shortDescription: "Custom-printed gift boxes with your child's name and photo.",
    description:
      "Personalised return gift boxes printed with your child's name, age and photo. Choose from ten themes and fill them with stationery, toys or chocolates. Minimum order 20 boxes.",
    specs: [
      { label: "Minimum order", value: "20 boxes" },
      { label: "Print", value: "Full-colour digital" },
      { label: "Turnaround", value: "4-6 working days" },
      { label: "Themes", value: "10 designs" },
    ],
  }),
];

export const getProduct = (slug: string) => products.find((p) => p.slug === slug);
export const getCategory = (slug: string) => categories.find((c) => c.slug === slug);
export const discountPercent = (p: Product) => Math.round(((p.mrp - p.price) / p.mrp) * 100);

export const ageGroups = ["0-6m", "6-12m", "1-3y", "3-6y", "6y+"] as const;

export const testimonials = [
  {
    name: "Divya R.",
    city: "Peelamedu, Coimbatore",
    text: "Ordered a newborn hamper for my sister. The packing was beautiful and delivery took just two days.",
    rating: 5,
  },
  {
    name: "Karthik S.",
    city: "R.S. Puram, Coimbatore",
    text: "We bought 60 return gifts for my son's birthday. Wholesale pricing was genuinely the best in the city.",
    rating: 5,
  },
  {
    name: "Meena V.",
    city: "Saibaba Colony",
    text: "The organic lotion suits my baby's sensitive skin perfectly. Will keep reordering.",
    rating: 4,
  },
];

export const blogPosts = [
  {
    slug: "newborn-essentials-checklist",
    title: "Newborn Essentials Checklist for Indian Homes",
    category: "Newborn Essentials",
    excerpt:
      "From muslin swaddles to bath basics, here is the practical list of what a newborn actually needs in the first three months.",
    date: "2026-07-18",
    readMinutes: 6,
  },
  {
    slug: "return-gift-ideas-under-200",
    title: "25 Return Gift Ideas Under ₹200 That Kids Love",
    category: "Return Gift Ideas",
    excerpt:
      "Budget-friendly return gifts for birthdays and naming ceremonies that are useful, safe and genuinely fun.",
    date: "2026-07-06",
    readMinutes: 5,
  },
  {
    slug: "choosing-educational-toys-by-age",
    title: "How to Choose Educational Toys by Age Group",
    category: "Educational Toys",
    excerpt:
      "A milestone-wise guide to picking toys that build motor skills, language and problem solving without overwhelming your child.",
    date: "2026-06-24",
    readMinutes: 7,
  },
];

export const faqs = [
  {
    q: "Do you deliver across India?",
    a: "Yes. We ship pan India from Coimbatore. Metro cities usually receive orders in 2-4 working days and other pincodes in 4-7 working days.",
  },
  {
    q: "Do you offer wholesale pricing for return gifts?",
    a: "We do. Orders of 50 units and above qualify for wholesale rates. Send your requirement on WhatsApp and we will share a quote the same day.",
  },
  {
    q: "Are the products safe for newborns?",
    a: "Every product listed under Baby Products and Organic Baby Care is chemical-safety checked and free from parabens, phthalates and BPA.",
  },
  {
    q: "What is your return policy?",
    a: "Unused products in original packaging can be returned within 7 days of delivery. Personalised return gifts are non-returnable unless damaged.",
  },
  {
    q: "Can I customise return gifts with my child's name?",
    a: "Yes, personalised printing is available on selected gift boxes with a minimum order of 20 units and a 4-6 day turnaround.",
  },
  {
    q: "Which payment methods do you accept?",
    a: "UPI, credit and debit cards, net banking and Cash on Delivery for serviceable pincodes.",
  },
];

export const store = {
  name: "Mazhalai Ulagam",
  tagline: "The world of happiness for little ones",
  phone: "97867 97970",
  phoneHref: "tel:+919786797970",
  whatsapp: "https://wa.me/919786797970",
  email: "info@mazhalaiulagam.com",
  address: "Coimbatore, Tamil Nadu, India",
  hours: "Mon – Sat: 9.30 AM – 8.00 PM",
  instagram: "https://instagram.com",
  facebook: "https://facebook.com",
};
