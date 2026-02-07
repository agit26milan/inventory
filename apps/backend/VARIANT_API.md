# Variant System API Documentation

Dokumentasi lengkap untuk Variant System API endpoints.

## Table of Contents
- [Variant Management](#variant-management)
- [Variant Value Management](#variant-value-management)
- [Variant Combination Management](#variant-combination-management)
- [Product with Variants](#product-with-variants)

---

## Variant Management

### Create Variant

Create a new variant type for a product (e.g., Color, Size).

**Endpoint:** `POST /api/variants`

**Request Body:**
```json
{
  "productId": 1,
  "name": "Color"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "productId": 1,
    "name": "Color",
    "createdAt": "2026-02-07T15:00:00.000Z",
    "updatedAt": "2026-02-07T15:00:00.000Z",
    "values": []
  },
  "message": "Variant created successfully"
}
```

### Get Variants by Product

Get all variants for a specific product.

**Endpoint:** `GET /api/variants/product/:productId`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "productId": 1,
      "name": "Color",
      "createdAt": "2026-02-07T15:00:00.000Z",
      "updatedAt": "2026-02-07T15:00:00.000Z",
      "values": [
        {
          "id": 1,
          "variantId": 1,
          "productId": 1,
          "name": "Red",
          "createdAt": "2026-02-07T15:01:00.000Z",
          "updatedAt": "2026-02-07T15:01:00.000Z"
        }
      ]
    }
  ],
  "message": "Variants retrieved successfully"
}
```

### Get Variant by ID

**Endpoint:** `GET /api/variants/:id`

### Update Variant

**Endpoint:** `PUT /api/variants/:id`

**Request Body:**
```json
{
  "name": "Warna"
}
```

### Delete Variant

**Endpoint:** `DELETE /api/variants/:id`

**Note:** Cannot delete variant if its values are used in variant combinations.

---

## Variant Value Management

### Add Variant Value

Add a value to a variant (e.g., "Red" to Color variant).

**Endpoint:** `POST /api/variants/:variantId/values`

**Request Body:**
```json
{
  "name": "Red"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "variantId": 1,
    "productId": 1,
    "name": "Red",
    "createdAt": "2026-02-07T15:01:00.000Z",
    "updatedAt": "2026-02-07T15:01:00.000Z"
  },
  "message": "Variant value created successfully"
}
```

### Update Variant Value

**Endpoint:** `PUT /api/variants/values/:id`

**Request Body:**
```json
{
  "name": "Merah"
}
```

### Delete Variant Value

**Endpoint:** `DELETE /api/variants/values/:id`

**Note:** Cannot delete value if used in variant combinations.

---

## Variant Combination Management

### Create Variant Combination

Create a combination of variant values with unique SKU, price, and stock.

**Endpoint:** `POST /api/variant-combinations`

**Request Body:**
```json
{
  "productId": 1,
  "sku": "TSHIRT-RED-M",
  "price": 150000,
  "stock": 25,
  "variantValueIds": [1, 4]
}
```

**Validation Rules:**
- SKU must be unique
- All variant values must belong to the specified product
- Cannot use multiple values from the same variant
- Must include at least one variant value

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "productId": 1,
    "sku": "TSHIRT-RED-M",
    "price": 150000,
    "stock": 25,
    "createdAt": "2026-02-07T15:05:00.000Z",
    "updatedAt": "2026-02-07T15:05:00.000Z",
    "values": [
      {
        "id": 1,
        "name": "Red",
        "variantId": 1,
        "variantName": "Color"
      },
      {
        "id": 4,
        "name": "M",
        "variantId": 2,
        "variantName": "Size"
      }
    ]
  },
  "message": "Variant combination created successfully"
}
```

### Get Variant Combinations by Product

**Endpoint:** `GET /api/variant-combinations/product/:productId`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "productId": 1,
      "sku": "TSHIRT-RED-M",
      "price": 150000,
      "stock": 25,
      "createdAt": "2026-02-07T15:05:00.000Z",
      "updatedAt": "2026-02-07T15:05:00.000Z",
      "values": [
        {
          "id": 1,
          "name": "Red",
          "variantId": 1,
          "variantName": "Color"
        },
        {
          "id": 4,
          "name": "M",
          "variantId": 2,
          "variantName": "Size"
        }
      ]
    }
  ],
  "message": "Variant combinations retrieved successfully"
}
```

### Get Variant Combination by ID

**Endpoint:** `GET /api/variant-combinations/:id`

### Update Variant Combination

Update SKU, price, stock, or variant values.

**Endpoint:** `PUT /api/variant-combinations/:id`

**Request Body (all fields optional):**
```json
{
  "sku": "TSHIRT-RED-M-V2",
  "price": 160000,
  "stock": 30,
  "variantValueIds": [1, 5]
}
```

### Delete Variant Combination

**Endpoint:** `DELETE /api/variant-combinations/:id`

---

## Product with Variants

### Get Product with All Variants

Get complete product data including all variants, variant values, and variant combinations.

**Endpoint:** `GET /api/products/:id/with-variants`

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "T-Shirt Premium",
    "sku": "TSHIRT-001",
    "stockMethod": "FIFO",
    "sellingPrice": 150000,
    "currentStock": 0,
    "createdAt": "2026-02-07T15:00:00.000Z",
    "updatedAt": "2026-02-07T15:00:00.000Z",
    "variants": [
      {
        "id": 1,
        "name": "Color",
        "values": [
          { "id": 1, "name": "Red" },
          { "id": 2, "name": "Blue" },
          { "id": 3, "name": "Black" }
        ]
      },
      {
        "id": 2,
        "name": "Size",
        "values": [
          { "id": 4, "name": "S" },
          { "id": 5, "name": "M" },
          { "id": 6, "name": "L" }
        ]
      }
    ],
    "variantCombinations": [
      {
        "id": 1,
        "sku": "TSHIRT-RED-M",
        "price": 150000,
        "stock": 25,
        "values": [
          { "id": 1, "name": "Red", "variantId": 1, "variantName": "Color" },
          { "id": 5, "name": "M", "variantId": 2, "variantName": "Size" }
        ]
      }
    ]
  },
  "message": "Product with variants retrieved successfully"
}
```

---

## Error Responses

### 400 Bad Request

```json
{
  "success": false,
  "message": "Variant with this name already exists for this product"
}
```

### 404 Not Found

```json
{
  "success": false,
  "message": "Product not found"
}
```

### Validation Error

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "name",
      "message": "Variant name is required"
    }
  ]
}
```

---

## Common Use Cases

### 1. Setting up Product Variants

```bash
# 1. Create product
POST /api/products
{ "name": "T-Shirt", "sku": "TS001", "stockMethod": "FIFO", "sellingPrice": 100000 }

# 2. Create variants
POST /api/variants
{ "productId": 1, "name": "Color" }

POST /api/variants
{ "productId": 1, "name": "Size" }

# 3. Add variant values
POST /api/variants/1/values
{ "name": "Red" }

POST /api/variants/1/values
{ "name": "Blue" }

POST /api/variants/2/values
{ "name": "S" }

POST /api/variants/2/values
{ "name": "M" }
```

### 2. Creating Variant Combinations

```bash
# Create all combinations
POST /api/variant-combinations
{ "productId": 1, "sku": "TS001-RED-S", "price": 100000, "stock": 10, "variantValueIds": [1, 3] }

POST /api/variant-combinations
{ "productId": 1, "sku": "TS001-RED-M", "price": 100000, "stock": 15, "variantValueIds": [1, 4] }

POST /api/variant-combinations
{ "productId": 1, "sku": "TS001-BLUE-S", "price": 110000, "stock": 8, "variantValueIds": [2, 3] }

POST /api/variant-combinations
{ "productId": 1, "sku": "TS001-BLUE-M", "price": 110000, "stock": 12, "variantValueIds": [2, 4] }
```

### 3. Updating Stock for Specific Combination

```bash
PUT /api/variant-combinations/1
{ "stock": 20 }
```

### 4. Getting Complete Product Info

```bash
GET /api/products/1/with-variants
```
