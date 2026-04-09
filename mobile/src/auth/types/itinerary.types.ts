export type ItineraryStatus = 'planning' | 'in_progress' | 'completed';

export type ItineraryDifficulty = 'easy' | 'moderate' | 'challenging';

export interface Itinerary {
  id: string;
  user_id: string;
  name: string;
  description: string;
  is_public: boolean;
  status: ItineraryStatus;
  difficulty: ItineraryDifficulty;
  estimated_minutes: number | null;
  total_distance_km: number | null;
  created_at: string;
  updated_at: string;
}

export interface ItineraryItem {
  id: string;
  itinerary_id: string;
  location_id: string;
  order_index: number;
  visited?: boolean;
  created_at: string;
}

export type CreateItineraryInput = Pick<Itinerary, 'name' | 'description' | 'is_public'> & Partial<Pick<Itinerary, 'difficulty'>>;
export type UpdateItineraryInput = Partial<Pick<Itinerary, 'name' | 'description' | 'is_public' | 'status' | 'difficulty' | 'estimated_minutes' | 'total_distance_km'>>;

export interface ItineraryWithItems extends Itinerary {
  items: (ItineraryItem & {
    locations: {
      name: string;
      description: string;
      category: string;
      latitude: number;
      longitude: number;
      image_url: string | null;
    };
  })[];
}
