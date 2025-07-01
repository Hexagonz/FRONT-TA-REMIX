import { MetaFunction } from "@remix-run/node";
import { useEffect, useRef, useState } from "react";

export default function Index() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const scanAnimationRef = useRef<number | null>(null);

  const [status, setStatus] = useState("Menunggu...");
  const [isSent, setIsSent] = useState(false);
  const [isWsOpen, setIsWsOpen] = useState(false);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [isScanning, setIsScanning] = useState(false);

  const speak = (text: string) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "id-ID";
    window.speechSynthesis.speak(utterance);
  };

  useEffect(() => {
    if (typeof window !== "undefined" && navigator.mediaDevices) {
      navigator.mediaDevices
        .getUserMedia({ video: true })
        .then((stream) => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.onloadedmetadata = () => {
              if (stream.active) {
                setIsCameraReady(true);
                console.log("[CAM] Kamera aktif");
              }
            };
          }
        })
        .catch((err) => {
          console.error("[CAM] Kamera gagal dibuka:", err);
          setStatus("❌ Akses kamera ditolak atau tidak tersedia");
          setIsCameraReady(false);
        });
    } else {
      console.warn("getUserMedia tidak tersedia (bukan di browser)");
    }
  }, []);

  useEffect(() => {
    const socket = new WebSocket("ws://localhost:3001");
    socketRef.current = socket;

    socket.onopen = () => {
      console.log("[WS] Connected");
      setIsWsOpen(true);
      setStatus("✅ Terhubung ke server");
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);

      setStatus("🔍 Memindai wajah...");
      setIsScanning(true);
      startScanEffect();

      setTimeout(() => {
        console.log(data.result)
        if (!(data.result === "Tidak Dikenal")) {
          setStatus(`✅ ${data.result}`);
          speak(
            data.result === "Tidak Dikenal"
              ? data.result
              : `Absensi berhasil. ${data.result}`
          );
        } else if(data.result == "Tidak Dikenal") {
          setIsSent(false);
          speak(data.result);
          setStatus(`❌ ${data.result}`);
        } else if (data.error) {
          setStatus(`❌ ${data.error}`);
          speak(`Terjadi kesalahan. ${data.error}`);
        }

        stopScanEffect();
        setIsScanning(false);
      }, 1500);
    };

    socket.onerror = () => {
      setStatus("⚠️ Gagal terhubung ke server");
      setIsWsOpen(false);
    };

    socket.onclose = () => {
      console.log("[WS] Disconnected");
      setIsWsOpen(false);
    };

    return () => {
      socket.close();
    };
  }, []);

  const sendFrame = () => {
    if (socketRef.current?.readyState === WebSocket.OPEN && videoRef.current) {
      const canvas = document.createElement("canvas");
      canvas.width = 320;
      canvas.height = 240;
      const ctx = canvas.getContext("2d");
      ctx?.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL("image/jpeg");

      socketRef.current.send(JSON.stringify({ image: dataUrl }));
      setStatus("📤 Mengirim gambar...");
      setIsSent(true);
    } else {
      setStatus("⚠️ WebSocket atau Kamera belum siap.");
    }
  };

  const startScanEffect = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    const height = canvas?.height || 240;
    const width = canvas?.width || 320;
    let y = 0;
    const speed = 3;

    const animate = () => {
      if (!ctx) return;

      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = "rgba(0, 0, 0, 0.15)";
      ctx.fillRect(0, 0, width, height);

      ctx.strokeStyle = "#00FF00";
      ctx.shadowColor = "#00FF00";
      ctx.shadowBlur = 8;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();

      y += speed;
      if (y > height) y = 0;

      scanAnimationRef.current = requestAnimationFrame(animate);
    };

    animate();
  };

  const stopScanEffect = () => {
    if (scanAnimationRef.current) {
      cancelAnimationFrame(scanAnimationRef.current);
      scanAnimationRef.current = null;
    }

    const ctx = canvasRef.current?.getContext("2d");
    if (ctx) {
      ctx.clearRect(0, 0, 320, 240);
    }
  };

  const isReady = isWsOpen && isCameraReady && !isSent && !isScanning;
  return (
    <div className="flex flex-col items-center justify-center mb-20">
      <div className="bg-white rounded-xl shadow-2xl pb-10 flex flex-col items-center gap-y-10">
        <div className="relative w-[320px] h-[240px]">
          <video
            ref={videoRef}
            autoPlay
            muted
            width={320}
            height={240}
            className="rounded-xl rounded-b-none shadow border outline-none absolute top-0 left-0 z-0"
          />
          <canvas
            ref={canvasRef}
            width={320}
            height={240}
            className="absolute top-0 left-0 z-10 pointer-events-none"
          />
        </div>
        <div className="flex flex-col gap-y-5 items-center">
          <button
            onClick={sendFrame}
            disabled={!isReady}
            className={`px-4 py-2 bg-white text-slate-500 outline outline-[1px] outline-offset-2 outline-slate-300 rounded transition-all font-bold ${
              isReady ? "hover:bg-slate-400 hover:text-white" : "opacity-50"
            }`}
          >
            {isScanning
              ? "Memindai Wajah..."
              : isSent
              ? "Gambar Terkirim"
              : isWsOpen
              ? isCameraReady
                ? "Absen Sekarang"
                : "Menunggu Kamera..."
              : "Menyambung..."}
          </button>
          <p className="text-sm text-slate-500">{status}</p>
        </div>
      </div>
    </div>
  );
}
