export interface Itinerary {
  id: string;
  user_id: string;
  name: string;
  description: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export interface ItineraryItem {
  id: string;
  itinerary_id: string;
  location_id: string;
  order_index: number;
  created_at: string;
}

export type CreateItineraryInput = Pick<Itinerary, 'name' | 'description' | 'is_public'>;
export type UpdateItineraryInput = Partial<CreateItineraryInput>;

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
