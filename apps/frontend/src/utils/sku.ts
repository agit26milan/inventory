export const getSkuName = (sku:string) => {
    return sku.split('-').slice(1, sku.length).join('-')
}