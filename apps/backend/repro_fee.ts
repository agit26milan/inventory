
import { PrismaClient } from '@prisma/client';
import { MarketplaceFeeService } from './src/modules/marketplace-fee/marketplace-fee.service';

const prisma = new PrismaClient();
const service = new MarketplaceFeeService();

async function main() {
  try {
    // 1. Get a product
    const product = await prisma.product.findFirst();
    if (!product) {
      console.log("No products found. Cannot test.");
      return;
    }
    console.log(`Found product: ${product.id} - ${product.name}`);

    // 2. Try to set fee
    console.log("Setting fee for Shopee...");
    const fee = await service.setFee({
      productId: product.id,
      marketplace: 'SHOPEE',
      percentage: 5.5
    });
    console.log("Fee set successfully:", fee);

    // 3. Try to update fee
    console.log("Updating fee for Shopee...");
    const updatedFee = await service.setFee({
      productId: product.id,
      marketplace: 'SHOPEE',
      percentage: 6.0
    });
    console.log("Fee updated successfully:", updatedFee);

  } catch (error) {
    console.error("Error occurred:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
