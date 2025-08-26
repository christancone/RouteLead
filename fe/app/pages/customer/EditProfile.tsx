import React, { useState } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import PrimaryCard from '../../../components/ui/PrimaryCard';
import PrimaryButton from '../../../components/ui/PrimaryButton';

interface EditProfileProps {
  profileData: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    phone_number: string | null;
    nic_number: string | null;
    address_line_1: string | null;
    address_line_2: string | null;
    city: string | null;
    date_of_birth: string | null;
    gender: string | null;
  };
}

const EditProfile = () => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    phone_number: '',
    nic_number: '',
    address_line_1: '',
    address_line_2: '',
    city: '',
    date_of_birth: '',
    gender: ''
  });

  const handleBack = () => {
    router.back();
  };

  const handleSave = async () => {
    try {
      setLoading(true);

      // Get current user
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;

      // Validate required fields
      if (!formData.first_name || !formData.last_name || !formData.nic_number) {
        Alert.alert('Error', 'Please fill in all required fields (First Name, Last Name, and NIC Number)');
        return;
      }

      // Update profile in database
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          ...formData,
          updated_at: new Date().toISOString()
        })
        .eq('id', user?.id);

      if (updateError) throw updateError;

      Alert.alert('Success', 'Profile updated successfully', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-100">
      {/* Header */}
      <View className="flex-row items-center p-4 bg-white border-b border-gray-200">
        <TouchableOpacity onPress={handleBack} className="p-2">
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text className="flex-1 text-center text-xl font-bold">Edit Profile</Text>
        <View className="w-10" />
      </View>

      <ScrollView className="flex-1 p-4">
        <PrimaryCard className="p-4">
          {/* Required Fields */}
          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-1">First Name *</Text>
            <TextInput
              className="border border-gray-300 rounded-lg px-4 py-2"
              value={formData.first_name}
              onChangeText={(text) => setFormData(prev => ({ ...prev, first_name: text }))}
              placeholder="Enter first name"
            />
          </View>

          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-1">Last Name *</Text>
            <TextInput
              className="border border-gray-300 rounded-lg px-4 py-2"
              value={formData.last_name}
              onChangeText={(text) => setFormData(prev => ({ ...prev, last_name: text }))}
              placeholder="Enter last name"
            />
          </View>

          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-1">NIC Number *</Text>
            <TextInput
              className="border border-gray-300 rounded-lg px-4 py-2"
              value={formData.nic_number}
              onChangeText={(text) => setFormData(prev => ({ ...prev, nic_number: text }))}
              placeholder="Enter NIC number"
            />
          </View>

          {/* Optional Fields */}
          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-1">Phone Number</Text>
            <TextInput
              className="border border-gray-300 rounded-lg px-4 py-2"
              value={formData.phone_number}
              onChangeText={(text) => setFormData(prev => ({ ...prev, phone_number: text }))}
              placeholder="Enter phone number"
              keyboardType="phone-pad"
            />
          </View>

          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-1">Address Line 1</Text>
            <TextInput
              className="border border-gray-300 rounded-lg px-4 py-2"
              value={formData.address_line_1}
              onChangeText={(text) => setFormData(prev => ({ ...prev, address_line_1: text }))}
              placeholder="Enter address line 1"
            />
          </View>

          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-1">Address Line 2</Text>
            <TextInput
              className="border border-gray-300 rounded-lg px-4 py-2"
              value={formData.address_line_2}
              onChangeText={(text) => setFormData(prev => ({ ...prev, address_line_2: text }))}
              placeholder="Enter address line 2"
            />
          </View>

          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-1">City</Text>
            <TextInput
              className="border border-gray-300 rounded-lg px-4 py-2"
              value={formData.city}
              onChangeText={(text) => setFormData(prev => ({ ...prev, city: text }))}
              placeholder="Enter city"
            />
          </View>

          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-1">Date of Birth</Text>
            <TextInput
              className="border border-gray-300 rounded-lg px-4 py-2"
              value={formData.date_of_birth}
              onChangeText={(text) => setFormData(prev => ({ ...prev, date_of_birth: text }))}
              placeholder="YYYY-MM-DD"
            />
          </View>

          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-1">Gender</Text>
            <TextInput
              className="border border-gray-300 rounded-lg px-4 py-2"
              value={formData.gender}
              onChangeText={(text) => setFormData(prev => ({ ...prev, gender: text }))}
              placeholder="Enter gender"
            />
          </View>

          <PrimaryButton
            title={loading ? 'Saving...' : 'Save Changes'}
            onPress={handleSave}
            disabled={loading}
          />
          {loading && (
            <ActivityIndicator 
              size="small" 
              color="#f97316" 
              className="mt-2"
            />
          )}
        </PrimaryCard>
      </ScrollView>
    </SafeAreaView>
  );
};

export default EditProfile;
