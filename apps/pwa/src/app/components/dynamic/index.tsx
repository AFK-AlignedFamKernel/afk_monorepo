// import {Box, Button, Text} from '@chakra-ui/react';
// import {useDynamicContext} from '@dynamic-labs/sdk-react-core';
// import {FC, useState} from 'react';

// // import ConnectWithOtpView from './ConnectWithOtpView';

// const DynamicManagement: FC = () => {
//   const {user} = useDynamicContext();

//   const [isOpenCreateAccount, setIsOpenCreateAccount] = useState<boolean | undefined>(false);
//   const [isOpenMenuInfo, setIssOpenMenuInfo] = useState<boolean | undefined>(false);

//   return (
//     <Box>
//       {user && !isOpenMenuInfo && (
//         <Button
//           onClick={() => {
//             setIssOpenMenuInfo(!isOpenMenuInfo);
//           }}
//         >
//           Open info
//         </Button>
//       )}
//       {!!user && isOpenMenuInfo && (
//         <>
//           {' '}
//           <p>Authenticated user:</p>
//           <Text>Email {user?.verifiedCredentials[1]?.email}</Text>
//           {/* <pre>
//             {JSON.stringify(user, null, 2)}
//           </pre> */}
//         </>
//       )}

//       <Button
//         onClick={() => {
//           setIsOpenCreateAccount(!isOpenCreateAccount);
//         }}
//       >
//         Create account
//       </Button>
//       {/* {isOpenCreateAccount && (
//         <Box>
//           <ConnectWithOtpView></ConnectWithOtpView>
//         </Box>
//       )} */}
//     </Box>
//   );
// };

// export default DynamicManagement;
