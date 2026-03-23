export type ItineraryStatus = 'planning' | 'in_progress' | 'completed';

export interface Itinerary {
  id: string;
  user_id: string;
  name: string;
  description: string;
  is_public: boolean;
  status: ItineraryStatus;
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

export type CreateItineraryInput = Pick<Itinerary, 'name' | 'description' | 'is_public'>;
export type UpdateItineraryInput = Partial<Pick<Itinerary, 'name' | 'description' | 'is_public' | 'status'>>;

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
