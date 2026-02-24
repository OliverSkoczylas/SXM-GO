import { useState, useCallback } from 'react';
import { itineraryService } from '../services/itineraryService';
import type { 
  Itinerary, 
  ItineraryWithItems, 
  CreateItineraryInput, 
  UpdateItineraryInput 
} from '../types/itinerary.types';

export const useItineraries = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [itineraries, setItineraries] = useState<Itinerary[]>([]);
  const [currentItinerary, setCurrentItinerary] = useState<ItineraryWithItems | null>(null);

  const fetchMyItineraries = useCallback(async () => {
    setLoading(true);
    try {
      const data = await itineraryService.getMyItineraries();
      setItineraries(data);
      setError(null);
    } catch (e: any) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchPublicItineraries = useCallback(async () => {
    setLoading(true);
    try {
      const data = await itineraryService.getPublicItineraries();
      setItineraries(data);
      setError(null);
    } catch (e: any) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchItineraryDetails = useCallback(async (id: string) => {
    setLoading(true);
    try {
      const data = await itineraryService.getItineraryDetails(id);
      setCurrentItinerary(data);
      setError(null);
    } catch (e: any) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }, []);

  const createItinerary = async (input: CreateItineraryInput) => {
    setLoading(true);
    try {
      const newItem = await itineraryService.createItinerary(input);
      setItineraries(prev => [newItem, ...prev]);
      setError(null);
      return newItem;
    } catch (e: any) {
      setError(e);
      throw e;
    } finally {
      setLoading(false);
    }
  };

  const updateItinerary = async (id: string, input: UpdateItineraryInput) => {
    setLoading(true);
    try {
      const updated = await itineraryService.updateItinerary(id, input);
      setItineraries(prev => prev.map(item => item.id === id ? updated : item));
      if (currentItinerary?.id === id) {
        setCurrentItinerary({ ...currentItinerary, ...updated });
      }
      setError(null);
    } catch (e: any) {
      setError(e);
      throw e;
    } finally {
      setLoading(false);
    }
  };

  const deleteItinerary = async (id: string) => {
    setLoading(true);
    try {
      await itineraryService.deleteItinerary(id);
      setItineraries(prev => prev.filter(item => item.id !== id));
      if (currentItinerary?.id === id) {
        setCurrentItinerary(null);
      }
      setError(null);
    } catch (e: any) {
      setError(e);
      throw e;
    } finally {
      setLoading(false);
    }
  };

  const addItem = async (itineraryId: string, locationId: string, orderIndex: number) => {
    try {
      await itineraryService.addItemToItinerary(itineraryId, locationId, orderIndex);
      await fetchItineraryDetails(itineraryId);
    } catch (e: any) {
      setError(e);
      throw e;
    }
  };

  const removeItem = async (itineraryId: string, itemId: string) => {
    try {
      await itineraryService.removeItemFromItinerary(itemId);
      await fetchItineraryDetails(itineraryId);
    } catch (e: any) {
      setError(e);
      throw e;
    }
  };

  return {
    loading,
    error,
    itineraries,
    currentItinerary,
    fetchMyItineraries,
    fetchPublicItineraries,
    fetchItineraryDetails,
    createItinerary,
    updateItinerary,
    deleteItinerary,
    addItem,
    removeItem
  };
};
