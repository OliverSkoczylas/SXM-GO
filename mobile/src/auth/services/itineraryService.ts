import { getSupabaseClient } from './supabaseClient';
import type {
  Itinerary,
  ItineraryWithItems,
  CreateItineraryInput,
  UpdateItineraryInput
} from '../types/itinerary.types';

// FR-048: Haversine distance in km between two GPS points
function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

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

    // FR-052: Mark each item as visited based on user's check-ins
    const { data: { user } } = await supabase.auth.getUser();
    if (user && data?.items?.length) {
      const { data: checkIns } = await supabase
        .from('check_ins')
        .select('location_id')
        .eq('user_id', user.id);
      const visitedIds = new Set((checkIns || []).map((c: any) => c.location_id));
      data.items = data.items.map((item: any) => ({
        ...item,
        visited: visitedIds.has(item.location_id),
      }));
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
  },

  // FR-048: Calculate total distance and estimated time for an itinerary
  async calculateItineraryStats(itineraryId: string): Promise<{ distanceKm: number; estimatedMinutes: number }> {
    const details = await this.getItineraryDetails(itineraryId);
    const items = details.items || [];

    if (items.length < 2) {
      return { distanceKm: 0, estimatedMinutes: items.length * 15 };
    }

    let totalKm = 0;
    for (let i = 0; i < items.length - 1; i++) {
      const a = items[i].locations;
      const b = items[i + 1].locations;
      totalKm += haversineKm(a.latitude, a.longitude, b.latitude, b.longitude);
    }

    // Estimate: 15 min per location + 3 min per km travel
    const estimatedMinutes = Math.round(items.length * 15 + totalKm * 3);

    // Persist to DB
    const supabase = getSupabaseClient();
    await supabase
      .from('itineraries')
      .update({ total_distance_km: Math.round(totalKm * 10) / 10, estimated_minutes: estimatedMinutes })
      .eq('id', itineraryId);

    return { distanceKm: Math.round(totalKm * 10) / 10, estimatedMinutes };
  },

  // FR-038: Award completion bonus when all locations in itinerary are visited
  async completeItinerary(itineraryId: string): Promise<{ bonus: number }> {
    const supabase = getSupabaseClient();

    // Mark as completed
    await supabase
      .from('itineraries')
      .update({ status: 'completed' })
      .eq('id', itineraryId);

    // Call RPC for 1.5x bonus
    const { data, error } = await supabase.rpc('award_itinerary_completion', {
      p_itinerary_id: itineraryId
    });

    return { bonus: error ? 0 : (data as number) };
  },

  // FR-055: Duplicate another user's shared itinerary
  async duplicateItinerary(sourceId: string): Promise<Itinerary> {
    const source = await this.getItineraryDetails(sourceId);
    const newItinerary = await this.createItinerary({
      name: `${source.name} (Copy)`,
      description: source.description,
      is_public: false,
      difficulty: source.difficulty,
    });

    // Copy items
    for (const item of source.items || []) {
      await this.addItemToItinerary(newItinerary.id, item.location_id, item.order_index);
    }

    return newItinerary;
  }
};
