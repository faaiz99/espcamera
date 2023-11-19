/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */
import React from 'react';
import {Button, SafeAreaView, StyleSheet, TextInput} from 'react-native';
import {RNCamera} from 'react-native-camera';
import {LogBox, PermissionsAndroid, Alert} from 'react-native';
import io from 'socket.io-client';
import ImageResizer from 'react-native-image-resizer';
import RNFS from 'react-native-fs';

LogBox.ignoreLogs(['ViewPropTypes']);
function App(): JSX.Element {
  const [intervalId, setIntervalId] = React.useState<NodeJS.Timeout | null>(null);
  const cameraRef = React.useRef<RNCamera | null>(null);
  const [socketLink, setSocketLink] = React.useState('http://192.168.100.19:3000/');
  const [socket, setSocket] = React.useState<any>(null);

  const connectWithSocket = async () => {
    clearInterval(intervalId);
    try{
      let skt = io(socketLink);
      setSocket(skt);
    }
    catch(e){
      Alert.alert('Error', 'Invalid socket link');
    }
  }

  React.useEffect(() => {
    if (socket) {
      console.log('connected');
      setIntervalId(
        setInterval(() => {
          takePicture();
        }, 100),
      );

      socket.onmessage = (e) => {
        console.log(e.data);
      };

      socket.onerror = (e) => {
        console.log(e.message);
      };

      socket.onclose = (e) => {
        console.log(e.code, e.reason);
      };
    }
    else{
      //delete interval id
      clearInterval(intervalId);
    }
  }, [socket]);

  const takePicture = async () => {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.CAMERA,
      {
        title: 'Camera Permission',
        message: 'App needs access to your camera',
        buttonNeutral: 'Ask Me Later',
        buttonNegative: 'Cancel',
        buttonPositive: 'OK',
      },
    );
    if (socket && granted && cameraRef.current) {
      const options = {quality: 0.5, base64: true};
      const data = await cameraRef.current.takePictureAsync(options);
      
      // Resize the image
      const resizedImage = await ImageResizer.createResizedImage(
        data.uri,
        data.width * (400 / data.height),
        400,
        'JPEG',
        100,
        0,
        undefined,
        false,
        { mode: 'contain', onlyScaleDown: false },
      );
      // Read the resized image as a base64 string
      const base64 = await RNFS.readFile(resizedImage.uri, 'base64');
      // Send the resized image
      socket.emit('image', {base64});
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <TextInput
        style={styles.input}
        onChangeText={setSocketLink}
        value={socketLink}
        placeholder="Enter socket link"
      />
      <RNCamera
        ref={cameraRef}
        style={styles.preview}
        type={RNCamera.Constants.Type.back}
      />
      <Button title="Connect" onPress={connectWithSocket} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column',
    backgroundColor: 'white',
  },
  preview: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  input: {
    height: 40,
    margin: 12,
    borderWidth: 1,
  },
});
export default App;
