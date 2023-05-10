import React, { useState, useRef, useEffect } from "react";
import cv from "@techstark/opencv-js";
import { Tensor, InferenceSession } from "onnxruntime-web";
import Loader from "./components/loader";
import { detectImage } from "./utils/detect";
import "./style/App.css";

const App = () => {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState("Loading OpenCV.js...");
  const [image, setImage] = useState(null);
  const inputImage = useRef(null);
  const imageRef = useRef(null);
  const canvasRef = useRef(null);

  // Configs
  const modelName = "yolov8n.onnx";
  const modelInputShape = [1, 3, 640, 640];
  const topk = 100;
  const iouThreshold = 0.45;
  const scoreThreshold = 0.2;

  const imageList = [`${process.env.PUBLIC_URL}/img/1.jpeg`,
                      `${process.env.PUBLIC_URL}/img/2.jpeg`,
                      `${process.env.PUBLIC_URL}/img/3.jpeg`,
                      `${process.env.PUBLIC_URL}/img/4.jpg`, 
                      `${process.env.PUBLIC_URL}/img/6.jpeg`]

  function changeImage(url){
    // handle next image to detect
    if (image) {
      setImage(null);
    }
    imageRef.current.src = url; // set image source
    setImage(url);
  }

  useEffect(() => {
    console.log(loading)
    if (!loading){
      changeImage(imageList[0])
    }
  }, [loading]);

  // wait until opencv.js initialized
  cv["onRuntimeInitialized"] = async () => {
    // create session
    setLoading("Loading YOLOv8 model...");
    const [yolov8, nms] = await Promise.all([
      InferenceSession.create(`${process.env.PUBLIC_URL}/model/${modelName}`),
      InferenceSession.create(`${process.env.PUBLIC_URL}/model/nms-yolov8.onnx`),
    ]);

    // warmup main model
    setLoading("Warming up model...");
    const tensor = new Tensor(
      "float32",
      new Float32Array(modelInputShape.reduce((a, b) => a * b)),
      modelInputShape
    );
    await yolov8.run({ images: tensor });

    setSession({ net: yolov8, nms: nms });
    setLoading(null);
  };

  return (
    <div className="App">
      {loading && <Loader>{loading}</Loader>}
      <div className="header">
        <h1>YOLOv8 Object Detection App</h1>
        <p>
          YOLOv8 object detection application live on browser
        </p>
      </div>

      <div className="content">
        <img
          ref={imageRef}
          src=""
          alt=""
          style={{ display: image ? "block" : "none" }}
          onLoad={() => {
            detectImage(
              imageRef.current,
              canvasRef.current,
              session,
              topk,
              iouThreshold,
              scoreThreshold,
              modelInputShape
            );
          }}
        />
        <canvas
          id="canvas"
          width={modelInputShape[2]}
          height={modelInputShape[3]}
          ref={canvasRef}
        />
      </div>

      <input
        type="file"
        ref={inputImage}
        accept="image/*"
        style={{ display: "none" }}
        onChange={(e) => {
          // handle next image to detect
          if (image) {
            URL.revokeObjectURL(image);
            setImage(null);
          }

          const url = URL.createObjectURL(e.target.files[0]); // create image url
          changeImage(url);
        }}
      />
      <div className="btn-container">
      {imageList.map((i,index) => 
        <button
              key={index}
              onClick={()=>{changeImage(i)}}
            >
            <img 
                alt=''
                height="100px"
                src ={i}
            />
            </button>
       )}
      </div>
      <div className="btn-container">
        <button
          onClick={() => {
            inputImage.current.click();
          }}
        >
          Open local image
        </button>
      </div>
    </div>
  );
};

export default App;
