import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Starting migration to fix duplicate process fees...');
    
    // Total processed stats
    let fixedSalesCount = 0;
    
    // Ambil SEMUA data penjualan untuk dievaluasi
    const sales = await prisma.sale.findMany({
        include: {
            saleItems: {
               include: {
                   product: {
                       include: {
                           marketplaceFees: true
                       }
                   }
               }
            }
        }
    });
    
    console.log(`Found ${sales.length} total sales to evaluate.`);

    for (const sale of sales) {
        // Evaluate if this sale has items with Shopee fees
        // The problem is duplicate process fee. If there is only ONE item with qty 1, the calculation was correct.
        // It's mostly an issue when there are MULTIPLE qty or MULTIPLE items that BOTH have Shopee fees.
        const shopeeItems = sale.saleItems.filter(item => 
            item.product.marketplaceFees.some(f => f.marketplace === 'SHOPEE')
        );

        if (shopeeItems.length <= 1 && (shopeeItems[0]?.quantity === 1)) {
            // No duplicate processFee issue for single-item, single-qty sales
            continue; 
        }

        // Kalau ada, kita hitung ulang nilai aslinya.
        // Sebelumnya: netRevenue (per baris item) = (revenue - feeAmount) - processFeeAmount
        // Jadi, Net Revenue per qty = ((Original Gross / Qty) * (1 - percentage/100)) - (processFee)
        // Hal ini sangat rumit untuk di-reverse secata matematis jika qty > 1 karena processFee tadinya 
        // dikurangkan dari TOTAL REVENUE BARIS ITU, bukan per item.
        // Mari kita perbaiki algoritmanya dari database:
        
        let newTotalAmount = 0;
        let newTotalCogs = Number(sale.totalCogs);
        let isProcessFeeApplied = false;
        let saleNeedRestructure = false;

        const updateOperations: any[] = [];

        for (const item of sale.saleItems) {
            const shopeeFee = item.product.marketplaceFees.find(f => f.marketplace === 'SHOPEE');
            
            if (!shopeeFee) {
                 newTotalAmount += (Number(item.sellingPrice) * item.quantity);
                 continue;
            }

            const currentNetSales = Number(item.sellingPrice) * item.quantity;
            const percentage = Number(shopeeFee.percentage);
            const processFee = Number(shopeeFee.processFee);
            
            // Rumus lama di `sales.service.ts`:
            // const feeAmount = (revenue * Number(shopeeFee.percentage)) / 100;
            // netRevenue = revenue - feeAmount - processFeeAmount;
            
            // Reversing the formula to find `revenue` (Gross Revenue):
            // netRevenue + processFeeAmount = revenue * (1 - (percentage / 100))
            // revenue = (netRevenue + processFeeAmount) / (1 - (percentage / 100))
            const originalGrossRevenue = (currentNetSales + processFee) / (1 - (percentage / 100));
            
            // Now apply the CORRECT logic:
            // Calculate Net Revenue for this item:
            const feeAmount = originalGrossRevenue * (percentage / 100);
            let correctNetRevenue = originalGrossRevenue - feeAmount;

            // Apply process fee only ONCE per SALE
            if (!isProcessFeeApplied && processFee > 0) {
                 correctNetRevenue -= processFee;
                 isProcessFeeApplied = true;
            }
            
            newTotalAmount += correctNetRevenue;
            
            // Check if there is a difference indicating a fix is needed
            // Javascript floating point precision fix
            const diff = Math.abs(currentNetSales - correctNetRevenue);
            if (diff > 0.01) { 
                saleNeedRestructure = true;
                
                // Update SaleItem's new average selling price
                const newSellingPrice = correctNetRevenue / item.quantity;
                
                updateOperations.push(prisma.saleItem.update({
                    where: { id: item.id },
                    data: {
                        sellingPrice: newSellingPrice
                    }
                }));
            }
        }

        if (saleNeedRestructure) {
            const newProfit = newTotalAmount - newTotalCogs;

            updateOperations.push(prisma.sale.update({
                where: { id: sale.id },
                data: {
                    totalAmount: newTotalAmount,
                    profit: newProfit
                }
            }));
            
            const equityRecord = await prisma.equity.findFirst({
                 where: { description: `Revenue from Sale #${sale.id}` }
            });
            
            if (equityRecord) {
                 // Adjust Equity relative to the difference.
                 // Equity tracks absolute balance entries, so we just update the specific entry amount.
                 updateOperations.push(prisma.equity.update({
                     where: { id: equityRecord.id },
                     data: { amount: newTotalAmount }
                 }));
            }

            try {
                // Execute all updates for this specific Sale in a transaction
                await prisma.$transaction(updateOperations);
                fixedSalesCount++;
                console.log(`[FIXED] Sale ID: ${sale.id} | Old Total: ${Number(sale.totalAmount).toFixed(2)} | New Total: ${newTotalAmount.toFixed(2)}`);
            } catch (err) {
                console.error(`[ERROR] Migrating Sale ID: ${sale.id}`, err);
            }
        }
    }
    
    console.log('--- Migration Finished ---');
    console.log(`Successfully fixed ${fixedSalesCount} sales affected by duplicate process fees.`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
