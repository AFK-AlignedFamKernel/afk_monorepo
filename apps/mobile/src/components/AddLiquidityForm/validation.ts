import * as Yup from 'yup';

export const AddLiquidityValidationSchema = Yup.object().shape({
  amount: Yup.string()
    .required('Amount is required')
    .matches(/^\d*\.?\d*$/, 'Must be a valid number'),
  
  dexType: Yup.string()
    .required('DEX type is required')
    .oneOf(['UNRUGGABLE', 'EKUBO', 'JEDISWAP']),

  startingPrice: Yup.string().when('dexType', {
    is: (val: string) => val === 'UNRUGGABLE',
    then: () => Yup.string()
      .required('Starting price is required')
      .matches(/^\d*\.?\d*$/, 'Must be a valid number')
  }),

  teamAllocation: Yup.string().when('dexType', {
    is: (val: string) => val === 'UNRUGGABLE',
    then: () => Yup.string()
      .required('Team allocation is required')
      .test('valid-percentage', 'Must be between 0 and 100', (value) => {
        if (!value) return false;
        const num = Number(value);
        return !isNaN(num) && num >= 0 && num <= 100;
      })
  }),

  teamVestingPeriod: Yup.string().when('dexType', {
    is: (val: string) => val === 'UNRUGGABLE',
    then: () => Yup.string()
      .required('Vesting period is required')
      .test('min-days', 'Must be at least 1 day', (value) => {
        if (!value) return false;
        const days = Number(value);
        return !isNaN(days) && days >= 1;
      })
  }),

  teamVestingCliff: Yup.string().when('dexType', {
    is: (val: string) => val === 'UNRUGGABLE',
    then: () => Yup.string()
      .required('Vesting cliff is required')
      .test('min-days', 'Must be at least 0 days', (value) => {
        if (!value) return false;
        const days = Number(value);
        return !isNaN(days) && days >= 0;
      })
  }),

  hodlLimit: Yup.string().when('dexType', {
    is: (val: string) => val === 'UNRUGGABLE',
    then: () => Yup.string()
      .required('Hodl limit is required')
      .matches(/^\d*\.?\d*$/, 'Must be a valid number')
  }),

  liquidityLockTime: Yup.string().when('dexType', {
    is: (val: string) => val === 'UNRUGGABLE',
    then: () => Yup.string()
      .required('Lock time is required')
      .test('min-days', 'Must be at least 1 day', (value) => {
        if (!value) return false;
        const days = Number(value);
        return !isNaN(days) && days >= 1;
      })
  }),

  ekuboPrice: Yup.string().when('dexType', {
    is: (val: string) => val === 'EKUBO',
    then: () => Yup.string()
      .required('Price is required')
      .matches(/^\d*\.?\d*$/, 'Must be a valid number')
      .test('min-price', 'Price must be greater than 0', (value) => {
        if (!value) return false;
        const price = Number(value);
        return !isNaN(price) && price > 0;
      })
  }),

  minLiquidity: Yup.string().when('dexType', {
    is: (val: string) => val === 'JEDISWAP',
    then: () => Yup.string()
      .required('Minimum liquidity is required')
      .matches(/^\d*\.?\d*$/, 'Must be a valid number')
      .test('min-liquidity', 'Minimum liquidity must be greater than 0', (value) => {
        if (!value) return false;
        const liquidity = Number(value);
        return !isNaN(liquidity) && liquidity > 0;
      })
  }),

  liquidityType: Yup.string().when('dexType', {
    is: (val: string) => val === 'EKUBO' || val === 'JEDISWAP',
    then: () => Yup.string()
      .required('Liquidity type is required')
      .oneOf(['EKUBO_NFT', 'JEDISWAP_LP'], 'Invalid liquidity type')
  })
});