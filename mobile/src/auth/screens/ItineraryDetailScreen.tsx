import React, { useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator,
  Alert,
  Share
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useItineraries } from '../hooks/useItineraries';

const ItineraryDetailScreen = () => {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { id } = route.params;
  const { currentItinerary, loading, fetchItineraryDetails, deleteItinerary, removeItem } = useItineraries();

  useEffect(() => {
    fetchItineraryDetails(id);
  }, [id, fetchItineraryDetails]);

  const handleShare = async () => {
    if (!currentItinerary) return;
    try {
      const result = await Share.share({
        message: `Check out my SXM itinerary: ${currentItinerary.name}
${currentItinerary.description}`,
        url: `sxmgo://itinerary/${currentItinerary.id}`, // Placeholder for deep linking
      });
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Itinerary',
      'Are you sure you want to delete this itinerary?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            await deleteItinerary(id);
            navigation.goBack();
          }
        }
      ]
    );
  };

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.itemCard}>
      <View style={styles.itemInfo}>
        <Text style={styles.itemName}>{item.locations.name}</Text>
        <Text style={styles.itemCategory}>{item.locations.category}</Text>
      </View>
      <TouchableOpacity 
        onPress={() => removeItem(id, item.id)}
        style={styles.removeButton}
      >
        <Text style={styles.removeButtonText}>Remove</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading && !currentItinerary) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#0066CC" />
      </View>
    );
  }

  if (!currentItinerary) {
    return (
      <View style={styles.centered}>
        <Text>Itinerary not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{currentItinerary.name}</Text>
        <Text style={styles.description}>{currentItinerary.description}</Text>
        
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
            <Text style={styles.actionButtonText}>Share</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionButton, styles.deleteButton]} onPress={handleDelete}>
            <Text style={styles.actionButtonText}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={currentItinerary.items}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={<Text style={styles.sectionTitle}>Locations</Text>}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No locations added yet</Text>
            <TouchableOpacity 
              style={styles.addMoreButton}
              onPress={() => navigation.navigate('MapTab')} // Direct to map to add locations
            >
              <Text style={styles.addMoreButtonText}>Explore Map to Add Locations</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { backgroundColor: '#FFFFFF', padding: 20, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  title: { fontSize: 24, fontWeight: '800', color: '#1A1A1A', marginBottom: 8 },
  description: { fontSize: 16, color: '#4B5563', marginBottom: 20 },
  actionRow: { flexDirection: 'row', gap: 12 },
  actionButton: { 
    flex: 1, 
    backgroundColor: '#0066CC', 
    paddingVertical: 10, 
    borderRadius: 8, 
    alignItems: 'center' 
  },
  deleteButton: { backgroundColor: '#EF4444' },
  actionButtonText: { color: '#FFFFFF', fontWeight: '600' },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#374151', marginBottom: 12, marginTop: 20 },
  listContent: { padding: 20 },
  itemCard: { 
    flexDirection: 'row', 
    backgroundColor: '#FFFFFF', 
    padding: 16, 
    borderRadius: 12, 
    marginBottom: 12,
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#F3F4F6'
  },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 16, fontWeight: '600', color: '#1A1A1A' },
  itemCategory: { fontSize: 14, color: '#6B7280' },
  removeButton: { padding: 8 },
  removeButtonText: { color: '#EF4444', fontSize: 14, fontWeight: '500' },
  emptyContainer: { alignItems: 'center', marginTop: 40 },
  emptyText: { color: '#6B7280', marginBottom: 20 },
  addMoreButton: { backgroundColor: '#E0F2FE', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 8 },
  addMoreButtonText: { color: '#0066CC', fontWeight: '600' }
});

export default ItineraryDetailScreen;
