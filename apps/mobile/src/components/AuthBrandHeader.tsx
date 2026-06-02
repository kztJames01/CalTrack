import React from 'react';
import { View, Text, Image } from 'react-native';
import { authScreenStyles } from '../styles/authScreenStyles';

const savorSymbol = require('../../assets/images/icon.png');

export function AuthBrandHeader() {
  return (
    <View style={authScreenStyles.brandRow}>
      <Image source={savorSymbol} style={authScreenStyles.logoImage} resizeMode="contain" />
      <View>
        <Text style={authScreenStyles.brandText}>Savor</Text>
        <Text style={authScreenStyles.brandSubtext}>AI Calorie Tracker</Text>
      </View>
    </View>
  );
}
