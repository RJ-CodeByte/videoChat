import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import React from 'react';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';

export default function CustomButton(props) {
  return (
    <View>
      <TouchableOpacity
        onPress={props.onPress}
        style={[
          {backgroundColor: props.backgroundColor},
          props.style,
          styles.button,
        ]}>
        <FontAwesome5 name={props.iconName} color="white" size={20} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  button:{
    width:60,
    height:60,
    padding:10,
    elevation:10,
    justifyContent:'center',
    alignItems:'center',
    alignSelf:'center',
    borderRadius:100,
  },
});
