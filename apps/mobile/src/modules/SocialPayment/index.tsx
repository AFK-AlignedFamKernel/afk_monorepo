// 'use dom';
// import SetupScreen from './setup';
// import {AppRender} from 'pixel_ui';

// export const SocialPaymentView: React.FC = () => {
//   return (
//     <>
//       {/* <SetupScreen /> */}
//       <AppRender
//         artPeaceAddress={process.env.EXPO_PUBLIC_CANVAS_STARKNET_CONTRACT_ADDRESS}
//         nftCanvasAddress={process.env.EXPO_PUBLIC_CANVAS_NFT_CONTRACT_ADDRESS}
//         usernameAddress={process.env.EXPO_PUBLIC_USERNAME_STORE_CONTRACT_ADDRESS}
//       ></AppRender>
//     </>
//   );
// };

// import {useAutoConnect} from 'afk_react_sdk';
import SetupScreen from './setup';

export const SocialPaymentView: React.FC = () => {
  return (
    <>
      <SetupScreen />
    </>
  );
};
