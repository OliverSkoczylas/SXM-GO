import React, { useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Modal, 
  TouchableOpacity, 
  FlatList, 
  ActivityIndicator 
} from 'react-native';
import { useItineraries } from '../hooks/useItineraries';

interface AddToItineraryModalProps {
  visible: boolean;
  onClose: () => void;
  locationId: string;
}

const AddToItineraryModal = ({ visible, onClose, locationId }: AddToItineraryModalProps) => {
  const { itineraries, loading, fetchMyItineraries, addItem } = useItineraries();

  useEffect(() => {
    if (visible) {
      fetchMyItineraries();
    }
  }, [visible, fetchMyItineraries]);

  const handleSelect = async (itineraryId: string) => {
    try {
      // For simplicity, adding to the end (index 999 or similar, logic could be smarter)
      await addItem(itineraryId, locationId, 0); 
      onClose();
    } catch (e) {
      // Error handled in hook
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Add to Itinerary</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.closeText}>Cancel</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <ActivityIndicator size="large" color="#0066CC" style={styles.loader} />
          ) : (
            <FlatList
              data={itineraries}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={styles.itineraryItem}
                  onPress={() => handleSelect(item.id)}
                >
                  <Text style={styles.itineraryName}>{item.name}</Text>
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <View style={styles.empty}>
                  <Text style={styles.emptyText}>No itineraries found.</Text>
                  <Text style={styles.emptySubtext}>Create one in your Profile first!</Text>
                </View>
              }
            />
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  content: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingBottom: 40, maxHeight: '70%' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  title: { fontSize: 18, fontWeight: '700', color: '#1A1A1A' },
  closeText: { color: '#6B7280', fontWeight: '600' },
  loader: { marginVertical: 40 },
  itineraryItem: { padding: 20, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  itineraryName: { fontSize: 16, color: '#1A1A1A' },
  empty: { padding: 40, alignItems: 'center' },
  emptyText: { fontSize: 16, fontWeight: '600', color: '#1A1A1A' },
  emptySubtext: { fontSize: 14, color: '#6B7280', marginTop: 4 }
});

export default AddToItineraryModal;
