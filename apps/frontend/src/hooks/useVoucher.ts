import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { voucherService } from '../services/voucher.service';
import { CreateVoucherDTO, UpdateVoucherDTO } from '../types';

export const useVouchers = () => {
    return useQuery({
        queryKey: ['vouchers'],
        queryFn: voucherService.getAll,
    });
};

export const useVoucher = (id: string) => {
    return useQuery({
        queryKey: ['voucher', id],
        queryFn: () => voucherService.getById(id),
        enabled: !!id,
    });
};

export const useCreateVoucher = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CreateVoucherDTO) => voucherService.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['vouchers'] });
        },
    });
};

export const useUpdateVoucher = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: UpdateVoucherDTO }) =>
            voucherService.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['vouchers'] });
        },
    });
};

export const useDeleteVoucher = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => voucherService.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['vouchers'] });
        },
    });
};
