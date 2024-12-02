export type ValidationErrors = {
  amount?: string;
  dexType?: string;
  startingPrice?: string;
  teamAllocation?: string;
  teamVestingPeriod?: string;
  teamVestingCliff?: string;
  hodlLimit?: string;
  liquidityLockTime?: string;
  ekuboPrice?: string;
  minLiquidity?: string;
  liquidityType?: string;
};

export const validateAddLiquidity = (values: any): ValidationErrors => {
  const errors: ValidationErrors = {};

 
  if (!values.amount) {
    errors.amount = 'Amount is required';
  } else if (!/^\d*\.?\d*$/.test(values.amount)) {
    errors.amount = 'Must be a valid number';
  }

  // DEX type validation  
  if (!values.dexType) {
    errors.dexType = 'DEX type is required';
  } else if (!['UNRUGGABLE', 'EKUBO', 'JEDISWAP'].includes(values.dexType)) {
    errors.dexType = 'Invalid DEX type';
  }

  // Unruggable specific validations
  if (values.dexType === 'UNRUGGABLE') {
    if (!values.startingPrice) {
      errors.startingPrice = 'Starting price is required';
    }
    
    if (!values.teamAllocation) {
      errors.teamAllocation = 'Team allocation is required';
    } else {
      const allocation = Number(values.teamAllocation);
      if (isNaN(allocation) || allocation < 0 || allocation > 100) {
        errors.teamAllocation = 'Must be between 0 and 100';
      }
    }

    if (!values.liquidityLockTime) {
      errors.liquidityLockTime = 'Lock time is required';
    } else {
      const days = Number(values.liquidityLockTime);
      if (isNaN(days) || days < 1) {
        errors.liquidityLockTime = 'Must be at least 1 day';
      }
    }
  }



  return errors;
};