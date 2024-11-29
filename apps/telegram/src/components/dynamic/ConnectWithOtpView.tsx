// import {Button, Text} from '@chakra-ui/react';
// import {useConnectWithOtp, useDynamicContext} from '@dynamic-labs/sdk-react-core';
// import {FC, FormEventHandler, useState} from 'react';

// const ConnectWithOtpView: FC = () => {
//   const {user} = useDynamicContext();
//   const [isOpenMenuInfo, setIssOpenMenuInfo] = useState<boolean | undefined>(false);
//   const [isOpenCreateAccount, setIsOpenCreateAccount] = useState<boolean | undefined>(false);

//   const {connectWithEmail, verifyOneTimePassword, connectWithSms} = useConnectWithOtp();

//   const onSubmitEmailHandler: FormEventHandler<HTMLFormElement> = async (event) => {
//     event.preventDefault();

//     const email = event.currentTarget.email.value;

//     await connectWithEmail(email);
//   };

//   const onSubmitOtpHandler: FormEventHandler<HTMLFormElement> = async (event) => {
//     event.preventDefault();

//     const otp = event.currentTarget.otp.value;

//     await verifyOneTimePassword(otp);
//   };

//   return (
//     <div>
//       <form key="email-form" onSubmit={onSubmitEmailHandler}>
//         <input type="email" name="email" placeholder="Email" />
//         <button type="submit">Submit</button>
//       </form>

//       <form key="otp-form" onSubmit={onSubmitOtpHandler}>
//         <input type="text" name="otp" placeholder="OTP" />
//         <button type="submit">Submit</button>
//       </form>

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
//     </div>
//   );
// };

// export default ConnectWithOtpView;
