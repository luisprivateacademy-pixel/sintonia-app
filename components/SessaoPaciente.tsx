"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Phone } from "lucide-react";
import DailyIframe, { DailyCall } from "@daily-co/daily-js";

export default function SessaoPaciente({
  roomUrl,
  token,
}: {
  roomUrl: string;
  token: string;
}) {
  const router = useRouter();
  const videoRef = useRef<HTMLDivElement>(null);
  const callRef = useRef<DailyCall | null>(null);
  const [conectado, setConectado] = useState(false);

  useEffect(() => {
    const call = DailyIframe.createFrame(videoRef.current!, {
      iframeStyle: {
        width: "100%",
        height: "100%",
        border: "0",
        borderRadius: "0",
      },
      showLeaveButton: true,
    });

    callRef.current = call;

    call.on("joined-meeting", () => setConectado(true));
    call.on("left-meeting", () => router.push("/paciente"));

    call.join({ url: roomUrl, token });

    return () => {
      call.destroy();
    };
  }, [roomUrl, token]);

  function sair() {
    if (callRef.current) callRef.current.leave();
    router.push("/paciente");
  }

  return (
    <div className="h-screen flex flex-col bg-purple-950">
      <header className="flex items-center justify-between px-6 py-3 border-b border-white/10">
        <div className="text-white font-serif text-lg">Sessao em andamento</div>
        <button
          onClick={sair}
          className="px-4 py-2 rounded-lg flex items-center gap-2 text-sm bg-red-600 text-white"
        >
          <Phone size={14} /> Sair
        </button>
      </header>
      <div ref={videoRef} className="flex-1" />
    </div>
  );
}
