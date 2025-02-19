

import './CanvasContainer.css';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import canvasConfig from '../configs/canvas.config.json';
import { fetchWrapper } from '../services/apiService.js';
import Canvas from './Canvas';
import ExtraPixelsCanvas from './ExtraPixelsCanvas.js';
import NFTSelector from './NFTSelector.js';
import TemplateCreationOverlay from './TemplateCreationOverlay.js';
import TemplateOverlay from './TemplateOverlay.js';
import { useContractAction } from "afk_sdk";
import { ART_PEACE_ADDRESS, TOKENS_ADDRESS } from "common"
import MetadataView from './metadata/Metadata';
import { byteArray, CallData, cairo, constants } from 'starknet';

const CanvasContainer = (props) => {

  // TODO: Handle window resize
  const width = canvasConfig.canvas.width;
  const height = canvasConfig.canvas.height;

  const minScale = 1;
  const maxScale = 40;

  const [canvasX, setCanvasX] = useState(0);
  const [canvasY, setCanvasY] = useState(0);
  const [canvasScale, setCanvasScale] = useState(2);
  const [touchInitialDistance, setInitialTouchDistance] = useState(0);
  const [touchScale, setTouchScale] = useState(0);
  const canvasContainerRef = useRef(null);

  const [isDragging, setIsDragging] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);
  const [dragStartY, setDragStartY] = useState(0);

  const [isErasing, setIsErasing] = useState(false);

  // Metadata states
  const [showMetadataForm, setShowMetaDataForm] = useState(false);
  const [metaData, setMetadata] = useState({
    twitter: '',
    nostr: '',
    ips: ''
  })

  const clampToCanvas = useCallback((x, y) => {
    return {
      x: Math.max(0, Math.min(width - 1, x)),
      y: Math.max(0, Math.min(height - 1, y))
    };
  }, [width, height]);



  // const handleSelectionStarts = useCallback( async (e) => {
  //   if (props.nftMintingMode || props.templateCreationMode || !props.isShieldMode) return;

  //   const canvas = props.canvasRef.current
  //   if (!canvas) return

  //   const rect = canvas.getBoundingClientRect()
  //   const x = Math.floor(((e.clientX - rect.left) / (rect.right - rect.left)) * props.width)
  //   const y = Math.floor(((e.clientY - rect.top) / (rect.bottom - rect.top)) * props.height)

  //   const clampedPosition = clampToCanvas(x, y);
  //   props.setShieldSelectionStart(clampedPosition)
  //   props.setShieldSelectionEnd(clampedPosition)
  //   props.setIsShieldSelecting(true)
  // }, [props.nftMintingMode, props.templateCreationMode, width, height, clampToCanvas, props.isShieldMode]);


  const handleSelectionStart = async (e) => {
    if (props.nftMintingMode || props.templateCreationMode || !props.isShieldMode) return;

    //Only one pixel can be shield for now.
    const maxPixels = 1;
    const canvas = props.canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor(((e.clientX - rect.left) / (rect.right - rect.left)) * width);
    const y = Math.floor(((e.clientY - rect.top) / (rect.bottom - rect.top)) * height);


    const clampedPosition = clampToCanvas(x, y);
    props.setShieldSelectionStart(clampedPosition);
    props.setShieldSelectionEnd(clampedPosition);
    props.setIsShieldSelecting(true);

    const position = clampedPosition.y * width + clampedPosition.x;

    const getPixelInfoEndpoint = await fetchWrapper(
      `get-pixel-info?position=${position.toString()}`,
    );

    if (!getPixelInfoEndpoint.data) {
      return;
    }
    const paddedAddress = '0x0' + props.address.slice(2);
    // Check if the pixel address matches the logged-in user's address
    if (getPixelInfoEndpoint.data === paddedAddress) {
      props.updateSelectedShieldPixels(position, maxPixels);
    } else {
      console.log("This pixel doesn't belong to the logged-in user")
    }
  };


  // const handleSelectionMove = useCallback((e) => {
  //   if (!props.isShieldSelecting) return;

  //   const canvas = props.canvasRef.current;
  //   const rect = canvas.getBoundingClientRect();
  //   const x = Math.floor(((e.clientX - rect.left) / (rect.right - rect.left)) * width);
  //   const y = Math.floor(((e.clientY - rect.top) / (rect.bottom - rect.top)) * height);

  //   const clampedPosition = clampToCanvas(x, y);
  //   props.setShieldSelectionEnd(clampedPosition);
  //   props.updateSelectedShieldPixels(props.shieldSelectionStart, clampedPosition);
  // }, [props.isShieldSelecting, width, height, clampToCanvas]);

  const handleSelectionEnd = useCallback(() => {
    props.setIsShieldSelecting(false);
  }, []);

  const handlePointerDown = (e) => {
    // TODO: Require over canvas?
    if (props.isShieldMode) {
      handleSelectionStart(e);
    } else if (!props.isEraserMode) {
      setIsDragging(true);
      setDragStartX(e.clientX);
      setDragStartY(e.clientY);
    } else {
      setIsErasing(true);
    }
  };



  const handlePointerUp = useCallback(() => {
    if (props.isShieldMode) {
      handleSelectionEnd();
    } else {
      setIsErasing(false);
      setIsDragging(false);
      setDragStartX(0);
      setDragStartY(0);
    }
  }, [props.isShieldMode, handleSelectionEnd]);

  const handlePointerMove = (e) => {
    if (props.isShieldMode) {
      // handleSelectionMove(e);
    } else if ((props.nftMintingMode && !props.nftSelected) || (props.templateCreationMode && !props.templateCreationSelected)) {
      return;
    } else if (isDragging) {
      setCanvasX(canvasX + e.clientX - dragStartX);
      setCanvasY(canvasY + e.clientY - dragStartY);
      setDragStartX(e.clientX);
      setDragStartY(e.clientY);
    } else if (props.isEraserMode && isErasing) {
      pixelClicked(e);
    }
  };


  useEffect(() => {
    window?.addEventListener('pointerup', handlePointerUp);
    return () => {
      window?.removeEventListener('pointerup', handlePointerUp);
    };
  }, [isDragging, canvasX, canvasY]);

  // Zoom in/out ( into the cursor position )
  const zoom = (e) => {
    // Get the cursor position within the canvas ( note the canvas can go outside the viewport )
    const rect = props.canvasRef.current.getBoundingClientRect();
    let cursorX = e.clientX - rect.left;
    let cursorY = e.clientY - rect.top;
    if (cursorX < 0) {
      cursorX = 0;
    } else if (cursorX > rect.width) {
      cursorX = rect.width;
    }
    if (cursorY < 0) {
      cursorY = 0;
    } else if (cursorY > rect.height) {
      cursorY = rect.height;
    }

    // Calculate new left and top position to keep cursor over the same rect pos  ition
    let direction = e.deltaY > 0 ? 1 : -1;
    let scaler = Math.log2(1 + Math.abs(e.deltaY) * 2) * direction;
    let newScale = canvasScale * (1 + scaler * -0.01);
    if (newScale < minScale) {
      newScale = minScale;
    } else if (newScale > maxScale) {
      newScale = maxScale;
    }
    const newWidth = width * newScale;
    const newHeight = height * newScale;
    const oldCursorXRelative = cursorX / rect.width;
    const oldCursorYRelative = cursorY / rect.height;
    const newCursorX = oldCursorXRelative * newWidth;
    const newCursorY = oldCursorYRelative * newHeight;
    const newPosX = canvasX - (newCursorX - cursorX);
    const newPosY = canvasY - (newCursorY - cursorY);

    setCanvasScale(newScale);
    setCanvasX(newPosX);
    setCanvasY(newPosY);
  };

  const handleTouchStart = (e) => {
    if (e.touches.length === 2) {
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const initialDistance = Math.sqrt(
        Math.pow(touch2.clientX - touch1.clientX, 2) + Math.pow(touch2.clientY - touch1.clientY, 2),
      );
      setTouchScale(canvasScale);
      setInitialTouchDistance(initialDistance);
    }
  };

  const handleTouchMove = (e) => {
    if (e.touches.length === 2) {
      const [touch1, touch2] = e.touches;
      const distance = Math.sqrt(
        Math.pow(touch2.clientX - touch1.clientX, 2) + Math.pow(touch2.clientY - touch1.clientY, 2),
      );
      const rect = props.canvasRef.current.getBoundingClientRect();
      const midX = (touch1.clientX + touch2.clientX) / 2;
      const midY = (touch1.clientY + touch2.clientY) / 2;

      let cursorX = midX - rect.left;
      let cursorY = midY - rect.top;
      if (cursorX < 0) {
        cursorX = 0;
      } else if (cursorX > rect.width) {
        cursorX = rect.width;
      }
      if (cursorY < 0) {
        cursorY = 0;
      } else if (cursorY > rect.height) {
        cursorY = rect.height;
      }

      let newScale = (distance / touchInitialDistance) * touchScale;
      if (newScale < minScale) {
        newScale = minScale;
      } else if (newScale > maxScale) {
        newScale = maxScale;
      }
      const newWidth = width * newScale;
      const newHeight = height * newScale;

      const oldCursorXRelative = cursorX / rect.width;
      const oldCursorYRelative = cursorY / rect.height;

      const newCursorX = oldCursorXRelative * newWidth;
      const newCursorY = oldCursorYRelative * newHeight;

      const newPosX = canvasX - (newCursorX - cursorX);
      const newPosY = canvasY - (newCursorY - cursorY);

      setCanvasScale(newScale);
      setCanvasX(newPosX);
      setCanvasY(newPosY);
      // TODO: Make scroll acceleration based
    }
  };


  useEffect(() => {
    window.addEventListener('mouseup', handleSelectionEnd);
    return () => {
      window.removeEventListener('mouseup', handleSelectionEnd);
    };
  }, [handleSelectionEnd]);

  useEffect(() => {
    canvasContainerRef?.current.addEventListener('wheel', zoom);
    canvasContainerRef?.current.addEventListener('touchstart', handleTouchStart);
    canvasContainerRef?.current.addEventListener('touchmove', handleTouchMove);
    return () => {
      canvasContainerRef?.current?.removeEventListener('wheel', zoom);
      canvasContainerRef?.current?.removeEventListener('touchstart', handleTouchStart);
      canvasContainerRef?.current?.removeEventListener('touchmove', handleTouchMove);
    };
  }, [canvasScale, canvasX, canvasY, touchInitialDistance]);

  // Init canvas transform to center of the viewport
  useEffect(() => {
    const containerRect = canvasContainerRef.current.getBoundingClientRect();
    const adjustX = ((canvasScale - 1) * width) / 2;
    const adjustY = ((canvasScale - 1) * height) / 2;
    setCanvasX(containerRect.width / 2 - adjustX);
    setCanvasY(containerRect.height / 2 - adjustY);
  }, [canvasContainerRef]);

  const colorExtraPixel = (x, y, colorId) => {
    const canvas = props.extraPixelsCanvasRef.current;
    const ctx = canvas.getContext('2d');
    const colorHex = `#${props.colors[colorId]}FF`;
    ctx.fillStyle = colorHex;
    ctx.fillRect(x, y, 1, 1);
  };

  const pixelSelect = async (x, y) => {

    // Clear selection if clicking the same pixel
    if (
      props.selectedColorId === -1 &&
      props.pixelSelectedMode &&
      props.selectedPositionX === x &&
      props.selectedPositionY === y
    ) {
      props.clearPixelSelection();
      return;
    }

    props.setPixelSelection(x, y);

    const position = y * width + x;
    // TODO: Cache pixel info & clear cache on update from websocket
    // TODO: Dont query if hover select ( until 1s after hover? )
    if (props.selectedColorId !== -1 || props.isEraserMode || props.isExtraDeleteMode) {
      props.setPixelPlacedBy(null);
      // return;
    }
    const getPixelInfoEndpoint = await fetchWrapper(
      `get-pixel-info?position=${position.toString()}`,
    );

    if (!getPixelInfoEndpoint.data) {
      return;
    }
    props.setPixelPlacedBy(getPixelInfoEndpoint.data);
  };

  //Pixel Call Hook
  const { mutate: mutatePlacePixel } = useContractAction()


  const placePixelCall = async (position, color, now) => {

    // if (devnetMode) return;
    // if (!props.address || !props.artPeaceContract) return;
    if (!props.address || !props.artPeaceContract || !props.account) return;

    //Check for wallet or account
    const callProps = (data, entry) => props.wallet ?

      [{
        // calldata:data,
        calldata: data,
        contract_address: ART_PEACE_ADDRESS?.['0x534e5f5345504f4c4941'],
        entry_point: entry
      }]
      :
      [{
        calldata: data,
        contractAddress: ART_PEACE_ADDRESS?.['0x534e5f5345504f4c4941'],
        entrypoint: entry
      }]

    console.log("props.isShieldMode", props.isShieldMode);



    //Check if the user adds a metadata.
    if (metaData.twitter || metaData.nostr || metaData.ips) {

      const metadata = {
        pos: position,
        ipfs: byteArray.byteArrayFromString(metaData.ips),
        nostr_event_id: metaData.nostr,
        owner: props.account.address,
        contract: ART_PEACE_ADDRESS?.['0x534e5f5345504f4c4941'] || "" // Contract address
      };
      const urlByteArray = byteArray.byteArrayFromString(metaData.url ?? "");
      // console.log("urlByteArray", urlByteArray);
      const nostrEventIdByteArray = byteArray.byteArrayFromString(metaData.nostr ?? 0);
      const nostrEventIdFelt = cairo.felt(BigInt(metaData.nostr ?? 0));
      // console.log("nostrEventIdFelt", nostrEventIdFelt);
      const positionUint256 = cairo.uint256(position);
      // console.log("positionUint256", positionUint256);


      console.log("props.isShieldMode", props.isShieldMode);
      if (props?.isShieldMode) {
        // const     positionUint256 = cairo.uint256(props.selectedShieldPixels);

        const metadataCall = {
          contractAddress: metadata.contract,
          entrypoint: 'place_pixel_with_metadata',
          calldata: CallData.compile({
            position: positionUint256,
            color: color,
            now: now,
            metaPos: positionUint256,
            ipfs: urlByteArray,
            nostr: nostrEventIdFelt,
            owner: metadata.owner,
            contract: metadata.contract
          }),
        };

        /** TODO get how much paid for the shield */
        // const paidByTime = await props?.account?.invoke(metadataCall)

        /** ADD APPROVE CALLDATA */


        const shielPixel = {
          contractAddress: metadata.contract,
          entrypoint: 'place_pixel_shield',
          calldata: CallData.compile({
            position: positionUint256,
            time: now,
          }),
        };
        const callMetadata = CallData.compile({ position, color, now, metaPos: positionUint256 ?? metadata.pos, ipfs: urlByteArray, nostr: nostrEventIdFelt ?? metadata.nostr_event_id, owner: metadata.owner, contract: metadata.contract })

        const tx = await props?.account?.execute([metadataCall, shielPixel])

        console.log("tx", tx);

        return;
      } else {

        // const urlByteArray = byteArray.byteArrayFromString(metaData.url);
        return mutatePlacePixel({
          account: props.account,
          wallet: props.wallet,

          callProps: callProps(CallData.compile({ position, color, now, metaPos: positionUint256 ?? metadata.pos, ipfs: urlByteArray, nostr: nostrEventIdFelt ?? metadata.nostr_event_id, owner: metadata.owner, contract: metadata.contract }), "place_pixel_with_metadata")
        }, {
          onError(err) {
            console.log(err);
            setShowMetaDataForm(false);
          },
          onSuccess(data) {
            console.log(data, "Success")
          }
        })
      }


    }

    console.log("props.isShieldMode", props.isShieldMode);
    if (props?.isShieldMode) {
      // const     positionUint256 = cairo.uint256(props.selectedShieldPixels);


      /** TODO get how much paid for the shield */
      // const paidByTime = await props?.account?.invoke(metadataCall)


      // get token address to paid

      const tokenAddress = TOKENS_ADDRESS[constants.StarknetChainId.SN_SEPOLIA].STRK 
      console.log("tokenAddress", tokenAddress);


      const amountUint = cairo.uint256(1)
      /** ADD APPROVE CALLDATA */

      const approveCall = {

        contractAddress: tokenAddress,
        entrypoint: 'approve',
        calldata: CallData.compile({
          amount: amountUint,
          spender: props?.artPeaceContract ?? ART_PEACE_ADDRESS?.['0x534e5f5345504f4c4941'],
        }),
      }


      const shielPixel = {
        contractAddress: props?.artPeaceContract ?? ART_PEACE_ADDRESS?.['0x534e5f5345504f4c4941'],
        entrypoint: 'place_pixel_shield',
        calldata: CallData.compile({
          position: positionUint256,
          time: now,
        }),
      };
      // const callMetadata = CallData.compile({ position, color, now, metaPos: positionUint256 ?? metadata.pos, ipfs: urlByteArray, nostr: nostrEventIdFelt ?? metadata.nostr_event_id, owner: metadata.owner, contract: metadata.contract })

      props?.account?.execute([approveCall, shielPixel])
    }

    mutatePlacePixel({
      account: props.account,
      wallet: props.wallet,
      callProps: callProps([position, color, now], "place_pixel")
    }, {
      onError(err) {
        console.log(err)
        setShowMetaDataForm(false)
      },
      onSuccess(data) {
        console.log(data, "Success")
      }
    })
  };


  const pixelClicked = async (e) => {
    if (props.nftMintingMode || props.templateCreationMode) {
      return;
    }
    const canvas = props.canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor(((e.clientX - rect.left) / (rect.right - rect.left)) * width);
    const y = Math.floor(((e.clientY - rect.top) / (rect.bottom - rect.top)) * height);

    // Only click pixel if it's within the canvas
    if (x < 0 || x >= width || y < 0 || y >= height) {
      return;
    }
    // Erase Extra Pixel
    if (props.isEraserMode) {
      const pixelIndex = props.extraPixelsData.findIndex((pixelData) => {
        return pixelData.x === x && pixelData.y === y;
      });
      if (pixelIndex !== -1) props.clearExtraPixel(pixelIndex);
      // Toggle Eraser mode  if there are no Extra Pixels placed
      if (!props.extraPixelsData.length) props.setIsEraserMode(!props.isEraserMode);
      return;
    }

    pixelSelect(x, y);

    // Color Extra Pixel
    if (props.selectedColorId === -1) {
      return;
    }

    if (props.availablePixels > (props.basePixelUp ? 1 : 0)) {
      if (props.availablePixelsUsed < props.availablePixels) {
        props.addExtraPixel(x, y);
        colorExtraPixel(x, y, props.selectedColorId);
        return;
      } else {
        // TODO: Notify user of no more extra pixels
        return;
      }
    }

    // Color Pixel
    const position = y * width + x;
    const colorId = props.selectedColorId;

    const timestamp = Math.floor(Date.now() / 1000);

    // if (!devnetMode) {
    props.setSelectedColorId(-1);
    props.colorPixel(position, colorId);
    await placePixelCall(position, colorId, timestamp);

    props.clearPixelSelection();
    props.setLastPlacedTime(timestamp * 1000);
    // return;
    // }

    if (props.selectedColorId !== -1) {
      props.setSelectedColorId(-1);
      props.colorPixel(position, colorId);
      console.log("body", JSON.stringify({
        position: position.toString(),
        color: colorId.toString(),
        timestamp: timestamp.toString(),
      }))
      try {
        const response = await fetchWrapper(`place-pixel-redis`, {
          mode: 'cors',
          method: 'POST',
          body: JSON.stringify({
            position: Number(position),
            color: Number(colorId),
            timestamp: Number(timestamp)
          })
        });
        if (response.result) {
          console.log(response.result);
        }
      } catch (error) {
        console.log("Error pixel-redis", error)

      }

      props.clearPixelSelection();
      props.setLastPlacedTime(timestamp * 1000);
    }
    // TODO: Fix last placed time if error in placing pixel
  };

  useEffect(() => {
    const hoverColor = (e) => {
      if (props.selectedColorId === -1 && !props.isEraserMode) {
        return;
      }
      if (props.nftMintingMode || props.templateCreationMode) {
        return;
      }
      if (
        !(e.target.classList.contains('ExtraPixelsCanvas') || e.target.classList.contains('Canvas'))
      ) {
        return;
      }

      const canvas = props.canvasRef.current;
      const rect = canvas.getBoundingClientRect();
      const x = Math.floor(((e.clientX - rect.left) / (rect.right - rect.left)) * width);
      const y = Math.floor(((e.clientY - rect.top) / (rect.bottom - rect.top)) * height);

      // Only click pixel if it's within the canvas
      if (x < 0 || x >= width || y < 0 || y >= height) {
        return;
      }

      pixelSelect(x, y);
    };
    window.addEventListener('mousemove', hoverColor);
    return () => {
      window.removeEventListener('mousemove', hoverColor);
    };
  }, [props.selectedColorId, props.nftMintingMode, props.isEraserMode, props.templateCreationMode]);

  const getSelectedColorInverse = () => {
    if (props.selectedPositionX === null || props.selectedPositionY === null) {
      return null;
    }

    if (props.selectedColorId === -1) {
      const existingPixel = props.extraPixelsData.find(
        (pixel) => pixel.x == props.selectedPositionX && pixel.y == props.selectedPositionY,
      );

      if (existingPixel) {
        let color = props.colors[existingPixel.colorId];
        return (
          '#' +
          (255 - parseInt(color.substring(0, 2), 16)).toString(16).padStart(2, '0') +
          (255 - parseInt(color.substring(2, 4), 16)).toString(16).padStart(2, '0') +
          (255 - parseInt(color.substring(4, 6), 16)).toString(16).padStart(2, '0')
        );
      }

      let color = props.canvasRef.current
        .getContext('2d')
        .getImageData(props.selectedPositionX, props.selectedPositionY, 1, 1).data;
      return (
        '#' +
        (255 - color[0]).toString(16).padStart(2, '0') +
        (255 - color[1]).toString(16).padStart(2, '0') +
        (255 - color[2]).toString(16).padStart(2, '0') +
        color[3].toString(16).padStart(2, '0')
      );
    }

    if (props.isExtraDeleteMode) {
      const existingPixel = props.extraPixelsData.find(
        (pixel) => pixel.x == props.selectedPositionX && pixel.y == props.selectedPositionY,
      );

      if (existingPixel) {
        let color = props.colors[existingPixel.colorId];
        return (
          '#' +
          (255 - parseInt(color.substring(0, 2), 16)).toString(16).padStart(2, '0') +
          (255 - parseInt(color.substring(2, 4), 16)).toString(16).padStart(2, '0') +
          (255 - parseInt(color.substring(4, 6), 16)).toString(16).padStart(2, '0')
        );
      }
    }

    return '#' + props.colors[props.selectedColorId] + 'FF';
  };

  const [selectedBoxShadow, setSelectedBoxShadow] = useState(null);
  const [selectedBackgroundColor, setSelectedBackgroundColor] = useState(null);
  useEffect(() => {
    const base1 = 0.12;
    const minShadowScale = 0.8;
    const startVal = Math.max(minShadowScale, base1 * canvasScale);
    const endVal = startVal * 0.8;
    setSelectedBoxShadow(`0 0 ${startVal}px ${endVal}px ${getSelectedColorInverse()} inset`);

    if (props.selectedColorId === -1) {
      setSelectedBackgroundColor('rgba(255, 255, 255, 0)');
    } else {
      if (props.isExtraDeleteMode) {
        setSelectedBackgroundColor('rgba(255, 255, 255, 0)');
      } else {
        setSelectedBackgroundColor(`#${props.colors[props.selectedColorId]}FF`);
      }
    }
  }, [
    canvasScale,
    props.selectedColorId,
    props.selectedPositionX,
    props.selectedPositionY,
    props.isExtraDeleteMode,
  ]);

  const renderSelectionBox = () => {
    if (props.shieldSelectionStart.x === null || props.shieldSelectionEnd.x === null) return null;

    const left = Math.min(props.shieldSelectionStart.x, props.shieldSelectionEnd.x) * canvasScale;
    const top = Math.min(props.shieldSelectionStart.y, props.shieldSelectionEnd.y) * canvasScale;
    const width = (Math.abs(props.shieldSelectionEnd.x - props.shieldSelectionStart.x) + 1) * canvasScale;
    const height = (Math.abs(props.shieldSelectionEnd.y - props.shieldSelectionStart.y) + 1) * canvasScale;

    return (
      <div
        className="shield-selection-box"
        style={{
          left,
          top,
          width,
          height,
        }}
      />
    );
  };

  const renderShieldedAreas = () => {
    return props.shieldedAreas.map((area, index) => (
      <div
        key={index}
        className="shielded-area"
        style={{
          left: area.x * canvasScale,
          top: area.y * canvasScale,
          width: area.width * canvasScale,
          height: area.height * canvasScale,
        }}
      />
    ));
  };

  return (
    <>
      <MetadataView setFormData={setMetadata} formData={metaData} selectorMode={props.selectorMode} handleOpen={() => setShowMetaDataForm(true)} closeMeta={() => [setShowMetaDataForm(false), setMetadata({ ips: "", nostr: "", twitter: "" })]} showMeta={showMetadataForm} />
      <div
        ref={canvasContainerRef}
        className="CanvasContainer"
        onPointerMove={handlePointerMove}
        onPointerDown={handlePointerDown}
      >
        <div
          className="CanvasContainer__anchor"
          style={{
            top: -height / 2,
            left: -width / 2,
            transform: `translate(${canvasX}px, ${canvasY}px)`,
          }}
        >
          {props.isShieldMode && renderSelectionBox()}
          {renderShieldedAreas()}
          {props.pixelSelectedMode && (
            <div
              className="Canvas__selection"
              style={{
                top: props.selectedPositionY * canvasScale,
                left: props.selectedPositionX * canvasScale,
              }}
            >
              <div
                className="Canvas__selection__pixel"
                style={{
                  boxShadow: selectedBoxShadow,
                  backgroundColor: selectedBackgroundColor,
                  width: canvasScale,
                  height: canvasScale,
                }}
              ></div>
            </div>
          )}

          <Canvas
            canvasRef={props.canvasRef}
            width={width}
            height={height}
            style={{
              width: width * canvasScale,
              height: height * canvasScale,
            }}
            colors={props.colors}
            pixelClicked={pixelClicked}
          />
          {props.availablePixels > 0 && (
            <ExtraPixelsCanvas
              extraPixelsCanvasRef={props.extraPixelsCanvasRef}
              width={width}
              height={height}
              style={{
                width: width * canvasScale,
                height: height * canvasScale,
              }}
              colors={props.colors}
              pixelClicked={pixelClicked}
            />
          )}
          {props.templateOverlayMode && props.overlayTemplate && (
            <TemplateOverlay
              canvasRef={props.canvasRef}
              width={width}
              height={height}
              canvasScale={canvasScale}
              overlayTemplate={props.overlayTemplate}
              setTemplateOverlayMode={props.setTemplateOverlayMode}
              setOverlayTemplate={props.setOverlayTemplate}
              colors={props.colors}
            />
          )}
          {props.templateCreationMode && (
            <TemplateCreationOverlay
              canvasRef={props.canvasRef}
              canvasScale={canvasScale}
              templateImage={props.templateImage}
              templateColorIds={props.templateColorIds}
              templateCreationMode={props.templateCreationMode}
              setTemplateCreationMode={props.setTemplateCreationMode}
              templateCreationSelected={props.templateCreationSelected}
              setTemplateCreationSelected={props.setTemplateCreationSelected}
              width={width}
              height={height}
              templatePosition={props.templatePosition}
              setTemplatePosition={props.setTemplatePosition}
            />
          )}
          {props.nftMintingMode && (
            <NFTSelector
              canvasRef={props.canvasRef}
              canvasScale={canvasScale}
              width={width}
              height={height}
              nftMintingMode={props.nftMintingMode}
              nftSelectionStarted={props.nftSelectionStarted}
              setNftSelectionStarted={props.setNftSelectionStarted}
              nftSelected={props.nftSelected}
              setNftSelected={props.setNftSelected}
              setNftMintingMode={props.setNftMintingMode}
              setNftPosition={props.setNftPosition}
              setNftWidth={props.setNftWidth}
              setNftHeight={props.setNftHeight}
            />
          )}
        </div>
      </div>
    </>
  );
};

export default CanvasContainer;