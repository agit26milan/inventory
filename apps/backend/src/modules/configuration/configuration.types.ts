export interface ConfigurationItem {
    id: number;
    key: string;
    value: string;
    description?: string | null;
    updatedAt: Date;
}
