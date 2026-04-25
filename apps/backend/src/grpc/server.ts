import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import path from 'path';
import { productHandler } from './handlers/product.handler';
import { inventoryHandler } from './handlers/inventory.handler';
import { salesHandler } from './handlers/sales.handler';
import { reportHandler } from './handlers/report.handler';
import { equityHandler } from './handlers/equity.handler';
import { storeExpenseHandler } from './handlers/store_expense.handler';
import { configurationHandler } from './handlers/configuration.handler';
import { variantHandler } from './handlers/variant.handler';
import { voucherHandler } from './handlers/voucher.handler';
import { marketplaceFeeHandler } from './handlers/marketplace_fee.handler';

const PROTO_PATH = path.join(__dirname, './protos/product.v1.proto');

function loadProto(protoFile: string) {
    return protoLoader.loadSync(path.join(__dirname, `./protos/${protoFile}`), {
        keepCase: true,
        longs: String,
        enums: String,
        defaults: true,
        oneofs: true,
    });
}

const packageDefinition = loadProto('product.v1.proto');
const inventoryPackageDef = loadProto('inventory.v1.proto');
const salesPackageDef = loadProto('sales.v1.proto');
const reportPackageDef = loadProto('report.v1.proto');
const equityPackageDef = loadProto('equity.v1.proto');
const storeExpensePackageDef = loadProto('store_expense.v1.proto');
const configurationPackageDef = loadProto('configuration.v1.proto');
const variantPackageDef = loadProto('variant.v1.proto');
const voucherPackageDef = loadProto('voucher.v1.proto');
const marketplaceFeePackageDef = loadProto('marketplace_fee.v1.proto');

const protoDescriptor = grpc.loadPackageDefinition(packageDefinition) as any;
const productProto = protoDescriptor.product?.v1;
const inventoryProto = (grpc.loadPackageDefinition(inventoryPackageDef) as any).inventory?.v1;
const salesProto = (grpc.loadPackageDefinition(salesPackageDef) as any).sales?.v1;
const reportProto = (grpc.loadPackageDefinition(reportPackageDef) as any).report?.v1;
const equityProto = (grpc.loadPackageDefinition(equityPackageDef) as any).equity?.v1;
const storeExpenseProto = (grpc.loadPackageDefinition(storeExpensePackageDef) as any).store_expense?.v1;
const configurationProto = (grpc.loadPackageDefinition(configurationPackageDef) as any).configuration?.v1;
const variantProto = (grpc.loadPackageDefinition(variantPackageDef) as any).variant?.v1;
const voucherProto = (grpc.loadPackageDefinition(voucherPackageDef) as any).voucher?.v1;
const marketplaceFeeProto = (grpc.loadPackageDefinition(marketplaceFeePackageDef) as any).marketplace_fee?.v1;

if (!productProto?.ProductService) {
    throw new Error('Failed to load ProductService from proto file. Check proto path and syntax.');
}

// ─── Auth interceptor via metadata ───────────────────────────────────────────

function validateAuth(call: grpc.ServerUnaryCall<any, any>, callback: grpc.sendUnaryData<any>): boolean {
    const token = call.metadata.get('authorization')[0];
    if (!token) {
        callback({ code: grpc.status.UNAUTHENTICATED, message: 'Missing authorization token' }, null);
        return false;
    }
    // TODO: Ganti dengan JWT verify sesungguhnya, contoh: jwt.verify(token, process.env.JWT_SECRET)
    return true;
}

/** Wrap semua handler dengan auth check + global error catch */
function withAuth(handler: Function) {
    return async (call: grpc.ServerUnaryCall<any, any>, callback: grpc.sendUnaryData<any>) => {
        if (!validateAuth(call, callback)) return;
        try {
            await handler(call, callback);
        } catch (error: any) {
            callback({ code: grpc.status.INTERNAL, message: error?.message ?? 'Internal server error' }, null);
        }
    };
}

// ─── Server setup ─────────────────────────────────────────────────────────────

const server = new grpc.Server();

server.addService(productProto.ProductService.service, {
    CreateProduct: withAuth(productHandler.createProduct),
    GetProducts: withAuth(productHandler.getProducts),
    GetProductById: withAuth(productHandler.getProductById),
    GetProductWithVariants: withAuth(productHandler.getProductWithVariants),
    UpdateProduct: withAuth(productHandler.updateProduct),
    DeleteProduct: withAuth(productHandler.deleteProduct),
});

server.addService(inventoryProto.InventoryService.service, {
    CreateBatch: withAuth(inventoryHandler.createBatch),
    GetAllBatches: withAuth(inventoryHandler.getAllBatches),
    GetBatchesByProduct: withAuth(inventoryHandler.getBatchesByProduct),
    GetCurrentStock: withAuth(inventoryHandler.getCurrentStock),
    GetBatchById: withAuth(inventoryHandler.getBatchById),
    UpdateBatch: withAuth(inventoryHandler.updateBatch),
    BulkUpdateSellingPrice: withAuth(inventoryHandler.bulkUpdateSellingPrice),
    DeleteBatch: withAuth(inventoryHandler.deleteBatch),
});

server.addService(salesProto.SalesService.service, {
    CreateSale: withAuth(salesHandler.createSale),
    GetAllSales: withAuth(salesHandler.getAllSales),
    GetSaleById: withAuth(salesHandler.getSaleById),
});

server.addService(reportProto.ReportService.service, {
    GetSalesSummary: withAuth(reportHandler.getSalesSummary),
    GetProductPerformance: withAuth(reportHandler.getProductPerformance),
    GetVariantPerformance: withAuth(reportHandler.getVariantPerformance),
    GetInventoryValuation: withAuth(reportHandler.getInventoryValuation),
    GetStockAlerts: withAuth(reportHandler.getStockAlerts),
    GetSalesTimeframe: withAuth(reportHandler.getSalesTimeframe),
    GetAnnualSales: withAuth(reportHandler.getAnnualSales),
    GetMonthlyProfit: withAuth(reportHandler.getMonthlyProfit),
    GetMonthlyOwnerWithdrawal: withAuth(reportHandler.getMonthlyOwnerWithdrawal),
});

server.addService(equityProto.EquityService.service, {
    CreateEquity: withAuth(equityHandler.createEquity),
    GetAllEquities: withAuth(equityHandler.getAllEquities),
    GetTotalEquity: withAuth(equityHandler.getTotalEquity),
});

server.addService(storeExpenseProto.StoreExpenseService.service, {
    CreateExpense: withAuth(storeExpenseHandler.createExpense),
    GetAllExpenses: withAuth(storeExpenseHandler.getAllExpenses),
    GetTotalExpenses: withAuth(storeExpenseHandler.getTotalExpenses),
    UpdateExpense: withAuth(storeExpenseHandler.updateExpense),
    DeleteExpense: withAuth(storeExpenseHandler.deleteExpense),
});

server.addService(configurationProto.ConfigurationService.service, {
    GetAll: withAuth(configurationHandler.getAll),
    GetByKey: withAuth(configurationHandler.getByKey),
    Upsert: withAuth(configurationHandler.upsert),
});

server.addService(variantProto.VariantService.service, {
    CreateVariant: withAuth(variantHandler.createVariant),
    GetVariantsByProduct: withAuth(variantHandler.getVariantsByProduct),
    GetVariantById: withAuth(variantHandler.getVariantById),
    UpdateVariant: withAuth(variantHandler.updateVariant),
    DeleteVariant: withAuth(variantHandler.deleteVariant),
    CreateVariantValue: withAuth(variantHandler.createVariantValue),
    UpdateVariantValue: withAuth(variantHandler.updateVariantValue),
    DeleteVariantValue: withAuth(variantHandler.deleteVariantValue),
});

server.addService(voucherProto.VoucherService.service, {
    CreateVoucher: withAuth(voucherHandler.createVoucher),
    GetAllVouchers: withAuth(voucherHandler.getAllVouchers),
    GetVoucherById: withAuth(voucherHandler.getVoucherById),
    UpdateVoucher: withAuth(voucherHandler.updateVoucher),
    DeleteVoucher: withAuth(voucherHandler.deleteVoucher),
});

server.addService(marketplaceFeeProto.MarketplaceFeeService.service, {
    SetFee: withAuth(marketplaceFeeHandler.setFee),
    GetFeesByProduct: withAuth(marketplaceFeeHandler.getFeesByProduct),
    DeleteFee: withAuth(marketplaceFeeHandler.deleteFee),
});

export function startGrpcServer(): void {
    const bindAddress = `0.0.0.0:${process.env.GRPC_PORT ?? 50051}`;

    server.bindAsync(bindAddress, grpc.ServerCredentials.createInsecure(), (err, port) => {
        if (err) {
            console.error('❌ gRPC server failed to bind:', err.message);
            return;
        }
        console.log(`⚡ gRPC server listening on port ${port}`);
    });
}
