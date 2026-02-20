import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { configurationService } from '../services/configuration.service';

const QUERY_KEY = 'configurations';

export const useConfigurations = () => {
    return useQuery({
        queryKey: [QUERY_KEY],
        queryFn: configurationService.getAll,
    });
};

export const useConfigurationByKey = (key: string) => {
    return useQuery({
        queryKey: [QUERY_KEY, key],
        queryFn: () => configurationService.getByKey(key),
    });
};

export const useUpsertConfiguration = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            key,
            value,
            description,
        }: {
            key: string;
            value: string;
            description?: string;
        }) => configurationService.upsert(key, value, description),
        onSuccess: (_data, variables) => {
            // Invalidate queries agar tampilan update otomatis setelah simpan
            queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
            queryClient.invalidateQueries({ queryKey: [QUERY_KEY, variables.key] });
        },
    });
};
