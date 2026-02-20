import prisma from '../../database/client';
import { ConfigurationItem } from './configuration.types';

export class ConfigurationService {
    /**
     * Ambil semua konfigurasi dari database
     */
    async getAll(): Promise<ConfigurationItem[]> {
        return prisma.configuration.findMany({
            orderBy: { key: 'asc' },
        });
    }

    /**
     * Ambil konfigurasi berdasarkan key
     */
    async getByKey(key: string): Promise<ConfigurationItem | null> {
        return prisma.configuration.findUnique({
            where: { key },
        });
    }

    /**
     * Insert atau update konfigurasi (upsert).
     * Jika key sudah ada maka nilainya diperbarui, jika belum maka dibuat baru.
     */
    async upsert(
        key: string,
        value: string,
        description?: string
    ): Promise<ConfigurationItem> {
        return prisma.configuration.upsert({
            where: { key },
            update: { value, ...(description !== undefined && { description }) },
            create: { key, value, description },
        });
    }
}

export default new ConfigurationService();
