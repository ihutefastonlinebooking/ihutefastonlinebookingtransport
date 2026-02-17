import React from 'react';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Loader, Spinner } from '../components';
import jsQR from 'jsqr';

export default function DriverScanPage() {
  const [hasPermission, setHasPermission] = React.useState(null);
  const [initializing, setInitializing] = React.useState(true);
  const [scanning, setScanning] = React.useState(true);
  const canvasRef = React.useRef();
  const videoRef = React.useRef();
  const [lastScanned, setLastScanned] = React.useState(null);
  const [scannedTickets, setScannedTickets] = React.useState([]);

  // Request camera permission and start scanning
  React.useEffect(() => {
    async function init() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current.play();
            setHasPermission(true);
            setInitializing(false);
            startScan();
          };
        }
      } catch (err) {
        console.error('Camera permission denied:', err);
        setHasPermission(false);
        setInitializing(false);
        toast.error('Camera permission denied. Please enable camera to scan QR codes.');
      }
    }
    init();

    return () => {
      if (videoRef.current?.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  function startScan() {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    let animationId;

    function scan() {
      if (!scanning) return;

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height);

      if (code) {
        const qrValue = code.data;
        const now = Date.now();

        // Prevent duplicate scans within 2 seconds
        if (lastScanned && lastScanned.value === qrValue && now - lastScanned.time < 2000) {
          animationId = requestAnimationFrame(scan);
          return;
        }

        handleQRScanned(qrValue);
        setLastScanned({ value: qrValue, time: now });
      }

      animationId = requestAnimationFrame(scan);
    }

    scan();

    return () => cancelAnimationFrame(animationId);
  }

  async function handleQRScanned(qrValue) {
    setScanning(false);
    try {
      // Validate QR and mark ticket as used
      const res = await axios.post('/api/qr-validation/validate', { qrCode: qrValue });
      const ticket = res.data.data;

      toast.success(`✓ Ticket ${ticket.booking_reference} validated!`);
      setScannedTickets([...scannedTickets, { ...ticket, scannedAt: new Date() }]);

      // Resume scanning after 2 seconds
      setTimeout(() => setScanning(true), 2000);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Invalid or already used ticket');
      // Resume scanning after error
      setTimeout(() => setScanning(true), 2000);
    }
  }

  if (initializing) {
    return <Loader message="Initializing camera..." />;
  }

  if (!hasPermission) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <ToastContainer />
        <div className="bg-white p-8 rounded shadow-md text-center max-w-md">
          <h2 className="text-2xl font-bold mb-4">Camera Access Denied</h2>
          <p className="text-gray-600 mb-6">Please enable camera permissions to scan passenger tickets.</p>
          <button onClick={() => window.location.reload()} className="bg-primary text-white px-6 py-2 rounded">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex flex-col">
      <ToastContainer />

      {/* Header */}
      <div className="bg-primary text-white p-4 text-center">
        <h1 className="text-2xl font-bold">Driver QR Scanner</h1>
        <p className="text-sm">Point camera at passenger tickets to validate</p>
      </div>

      {/* Camera feed */}
      <div className="flex-1 flex items-center justify-center overflow-hidden">
        <div className="relative w-full h-full max-w-md">
          <video ref={videoRef} className="w-full h-full object-cover" />
          <canvas ref={canvasRef} className="hidden" />

          {/* Scanning frame overlay */}
          <div className="absolute inset-0 border-4 border-green-400 rounded-lg" style={{ margin: '10%' }}>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-white text-center">
                <Spinner size="lg" className="mb-4" />
                <p>Scanning...</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scanned tickets history */}
      <div className="bg-gray-900 text-white p-4 max-h-48 overflow-y-auto">
        <h2 className="text-lg font-bold mb-2">Recently Scanned ({scannedTickets.length})</h2>
        <div className="space-y-2">
          {scannedTickets.slice(-5).map((ticket, idx) => (
            <div key={idx} className="bg-gray-800 p-2 rounded text-sm">
              <p><strong>{ticket.booking_reference}</strong></p>
              <p className="text-xs text-gray-400">{new Date(ticket.scannedAt).toLocaleTimeString()}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
