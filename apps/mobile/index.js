import 'fast-text-encoding';
import './src/app/Shims';
import { AppRegistry } from 'react-native';
import App from './src/app/App';
import { name as appName } from './app.json';

// import registerRootComponent from 'expo/build/launch/registerRootComponent';
import { registerRootComponent } from 'expo';
import {Wrapper} from './src/app/Wrapper';

registerRootComponent(Wrapper);

AppRegistry.registerComponent(appName, () => App);

// import { registerRootComponent } from 'expo';
// import App from './src/App'; // or wherever your App component is

// registerRootComponent(App);
// // import 'fast-text-encoding';
// // import './src/app/Shims';
// // import { AppRegistry } from 'react-native';
// // import App from './src/app/App';
// // import { name as appName } from './app.json';

// // // import registerRootComponent from 'expo/build/launch/registerRootComponent';
// // import { registerRootComponent } from 'expo';
// // import {Wrapper} from './src/app/Wrapper';

// // registerRootComponent(Wrapper);

// // AppRegistry.registerComponent(appName, () => App);