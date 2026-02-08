import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { marketplaceFeeService } from '../services/marketplace-fee.service';
import { CreateMarketplaceFeeDTO } from '../types';

export const useFeesByProduct = (productId: number | null) => {
  return useQuery({
    queryKey: ['marketplaceFees', productId],
    queryFn: () => {
        if (!productId) return [];
        return marketplaceFeeService.getFeesByProduct(productId);
    },
    enabled: !!productId,
  });
};

export const useSetFee = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateMarketplaceFeeDTO) => marketplaceFeeService.setFee(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['marketplaceFees', data.productId] });
    },
  });
};

export const useDeleteFee = () => {
    const queryClient = useQueryClient();
  
    return useMutation({
      mutationFn: (id: number) => marketplaceFeeService.deleteFee(id),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['marketplaceFees'] });
      },
    });
  };
