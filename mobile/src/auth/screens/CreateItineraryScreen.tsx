import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  Switch,
  Alert,
  ActivityIndicator,
  ScrollView
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useItineraries } from '../hooks/useItineraries';

const CreateItineraryScreen = () => {
  const navigation = useNavigation<any>();
  const { createItinerary, loading } = useItineraries();
  
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a name for your itinerary');
      return;
    }

    try {
      const newItem = await createItinerary({
        name: name.trim(),
        description: description.trim(),
        is_public: isPublic
      });
      navigation.replace('ItineraryDetail', { id: newItem.id });
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to create itinerary');
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.label}>Itinerary Name</Text>
      <TextInput
        style={styles.input}
        value={name}
        onChangeText={setName}
        placeholder="e.g., My Weekend in SXM"
        placeholderTextColor="#9CA3AF"
      />

      <Text style={styles.label}>Description (Optional)</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        value={description}
        onChangeText={setDescription}
        placeholder="Describe your trip..."
        placeholderTextColor="#9CA3AF"
        multiline
        numberOfLines={4}
      />

      <View style={styles.switchContainer}>
        <View>
          <Text style={styles.switchLabel}>Public Itinerary</Text>
          <Text style={styles.switchSublabel}>Allow others to see and follow this itinerary</Text>
        </View>
        <Switch
          value={isPublic}
          onValueChange={setIsPublic}
          trackColor={{ false: '#D1D5DB', true: '#BFDBFE' }}
          thumbColor={isPublic ? '#0066CC' : '#F3F4F6'}
        />
      </View>

      <TouchableOpacity 
        style={[styles.button, (!name.trim() || loading) && styles.buttonDisabled]}
        onPress={handleCreate}
        disabled={!name.trim() || loading}
      >
        {loading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.buttonText}>Create Itinerary</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  content: { padding: 20 },
  label: { fontSize: 16, fontWeight: '600', color: '#374151', marginBottom: 8 },
  input: { 
    backgroundColor: '#F9FAFB', 
    borderWidth: 1, 
    borderColor: '#E5E7EB', 
    borderRadius: 8, 
    padding: 12, 
    fontSize: 16, 
    color: '#111827',
    marginBottom: 20
  },
  textArea: { height: 100, textAlignVertical: 'top' },
  switchContainer: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    marginBottom: 30,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6'
  },
  switchLabel: { fontSize: 16, fontWeight: '600', color: '#374151' },
  switchSublabel: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  button: { 
    backgroundColor: '#0066CC', 
    paddingVertical: 16, 
    borderRadius: 12, 
    alignItems: 'center' 
  },
  buttonDisabled: { backgroundColor: '#93C5FD' },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' }
});

export default CreateItineraryScreen;
