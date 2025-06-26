import Image from "next/image";
import { useAccount } from "@starknet-react/core";
import { BasicTab } from "./basic";
import { sha256 } from "js-sha256";
import { playSoftClick2 } from "../utils/sounds";
import { addStencilData, uploadStencilImg } from "../../api/stencils";
import { addStencilCall } from "../../contract/calls";
import { useState } from "react";
import { useFileUpload } from "@/hooks/useFileUpload";

export const StencilCreationTab = (props: any) => {
  const { account } = useAccount();
  console.log("account address in stencil creation", account?.address);
  const [image, setImage] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const fileUpload = useFileUpload();

  const hashStencilImage = () => {
    // TODO: Change hash to Poseidon
    const hash = sha256(props.stencilColorIds).slice(2);
    return "0x" + hash;
  }

  function dataURLtoBlob(dataurl: string) {
    const arr = dataurl.split(',');
    const mime = arr[0]?.match(/:(.*?);/)?.[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  }

  const submit = async () => {
    console.log("submit");
    playSoftClick2();
    const hash = hashStencilImage();

    let urlImage = '';
    let urlHash = '';

    // TODO add file upload through IPFS
    // if (image) {
    //   const result = await fileUpload.mutateAsync(image);
    //   console.log("result file upload", result);
    //   if (result.data.url) {
    //     urlImage = result.data.url
    //     setImageUrl(result.data?.hash)
    //     urlHash = result.data?.hash
    //   }
    // }

    if (!image) {
      urlImage = props.stencilImage.image;
      urlHash = props.stencilImage.hash;
    }


    // --- Robust image upload handling ---
    let blobToUpload;
    if (image) {
      if (image.startsWith("data:image")) {
        // It's a data URL
        blobToUpload = dataURLtoBlob(image);
      } else {
        // It's just base64, make it a data URL
        blobToUpload = dataURLtoBlob("data:image/png;base64," + image);
      }
    } else if (props.stencilImage?.file) {
      // If you have the original File object
      blobToUpload = props.stencilImage.file;
    } else if (urlImage && urlImage.startsWith("data:image")) {
      blobToUpload = dataURLtoBlob(urlImage);
    } else {
      throw new Error("No valid image to upload");
    }
    const formData = new FormData();
    formData.append('file', blobToUpload);
    // --- End robust image upload handling ---

    

    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/upload-stencil-img`, {
      method: 'POST',
      body: formData,
    });
    const res = await response.json();
    console.log("Stencil added to DB:", res);
    props.endStencilCreation();
    props.setActiveTab("Stencils");
    // const imgHash = hash.substr(2).padStart(64, "0");
    // const imgHash = urlHash;
    const ipfsHash = res?.result;
    console.log("ipfsHash",ipfsHash)

    const imgHash = hash;
    // if (!account) return;
    try {
      await addStencilCall(account ?? props?.account, props.worldId, hash, props.stencilImage.width, props.stencilImage.height, props.stencilPosition, ipfsHash);
      // await addStencilCall(account, props.worldId, urlHash, props.stencilImage.width, props.stencilImage.height, props.stencilPosition);
    } catch (error) {
      console.error("Error submitting stencil:", error);
      return;
    }
    const newStencil = {
      favorited: true,
      favorites: 1,
      hash: res?.result,
      height: props.stencilImage.height,
      name: "",
      position: props.stencilPosition,
      stencilId: res.stencilId,
      width: props.stencilImage.width,
      worldId: props.worldId,
      ipfsHash: ipfsHash,
    };
    props.setOpenedStencil(newStencil);
  };

  return (
    <BasicTab title="Create a Stencil" {...props} style={{ marginBottom: "0.5rem" }} onClose={props.endStencilCreation}>
      {props.stencilImage && (
        <div>
          <div className="flex flex-col w-full">
            <div className="pt-[1rem] pb-[2rem] flex flex-col items-center justify-center gap-1">
              <Image
                src={props.stencilImage.image}
                width={props.stencilImage.width}
                height={props.stencilImage.height}
                alt="Stencil"
                className="Pixel__img mx-auto h-[14rem] w-[20rem] object-contain"
              />
              <p className="Text__xsmall text-center">(colors converted to world&lsquo;s palette)</p>
            </div>
            <div className="px-[0.5rem] mx-[0.5rem] flex flex-row align-center justify-between">
              <p className="Text__medium pr-[1rem]">World&nbsp;&nbsp;&nbsp;&nbsp;:</p>
              <p className="Text__medium pr-[0.5rem] truncate w-[21rem] text-right">{props.worldName}</p>
            </div>
            <div className="px-[0.5rem] mx-[0.5rem] mt-[1rem] flex flex-row align-center justify-between">
              <p className="Text__medium pr-[1rem]">Size&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;:</p>
              <p className="Text__medium pr-[0.5rem] text-right">{props.stencilImage.width} x {props.stencilImage.height}</p>
            </div>
            <div className="px-[0.5rem] mx-[0.5rem] mt-[1rem] flex flex-row align-center justify-between">
              <p className="Text__medium pr-[1rem]">Position&nbsp;:</p>
              <p className="Text__medium pr-[0.5rem] text-right">
                ({props.stencilPosition % props.canvasWidth},&nbsp;
                {Math.floor(props.stencilPosition / props.canvasWidth)})
              </p>
            </div>
          </div>
          <div className="flex flex-col w-full">
            {props.stencilCreationSelected ? (
              <p className="text-lg text-black px-[0.5rem] mx-[0.5rem] mt-[1rem]">
                Confirm info and submit the new stencil...
              </p>
            ) : (
              <p className="text-lg text-red-500 px-[0.5rem] mx-[0.5rem] mt-[1rem]">
                Select a position on the Canvas for the stencil...
              </p>
            )}
          </div>
          <div className="flex flex-row justify-around mt-[1.5rem] align-center">
            <div
              className="Button__primary Text__medium"
              onClick={() => {
                playSoftClick2();
                props.endStencilCreation();
              }}
            >
              Cancel
            </div>
            <div
              className={`Button__primary Text__medium ${!props.stencilCreationSelected ? "Button--disabled" : ""}`}
              onClick={() => submit()}
            >
              Submit
            </div>
          </div>
        </div>
      )}
    </BasicTab>
  );
}
