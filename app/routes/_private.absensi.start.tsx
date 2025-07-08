import { json, redirect, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { getSession } from "~/services/session.services";
import { useEffect, useRef, useState } from "react";
import { axios } from "~/services/axios.services";

function gabungTanggalDenganJam(tanggal: Date, waktuISO: string) {
  const jam = new Date(waktuISO);
  const hasil = new Date(tanggal);
  hasil.setHours(jam.getUTCHours());
  hasil.setMinutes(jam.getUTCMinutes());
  hasil.setSeconds(0);
  hasil.setMilliseconds(0);
  return hasil;
}

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const id = Number(url.searchParams.get("id"));
  const session = await getSession(request.headers.get("cookie"));
  const token = session.get("access_token");
  const username = session.get("username");

  if (!id || !username) {
    return redirect("/?error=akses_ditolak");
  }

  try {
    const response = await axios.get("/presensi", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const semuaPresensi = response.data.data;

    const dataUser = semuaPresensi.find(
      (item: any) =>
        item.jadwal.id_jadwal === id && item.siswa.nisn === username
    );

    if (!dataUser) return redirect("/absensi/?error=not_found");

    const now = new Date();
    const jamMulai = gabungTanggalDenganJam(now, dataUser.jadwal.jam_mulai);
    const jamSelesai = gabungTanggalDenganJam(now, dataUser.jadwal.jam_selesai);
    const presensiAktif = now >= jamMulai && now <= jamSelesai;

    if (!presensiAktif) {
      return redirect("/absensi/?error=no_confirm");
    }

    return json({
      nim: username,
      mapel: dataUser.jadwal.guru.mapel.deskripsi,
      id_presensi: dataUser.id_presensi,
      token,
    });
  } catch (err) {
    console.error(err);
    return redirect("/absensi/?error=server_error");
  }
}

export default function StartAbsensi() {
  const { nim, mapel, id_presensi, token } = useLoaderData<typeof loader>();

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

  const updateProgres = async () => {
    try {
      await axios.put(
        `/presensi/${id_presensi}`,
        {
          progres: "pending",
          uploaded_at: new Date("2025-07-08").toISOString()
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
    } catch (error) {
      console.error("Gagal update progres:", error);
    }
  };

  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then((stream) => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            if (stream.active) setIsCameraReady(true);
          };
        }
      })
      .catch(() => {
        setStatus("❌ Akses kamera ditolak");
        setIsCameraReady(false);
      });
  }, []);

  useEffect(() => {
    const socket = new WebSocket("ws://localhost:3001");
    socketRef.current = socket;

    socket.onopen = () => {
      setIsWsOpen(true);
      setStatus("✅ Terhubung ke server");
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setStatus("🔍 Memindai wajah...");
      setIsScanning(true);
      startScanEffect();
      console.log(data)
      setTimeout(() => {
        if (data.result && data.result !== "Tidak Dikenal") {
          if (data.absen) {
            setStatus(`✅ ${data.result}`);
            speak(`Absensi berhasil. ${data.result}`);
            updateProgres();
          } else {
            setStatus(`✅ ${data.result}`);
            speak(` ${data.result}`);
          }
        } else if (data.result === "Tidak Dikenal") {
          setIsSent(false);
          speak("Tidak Dikenal");
          setStatus("❌ Tidak Dikenal");
        } else if (data.error) {
          setStatus(`❌ ${data.error}`);
          speak(`Terjadi kesalahan. ${data.error}`);
          setIsSent(false);
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

      socketRef.current.send(JSON.stringify({ image: dataUrl, nim, mapel }));
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
    if (scanAnimationRef.current)
      cancelAnimationFrame(scanAnimationRef.current);
    const ctx = canvasRef.current?.getContext("2d");
    ctx?.clearRect(0, 0, 320, 240);
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
            className="rounded-xl rounded-b-none shadow border absolute top-0 left-0 z-0"
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
          <p className="text-xs text-slate-500 text-center break-words max-w-[280px] px-2">
            {status}
          </p>
        </div>
      </div>
    </div>
  );
}
