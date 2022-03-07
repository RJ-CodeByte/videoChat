import React, {useState, useRef, useEffect} from 'react';
import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import CustomButton from './src/components/button';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import GettingCalls from './src/components/GettingCalls';
import Video from './src/components/video';
import {
  MediaStream,
  RTCPeerConnection,
  RTCIceCandidate,
  RTCSessionDescription,
} from 'react-native-webrtc';
import Utils from './src/utils/utils';
import firestore from '@react-native-firebase/firestore';
import InCallManager from 'react-native-incall-manager';

const configuration = {iceServers: [{url: 'stun:stun.l.google.com:19302'}]};

export default function App() {
  const [localStream, setLocalStream] = useState(MediaStream | null);
  const [remoteStream, setRemoteStream] = useState(MediaStream | null);
  const [gettingCall, setGettingCall] = useState(false);
  const pc = useRef(RTCPeerConnection);
  const connecting = useRef(false);

  useEffect(() => {
    const cRef = firestore().collection('meet').doc('chatId');

    const subscribe = cRef.onSnapshot(snapshot => {
      const data = snapshot.data();

      // on answer start  the call
      if (pc.current && !pc.current.remoteDescription && data && data.answer) {
        pc.current.setRemoteDescription(new RTCSessionDescription(data.answer));
      }

      // if there is offer for chatId set the getting call flag
      if (data && data.offer && !connecting.current) {
        setGettingCall(true);
      }
    });

    // On delete of collection call hangup
    // the other side has clicked on hangup
    const subscribeDelete = cRef.collection('callee').onSnapshot(snapshot => {
      snapshot.docChanges().forEach(change => {
        if (change.type == 'removed') {
          hangup();
          InCallManager.stopRingtone();
          InCallManager.stop();
        }
      });
    });

    return () => {
      subscribe();
      subscribeDelete();
    };
  }, []);

  const setupWebrtc = async () => {
    try {
    pc.current = new RTCPeerConnection(configuration);

    //  get the audio and  video stream for the call
    const stream = await Utils.getStream();
    if (stream) {
      setLocalStream(stream);
      pc.current.addStream(stream);
    }

    //Set the remote stream once it available
    pc.current.onaddstream = function (event) {
      setRemoteStream(event.stream);
    };
  } catch (error) {
   console.log("Error While setup...",error);   
  }
  };

  
  const create = async () => {
    try {
    console.log('Calling');
    connecting.current = true;

    // setUp webrtc
    await setupWebrtc();

    // document for the call
    const cRef = firestore().collection('meet').doc('chatId');

    // Exchange the ICE candidate between the caller and callee\
    collectIceCandidates(cRef, 'caller', 'callee');

    if (pc.current) {
      // create  the offer for the call
      // Store the under the document
      const offer = await pc.current.createOffer();
      pc.current.setLocalDescription(offer);
      const cWithOffer = {
        offer: {
          type: offer.type,
          sdp: offer.sdp,
        },
      };
      cRef.set(cWithOffer);
    }
  } catch (error) {
   console.log("Error...",error);   
  }
  };

  const join = async () => {
    console.log('Joining The call');
    connecting.current = true;
    setGettingCall(false);
    InCallManager.stopRingtone();
    InCallManager.stop();

    const cRef = firestore().collection('meet').doc('chatId');
    const offer = (await cRef.get()).data()?.offer;

    if (offer) {
      //Setup Webrtc
      await setupWebrtc();

      // Exchnage the ICE candidate
      // Check the parameters, Its reserved. since the Joining part is callee
      collectIceCandidates(cRef, 'callee', 'caller');

      if (pc.current) {
        pc.current.setRemoteDescription(new RTCSessionDescription(offer));

        // Create the answer for the call
        // Update the document with answer
        const answer = await pc.current.createAnswer();
        pc.current.setLocalDescription(answer);
        const cWithAnswer = {
          answer: {
            type: answer.type,
            sdp: answer.sdp,
          },
        };
        cRef.update(cWithAnswer);
      }
    }
  };

  /* 
  For disconnecting the call close the connection, 
  release the stream And delete the document fot the call
   */

  const hangup = async () => {
    setGettingCall(false);
    connecting.current = false;
    streamCleanUp();
    firestoreCleanUp();
    if (pc.current) {
      // pc.current = null;
      pc.current.close();
    }
    InCallManager.stopRingtone();
    InCallManager.stop();
  };

  const streamCleanUp = async () => {
    if (localStream) {
      localStream.getTracks().forEach(t => t.stop());
      localStream.release();
    }
    setLocalStream(null);
    setRemoteStream(null);
  };
  const firestoreCleanUp = async () => {
    const cRef = firestore().collection('meet').doc('chatId');

    if (cRef) {
      const calleeCandidate = await cRef.collection('callee').get();
      calleeCandidate.forEach(async candidate => {
        await candidate.ref.delete();
      });

      const callerCandidate = await cRef.collection('caller').get();
      callerCandidate.forEach(async candidate => {
        await candidate.ref.delete();
      });
      cRef.delete();
    }
  };

  //Helper Function

  const collectIceCandidates = async (cRef, localName, remoteName) => {
    // console.log('REF: ' + JSON.stringify(cRef));
    const candidateCollection = cRef.collection(localName);

    if (pc.current) {
      //on New ICE  candidate add it to firestore
      pc.current.onicecandidate = event => {
        if (event.candidate) {
          candidateCollection.add(event.candidate);
        }
      };
    }

    //Get the ICE candidate added to firestore and update the local PC
    cRef.collection(remoteName).onSnapshot(snapshot => {
      snapshot.docChanges().forEach(change => {
        if (change.type == 'added') {
          const candidate = new RTCIceCandidate(change.doc.data());
          pc.current?.addIceCandidate(candidate);
        }
      });
    });
  };

  //display the gattingCall Component
  if (gettingCall) {
    InCallManager.startRingtone('_DEFAULT_');
    return <GettingCalls hangup={hangup} join={join} />;
  }

  // Display local stream on calling
  // Display both local and remote stream once call is connected
  // console.log('stream' + JSON.stringify(localStream));
  if (localStream) {
    return (
      <Video
        hangup={hangup}
        localStream={localStream}
        remoteStream={remoteStream}
      />
    );
  }

  //display the call button
  return (
    <View style={styles.container}>
      <CustomButton
        iconName="video"
        backgroundColor={'grey'}
        onPress={create}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
