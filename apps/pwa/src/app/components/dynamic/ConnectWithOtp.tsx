import { FC, FormEventHandler } from 'react';
import { useConnectWithOtp, useDynamicContext } from '@dynamic-labs/sdk-react-core';

const ConnectWithOrpView: FC = () => {
  const { user } = useDynamicContext()

  const { connectWithEmail, verifyOneTimePassword } = useConnectWithOtp();

  const onSubmitEmailHandler: FormEventHandler<HTMLFormElement> = async (
    event,
  ) => {
    event.preventDefault();

    const email = event.currentTarget.email.value;

    await connectWithEmail(email);
  };

  const onSubmitOtpHandler: FormEventHandler<HTMLFormElement> = async (
    event,
  ) => {
    event.preventDefault();

    const otp = event.currentTarget.otp.value;

    await verifyOneTimePassword(otp);
  };

  return (
    <div>
      <form key='email-form' onSubmit={onSubmitEmailHandler}>
        <input type='email' name='email' placeholder='Email' />
        <button type='submit'>Submit</button>
      </form>

      <form key='otp-form' onSubmit={onSubmitOtpHandler}>
        <input type='text' name='otp' placeholder='OTP' />
        <button type='submit'>Submit</button>
      </form>

      {!!user && (
        <>    <p>Authenticated user:</p>
          <pre>
            {JSON.stringify(user, null, 2)}
          </pre>
        </>
      )}
    </div>
  )
}
