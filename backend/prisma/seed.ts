import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const SIZES = ['7', '8', '9', '10', '11'];

type SubCategory = 'running' | 'casual' | 'formal';

// [name, subCategory, priceInRupees, stockPerSize]
const shoeDesigns: [string, SubCategory, number, number][] = [
  // running
  ['Trail Runner X', 'running', 3499, 12],
  ['Sprint Air Pro', 'running', 4199, 8],
  ['Marathon Flex', 'running', 3899, 10],
  ['CloudStep Runner', 'running', 3299, 14],
  ['Velocity Mesh', 'running', 3699, 9],
  ['EnduroFit Trainer', 'running', 4499, 7],
  ['TrackStar Lite', 'running', 2999, 15],
  // casual
  ['Street Canvas Low', 'casual', 1799, 15],
  ['Urban Knit Sneaker', 'casual', 2499, 10],
  ['Weekend Suede Sneaker', 'casual', 2899, 9],
  ['Retro Court Classic', 'casual', 2199, 12],
  ['Canvas High-Top', 'casual', 1999, 13],
  ['Slip-On Loafer Sneaker', 'casual', 2699, 8],
  ['Denim Low-Top', 'casual', 1899, 11],
  // formal
  ['Oxford Classic', 'formal', 4499, 6],
  ['Derby Leather', 'formal', 4299, 7],
  ['Monk Strap Elite', 'formal', 5499, 5],
  ['Brogue Wingtip', 'formal', 4799, 6],
  ['Chelsea Boot Formal', 'formal', 5199, 6],
  ['Cap-Toe Classic', 'formal', 3999, 8],
];

const shoeDescriptionTemplates: Record<SubCategory, (name: string) => string> = {
  running: (name) => `${name} — lightweight running shoe with breathable mesh upper and cushioned sole, built for training and daily runs.`,
  casual: (name) => `${name} — comfortable everyday sneaker designed for casual wear.`,
  formal: (name) => `${name} — leather formal shoe with a polished finish, built for office and occasions.`,
};

// [name, subCategory, priceInRupees, stock, description]
const accessories: [string, SubCategory, number, number, string][] = [
  // running (12)
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
  // casual (12)
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
  // formal (11)
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
];

async function main() {
  console.log('Seeding shoe products...');
  const shoeIdsBySub: Record<SubCategory, string[]> = { running: [], casual: [], formal: [] };
  const accIdsBySub: Record<SubCategory, string[]> = { running: [], casual: [], formal: [] };

  for (const [name, subCategory, priceRupees, stockPerSize] of shoeDesigns) {
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
        },
      });
      shoeIdsBySub[subCategory].push(product.id);
    }
  }

  console.log('Seeding accessories...');
  for (const [name, subCategory, priceRupees, stock, description] of accessories) {
    const product = await prisma.product.create({
      data: { name, category: 'accessories', subCategory, description, price: priceRupees * 100, stock, size: null },
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