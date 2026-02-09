import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { storeExpenseService } from '../services/store-expense.service';
import { CreateStoreExpenseDTO, UpdateStoreExpenseDTO } from '../types';

export const useStoreExpenses = () => {
    return useQuery({
        queryKey: ['storeExpenses'],
        queryFn: storeExpenseService.getAllExpenses,
    });
};

export const useCreateStoreExpense = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CreateStoreExpenseDTO) => storeExpenseService.createExpense(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['storeExpenses'] });
            queryClient.invalidateQueries({ queryKey: ['totalExpenses'] });
            queryClient.invalidateQueries({ queryKey: ['totalEquity'] });
        },
    });
};

export const useUpdateStoreExpense = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: UpdateStoreExpenseDTO }) =>
            storeExpenseService.updateExpense(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['storeExpenses'] });
            queryClient.invalidateQueries({ queryKey: ['totalExpenses'] });
            queryClient.invalidateQueries({ queryKey: ['totalEquity'] });
        },
    });
};

export const useDeleteStoreExpense = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: number) => storeExpenseService.deleteExpense(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['storeExpenses'] });
            queryClient.invalidateQueries({ queryKey: ['totalExpenses'] });
            queryClient.invalidateQueries({ queryKey: ['totalEquity'] });
        },
    });
};

export const useTotalExpenses = () => {
    return useQuery({
        queryKey: ['totalExpenses'],
        queryFn: storeExpenseService.getTotalExpenses,
    });
};
