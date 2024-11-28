import * as Yup from 'yup';

export const AddLiquidityValidationSchema = Yup.object().shape({
  amount: Yup.string()
    .required('Amount is required')
    .matches(/^\d*\.?\d*$/, 'Must be a valid number'),
  dexType: Yup.string()
    .oneOf(['EKUBO', 'JEDISWAP', 'UNRUGGABLE'], 'Invalid DEX type')
    .required('DEX type is required'),
    
  // Unruggable specific validations
  startingPrice: Yup.string()
    .when('dexType', {
      is: 'UNRUGGABLE',
      then: (schema) => schema
        .required('Starting price is required')
        .matches(/^\d*\.?\d*$/, 'Must be a valid number'),
    }),
  liquidityLockTime: Yup.string()
    .when('dexType', {
      is: 'UNRUGGABLE',
      then: (schema) => schema
        .required('Lock time is required')
        .matches(/^\d+$/, 'Must be a whole number')
        .test('min-days', 'Must be at least 7 days', (value) => 
          value ? parseInt(value) >= 7 : false
        ),
    }),

  // Ekubo specific validations
  ekuboPrice: Yup.string()
    .when('dexType', {
      is: 'EKUBO',
      then: (schema) => schema
        .required('Price is required')
        .matches(/^\d*\.?\d*$/, 'Must be a valid number'),
    }),

  // Jediswap specific validations
  minLiquidity: Yup.string()
    .when('dexType', {
      is: 'JEDISWAP',
      then: (schema) => schema
        .required('Minimum liquidity is required')
        .matches(/^\d*\.?\d*$/, 'Must be a valid number'),
    }),
});