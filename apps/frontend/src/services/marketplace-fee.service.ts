import api from './api';
import { MarketplaceFee, CreateMarketplaceFeeDTO, ApiResponse } from '../types';

export const marketplaceFeeService = {
  // Set fee (Create/Update)
  setFee: async (data: CreateMarketplaceFeeDTO): Promise<MarketplaceFee> => {
    const response = await api.post<ApiResponse<MarketplaceFee>>('/marketplace-fees', data);
    return response.data.data;
  },

  // Get fees by product
  getFeesByProduct: async (productId: number): Promise<MarketplaceFee[]> => {
    const response = await api.get<ApiResponse<MarketplaceFee[]>>(`/marketplace-fees/product/${productId}`);
    return response.data.data;
  },

  // Delete fee
  deleteFee: async (id: number): Promise<void> => {
    await api.delete<ApiResponse<null>>(`/marketplace-fees/${id}`);
  },
};
