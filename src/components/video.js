import {StyleSheet, Text, View} from 'react-native';
import React from 'react';
import CustomButton from './button';
import {RTCView} from 'react-native-webrtc';

function ButtonContainer(props) {
  return (
    <View style={styles.bContainer}>
      <CustomButton
        iconName="phone"
        backgroundColor={'red'}
        onPress={props.hangup}
      />
    </View>
  );
}

export default function Video(props) {
  // On call we will just display the local stream
  if (props.localStream && !props.remoteStream) {
    return (
      <View style={styles.container}>
        <RTCView
          streamURL={props.localStream.toURL()}
          objectFit={'cover'}
          style={styles.video}
        />
        <ButtonContainer hangup={props.hangup} />
      </View>
    );
  }
  // Once the call is connected we will display the local stream on top of remote stream
  if (props.localStream && props.remoteStream) {
    return (
      <View style={styles.container}>
        <RTCView
          streamURL={props.remoteStream.toURL()}
          objectFit={'cover'}
          style={styles.video}
        />
        <RTCView
          streamURL={props.localStream.toURL()}
          objectFit={'cover'}
          style={styles.videoLocal}
        />
        <ButtonContainer hangup={props.hangup} />
      </View>
    );
  }
  return <ButtonContainer hangup={props.hangup} />;
}

const styles = StyleSheet.create({
  bContainer: {
    flexDirection: 'row',
    bottom: 30,
  },
  container: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  video: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  videoLocal: {
    position: 'absolute',
    width: 100,
    height: 150,
    top: 0,
    left: 20,
    elevation: 10,
  },
});
