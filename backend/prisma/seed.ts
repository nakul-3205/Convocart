import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const SIZES = ['7', '8', '9', '10', '11'];
type SubCategory = 'running' | 'casual' | 'formal';

const CATEGORY_COLORS: Record<SubCategory, string> = {
  running: 'E3F2FD/1565C0',
  casual: 'FFF3E0/EF6C00',
  formal: 'ECEFF1/424242',
};

function placeholderImage(name: string, subCategory: SubCategory): string {
  const [bg, fg] = CATEGORY_COLORS[subCategory].split('/');
  return `https://placehold.co/600x600/${bg}/${fg}?text=${encodeURIComponent(name)}`;
}

function cloudinarySquare(url: string): string {
  return url.replace('/upload/', '/upload/c_fill,ar_1:1,g_auto/');
}

const RAW_REAL_IMAGES: Record<string, string> = {
  'Trail Runner X': 'https://res.cloudinary.com/dins3utus/image/upload/v1787723904/Lightweight_Running_Shoe_-_Blue_Grey_202608261124_aorqck.jpg',
  'Sprint Air Pro': 'https://res.cloudinary.com/dins3utus/image/upload/v1787723905/Performance_Running_Shoe_-_Orange_202608261122_ectcbk.jpg',
  'Marathon Flex': 'https://res.cloudinary.com/dins3utus/image/upload/v1787723902/Cushioned_Long-Distance_Runner_202608261126_dz1nnp.jpg',
  'CloudStep Runner': 'https://res.cloudinary.com/dins3utus/image/upload/v1787723902/Minimalist_Everyday_Running_Shoe_202608261127_itplbn.jpg',
  'Velocity Mesh': 'https://res.cloudinary.com/dins3utus/image/upload/v1787723904/Velocity_Mesh_202608261124_wmcly0.jpg',
  'EnduroFit Trainer': 'https://res.cloudinary.com/dins3utus/image/upload/v1787723903/EnduroFit_Trainer_202608261126_pnvpt5.jpg',
  'TrackStar Lite': 'https://res.cloudinary.com/dins3utus/image/upload/v1787723903/TrackStar_Lite_202608261127_wwyqyo.jpg',
  'Nimbus Stride': 'https://res.cloudinary.com/dins3utus/image/upload/v1787723904/Nimbus_Stride_202608261124_jb0y5h.jpg',

  'Street Canvas Low': 'https://res.cloudinary.com/dins3utus/image/upload/v1787723903/Classic_Low-Top_Canvas_Sneaker_202608261124_cyb0sx.jpg',
  'Urban Knit Sneaker': 'https://res.cloudinary.com/dins3utus/image/upload/v1787723902/Modern_Sock-Fit_Knit_Sneaker_202608261127_ngsqnu.jpg',
  'Weekend Suede Sneaker': 'https://res.cloudinary.com/dins3utus/image/upload/v1787723903/Casual_Suede_Sneaker_202608261125_jlci6e.jpg',
  'Retro Court Classic': 'https://res.cloudinary.com/dins3utus/image/upload/v1787723904/Retro_Court_Classic_202608261124_i2pci7.jpg',
  'Canvas High-Top': 'https://res.cloudinary.com/dins3utus/image/upload/v1787723902/Canvas_High-Top_202608261125_gnmclz.jpg',
  'Slip-On Loafer Sneaker': 'https://res.cloudinary.com/dins3utus/image/upload/v1787723903/Slip-On_Loafer_Sneaker_202608261126_gkg5z2.jpg',
  'Denim Low-Top': 'https://res.cloudinary.com/dins3utus/image/upload/v1787723903/Denim_Low-Top_202608261127_oiuc4c.jpg',
  'Boardwalk Slip-On': 'https://res.cloudinary.com/dins3utus/image/upload/v1787723905/Boardwalk_Slip-On_202608261122_knxwq2.jpg',

  'Oxford Classic': 'https://res.cloudinary.com/dins3utus/image/upload/v1787723904/Polished_Black_Leather_Oxford_202608261122_lhrlpg.jpg',
  'Derby Leather': 'https://res.cloudinary.com/dins3utus/image/upload/v1787723904/Brown_Leather_Derby_Shoe_202608261124_noicrt.jpg',
  'Monk Strap Elite': 'https://res.cloudinary.com/dins3utus/image/upload/v1787723903/Monk_Strap_Elite_202608261126_ehs4gh.jpg',
  'Brogue Wingtip': 'https://res.cloudinary.com/dins3utus/image/upload/v1787723902/Brogue_Wingtip_202608261126_a1loiy.jpg',
  'Chelsea Boot Formal': 'https://res.cloudinary.com/dins3utus/image/upload/v1787723903/Dark_Brown_Chelsea_Boot_202608261126_hmjwr4.jpg',
  'Cap-Toe Classic': 'https://res.cloudinary.com/dins3utus/image/upload/v1787723902/Cap-Toe_Classic_202608261127_j7noic.jpg',
  'Wingtip Brogue Deluxe': 'https://res.cloudinary.com/dins3utus/image/upload/v1787723904/Wingtip_Brogue_Deluxe_202608261124_zyg9vw.jpg',
  'Penny Loafer Classic': 'https://res.cloudinary.com/dins3utus/image/upload/v1787723904/Penny_Loafer_Classic_202608261124_igxkqk.jpg',
  'Chukka Boot Formal': 'https://res.cloudinary.com/dins3utus/image/upload/v1787723905/Chukka_Boot_Formal_202608261122_awofdc.jpg',

  'Moisture-Wicking Running Socks (Pair)': 'https://res.cloudinary.com/dins3utus/image/upload/v1787723905/Athletic_Running_Socks_202608261122_t0hybw.jpg',
  'Sneaker Cleaning Kit': 'https://res.cloudinary.com/dins3utus/image/upload/v1787723902/Sneaker_Cleaning_Kit_202608261126_euiuxg.jpg',
  'Shoe Polish Kit': 'https://res.cloudinary.com/dins3utus/image/upload/v1787723902/Shoe_Polish_Kit_202608261127_febe7i.jpg',
};

const REAL_IMAGES: Record<string, string> = Object.fromEntries(
  Object.entries(RAW_REAL_IMAGES).map(([name, url]) => [name, cloudinarySquare(url)]),
);

function getImage(name: string, subCategory: SubCategory): string {
  return REAL_IMAGES[name] ?? placeholderImage(name, subCategory);
}

const shoeDesigns: [string, SubCategory, number, number][] = [
  ['Trail Runner X', 'running', 3499, 12],
  ['Sprint Air Pro', 'running', 4199, 8],
  ['Marathon Flex', 'running', 3899, 10],
  ['CloudStep Runner', 'running', 3299, 14],
  ['Velocity Mesh', 'running', 3699, 9],
  ['EnduroFit Trainer', 'running', 4499, 7],
  ['TrackStar Lite', 'running', 2999, 15],
  ['Nimbus Stride', 'running', 3599, 10],
  ['PowerFoam Racer', 'running', 4299, 8],
  ['AeroTrack Runner', 'running', 3199, 12],
  ['Street Canvas Low', 'casual', 1799, 15],
  ['Urban Knit Sneaker', 'casual', 2499, 10],
  ['Weekend Suede Sneaker', 'casual', 2899, 9],
  ['Retro Court Classic', 'casual', 2199, 12],
  ['Canvas High-Top', 'casual', 1999, 13],
  ['Slip-On Loafer Sneaker', 'casual', 2699, 8],
  ['Denim Low-Top', 'casual', 1899, 11],
  ['Boardwalk Slip-On', 'casual', 2099, 12],
  ['Classic Deck Shoe', 'casual', 2399, 10],
  ['Retro High-Top Canvas', 'casual', 2299, 11],
  ['Oxford Classic', 'formal', 4499, 6],
  ['Derby Leather', 'formal', 4299, 7],
  ['Monk Strap Elite', 'formal', 5499, 5],
  ['Brogue Wingtip', 'formal', 4799, 6],
  ['Chelsea Boot Formal', 'formal', 5199, 6],
  ['Cap-Toe Classic', 'formal', 3999, 8],
  ['Wingtip Brogue Deluxe', 'formal', 4899, 6],
  ['Penny Loafer Classic', 'formal', 4599, 7],
  ['Chukka Boot Formal', 'formal', 4699, 6],
  ['Split-Toe Derby', 'formal', 4399, 7],
];

const shoeDescriptionTemplates: Record<SubCategory, (name: string) => string> = {
  running: (name) => `${name} — lightweight running shoe with breathable mesh upper and cushioned sole, built for training and daily runs.`,
  casual: (name) => `${name} — comfortable everyday sneaker designed for casual wear.`,
  formal: (name) => `${name} — leather formal shoe with a polished finish, built for office and occasions.`,
};

const accessories: [string, SubCategory, number, number, string][] = [
  ['Moisture-Wicking Running Socks (Pair)', 'running', 399, 50, 'Breathable, cushioned socks designed for long runs.'],
  ['Performance Insoles', 'running', 599, 40, 'Extra cushioning insoles that fit under any running shoe.'],
  ['Compression Ankle Sleeves', 'running', 449, 35, 'Supportive sleeves that reduce fatigue on long runs.'],
  ['Reflective Shoe Clips', 'running', 199, 60, 'Clip-on reflectors for visibility during evening runs.'],
  ['Elastic No-Tie Laces', 'running', 299, 45, 'Stretch laces for a snug, tie-free fit.'],
  ['Anti-Blister Heel Pads', 'running', 249, 55, 'Cushioned pads that prevent heel rubbing on long runs.'],
  ['Running Shoe Deodorizer', 'running', 349, 30, 'Odor-neutralizing spray for post-run shoe care.'],
  ['Trail Gaiters', 'running', 649, 20, 'Ankle gaiters that keep debris out on trail runs.'],
  ['Arch Support Insoles', 'running', 549, 32, 'Insoles with extra arch support for high-mileage runners.'],
  ['Quick-Dry Sport Socks (3-Pack)', 'running', 699, 38, 'Set of three moisture-wicking socks for training.'],
  ['Toe Guard Protectors', 'running', 279, 25, 'Protective guards that reduce toe-box wear.'],
  ['Running Shoe Bag', 'running', 399, 28, 'Ventilated bag for carrying shoes to the gym or a race.'],
  ['Blister-Prevention Tape', 'running', 199, 40, 'Athletic tape that prevents blisters on long runs.'],
  ['Hydration Running Belt', 'running', 799, 20, 'Adjustable belt for carrying water on long runs.'],
  ['Reflective Running Vest', 'running', 899, 15, 'High-visibility vest for early morning or night runs.'],
  ['Everyday Ankle Socks (Pair)', 'casual', 249, 60, 'Soft cotton-blend ankle socks for daily wear.'],
  ['Sneaker Cleaning Kit', 'casual', 899, 25, 'Brush and solution kit to keep sneakers looking new.'],
  ['Suede Protector Spray', 'casual', 549, 22, 'Water- and stain-repellent spray for suede sneakers.'],
  ['Flat Shoe Laces (Pack)', 'casual', 199, 40, 'Replacement laces in assorted colors.'],
  ['Insole Cushion Pads', 'casual', 349, 30, 'Extra comfort padding for everyday sneakers.'],
  ['Sneaker Crease Protectors', 'casual', 449, 20, 'Toe-box inserts that prevent creasing.'],
  ['No-Show Socks (3-Pack)', 'casual', 399, 45, 'Low-cut socks that stay hidden under sneakers.'],
  ['Shoe Freshener Balls', 'casual', 299, 35, 'Odor-absorbing inserts for daily-wear sneakers.'],
  ['Sneaker Storage Box', 'casual', 799, 18, 'Stackable clear box for sneaker storage.'],
  ['Waterproof Spray', 'casual', 599, 24, 'Protective spray for canvas and knit sneakers.'],
  ['Colored Shoe Laces', 'casual', 179, 42, 'Assorted-color replacement laces.'],
  ['Cotton Crew Socks', 'casual', 279, 38, 'Everyday crew-length cotton socks.'],
  ['Sneaker Insert Cushions', 'casual', 299, 35, 'Soft cushion inserts for all-day sneaker comfort.'],
  ['Canvas Sneaker Wash Kit', 'casual', 649, 20, 'Gentle wash kit designed for canvas sneakers.'],
  ['Fabric Sneaker Protector Spray', 'casual', 499, 25, 'Stain-repellent spray for fabric sneakers.'],
  ['Shoe Polish Kit', 'formal', 699, 30, 'Polish, brush, and cloth set for leather formal shoes.'],
  ['Shoe Horn (Wooden)', 'formal', 349, 35, 'Long-handled wooden shoe horn for easy wear.'],
  ['Cedar Shoe Trees', 'formal', 899, 20, 'Cedar inserts that preserve shoe shape and absorb moisture.'],
  ['Leather Conditioner', 'formal', 549, 25, 'Conditioning cream that keeps leather supple.'],
  ['Dress Socks (3-Pack)', 'formal', 599, 32, 'Formal-length dress socks in classic colors.'],
  ['Shoe Polish Brush Set', 'formal', 449, 22, 'Horsehair brushes for buffing leather shoes.'],
  ['Leather Shoe Bag', 'formal', 649, 18, 'Dust bag for storing or traveling with formal shoes.'],
  ['Shoe Stretcher', 'formal', 799, 15, 'Adjustable stretcher for a more comfortable leather-shoe fit.'],
  ['Waterproof Leather Spray', 'formal', 599, 20, 'Protective spray that guards leather against moisture.'],
  ['Anti-Slip Heel Grips', 'formal', 249, 28, 'Grip pads that prevent heel slipping in leather shoes.'],
  ['Formal Shoe Insoles', 'formal', 449, 26, 'Slim cushioned insoles designed for dress shoes.'],
  ['Leather Shoe Polish (Black)', 'formal', 399, 30, 'Classic black polish for leather dress shoes.'],
  ['Leather Shoe Polish (Brown)', 'formal', 399, 28, 'Classic brown polish for leather dress shoes.'],
  ['Formal Shoe Bag (Pair)', 'formal', 549, 18, 'Individual dust bags for a pair of formal shoes.'],
  ['Metal Shoe Horn (Travel Size)', 'formal', 299, 22, 'Compact travel-size metal shoe horn.'],
];

async function main() {
  console.log('Seeding shoe products...');
  const shoeIdsBySub: Record<SubCategory, string[]> = { running: [], casual: [], formal: [] };
  const accIdsBySub: Record<SubCategory, string[]> = { running: [], casual: [], formal: [] };

  for (const [name, subCategory, priceRupees, stockPerSize] of shoeDesigns) {
    const imageUrl = getImage(name, subCategory);
    for (const size of SIZES) {
      const product = await prisma.product.create({
        data: {
          name: `${name} (Size ${size})`,
          category: 'shoes',
          subCategory,
          description: shoeDescriptionTemplates[subCategory](name),
          price: priceRupees * 100,
          stock: stockPerSize,
          size,
          imageUrl,
        },
      });
      shoeIdsBySub[subCategory].push(product.id);
    }
  }

  console.log('Seeding accessories...');
  for (const [name, subCategory, priceRupees, stock, description] of accessories) {
    const product = await prisma.product.create({
      data: {
        name, category: 'accessories', subCategory, description,
        price: priceRupees * 100, stock, size: null,
        imageUrl: getImage(name, subCategory),
      },
    });
    accIdsBySub[subCategory].push(product.id);
  }

  console.log('Wiring cross-sell mapping...');
  for (const sub of ['running', 'casual', 'formal'] as const) {
    for (const shoeId of shoeIdsBySub[sub]) {
      for (const accId of accIdsBySub[sub]) {
        await prisma.productCrossSell.create({ data: { productId: shoeId, crossSellProductId: accId } });
      }
    }
  }

  const totalShoes = shoeDesigns.length * SIZES.length;
  console.log(`Seeded ${totalShoes} shoe products + ${accessories.length} accessories = ${totalShoes + accessories.length} total.`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });