import { getSupabaseClient } from './supabaseClient';
import type { 
  Itinerary, 
  ItineraryWithItems, 
  CreateItineraryInput, 
  UpdateItineraryInput 
} from '../types/itinerary.types';

export const itineraryService = {
  async getMyItineraries(): Promise<Itinerary[]> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('itineraries')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getPublicItineraries(): Promise<Itinerary[]> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('itineraries')
      .select('*')
      .eq('is_public', true)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getItineraryDetails(id: string): Promise<ItineraryWithItems> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('itineraries')
      .select(`
        *,
        items:itinerary_items(
          *,
          locations(*)
        )
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    
    // Sort items by order_index
    if (data && data.items) {
      data.items.sort((a: any, b: any) => a.order_index - b.order_index);
    }
    
    return data;
  },

  async createItinerary(input: CreateItineraryInput): Promise<Itinerary> {
    const supabase = getSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('itineraries')
      .insert([{ ...input, user_id: user.id }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateItinerary(id: string, input: UpdateItineraryInput): Promise<Itinerary> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('itineraries')
      .update(input)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteItinerary(id: string): Promise<void> {
    const supabase = getSupabaseClient();
    const { error } = await supabase
      .from('itineraries')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async addItemToItinerary(itineraryId: string, locationId: string, orderIndex: number): Promise<void> {
    const supabase = getSupabaseClient();
    const { error } = await supabase
      .from('itinerary_items')
      .insert([{
        itinerary_id: itineraryId,
        location_id: locationId,
        order_index: orderIndex
      }]);

    if (error) throw error;
  },

  async removeItemFromItinerary(itemId: string): Promise<void> {
    const supabase = getSupabaseClient();
    const { error } = await supabase
      .from('itinerary_items')
      .delete()
      .eq('id', itemId);

    if (error) throw error;
  },

  async reorderItems(itineraryId: string, itemOrders: { id: string, order_index: number }[]): Promise<void> {
    const supabase = getSupabaseClient();
    const { error } = await supabase
      .from('itinerary_items')
      .upsert(itemOrders.map(item => ({
        id: item.id,
        itinerary_id: itineraryId,
        order_index: item.order_index
      })));

    if (error) throw error;
  }
};
