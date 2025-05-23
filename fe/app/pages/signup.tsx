import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../../lib/auth';
import { UserRole } from '../../lib/types';
import CustomAlert from '../../components/CustomAlert';

export default function SignupScreen() {
  const { signUp } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole>(UserRole.CUSTOMER);
  const [alert, setAlert] = useState({
    visible: false,
    title: '',
    message: '',
    type: 'info' as 'success' | 'error' | 'info'
  });

  const handleSignup = async () => {
    if (loading) return;
    
    // Validate required fields
    if (!email || !password || !firstName || !lastName || !phoneNumber) {
      setAlert({
        visible: true,
        title: 'Missing Information',
        message: 'Please fill in all required fields marked with *',
        type: 'error'
      });
      return;
    }
    
    try {
      setLoading(true);
      console.log('Starting signup process with role:', selectedRole);
      await signUp(email, password, selectedRole, {
        firstName,
        lastName,
        phoneNumber
      });
      setAlert({
        visible: true,
        title: 'Success!',
        message: 'Your account has been created successfully! Please check your email to verify your account.',
        type: 'success'
      });
    } catch (error: any) {
      console.error('Signup error:', error);
      setAlert({
        visible: true,
        title: 'Error',
        message: error.message || 'Failed to create account. Please try again.',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAlertDismiss = () => {
    setAlert(prev => ({ ...prev, visible: false }));
    if (alert.type === 'success') {
      router.replace('/pages/welcome');
    }
  };

  const RoleButton = ({ role, label }: { role: UserRole; label: string }) => (
    <TouchableOpacity
      onPress={() => {
        console.log('Setting role to:', role);
        setSelectedRole(role);
      }}
      className={`flex-1 p-3 rounded-xl mr-2 ${
        selectedRole === role ? 'bg-primary' : 'bg-gray-100'
      }`}
    >
      <Text
        className={`text-center font-medium ${
          selectedRole === role ? 'text-white' : 'text-gray-600'
        }`}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-background"
    >
      <ScrollView className="flex-1 px-5">
        <View className="items-center mt-20 mb-10">
          <Image
            source={require('../../assets/images/logo_vehicle.png')}
            className="w-36 h-24"
            resizeMode="contain"
          />
          <Image
            source={require('../../assets/images/logo_text.png')}
            className="w-48 h-12 mb-2.5"
            resizeMode="contain"
          />
        </View>

        <View className="px-5">
          <Text className="text-3xl font-bold text-secondary mb-2">Create Account</Text>
          <Text className="text-base text-text-light mb-8">Sign up to get started</Text>

          <View className="mb-4">
            <TextInput
              className="bg-gray-100 rounded-xl p-4 text-base border border-border"
              placeholder="First Name *"
              value={firstName}
              onChangeText={setFirstName}
              autoCapitalize="words"
              style={{ boxShadow: 'none' }}
            />
          </View>

          <View className="mb-4">
            <TextInput
              className="bg-gray-100 rounded-xl p-4 text-base border border-border"
              placeholder="Last Name *"
              value={lastName}
              onChangeText={setLastName}
              autoCapitalize="words"
              style={{ boxShadow: 'none' }}
            />
          </View>

          <View className="mb-4">
            <TextInput
              className="bg-gray-100 rounded-xl p-4 text-base border border-border"
              placeholder="Email *"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              style={{ boxShadow: 'none' }}
            />
          </View>

          <View className="mb-4">
            <TextInput
              className="bg-gray-100 rounded-xl p-4 text-base border border-border"
              placeholder="Phone Number *"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              keyboardType="phone-pad"
              style={{ boxShadow: 'none' }}
            />
          </View>

          <View className="mb-4">
            <TextInput
              className="bg-gray-100 rounded-xl p-4 text-base border border-border"
              placeholder="Password *"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              style={{ boxShadow: 'none' }}
            />
          </View>

          <View className="mb-6">
            <Text className="text-base text-text-light mb-2">Select your role: *</Text>
            <View className="flex-row">
              <RoleButton role={UserRole.CUSTOMER} label="Customer" />
              <RoleButton role={UserRole.DRIVER} label="Driver" />
            </View>
          </View>

          <TouchableOpacity 
            className="bg-primary rounded-xl p-4 items-center mb-6"
            onPress={handleSignup}
            disabled={loading}
            style={{ pointerEvents: 'auto', opacity: loading ? 0.7 : 1 }}
          >
            <Text className="text-white text-lg font-bold">
              {loading ? 'Creating Account...' : 'Create Account'}
            </Text>
          </TouchableOpacity>

          <View className="flex-row justify-center items-center">
            <Text className="text-text-light text-sm">Already have an account? </Text>
            <TouchableOpacity 
              onPress={() => router.push('/pages/login')}
              style={{ pointerEvents: 'auto' }}
            >
              <Text className="text-primary text-sm font-bold">Sign In</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <CustomAlert
        visible={alert.visible}
        title={alert.title}
        message={alert.message}
        type={alert.type}
        onDismiss={handleAlertDismiss}
      />
    </KeyboardAvoidingView>
  );
} 