import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { Link, useRouter } from 'expo-router';
import PrimaryButton from '@/components/ui/PrimaryButton';
import SecondaryButton from '@/components/ui/SecondaryButton';
import EditButton from '@/components/ui/EditButton';
import DeleteButton from '@/components/ui/DeleteButton';
import PrimaryCard from '@/components/ui/PrimaryCard';
import IndigoButton from '@/components/ui/IndigoButton';
import { ProfileAvatar } from '@/components/ui/ProfileImage';
import DriverBottomNavigation from '@/components/navigation/DriverBottomNavigation';
import { VerificationGuard } from '@/components/guards/VerificationGuardOptimized';
import { useMyRoutes } from '@/hooks/useMyRoutes';
import { useDriverInfo } from '@/hooks/useEarningsData';
import { formatCurrency, formatDate, ApiService } from '@/services/apiService';
import { calculateCountdown, formatRouteStatus, isBiddingActive } from '@/utils/routeUtils';

const MyRoutes = () => {
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState<'active' | 'past'>('active');
  const [deletingRoute, setDeletingRoute] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Get authenticated driver ID
  const { driverId } = useDriverInfo();
  
  // Fetch all routes and filter on frontend
  const { routes: allRoutes, loading, error, refreshing, refresh } = useMyRoutes(driverId);
  
  // Update current time every second for real-time countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);
  
  // Filter routes based on active filter and sort by date (newest first)
  const routes = allRoutes
    .filter(route => {
      if (activeFilter === 'active') {
        return ['INITIATED', 'OPEN'].includes(route.status);
      } else {
        return ['BOOKED', 'COMPLETED', 'CANCELLED'].includes(route.status);
      }
    })
    .sort((a, b) => {
      // Sort by departureTime with newest first
      const dateA = new Date(a.departureTime);
      const dateB = new Date(b.departureTime);
      return dateB.getTime() - dateA.getTime();
    });

  const handleFilterChange = (filter: 'active' | 'past') => {
    setActiveFilter(filter);
  };

  const handleEditRoute = (route: any) => {
    try {
      // Clean the route data to avoid circular references
      const cleanRouteData = {
        id: route.id,
        originLat: route.originLat,
        originLng: route.originLng,
        destinationLat: route.destinationLat,
        destinationLng: route.destinationLng,
        originLocationName: route.originLocationName,
        destinationLocationName: route.destinationLocationName,
        departureTime: route.departureTime,
        biddingStart: route.biddingStart,
        status: route.status,
        detourToleranceKm: route.detourToleranceKm,
        suggestedPriceMin: route.suggestedPriceMin,
        suggestedPriceMax: route.suggestedPriceMax,
        totalDistanceKm: route.totalDistanceKm,
        estimatedDurationMinutes: route.estimatedDurationMinutes,
        routePolyline: route.routePolyline,
        bidCount: route.bidCount,
        highestBidAmount: route.highestBidAmount,
        createdAt: route.createdAt
      };
      
      // Navigate to EditRoute page with cleaned route data
      router.push({
        pathname: '/pages/driver/EditRoute',
        params: {
          routeData: JSON.stringify(cleanRouteData)
        }
      });
    } catch (error) {
      console.error('Error navigating to edit route:', error);
      Alert.alert('Error', 'Failed to open edit page. Please try again.');
    }
  };

  const handleDeleteRoute = async (routeId: string) => {
    Alert.alert(
      'Delete Route',
      'Are you sure you want to delete this route? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              setDeletingRoute(routeId);
              await ApiService.deleteRoute(routeId, driverId);
              
              // Show success message
              Alert.alert('Success', 'Route deleted successfully');
              
              // Refresh the routes list
              await refresh();
            } catch (error) {
              console.error('Error deleting route:', error);
              Alert.alert(
                'Delete Failed', 
                error instanceof Error ? error.message : 'Failed to delete route. Please try again.'
              );
            } finally {
              setDeletingRoute(null);
            }
          }
        }
      ]
    );
  };

  // Enhanced real-time countdown function
  const calculateRealTimeCountdown = (biddingEndTime: string) => {
    const endTime = new Date(biddingEndTime);
    const now = currentTime;
    const timeLeft = endTime.getTime() - now.getTime();
    
    if (timeLeft <= 0) {
      return { text: 'Ended', isExpired: true };
    }
    
    const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
    
    if (days > 0) {
      return { text: `${days}d ${hours}h ${minutes}m`, isExpired: false };
    } else if (hours > 0) {
      return { text: `${hours}h ${minutes}m ${seconds}s`, isExpired: false };
    } else if (minutes > 0) {
      return { text: `${minutes}m ${seconds}s`, isExpired: false };
    } else {
      return { text: `${seconds}s`, isExpired: false };
    }
  };

  const renderRouteCard = useCallback((route: any) => {
    // Safety checks for route data
    if (!route || !route.id) {
      console.warn('Invalid route data:', route);
      return null;
    }

    // Safe countdown calculation
    const countdown = route.biddingEndTime 
      ? calculateRealTimeCountdown(route.biddingEndTime)
      : { text: 'No data', isExpired: true };
    
    // Use location names from API response (already geocoded by the API)
    const originDisplay = route.originLocationName || 
      (route.originLat && route.originLng ? `${route.originLat}, ${route.originLng}` : 'Unknown origin');
    const destinationDisplay = route.destinationLocationName || 
      (route.destinationLat && route.destinationLng ? `${route.destinationLat}, ${route.destinationLng}` : 'Unknown destination');

    // Safe departure time formatting
    let formattedDepartureTime = 'No date';
    let formattedDepartureHour = 'No time';
    
    if (route.departureTime) {
      try {
        const departureDate = new Date(route.departureTime);
        if (!isNaN(departureDate.getTime())) {
          formattedDepartureTime = departureDate.toLocaleDateString('en-US', { 
            weekday: 'short',
            month: 'short', 
            day: '2-digit', 
            year: 'numeric'
          });
          formattedDepartureHour = departureDate.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit' 
          });
        }
      } catch (error) {
        console.warn('Invalid departure time:', route.departureTime);
      }
    }

    return (
      <PrimaryCard key={route.id} style={{ marginBottom: 16 }}>
        {/* Origin Location */}
        <View className="flex-row items-center mb-3">
          <Ionicons name="location-outline" size={20} color="#f97316" />
          <Text className="text-lg font-semibold ml-2 flex-1 text-gray-800" numberOfLines={2}>
            {originDisplay}
          </Text>
        </View>
        
        {/* Destination Location */}
        <View className="flex-row items-center mb-3">
          <Ionicons name="flag-outline" size={20} color="#10b981" />
          <Text className="text-lg font-semibold ml-2 flex-1 text-gray-800" numberOfLines={2}>
            {destinationDisplay}
          </Text>
        </View>
        
        {/* Departure Date & Time */}
        <View className="flex-row items-center mb-3">
          <Ionicons name="calendar-outline" size={20} color="#6366f1" />
          <View className="ml-2">
            <Text className="text-base font-medium text-gray-800">
              {formattedDepartureTime}
            </Text>
            <Text className="text-sm text-gray-600">
              at {formattedDepartureHour}
            </Text>
          </View>
        </View>
        
        {/* Bidding Countdown - only show for active routes */}
        {(route.status === 'INITIATED' || route.status === 'OPEN') && (
          <View className="flex-row items-center mb-3">
            <Ionicons 
              name="timer-outline" 
              size={20} 
              color={countdown.isExpired ? "#dc2626" : "#ea580c"} 
            />
            <Text 
              className={`ml-2 font-medium text-base ${
                countdown.isExpired ? 'text-red-600' : 'text-orange-600'
              }`}
            >
              {countdown.isExpired ? 'Bidding Ended' : `Ends in: ${countdown.text}`}
            </Text>
          </View>
        )}
        
        {/* Bids Summary */}
        <View className="flex-row items-center justify-between mb-4 bg-gray-50 p-3 rounded-lg">
          <View className="flex-row items-center">
            <Ionicons name="people-outline" size={18} color="#6b7280" />
            <Text className="text-gray-700 ml-2 font-medium">
              {(route.bidCount !== undefined && route.bidCount !== null) ? route.bidCount : 0} Bids
            </Text>
          </View>
          {route.highestBidAmount && typeof route.highestBidAmount === 'number' && route.highestBidAmount > 0 ? (
            <View className="flex-row items-center">
              <Ionicons name="trophy-outline" size={18} color="#f59e0b" />
              <Text className="text-amber-600 font-bold ml-2">
                {formatCurrency(route.highestBidAmount)}
              </Text>
            </View>
          ) : (
            <Text className="text-gray-500 text-sm italic">No bids yet</Text>
          )}
        </View>
        
        {/* Action Buttons */}
        <View className="flex-row justify-between">
          {route.status === 'INITIATED' || route.status === 'OPEN' ? (
            <>
              <PrimaryButton
                title="View Bids"
                onPress={() => router.push(`/pages/driver/ViewBids?routeId=${route.id}`)}
                style={{ flex: 1, marginRight: 4 }}
                textStyle={{ fontSize: 12 }}
              />
              <EditButton
                title="Edit"
                onPress={() => handleEditRoute(route)}
                style={{ flex: 1, marginHorizontal: 4 }}
                textStyle={{ fontSize: 12 }}
              />
              <DeleteButton
                title={deletingRoute === route.id ? "Deleting..." : "Delete"}
                onPress={() => handleDeleteRoute(route.id)}
                style={{ 
                  flex: 1, 
                  marginLeft: 4,
                  opacity: deletingRoute === route.id ? 0.6 : 1
                }}
                textStyle={{ fontSize: 12 }}
                disabled={deletingRoute === route.id}
              />
            </>
          ) : route.status === 'BOOKED' ? (
            <>
              <PrimaryButton
                title="View Details"
                onPress={() => router.push(`/pages/driver/ViewBids?routeId=${route.id}`)}
                style={{ flex: 1, marginRight: 8 }}
                textStyle={{ fontSize: 12 }}
              />
              <SecondaryButton
                title="Track Delivery"
                onPress={() => {
                  // TODO: Navigate to delivery tracking
                  Alert.alert('Track Delivery', 'Delivery tracking feature coming soon!');
                }}
                style={{ flex: 1, marginLeft: 8 }}
                textStyle={{ fontSize: 12 }}
              />
            </>
          ) : (
            <PrimaryButton
              title="View Details"
              onPress={() => router.push(`/pages/driver/ViewBids?routeId=${route.id}`)}
              style={{ flex: 1 }}
              textStyle={{ fontSize: 12 }}
            />
          )}
        </View>
      </PrimaryCard>
    );
  }, [router, currentTime, deletingRoute, driverId]); // Added currentTime to dependencies for real-time updates

  if (loading && !refreshing) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
        <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-200 bg-white">
          <Link href="/pages/driver/Notifications" className="items-center">
            <Ionicons name="notifications-outline" size={24} color="black" />
          </Link>
          <Text className="text-xl font-bold text-gray-900">My Routes</Text>
          <Link href="/pages/driver/Profile" className="items-center">
            <View className="flex-row items-center">
              <ProfileAvatar 
                useCurrentUser={true}
                size={32}
                className="mr-2"
              />
            </View>
          </Link>
        </View>
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#f97316" />
          <Text className="text-gray-600 mt-2">Loading routes...</Text>
        </View>
        
        {/* Bottom Navigation Bar */}
        <DriverBottomNavigation />
      </SafeAreaView>
    );
  }

  return (
    <VerificationGuard 
      featureName="My Routes"
      description="Create and manage your return routes, view bids, and track route status"
    >
      <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
        {/* Top Bar */}
        <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-200 bg-white">
          <Link href="/pages/driver/Notifications" className="items-center">
            <Ionicons name="notifications-outline" size={24} color="black" />
          </Link>
          <Text className="text-xl font-bold text-gray-900">My Routes</Text>
          <Link href="/pages/driver/Profile" className="items-center">
            <View className="flex-row items-center">
              <ProfileAvatar 
                useCurrentUser={true}
                size={32}
                className="mr-2"
              />
            </View>
          </Link>
        </View>

      {/* Filter Buttons Section */}
      <View className="flex-row justify-around p-4 bg-white border-b border-gray-200">
        <IndigoButton
          title="Active Routes"
          onPress={() => handleFilterChange('active')}
          style={{ 
            flex: 1, 
            marginRight: 8, 
            paddingVertical: 10, 
            paddingHorizontal: 16,
            backgroundColor: activeFilter === 'active' ? '#4f46e5' : '#e5e7eb'
          }}
          textStyle={{ 
            fontSize: 16,
            color: activeFilter === 'active' ? 'white' : '#6b7280'
          }}
        />
        <SecondaryButton
          title="Past Routes"
          onPress={() => handleFilterChange('past')}
          style={{ 
            flex: 1, 
            marginLeft: 8, 
            paddingVertical: 10, 
            paddingHorizontal: 16,
            backgroundColor: activeFilter === 'past' ? '#4f46e5' : '#e5e7eb'
          }}
          textStyle={{ 
            fontSize: 16,
            color: activeFilter === 'past' ? 'white' : '#6b7280'
          }}
        />
      </View>

      {/* Scrollable Content Section */}
      <ScrollView 
        className="flex-1" 
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 100 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refresh} colors={['#f97316']} />
        }
        showsVerticalScrollIndicator={false}
      >
        {error ? (
          <View className="flex-1 justify-center items-center py-10">
            <Ionicons name="alert-circle-outline" size={48} color="#ef4444" />
            <Text className="text-red-600 text-center mt-2 font-medium">Error loading routes</Text>
            <Text className="text-gray-600 text-center mt-1">{error}</Text>
            <TouchableOpacity 
              onPress={refresh}
              className="mt-4 bg-orange-500 px-6 py-2 rounded-lg"
            >
              <Text className="text-white font-medium">Try Again</Text>
            </TouchableOpacity>
          </View>
        ) : routes.length === 0 ? (
          <View className="flex-1 justify-center items-center py-10">
            <Ionicons name="car-outline" size={48} color="#9ca3af" />
            <Text className="text-gray-600 text-center mt-2 font-medium">
              No {activeFilter} routes found
            </Text>
            <Text className="text-gray-500 text-center mt-1">
              {activeFilter === 'active' 
                ? 'Create your first route to start receiving bids'
                : 'Your completed routes will appear here'
              }
            </Text>
          </View>
        ) : (
          routes.map(renderRouteCard)
        )}
      </ScrollView>

      {/* Bottom Navigation Bar */}
      <DriverBottomNavigation />
    </SafeAreaView>
    </VerificationGuard>
  );
};

export default MyRoutes;