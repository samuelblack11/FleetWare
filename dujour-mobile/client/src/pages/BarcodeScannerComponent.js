import React, { useEffect, useRef } from 'react';
import Webcam from 'react-webcam';
import { BrowserQRCodeReader } from '@zxing/library';

const BarcodeScannerComponent = ({ onScan }) => {
    const webcamRef = useRef(null);
    const codeReader = new BrowserQRCodeReader();

    useEffect(() => {
        let selectedDeviceId;

        const startScanning = async () => {
            const videoDevices = await codeReader.listVideoInputDevices();
            selectedDeviceId = videoDevices[0].deviceId;
            codeReader.decodeFromVideoDevice(selectedDeviceId, webcamRef.current.video, (result, err) => {
                if (result) {
                    onScan(result.text);
                }
            });
        };

        startScanning();

        // Cleanup function to stop the camera when the component is unmounted or scanner is closed
        return () => {
            codeReader.reset();
            if (webcamRef.current && webcamRef.current.stream) {
                const tracks = webcamRef.current.stream.getTracks();
                tracks.forEach(track => track.stop());
            }
        };
    }, []); // Empty dependency array ensures this effect runs only once after mounting

    return <Webcam ref={webcamRef} />;
};

export default BarcodeScannerComponent;
