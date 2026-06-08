export const getSkuName = (sku: string): string => {
    return sku.split('-').slice(1).join('-')
}