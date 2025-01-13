import './PixelSelector.css';
import '../utils/Styles.css';

import React, { useEffect, useState } from 'react';
import { useContractAction } from "afk_sdk";
import { ART_PEACE_ADDRESS } from "common"

import EraserIcon from '../resources/icons/Eraser.png';

const PixelSelector = (props) => {
  //Pixel Call Hook
  const { mutate: mutatePlaceShield } = useContractAction()

  const shieldPixelFn = async () => {

    //Add a default 3MIN Shield time.
    const timestamp = props.shieldTime || Math.floor(Date.now() / 1000) + (3 * 60);
    if (!props.address || !props.account ||  props.selectedShieldPixels.length === 0 ) return;
    //Check for wallet or account
    const callProps = (entry) => props.wallet ?
      props.selectedShieldPixels.map((item) => {
        return {
          calldata: [item, timestamp],
          contract_address: ART_PEACE_ADDRESS?.['0x534e5f5345504f4c4941'],
          entry_point: entry
        }
      })
      :
      props.selectedShieldPixels.map((item) => {
        return {
          calldata: [item, timestamp],
          contractAddress: ART_PEACE_ADDRESS?.['0x534e5f5345504f4c4941'],
          entrypoint: entry

        }
      })

    mutatePlaceShield({
      account: props.account,
      wallet: props.wallet,
      callProps: callProps("place_pixel_shield")
    }, {
      onError(err) {
        console.log(err)
      },
      onSuccess(data) {
        console.log(data, "Success")
      }
    })
  };

  // Track when a placement is available


  const [placementTimer, setPlacementTimer] = useState('XX:XX');
  const [placementMode, setPlacementMode] = useState(false);
  const [ended, setEnded] = useState(false);

  useEffect(() => {
    if (props.queryAddress === '0' || !props.account?.address) {
      setPlacementTimer('Login to Play');
      return;
    }
    if (props.availablePixels > 0 || props.account?.address) {
      let amountAvailable = props.availablePixels - props.availablePixelsUsed;
      if (amountAvailable > 1) {
        setPlacementTimer('Place Pixels');
        return;
      } else if (amountAvailable === 1) {
        setPlacementTimer('Place Pixel');
        return;
      } else {
        setPlacementTimer('Out of Pixels');
        return;
      }
    } else {
      // TODO: Use lowest timer out of base, chain, faction, ...
      setPlacementTimer(props.basePixelTimer);
      props.clearAll();
    }
    if (
      placementTimer === '0:00' &&
      placementMode &&
      placementTimer !== 'Out of Pixels' &&
      placementTimer !== 'Login to Play'
    ) {
      setEnded(true);
    } else {
      setEnded(false);
    }
  }, [props.availablePixels, props.availablePixelsUsed, props.basePixelTimer, props.queryAddress, placementTimer, placementMode, props, props.account?.address]);

  const toSelectorMode = (event) => {
    event.preventDefault();
    // Only works if not hitting the close button
    if (event.target.classList.contains('Button__close')) {
      return;
    }

    if (props.queryAddress === '0') {
      props.setActiveTab('Account');
      return;
    }

    if (props.availablePixels > props.availablePixelsUsed) {
      props.setSelectorMode(true);
      props.setIsEraserMode(false);
      setPlacementMode(true);
    }
  };

  const selectColor = (idx) => {
    props.setSelectedColorId(idx);
    props.setSelectorMode(false);
  };

  const cancelSelector = () => {
    props.setSelectedColorId(-1);
    props.setSelectorMode(false);
    props.setIsEraserMode(false);
    setPlacementMode(false);
    setEnded(false);
  };

  return (
    <div className='PixelSelector'>
      {(props.selectorMode || ended) && (
        <div>
          <div className='PixelSelector__selector'>
            <div className='PixelSelector__selector__colors'>
              {props.colors.map((color, idx) => {
                return (
                  <div
                    className='PixelSelector__color PixelSelector__color__selectable'
                    key={idx}
                    style={{ backgroundColor: `#${color}FF` }}
                    onClick={() => selectColor(idx)}
                  ></div>
                );
              })}
            </div>
            <div className='Button__close' onClick={() => cancelSelector()}>
              x
            </div>
          </div>
          <div>
            <div onClick={props.toggleShieldMode} className='Button__primary Text__large'>
              <p className='PixelSelector__text'>{props.isShieldMode ? "Exit Shield Mode" : "Enter Shield Mode"}</p>
            </div>
            <div  onClick={() => [props.registerShieldArea(), shieldPixelFn()]} className='Button__primary Text__large'>
              <p className='PixelSelector__text'>Shield Pixel for (3) minutes</p>
            </div>
          </div>
        </div>
      )}
      {!props.selectorMode && !ended && (
        <div
          className={
            'Button__primary Text__large ' +
            (props.availablePixels > props.availablePixelsUsed
              ? ''
              : 'PixelSelector__button--invalid')
          }
          onClick={toSelectorMode}
        >
          <p className='PixelSelector__text'>{placementTimer}</p>
          {props.availablePixels > (props.basePixelUp ? 1 : 0) && (
            <div className='PixelSelector__extras'>
              <div
                style={{
                  margin: '0 1rem',
                  height: '2.4rem',
                  width: '0.5rem',
                  borderRadius: '0.25rem',
                  backgroundColor: 'rgba(0, 0, 0, 0.3)'
                }}
              ></div>
              <p className='PixelSelector__text'>
                {props.availablePixels - props.availablePixelsUsed} left
              </p>
            </div>
          )}
          {props.selectedColorId !== -1 && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'center',
                alignItems: 'center',
                margin: '0 0 0 0.5rem'
              }}
            >
              <div
                className='PixelSelector__color'
                style={{
                  backgroundColor: `#${props.colors[props.selectedColorId]}FF`
                }}
              ></div>
              <div
                className='Button__close'
                style={{ marginLeft: '1rem' }}
                onClick={() => cancelSelector()}
              >
                x
              </div>
            </div>
          )}
          {props.isEraserMode && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'center',
                alignItems: 'center',
                margin: '0 0 0 0.5rem'
              }}
            >
              <div
                className='PixelSelector__color'
                style={{
                  backgroundColor: '#FFFFFF'
                }}
              >
                <img
                  src={EraserIcon}
                  alt='Eraser'
                  style={{
                    width: '2rem',
                    height: '2rem'
                  }}
                />
              </div>
              <div
                className='Button__close'
                style={{ marginLeft: '1rem' }}
                onClick={() => cancelSelector()}
              >
                x
              </div>
            </div>
          )}
        </div>
      )}



    </div>
  );
};

export default PixelSelector;
