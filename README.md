# 📦 Inventory Management System (FIFO & LIFO)

A modern, full-stack inventory management system with support for both FIFO (First In First Out) and LIFO (Last In First Out) stock valuation methods.

## 🎯 Features

- **Product Management**: Create, update, and delete products with customizable stock methods
- **Inventory Tracking**: Record stock batches with cost prices and track remaining quantities
- **Sales Processing**: Automatic stock deduction and COGS calculation based on FIFO/LIFO
- **Real-time Reports**: Sales summary, product performance, and inventory valuation
- **Modern UI**: Clean, responsive interface with dark theme and glassmorphism effects

## 🛠️ Technology Stack

### Backend
- **Node.js** + **Express.js** - REST API server
- **TypeScript** - Type-safe development
- **Prisma** - Modern ORM for MySQL
- **Zod** - Runtime validation
- **MySQL** - Relational database

### Frontend
- **Vite** - Fast build tool
- **React 18** - UI library
- **TypeScript** - Type safety
- **TanStack Query** - Server state management
- **React Router** - Client-side routing
- **Axios** - HTTP client

## 📂 Project Structure

```
inventory-app/
├── apps/
│   ├── backend/          # Express API server
│   │   ├── src/
│   │   │   ├── modules/  # Feature modules
│   │   │   │   ├── product/
│   │   │   │   ├── inventory/
│   │   │   │   ├── sales/
│   │   │   │   └── report/
│   │   │   ├── database/ # Prisma client
│   │   │   ├── routes/   # API routes
│   │   │   └── utils/    # Utilities
│   │   └── prisma/       # Database schema
│   │
│   └── frontend/         # React application
│       └── src/
│           ├── pages/    # Page components
│           ├── components/
│           ├── services/ # API clients
│           └── hooks/    # React Query hooks
│
└── package.json          # Monorepo root
```

## 🚀 Getting Started

### Prerequisites

- **Node.js** >= 18.0.0
- **npm** >= 9.0.0
- **MySQL** >= 8.0

### Installation

1. **Clone or navigate to the project**:
   ```bash
   cd /Volumes/ssdeksternal/projects/inventory-app
   ```

2. **Install dependencies**:
   ```bash
   npm install
   npm run install:all
   ```

3. **Configure database**:
   
   Create a `.env` file in `apps/backend/`:
   ```bash
   cp apps/backend/.env.example apps/backend/.env
   ```
   
   Edit `apps/backend/.env` with your MySQL credentials:
   ```env
   DATABASE_URL="mysql://username:password@localhost:3306/inventory_db"
   PORT=3001
   NODE_ENV=development
   ```

4. **Create database**:
   ```bash
   mysql -u root -p
   CREATE DATABASE inventory_db;
   EXIT;
   ```

5. **Run database migrations**:
   ```bash
   cd apps/backend
   npx prisma migrate dev --name init
   npx prisma generate
   cd ../..
   ```

6. **Start development servers**:
   ```bash
   npm run dev
   ```
   
   This will start:
   - Backend API: http://localhost:3001
   - Frontend UI: http://localhost:5173

## 📖 Usage

### 1. Create Products

Navigate to **Products** page and create products with:
- Product name
- SKU (unique identifier)
- Stock method (FIFO or LIFO)
- Selling price

### 2. Add Inventory

Go to **Inventory** page to record stock batches:
- Select product
- Enter quantity
- Enter cost price per unit

Each batch is tracked separately with its cost price and remaining quantity.

### 3. Process Sales

On the **Sales** page:
- Add multiple items to a sale
- System automatically:
  - Deducts stock based on FIFO/LIFO method
  - Calculates COGS (Cost of Goods Sold)
  - Computes profit

### 4. View Reports

Check **Reports** page for:
- Sales summary (total sales, COGS, profit, margin)
- Product performance (revenue, profit per product)
- Inventory valuation (current stock value)

## 🔍 FIFO vs LIFO Logic

### FIFO (First In First Out)
- **Oldest stock** is sold first
- Batches are consumed in chronological order (oldest → newest)
- Common for perishable goods

**Example**:
```
Batch 1: 10 units @ $50 (Jan 1)
Batch 2: 10 units @ $60 (Jan 15)

Sale: 15 units
COGS = (10 × $50) + (5 × $60) = $800
```

### LIFO (Last In First Out)
- **Newest stock** is sold first
- Batches are consumed in reverse chronological order (newest → oldest)
- Can reduce tax liability in inflationary periods

**Example**:
```
Batch 1: 10 units @ $50 (Jan 1)
Batch 2: 10 units @ $60 (Jan 15)

Sale: 15 units
COGS = (10 × $60) + (5 × $50) = $850
```

## 🗄️ Database Schema

### Products
- `id`: Primary key
- `name`: Product name
- `sku`: Unique SKU
- `stockMethod`: FIFO or LIFO
- `sellingPrice`: Default selling price

### Inventory Batches
- `id`: Primary key
- `productId`: Foreign key to products
- `quantity`: Original quantity
- `remainingQuantity`: Current remaining quantity
- `costPrice`: Cost per unit
- `createdAt`: Batch creation date

### Sales
- `id`: Primary key
- `saleDate`: Transaction date
- `totalAmount`: Total revenue
- `totalCogs`: Total cost of goods sold
- `profit`: Total profit

### Sale Items
- `id`: Primary key
- `saleId`: Foreign key to sales
- `productId`: Foreign key to products
- `quantity`: Quantity sold
- `sellingPrice`: Price per unit
- `cogs`: Cost of goods sold for this item

## 🎨 API Endpoints

### Products
- `POST /api/products` - Create product
- `GET /api/products` - List all products
- `GET /api/products/:id` - Get product by ID
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product

### Inventory
- `POST /api/inventory` - Create inventory batch
- `GET /api/inventory` - List all batches
- `GET /api/inventory/product/:productId` - Get batches by product
- `GET /api/inventory/stock/:productId` - Get current stock

### Sales
- `POST /api/sales` - Create sale
- `GET /api/sales` - List all sales
- `GET /api/sales/:id` - Get sale by ID

### Reports
- `GET /api/reports/sales-summary` - Sales summary
- `GET /api/reports/product-performance` - Product performance
- `GET /api/reports/inventory-valuation` - Inventory valuation

## 🧪 Testing

### Manual Testing

1. **Test FIFO**:
   - Create product with FIFO method
   - Add 3 batches with different cost prices
   - Make a sale
   - Verify oldest batches are deducted first

2. **Test LIFO**:
   - Create product with LIFO method
   - Add 3 batches with different cost prices
   - Make a sale
   - Verify newest batches are deducted first

3. **Test Stock Validation**:
   - Try to sell more than available stock
   - Should receive error message

## 🔧 Development Scripts

```bash
# Install all dependencies
npm run install:all

# Run both frontend and backend
npm run dev

# Run backend only
npm run backend

# Run frontend only
npm run frontend

# Build for production
npm run build

# Database commands
cd apps/backend
npx prisma studio          # Open Prisma Studio
npx prisma migrate dev     # Create new migration
npx prisma generate        # Generate Prisma Client
```

## 🚀 Deployment

### Backend
1. Set environment variables
2. Run database migrations
3. Build: `npm run build --workspace=apps/backend`
4. Start: `npm start --workspace=apps/backend`

### Frontend
1. Build: `npm run build --workspace=apps/frontend`
2. Serve the `dist` folder with any static server

## 📝 Future Enhancements

- [ ] Multi-warehouse support
- [ ] User authentication & authorization
- [ ] Export reports to Excel/PDF
- [ ] Barcode scanning
- [ ] Low stock alerts
- [ ] Purchase order management
- [ ] Supplier management
- [ ] Advanced analytics & charts

## 📄 License

MIT License - feel free to use this project for learning or commercial purposes.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

Built with ❤️ using modern web technologies
