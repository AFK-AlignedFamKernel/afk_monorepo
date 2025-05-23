'use client';

import React, { useState } from 'react';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import { useCreateToken, DeployTokenFormValues } from '../../hooks/useCreateToken';
import { useStarknet } from '../../hooks/useStarknet';
import { BondingType } from '../../types/token';
// import { WalletConnectButton } from '../account/WalletConnectButton';
import { useAccount } from '@starknet-react/core';
import { useFileUpload } from '@/hooks/useFileUpload';
import { useUIStore } from '@/store/uiStore';
import dynamic from 'next/dynamic';
import { useFileJsonUpload } from '@/hooks/useFileJsonUpload';

const WalletConnectButton = dynamic(() => import('@/components/account/starknet/WalletConnectButton').then(mod => mod.WalletConnectButtonController), {
  ssr: false,
});


interface TokenCreateFormProps {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

const validationSchema = Yup.object().shape({
  name: Yup.string().required('Token name is required'),
  symbol: Yup.string().required('Token symbol is required'),
  initialSupply: Yup.number()
    .required('Initial supply is required')
    .min(0, 'Initial supply must be positive'),
  bonding_type: Yup.string().required('Bonding type is required'),
  creator_fee_percent: Yup.number()
    .min(0, 'Fee must be positive')
    .max(100, 'Fee cannot exceed 100%'),
  metadata: Yup.object().shape({
    // url: Yup.string().url('Must be a valid URL'),
    twitter: Yup.string(),
    github: Yup.string(),
    telegram: Yup.string(),
    website: Yup.string().url('Must be a valid URL'),
  }),
});

export const TokenCreateForm: React.FC<TokenCreateFormProps> = ({
  onSuccess,
  onError,
}) => {
  const [showMetadata, setShowMetadata] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const fileUpload = useFileUpload()
  const fileJsonUpload = useFileJsonUpload()
  const { address } = useStarknet();
  const { showToast } = useUIStore();
  const { deployTokenAndLaunch, isLoading, error, deployToken, deployTokenAndLaunchWithMetadata } = useCreateToken();
  const { account } = useAccount();
  const initialValues: DeployTokenFormValues = {
    name: '',
    symbol: '',
    initialSupply: undefined,
    bonding_type: BondingType.Linear,
    creator_fee_percent: 0,
    contract_address_salt: '',
    metadata: {
      url: '',
      twitter: '',
      github: '',
      telegram: '',
      website: '',
    },
  };

  const handleSubmit = async (values: DeployTokenFormValues) => {
    // if (!address) {
    //   onError?.(new Error('Please connect your wallet first'));
    //   return;
    // }

    try {


      let imageUrl = '';
      let urlHash = '';

      if (file) {
        try {
          const result = await fileUpload.mutateAsync(file);
          console.log("result file upload", result);
          if (result.data.url) {
            imageUrl = result.data.url
            urlHash = result.data?.hash
          }
        } catch (error) {
          console.log("error",error)
          
        }
     
      }

      let res;


      console.log('imageUrl', imageUrl);
      values.metadata.url = imageUrl;
      console.log('values', values);

      let metadata = {
        url: values.metadata.url,
        twitter: values.metadata.twitter,
        github: values.metadata.github,
        telegram: values.metadata.telegram,
        website: values.metadata.website,
        description:values?.metadata?.description,
        nostr_event_id: values.metadata.nostr_event_id,
        ipfs_hash:undefined
      }

      try {
        
        
        const result = await fileJsonUpload.mutateAsync(file);
        
        metadata.ipfs_hash= result?.data?.hash
      } catch (error) {
        console.log("res json issue")
        
      }

      // return;
      const result = await deployTokenAndLaunch(values, metadata);
      // const result = await deployTokenAndLaunchWithMetadata(values, metadata);
      // const result = await deployTokenAndLaunch(values);
      if (result) {
        onSuccess?.();
      }

      showToast({
        message: 'Token created',
        type: 'success',
      });
    } catch (err) {
      onError?.(err as Error);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-6 rounded-lg shadow-lg">
      <div className="mb-6">
        <WalletConnectButton />
      </div>

      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
      >
        {({ errors, touched, handleChange }) => (
          <Form className="space-y-6">
            <div>
              <label className="block text-sm font-medium">
                Token Name
              </label>
              <Field
                type="text"
                name="name"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600"
              />
              {errors.name && touched.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium">
                Token Symbol
              </label>
              <Field
                type="text"
                name="symbol"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600"
              />
              {errors.symbol && touched.symbol && (
                <p className="mt-1 text-sm text-red-600">{errors.symbol}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Initial Supply
              </label>
              <Field
                type="number"
                name="initialSupply"
                step="any"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600"
              />
              {errors.initialSupply && touched.initialSupply && (
                <p className="mt-1 text-sm text-red-600">{errors.initialSupply}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Bonding Type
              </label>
              <Field
                as="select"
                name="bonding_type"
                // className="mt-1 block w-full text-black rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-black"
              >
                <option value={BondingType.Linear}>
                  <span>Linear</span>
                </option>
                <option value={BondingType.Exponential}>
                  <span>Exponential</span>
                </option>
              </Field>
              {errors.bonding_type && touched.bonding_type && (
                <p className="mt-1 text-sm text-red-600">{errors.bonding_type}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Creator Fee Percentage
              </label>
              <Field
                type="number"
                name="creator_fee_percent"
                step="any"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600"
              />
              {errors.creator_fee_percent && touched.creator_fee_percent && (
                <p className="mt-1 text-sm text-red-600">{errors.creator_fee_percent}</p>
              )}
            </div>

            <div>
              <button
                type="button"
                onClick={() => setShowMetadata(!showMetadata)}
                className="text-sm text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
              >
                {showMetadata ? 'Hide Metadata' : 'Show Metadata'}
              </button>

              {showMetadata && (
                <div className="mt-4 space-y-4">

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Image/GIF
                    </label>
                    <input type="file" id="file" className="nostr-form__input w-100" onChange={(e) => setFile(e.target.files?.[0] || null)} />


                    {errors.metadata?.url && touched.metadata?.url && (
                      <p className="mt-1 text-sm text-red-600">{errors.metadata.url}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Twitter
                    </label>
                    <Field
                      type="text"
                      name="metadata.twitter"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      GitHub
                    </label>
                    <Field
                      type="text"
                      name="metadata.github"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Telegram
                    </label>
                    <Field
                      type="text"
                      name="metadata.telegram"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Website
                    </label>
                    <Field
                      type="url"
                      name="metadata.website"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600"
                    />
                    {errors?.metadata?.website && touched.metadata?.website && (
                      <p className="mt-1 text-sm text-red-600">{errors?.metadata?.website}</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {error && (
              <div className="text-red-600 text-sm">
                {error.message}
              </div>
            )}

            <button
              type="submit"
              disabled={!address || isLoading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Creating Token...' : 'Create Token'}
            </button>

            <button
              type="button"
              onClick={() => {
                console.log('test');
                deployToken(initialValues);
              }}
            >
              Create token
            </button>
          </Form>
        )}
      </Formik>
    </div>
  );
}; 