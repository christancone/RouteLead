import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import CustomerFooter from '../../../components/navigation/CustomerFooter';

interface VerificationStatus {
  status: 'unverified' | 'pending' | 'verified';
  nicPhotoUrl?: string;
  selfiePhotoUrl?: string;
  submittedAt?: string;
  reviewedAt?: string;
}

const CustomerVerification = () => {
  const [nicPhoto, setNicPhoto] = useState<string | null>(null);
  const [selfiePhoto, setSelfiePhoto] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus>({
    status: 'unverified'
  });
  const [loading, setLoading] = useState(true);

  // Simulating fetching verification status
  React.useEffect(() => {
    const checkVerificationStatus = () => {
      setLoading(true);
      // Simulate API call delay
      setTimeout(() => {
        // This is demo data - replace with actual API call
        setVerificationStatus({
          status: 'pending',
          nicPhotoUrl: 'https://picsum.photos/400/300', // Demo image
          selfiePhotoUrl: 'https://picsum.photos/400/300', // Demo image
          submittedAt: new Date(Date.now() - 86400000).toISOString(), // 24 hours ago
        });
        setLoading(false);
      }, 1000);
    };

    checkVerificationStatus();
  }, []);

  const pickImage = async (type: 'nic' | 'selfie') => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled && result.assets[0].uri) {
        if (type === 'nic') {
          setNicPhoto(result.assets[0].uri);
        } else {
          setSelfiePhoto(result.assets[0].uri);
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const handleSubmit = () => {
    if (!nicPhoto || !selfiePhoto) {
      Alert.alert('Missing Documents', 'Please upload all required documents');
      return;
    }

    // Placeholder for backend implementation
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      Alert.alert(
        'Success',
        'Your verification request has been submitted.',
        [
          { 
            text: 'OK', 
            onPress: () => router.push({ pathname: '/pages/customer/Profile' } as any)
          }
        ]
      );
    }, 1500);
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-200">
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text className="text-xl font-bold">Get Verified</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView className="flex-1 p-4">
        {loading ? (
          <View className="flex-1 justify-center items-center py-8">
            <Text className="text-gray-600">Loading verification status...</Text>
          </View>
        ) : (
          <>
            {/* Verification Status Card */}
            <View className={`p-4 rounded-lg mb-6 ${
              verificationStatus.status === 'verified' ? 'bg-green-50' :
              verificationStatus.status === 'pending' ? 'bg-yellow-50' :
              'bg-blue-50'
            }`}>
              <View className="flex-row items-center mb-2">
                <View className={`w-3 h-3 rounded-full mr-2 ${
                  verificationStatus.status === 'verified' ? 'bg-green-500' :
                  verificationStatus.status === 'pending' ? 'bg-yellow-500' :
                  'bg-blue-500'
                }`} />
                <Text className={`font-medium ${
                  verificationStatus.status === 'verified' ? 'text-green-800' :
                  verificationStatus.status === 'pending' ? 'text-yellow-800' :
                  'text-blue-800'
                }`}>
                  {verificationStatus.status === 'verified' ? 'Verified Account' :
                   verificationStatus.status === 'pending' ? 'Verification Pending' :
                   'Not Verified'}
                </Text>
              </View>
              
              {verificationStatus.submittedAt && (
                <Text className="text-gray-600 text-sm">
                  Submitted: {new Date(verificationStatus.submittedAt).toLocaleDateString()}
                </Text>
              )}
              {verificationStatus.reviewedAt && (
                <Text className="text-gray-600 text-sm">
                  Reviewed: {new Date(verificationStatus.reviewedAt).toLocaleDateString()}
                </Text>
              )}
            </View>

            {verificationStatus.status === 'unverified' && (
              <View className="bg-blue-50 p-4 rounded-lg mb-6">
                <Text className="text-blue-800 font-medium mb-2">Important Instructions:</Text>
                <Text className="text-blue-600 text-sm">
                  • Upload a clear photo of your NIC (front side){'\n'}
                  • Upload a clear selfie photo of yourself{'\n'}
                  • Make sure all details are clearly visible{'\n'}
                  • Files should be in JPG or PNG format
                </Text>
              </View>
            )}

            {verificationStatus.status !== 'unverified' ? (
              <>
                {/* Submitted Documents */}
                <View className="mb-6">
                  <Text className="text-lg font-semibold mb-4">Submitted Documents</Text>
                  
                  <View className="mb-6">
                    <Text className="text-base font-medium mb-2">NIC Photo</Text>
                    <View className="border border-gray-200 rounded-lg overflow-hidden">
                      <Image
                        source={{ uri: verificationStatus.nicPhotoUrl }}
                        className="w-full h-48"
                        resizeMode="cover"
                      />
                    </View>
                  </View>

                  <View className="mb-6">
                    <Text className="text-base font-medium mb-2">Your Photo</Text>
                    <View className="border border-gray-200 rounded-lg overflow-hidden">
                      <Image
                        source={{ uri: verificationStatus.selfiePhotoUrl }}
                        className="w-full h-48"
                        resizeMode="cover"
                      />
                    </View>
                  </View>
                </View>

                {verificationStatus.status === 'pending' && (
                  <View className="bg-yellow-50 p-4 rounded-lg mb-6">
                    <Text className="text-yellow-800 text-sm">
                      Your verification is under review. We'll notify you once the review is complete.
                    </Text>
                  </View>
                )}
              </>
            ) : (
              <>
                {/* NIC Photo Upload */}
                <View className="mb-6">
                  <Text className="text-base font-medium mb-2">NIC Photo</Text>
                  <TouchableOpacity
                    onPress={() => pickImage('nic')}
                    className="border-2 border-dashed border-gray-300 rounded-lg p-4 items-center"
                  >
                    {nicPhoto ? (
                      <Image
                        source={{ uri: nicPhoto }}
                        className="w-full h-48 rounded-lg"
                        resizeMode="cover"
                      />
                    ) : (
                      <View className="items-center py-4">
                        <Ionicons name="cloud-upload-outline" size={40} color="#666" />
                        <Text className="text-gray-600 mt-2">Upload NIC Photo</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                </View>

                {/* Selfie Photo Upload */}
                <View className="mb-6">
                  <Text className="text-base font-medium mb-2">Your Photo</Text>
                  <TouchableOpacity
                    onPress={() => pickImage('selfie')}
                    className="border-2 border-dashed border-gray-300 rounded-lg p-4 items-center"
                  >
                    {selfiePhoto ? (
                      <Image
                        source={{ uri: selfiePhoto }}
                        className="w-full h-48 rounded-lg"
                        resizeMode="cover"
                      />
                    ) : (
                      <View className="items-center py-4">
                        <Ionicons name="camera-outline" size={40} color="#666" />
                        <Text className="text-gray-600 mt-2">Upload Your Photo</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  onPress={handleSubmit}
                  disabled={isSubmitting}
                  className={`py-4 rounded-lg ${
                    isSubmitting || !nicPhoto || !selfiePhoto
                      ? 'bg-gray-300'
                      : 'bg-orange-500'
                  }`}
                >
                  <Text className="text-white text-center font-semibold text-lg">
                    {isSubmitting ? 'Submitting...' : 'Submit for Review'}
                  </Text>
                </TouchableOpacity>

                <View className="bg-gray-50 p-4 rounded-lg mb-6 mt-4">
                  <Text className="text-gray-600 text-sm">
                    After submission, our team will review your documents within 24-48 hours. 
                    You will be notified once your verification is complete.
                  </Text>
                </View>
              </>
            )}
          </>
        )}
      </ScrollView>

      <CustomerFooter activeTab="profile" />
    </SafeAreaView>
  );
};

export default CustomerVerification;
