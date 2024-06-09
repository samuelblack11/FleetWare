import React, { useRef, useEffect } from 'react';
import Webcam from 'react-webcam';
import { BrowserBarcodeReader } from '@zxing/library';

const videoConstraints = {
  width: 1280,
  height: 720,
  facingMode: "environment"
};

const BarcodeScannerComponent = ({ onScan }) => {
  const webcamRef = useRef(null);

  useEffect(() => {
    const codeReader = new BrowserBarcodeReader();
    let selectedDeviceId;

    const scan = async () => {
      if (webcamRef.current) {
        try {
          const videoDevices = await codeReader.listVideoInputDevices();
          selectedDeviceId = videoDevices[0].deviceId;  // This selects the first available video device
          
          // Decode continuously from the selected device
          codeReader.decodeFromVideoDevice(selectedDeviceId, webcamRef.current.video, (result, err) => {
            if (result) {
              onScan(result.text);
              codeReader.reset();  // Optionally reset reader after successful scan
            }
            if (err && err.name === 'NotFoundException') {
              // This error is expected when no barcodes are detected in the frame
              console.log('Scanning...');
            } else if (err) {
              console.error(err);
            }
          });
        } catch (error) {
          console.error('Error setting up barcode scanner:', error);
        }
      }
    };

    scan();

    return () => {
      codeReader.reset();  // Clean up the code reader when the component is unmounted
    };
  }, []);

  return (
    <Webcam
      audio={false}
      height={720}
      ref={webcamRef}
      screenshotFormat="image/jpeg"
      width={1280}
      videoConstraints={videoConstraints}
    />
  );
};

export default BarcodeScannerComponent;
