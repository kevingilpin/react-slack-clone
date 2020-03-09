import firebase from 'firebase/app';
import "firebase/auth";
import "firebase/database";
import "firebase/storage";

var firebaseConfig = {
    apiKey: "AIzaSyAMh3IkXh1n3Z7DN8911DAQXVNkvkbo2es",
    authDomain: "react-slack-clone-c91c2.firebaseapp.com",
    databaseURL: "https://react-slack-clone-c91c2.firebaseio.com",
    projectId: "react-slack-clone-c91c2",
    storageBucket: "react-slack-clone-c91c2.appspot.com",
    messagingSenderId: "761780546446",
    appId: "1:761780546446:web:3853844032c9841edf12df"
};

firebase.initializeApp(firebaseConfig);

export default firebase;