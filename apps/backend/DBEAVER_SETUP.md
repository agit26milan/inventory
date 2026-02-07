# Panduan Koneksi Database ke DBeaver

## 📋 Informasi Koneksi Database

Berdasarkan konfigurasi di `.env`, berikut adalah detail koneksi database:

```
Host: localhost
Port: 3306
Database: inventory_db
Username: root
Password: (KOSONGKAN)
```

---

## 🔧 Langkah-langkah Koneksi ke DBeaver

### 1. Buka DBeaver

Jalankan aplikasi DBeaver di komputer Anda.

### 2. Buat Koneksi Baru

1. Klik menu **Database** → **New Database Connection**
   
   ATAU
   
2. Klik icon **New Database Connection** (icon plug dengan tanda +) di toolbar

### 3. Pilih Database Type

1. Pilih **MySQL** dari daftar database
2. Klik **Next**

### 4. Masukkan Detail Koneksi

Isi form dengan informasi berikut:

#### Main Tab

| Field | Value |
|-------|-------|
| **Server Host** | `localhost` |
| **Port** | `3306` |
| **Database** | `inventory_db` |
| **Username** | `root` |
| **Password** | *(Kosongkan / Empty)* |

#### Opsi Tambahan (Optional)

- **Connection name**: Bisa diisi dengan nama yang mudah diingat, misalnya: `Inventory App - Local`
- Centang **Save password** jika ingin menyimpan password

### 5. Test Connection

1. Klik tombol **Test Connection** di bagian bawah
2. Jika koneksi berhasil, akan muncul pesan sukses
3. Jika gagal, pastikan:
   - MySQL server sudah running
   - Port 3306 tidak diblokir firewall
   - Username dan password benar

### 6. Download Driver (Jika Diperlukan)

Jika ini pertama kali menggunakan MySQL di DBeaver:
1. DBeaver akan menanyakan apakah ingin download MySQL driver
2. Klik **Download** dan tunggu hingga selesai
3. Setelah selesai, klik **Test Connection** lagi

### 7. Finish

1. Jika test connection berhasil, klik **Finish**
2. Koneksi database akan muncul di panel **Database Navigator** sebelah kiri

---

## 🚀 Menjalankan MySQL Server

Jika MySQL server belum running, jalankan terlebih dahulu:

### Menggunakan Homebrew (macOS)

```bash
# Start MySQL
brew services start mysql

# Stop MySQL
brew services stop mysql

# Restart MySQL
brew services restart mysql

# Check status
brew services list | grep mysql
```

### Menggunakan MySQL Command

```bash
# Start MySQL
sudo mysql.server start

# Stop MySQL
sudo mysql.server stop

# Restart MySQL
sudo mysql.server restart
```

### Menggunakan XAMPP/MAMP

Jika menggunakan XAMPP atau MAMP:
1. Buka aplikasi XAMPP/MAMP
2. Klik tombol **Start** pada MySQL
3. Tunggu hingga status berubah menjadi running (hijau)

---

## 📊 Setelah Terhubung

### Membuat Database (Jika Belum Ada)

Jika database `inventory_db` belum dibuat:

1. Klik kanan pada koneksi MySQL di DBeaver
2. Pilih **SQL Editor** → **New SQL Script**
3. Jalankan query berikut:

```sql
CREATE DATABASE IF NOT EXISTS inventory_db
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;
```

4. Klik icon **Execute SQL Statement** (Ctrl/Cmd + Enter)

### Menjalankan Prisma Migration

Setelah database terhubung, jalankan migration untuk membuat tabel:

```bash
cd apps/backend
npx prisma migrate dev --name add_variant_system
```

### Melihat Tabel di DBeaver

Setelah migration berhasil:

1. Expand koneksi database di Database Navigator
2. Expand **inventory_db**
3. Expand **Tables**
4. Anda akan melihat tabel-tabel berikut:
   - `products`
   - `variants`
   - `variant_values`
   - `variant_combinations`
   - `variant_combination_values`
   - `inventory_batches`
   - `sales`
   - `sale_items`

---

## 🔍 Tips DBeaver

### Melihat Data Tabel

1. Double-click pada nama tabel
2. Tab **Data** akan terbuka menampilkan isi tabel
3. Gunakan toolbar untuk:
   - Refresh data
   - Add new row
   - Edit row
   - Delete row
   - Export data

### Menjalankan Query

1. Klik kanan pada database → **SQL Editor** → **New SQL Script**
2. Tulis query SQL
3. Tekan **Ctrl/Cmd + Enter** untuk execute
4. Hasil akan muncul di panel bawah

### Melihat ER Diagram

1. Klik kanan pada database `inventory_db`
2. Pilih **View Diagram**
3. DBeaver akan generate ER diagram otomatis
4. Anda bisa save diagram untuk dokumentasi

### Export Data

1. Klik kanan pada tabel
2. Pilih **Export Data**
3. Pilih format (SQL, CSV, JSON, Excel, dll)
4. Follow wizard untuk export

---

## ❗ Troubleshooting

### Error: "Access denied for user 'root'@'localhost'"

**Solusi:**
1. Password salah - cek password MySQL Anda
2. Reset password MySQL:
   ```bash
   mysql -u root
   ALTER USER 'root'@'localhost' IDENTIFIED BY 'password';
   FLUSH PRIVILEGES;
   ```

### Error: "Can't connect to MySQL server on 'localhost'"

**Solusi:**
1. MySQL server belum running - jalankan MySQL server
2. Port salah - pastikan MySQL running di port 3306
3. Check dengan command:
   ```bash
   mysql -u root -p
   ```

### Error: "Unknown database 'inventory_db'"

**Solusi:**
Database belum dibuat. Buat database terlebih dahulu:
```sql
CREATE DATABASE inventory_db;
```

### Driver Download Gagal

**Solusi:**
1. Download manual dari: https://dev.mysql.com/downloads/connector/j/
2. Di DBeaver: Database → Driver Manager → MySQL
3. Klik **Add File** dan pilih JAR file yang sudah didownload

---

## 📝 Connection String Reference

Jika perlu mengubah konfigurasi database, edit file `.env`:

```env
# Format: mysql://username:password@host:port/database
DATABASE_URL="mysql://root:password@localhost:3306/inventory_db"
```

**Parameter yang bisa diubah:**
- `username`: User MySQL (default: root)
- `password`: Password MySQL
- `host`: Server address (default: localhost)
- `port`: MySQL port (default: 3306)
- `database`: Nama database (default: inventory_db)

---

## ✅ Checklist Koneksi

- [ ] MySQL server sudah running
- [ ] Database `inventory_db` sudah dibuat
- [ ] DBeaver sudah terinstall
- [ ] MySQL driver sudah terdownload di DBeaver
- [ ] Test connection berhasil
- [ ] Prisma migration sudah dijalankan
- [ ] Tabel sudah terlihat di DBeaver

---

## 🎯 Next Steps

Setelah database terhubung ke DBeaver:

1. **Jalankan Migration**:
   ```bash
   cd apps/backend
   npx prisma migrate dev
   ```

2. **Lihat Struktur Tabel** di DBeaver untuk memverifikasi schema

3. **Start Backend Server**:
   ```bash
   npm run dev
   ```

4. **Test API Endpoints** menggunakan Postman/Thunder Client

5. **Monitor Database** di DBeaver saat testing API
