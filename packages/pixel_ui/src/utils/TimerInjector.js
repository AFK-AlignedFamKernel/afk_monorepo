import {useContractWrite} from '@starknet-react/core';
import {useEffect, useState} from 'react';

import {fetchWrapper} from '../services/apiService';
import {getTodaysStartTime} from '../services/apiService.js';
import {devnetMode} from '../utils/Consts.js';

// TODO: CHange props
export const TimerInjector = ({children, props, isLastDay, endTimestamp}) => {
  // Timing
  const [startTimeApiState, setStartTimeApiState] = useState({
    loading: null,
    error: '',
    data: null,
  });
  useEffect(() => {
    const fetchStartTime = async () => {
      try {
        setStartTimeApiState((prevState) => ({
          ...prevState,
          loading: true,
        }));
        const result = await getTodaysStartTime();
        setStartTimeApiState((prevState) => ({
          ...prevState,
          data: result?.data,
          loading: false,
        }));
      } catch (error) {
        // Handle or log the error as needed
        setStartTimeApiState((prevState) => ({
          ...prevState,
          error,
          loading: false,
        }));
        console.error('Error fetching start time:', error);
      }
    };
    fetchStartTime();
  }, []);

  const [calls, setCalls] = useState([]);
  const increaseDayIndexCall = () => {
    if (devnetMode) return;
    if (!props.address || !props.artPeaceContract) return;
    // TODO: Check valid inputs & expand calldata
    setCalls(props?.artPeaceContract?.populateTransaction['increase_day_index']());
  };

  useEffect(() => {
    const increaseDayIndex = async () => {
      if (devnetMode) return;
      if (calls.length === 0) return;
      await writeAsync();
      // TODO: Update the UI with the new state
    };
    increaseDayIndex();
  }, [calls]);

  const {writeAsync} = useContractWrite({
    calls,
  });

  const [timeLeftInDay, setTimeLeftInDay] = useState('');
  const [newDayAvailable, setNewDayAvailable] = useState(false);
  const startNextDay = async () => {
    if (!newDayAvailable) {
      return;
    }
    if (!devnetMode) {
      increaseDayIndexCall(props.questId, []);
      return;
    }
    const response = await fetchWrapper(`increase-day-devnet`, {
      mode: 'cors',
      method: 'POST',
    });
    if (response.result) {
      console.log(response.result);
    }
  };

  useEffect(() => {
    const calculateTimeLeft = () => {
      if (!startTimeApiState.data) {
        return;
      }
      const now = new Date();
      let thisDayEnd = now;
      // TODO: isLastDay || game ended
      if (isLastDay) {
        thisDayEnd = new Date(endTimestamp * 1000);
      } else {
        thisDayEnd = new Date(startTimeApiState.data);
        thisDayEnd.setHours(thisDayEnd.getHours() + 24);
      }

      const difference = thisDayEnd - now;
      if (difference < 0 || devnetMode) {
        setNewDayAvailable(true);
      } else {
        setNewDayAvailable(false);
      }

      const hoursFinal = Math.floor((difference / (1000 * 60 * 60)) % 24);
      const minutesFinal = Math.floor((difference / 1000 / 60) % 60);
      const secondsFinal = Math.floor((difference / 1000) % 60);

      const formattedTimeLeft = `${hoursFinal.toString().padStart(2, '0')}:${minutesFinal
        .toString()
        .padStart(2, '0')}:${secondsFinal.toString().padStart(2, '0')}`;
      setTimeLeftInDay(formattedTimeLeft);
    };
    calculateTimeLeft();

    const interval = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(interval);
  }, [startTimeApiState.data]);

  return children({timeLeftInDay, newDayAvailable, startNextDay});
};
