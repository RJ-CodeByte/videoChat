import {Image, StyleSheet, Text, View} from 'react-native';
import React from 'react';
import CustomButton from './button';

export default function GettingCalls(props) {
  
  return (
    <View style={styles.container}>
      <Image
        style={styles.image}
        source={require('../../assets/person1.jpg')}
      />
      <View style={styles.bContainer}>
        <CustomButton
          style={{marginRight: 30}}
          iconName="phone"
          backgroundColor={'green'}
          onPress={props.join}
        />
        <CustomButton
          style={{marginLeft: 30}}
          iconName="phone"
          backgroundColor={'red'}
          onPress={props.hangup}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  image: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  bContainer: {
    flexDirection: 'row',
    bottom: 40,
  },
});
