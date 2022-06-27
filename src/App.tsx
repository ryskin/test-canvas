import React, { useCallback, useEffect, useState } from "react";
import { Canvas } from "./components/Canvas";

const MAX_WIDTH = 900;
const MAX_HEIGHT = 900;

const App = () => {
  const [collections, setCollections] = useState([
    {
      imageUrl:
        "https://img.freepik.com/free-photo/cows-eating-lush-grass-green-field-front-fuji-mountain-japan_335224-36.jpg?t=st=1655917317~exp=1655917917~hmac=a9b634412f648ee4a66f5f18b6aae62a4875366413f6d5e73b27fe3e5f18fc02&w=1480",
      data: [],
    },
    {
      imageUrl:
        "https://as1.ftcdn.net/v2/jpg/03/91/12/74/1000_F_391127455_r8z0gvlLCVf4fS20j1FVMlsISMzZRVP9.jpg",
      data: [],
    },
  ]);

  const [imageUrl, setImageUrl] = useState(
    "https://img.freepik.com/free-photo/cows-eating-lush-grass-green-field-front-fuji-mountain-japan_335224-36.jpg?t=st=1655917317~exp=1655917917~hmac=a9b634412f648ee4a66f5f18b6aae62a4875366413f6d5e73b27fe3e5f18fc02&w=1480"
  );

  const [image, setImage] = useState<HTMLImageElement>();
  const [imageSize, setImageSize] = useState<{
    width: number;
    height: number;
  }>();
  const [ratio, setRatio] = useState<number>();

  const { width, height } = imageSize || { width: 0, height: 0 };

  useEffect(() => {
    const img = new Image();
    img.src = imageUrl;
    const width = img.naturalWidth;
    const height = img.naturalHeight;
    const ratio = Math.min(MAX_WIDTH / width, MAX_HEIGHT / height);
    const newWidth = width * ratio;
    const newHeight = height * ratio;
    setImage(img);
    setRatio(ratio);
    setImageSize({ width: newWidth, height: newHeight });
  }, [imageUrl]);

  const handleChangeImage = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const target = e.currentTarget;
    setImageUrl(target.src);
    // handleImageLoaded();
  };

  const setData = useCallback(
    (data: any) => {
      setCollections(
        collections.map((item: any) => {
          if (item.imageUrl === imageUrl) {
            return {
              ...item,
              data,
            };
          }
          return item;
        })
      );
    },
    [collections, imageUrl]
  );

  const getCollection = useCallback(() => {
    return (
      collections.find((item: any) => item.imageUrl === imageUrl)?.data || []
    );
  }, [collections, imageUrl]);

  return (
    <div>
      {ratio  && (
        <div>
          {width / ratio}, {height / ratio}
        </div>
      )}
      {collections.map((image) => (
        <img
          key={image.imageUrl}
          onClick={handleChangeImage}
          src={image.imageUrl}
          alt="from input"
          height={100}
        />
      ))}
      <Canvas
        setData={setData}
        collection={getCollection()}
        img={image}
        id={imageUrl}
        width={imageSize?.width}
        height={imageSize?.height}
      />
    </div>
  );
};

export default App;
