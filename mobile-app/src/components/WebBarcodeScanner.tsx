import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { BrowserMultiFormatReader, NotFoundException } from '@zxing/library';

interface WebBarcodeScannerProps {
  onBarCodeScanned: (data: string) => void;
  isScanning: boolean;
}

const WebBarcodeScanner: React.FC<WebBarcodeScannerProps> = ({
  onBarCodeScanned,
  isScanning,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const codeReaderRef = useRef<BrowserMultiFormatReader | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const codeReader = new BrowserMultiFormatReader();
    codeReaderRef.current = codeReader;

    const startScanning = async () => {
      try {
        const videoInputDevices = await codeReader.listVideoInputDevices();

        if (videoInputDevices.length === 0) {
          setError('Камера не найдена');
          return;
        }

        // Prefer back camera
        const backCamera = videoInputDevices.find(device =>
          device.label.toLowerCase().includes('back') ||
          device.label.toLowerCase().includes('rear') ||
          device.label.toLowerCase().includes('environment')
        ) || videoInputDevices[0];

        if (videoRef.current && isScanning) {
          setIsReady(true);
          codeReader.decodeFromVideoDevice(
            backCamera.deviceId,
            videoRef.current,
            (result, error) => {
              if (result) {
                onBarCodeScanned(result.getText());
              }
              if (error && !(error instanceof NotFoundException)) {
                console.error('Scanning error:', error);
              }
            }
          );
        }
      } catch (err) {
        console.error('Camera error:', err);
        setError('Не удалось получить доступ к камере');
      }
    };

    if (isScanning) {
      startScanning();
    }

    return () => {
      if (codeReaderRef.current) {
        codeReaderRef.current.reset();
      }
    };
  }, [isScanning, onBarCodeScanned]);

  return (
    <View style={styles.container}>
      <video
        ref={videoRef}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
        }}
      />
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
      {!isReady && !error && (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Загрузка камеры...</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  errorContainer: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  errorText: {
    color: '#fff',
    fontSize: 16,
    backgroundColor: 'rgba(255, 0, 0, 0.7)',
    padding: 16,
    borderRadius: 8,
  },
  loadingContainer: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 16,
    borderRadius: 8,
  },
});

export default WebBarcodeScanner;
