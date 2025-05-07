import Image from "next/image"
import Link from "next/link"

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <Image src="/background_image.svg" alt="Background" fill priority className="object-cover" />
      </div>

      {/* Logo */}
      <div className="absolute bottom-[15%] right-[10%] z-10">
        <Image src="/obi_turtle.svg" alt="Turtle Logo" width={240} height={240} />
      </div>

      {/* Content Container */}
      <div className="z-10 flex flex-col items-center justify-center text-center px-4">
        {/* Title */}
        <h1 className="oi-regular text-6xl md:text-8xl mb-4 text-[#987048]">Obi</h1>

        {/* Tagline */}
        <p className="font-['Satoshi'] font-light text-xl md:text-2xl mb-8 text-[#987048]">learn crypto. slow and steady</p>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 mt-4">
          <Link
            href="https://t.me/yourlink"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 bg-white/20 backdrop-blur-sm border border-[#987048] text-[#987048] px-6 py-3 rounded-full hover:bg-white/30 transition-all"
          >
            <Image src="/telegram.svg" alt="Telegram" width={24} height={24} />
            <span className="font-['Satoshi'] font-normal">Telegram</span>
          </Link>

          <Link
            href="https://wa.me/yourlink"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 bg-white/20 backdrop-blur-sm border border-[#987048] text-[#987048] px-6 py-3 rounded-full hover:bg-white/30 transition-all"
          >
            <Image src="/whatsapp.svg" alt="WhatsApp" width={24} height={24} />
            <span className="font-['Satoshi'] font-normal">WhatsApp</span>
          </Link>
        </div>

        {/* Launch App Button */}
        <div className="mt-4">
          <Link
            href="https://obi-agentkit.vercel.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 bg-[#987048] text-white px-8 py-3 rounded-full hover:bg-[#87603d] transition-all"
          >
            <span className="font-['Satoshi'] font-normal">Launch App</span>
          </Link>
        </div>
      </div>
    </main>
  )
}
