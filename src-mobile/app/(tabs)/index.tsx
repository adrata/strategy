/**
 * Home Tab
 * Main dashboard/home screen
 */

import { View, Text } from 'react-native';

export default function HomeScreen() {
  return (
    <View className="flex-1 justify-center items-center p-6 bg-white">
      <Text className="text-2xl font-bold mb-2 text-black">Welcome to Adrata</Text>
      <Text className="text-base text-gray-600">Mobile app is ready!</Text>
    </View>
  );
}

