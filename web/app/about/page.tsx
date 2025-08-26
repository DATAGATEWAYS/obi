import type {Metadata} from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
    title: "About — Obi",
    description: "learn crypto, slow and steady.",
};

export default function AboutPage() {
    return (
        <main className="mx-auto max-w-[1120px] px-4 md:px-6 pt-20 md:pt-16">
            {/* Back to Home */}
            <Link
                href="/"
                aria-label="Back to home"
                className="fixed top-3 right-3 md:top-6 md:right-6 z-50 flex items-center justify-center gap-2 bg-white/20 backdrop-blur-sm border border-[#987048] text-[#987048] px-6 py-3 rounded-full hover:bg-white/30 active:scale-[0.98] transition-all pointer-events-auto"
            >
                <span className="satoshi-regular">Home</span>
            </Link>
            <div className="space-y-24 md:space-y-32 lg:space-y-40">
                {/* Intro + stickers */}
                <section className="grid gap-10 md:grid-cols-[1.25fr_0.75fr] items-start md:pb-18">
                    <div className="space-y-4">
                        <h2 className="font-black text-[#95654D] text-[28px] md:text-[40px] leading-[1.18] tracking-[0.03em]">
                            Your Personal Guide to the Future of Money
                        </h2>

                        <div className="max-w-[547px]">
                            <p className="text-[16px] font-medium leading-[1.18] tracking-[0.03em] text-[#6C584C]">
                                Imagine having a knowledgeable partner who&apos;s always available to clear your crypto
                                curiosity — that&apos;s Obi.
                            </p>

                            <p className="mt-4 text-[16px] font-medium leading-[1.18] tracking-[0.03em] text-[#6C584C]">
                                Whether you&apos;re curious about digital currencies, need help setting up your first
                                wallet,
                                want to send money to family in another country, or just understand the blockchain buzz
                                —
                                Obi
                                makes it simple through the messaging apps you already use.
                            </p>
                        </div>

                    </div>
                    {/* Stickers */}
                    <div
                        className="relative md:ml-auto w-full h-[180px] sm:h-[200px] md:h-[240px] lg:h-[260px] pointer-events-none select-none">
                        {/* Wallet? let's talk */}
                        <Image
                            src="/stickers/wallet.svg"
                            alt="Wallet? let's talk"
                            width={173}
                            height={131}
                            className="absolute top-0 left-1/2 -translate-x-1/2 rotate-[6deg] w-[150px] md:w-[173px] transform-gpu"
                            priority
                        />

                        {/* Shell */}
                        <Image
                            src="/stickers/shell.svg"
                            alt=""
                            width={147}
                            height={120}
                            className="absolute top-[39%] left-[10%] -rotate-[10deg] w-[120px] md:w-[147px] transform-gpu"
                        />

                        {/* Curious is enough */}
                        <Image
                            src="/stickers/curious.svg"
                            alt="Curious is enough"
                            width={160}
                            height={130}
                            className="absolute top-[56%] right-[12%] -rotate-[-2deg] w-[140px] md:w-[160px] transform-gpu"
                        />
                    </div>
                </section>

                {/* Pain points */}
                <section className="space-y-8 font-satoshi">
                    <h3 className="text-[28px] md:text-[40px] font-black leading-[1.18] tracking-[0.03em] text-[#95654D]">
                        Getting started with crypto feels overwhelming and risky,{" "}
                        <span className="text-[#ADC178]">because it is.</span>
                    </h3>

                    <div className="grid gap-8 md:grid-cols-2">
                        {/* Left coloumn */}
                        <div>
                            <div className="relative md:block md:h-[360px] lg:h-[380px]">
                                {/* MOBILE */}
                                <div className="flex flex-col items-center md:hidden px-4 relative">
                                    <BubbleSticker
                                        src="/stickers/scammers.svg"
                                        width={260}
                                        height={110}
                                        className="max-w-[90%] translate-x-[-10px] translate-y-[0px]"
                                    />

                                    <BubbleSticker
                                        src="/stickers/learning.svg"
                                        width={260}
                                        height={120}
                                        className="max-w-[90%] translate-x-[-50px] -translate-y-[20px]"
                                    />

                                    <BubbleSticker
                                        src="/stickers/assumes.svg"
                                        width={230}
                                        height={120}
                                        className="max-w-[90%] -translate-x-[-50px] translate-y-[-40px]"
                                    />

                                    <BubbleSticker
                                        src="/stickers/friends.svg"
                                        width={310}
                                        height={140}
                                        className="max-w-[90%] translate-x-[-30px] translate-y-[0px]"
                                    />
                                </div>


                                {/* DESKTOP/TABLET (как было) */}
                                <div className="relative hidden h-[340px] md:block md:h-[360px] lg:h-[380px]">
                                    <BubbleSticker src="/stickers/scammers.svg" width={271} height={73}
                                                   className="absolute left-20 top-0"/>
                                    <BubbleSticker src="/stickers/learning.svg" width={242} height={117}
                                                   className="absolute left-[-250px] top-[148px]"/>
                                    <BubbleSticker src="/stickers/assumes.svg" width={194} height={116}
                                                   className="absolute left-[300px] top-[-14px]"/>
                                    <BubbleSticker src="/stickers/friends.svg" width={347} height={101}
                                                   className="absolute left-[120px] top-[20px]"/>
                                </div>
                            </div>
                        </div>

                        {/* right column (Result card from 3 SVGs) */}
                        <div className="relative md:block md:h-[360px] lg:h-[380px]">
                            {/* MOBILE */}
                            <div className="relative h-[300px] md:hidden">
                                <Image
                                    src="/stickers/result.svg"
                                    alt=""
                                    width={394}
                                    height={194}
                                    className="absolute top-[0px] left-1/2 -translate-x-1/2 w-[360px] h-[177px]"
                                />
                                <Image
                                    src="/stickers/note.svg"
                                    alt=""
                                    width={227}
                                    height={116}
                                    className="absolute  bottom-[20px] right-[-10px] w-[227px] h-[116px] rotate-[12deg]"
                                />
                                <Image
                                    src="/stickers/wood.svg"
                                    alt=""
                                    width={59}
                                    height={16}
                                    className="absolute bottom-[78px] right-[-18px] rotate-[8deg]"
                                />
                            </div>

                            {/* DESKTOP/TABLET */}
                            <div className="relative hidden h-[340px] md:block md:h-[360px] lg:h-[380px]">
                                <Image src="/stickers/result.svg" alt="" width={394} height={194}
                                       className="absolute top-[100px] left-0 w-[394px] h-[194px]"/>
                                <Image src="/stickers/note.svg" alt="" width={227} height={116}
                                       className="absolute -bottom-2 -right-[-60px] w-[227px] h-[116px] rotate-[1deg]"/>
                                <Image src="/stickers/wood.svg" alt="" width={73} height={16}
                                       className="absolute bottom-[54px] right-[40px] rotate-[8deg]"/>
                            </div>
                        </div>
                    </div>
                </section>


                {/* Telegram */}
                <section className="space-y-6">
                    <h3 className="font-black text-[#95654D] text-[28px] md:text-[40px] leading-[1.18] tracking-[0.03em]">
                        Obi is your AI-powered crypto mentor, available 24/7 through Telegram.
                    </h3>

                    {/* ——— STEPS ——— */}
                    <div className="relative">
                        {/* MOBILE: */}
                        <ol className="md:hidden flex flex-col items-center gap-4 px-4">
                            <Step
                                n={1}
                                className="w-full max-w-[360px]"
                                cardClassName="w-full"
                            >
                                Just message Obi on Telegram. No apps to install. No need to “sound smart”. Type your
                                question in your own words.
                            </Step>

                            <Step
                                n={2}
                                className="w-full max-w-[360px]"
                                cardClassName="w-full"
                            >
                                Obi replies with plain-English guidance — no jargon, no hype. You get step-by-step help,
                                safety tips, and recommendations.
                            </Step>

                            <Step
                                n={3}
                                className="w-full max-w-[360px]"
                                cardClassName="w-full"
                            >
                                Explore at your own pace. Obi helps you avoid scams, understand opportunities, and
                                connect
                                with vetted human experts.
                            </Step>
                        </ol>


                        {/* DESKTOP/TABLET: */}
                        <ol className="hidden md:block md:relative md:h-[340px]">
                            <Step
                                n={1}
                                className="md:absolute md:top-[20px] md:left-[160px]"
                                cardClassName="md:w-[334px]"
                            >
                                Just message Obi on Telegram. No apps to install. No need to “sound smart”. Type your
                                question
                                in your own words.
                            </Step>

                            <Step
                                n={2}
                                className="md:absolute md:top-[150px] md:left-[340px]"
                                cardClassName="md:w-[334px]"
                            >
                                Obi replies with plain-English guidance — no jargon, no hype. You get step-by-step help,
                                safety
                                tips, and recommendations.
                            </Step>

                            <Step
                                n={3}
                                className="md:absolute md:top-[280px] md:left-[620px]"
                                cardClassName="md:w-[334px]"
                            >
                                Explore at your own pace. Obi helps you avoid scams, understand opportunities, and
                                connect
                                with
                                vetted human experts.
                            </Step>
                        </ol>
                    </div>
                </section>

                {/* Quote */}
                <section className="py-2 flex justify-center px-4">
                    <blockquote
                        className="gasoek text-[28px] md:text-[40px] leading-[1.18] tracking-[0.03em] text-[#ADC178] font-normal
               w-full max-w-[423px] text-center"
                    >
                        “having Obi is like having a crypto-savvy friend in your pocket.”
                    </blockquote>
                </section>


                {/* Personas */}
                <section className="space-y-6">
                    <h3 className="font-black text-[#95654D] text-[28px] md:text-[40px] leading-[1.18] tracking-[0.03em]">Who
                        is Obi for?</h3>
                    <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-4">
                        <Persona
                            title="The Curious"
                            text="“I keep hearing about Bitcoin, but I don’t know where to start.”"
                            img="/personas/curious.png"
                        />
                        <Persona
                            title="The Practical"
                            text="“I want to send money abroad without huge fees.”"
                            img="/personas/practical.png"
                        />
                        <Persona
                            title="The Cautious"
                            text="“I want to understand this stuff before I invest anything.”"
                            img="/personas/cautious.png"
                        />
                        <Persona
                            title="The Pioneer"
                            text="“Banking is expensive and slow where I live.”"
                            img="/personas/pioneer.png"
                        />
                    </div>
                </section>

                {/* Accordion */}
                <section className="space-y-4">
                    <h3 className="font-black text-[#95654D] text-[28px] md:text-[40px] leading-[1.18] tracking-[0.03em]">You
                        can use Obi for</h3>

                    <div className="space-y-3">
                        <Details
                            title="Ask Anything, Anytime"
                            description="Text OBI your crypto questions in plain language:"
                            defaultOpen
                            items={[
                                "How do I buy my first Bitcoin safely?",
                                "What’s the difference between Bitcoin and Ethereum?",
                                "Is this investment opportunity a scam?"
                            ]}
                        />
                        <Details
                            title="Get Instant, Clear Answers"
                            description="OBI translates complex crypto concepts into everyday language, with:"
                            items={[
                                "Step-by-step guides tailored to your experience level",
                                "Real-time scam detection and warnings",
                                "Recommendations based on your specific needs and location"
                            ]}
                        />
                        <Details
                            title="Learn at Your Own Pace"
                            items={[
                                "Start with basics and gradually explore advanced topics",
                                "Track your learning progress with interactive milestones",
                                "Join local communities of learners like you"
                            ]}
                        />
                        <Details
                            title="Stay Protected"
                            items={[
                                "Automatic alerts for suspicious links or offers",
                                "Education about common scams and how to avoid them",
                                "Access to trusted resources and verified projects only"
                            ]}
                        />
                        <Details
                            title="Stay Protected"
                            items={[
                                "Automatic alerts for suspicious links or offers",
                                "Education about common scams and how to avoid them",
                                "Access to trusted resources and verified projects only"
                            ]}
                        />
                        <Details
                            title="Connect with Human Experts"
                            badge="/stickers/soon.svg"
                            description="When you need personalized guidance:"
                            items={[
                                "Book sessions with verified crypto professionals",
                                "Get one-on-one help with complex transactions",
                                "Pay securely through the app or traditional payment methods"
                            ]}
                        />
                    </div>
                </section>

                {/* Finals */}
                <section className="space-y-10 w-full max-w-[423px] mx-auto text-center">
                    <div>
                        <div
                            className="gasoek text-[28px] md:text-[48px] leading-[1.18] tracking-[0.03em] text-[#ADC178]">
                            Every journey begins with
                        </div>
                        <div className="lobster">a single step.</div>
                    </div>

                    <div>
                        <div
                            className="gasoek text-[28px] md:text-[48px] leading-[1.18] tracking-[0.03em] text-[#ADC178]">With
                            Obi, that step is just
                        </div>
                        <div className="lobster">one question</div>
                        <div
                            className="gasoek text-[28px] md:text-[48px] leading-[1.18] tracking-[0.03em] text-[#ADC178]">
                            away.
                        </div>
                    </div>
                </section>

                {/* footer */}
                <footer className="relative left-1/2 w-screen -translate-x-1/2 mt-16 sm:mt-20 md:mt-0"
                style={{marginTop: 160}}>
                    <div className="relative h-[260px] sm:h-[300px] md:h-[360px] lg:h-[420px]">
                        {/* Hill */}
                        <Image
                            src="/stickers/hill.svg"
                            alt=""
                            fill
                            className="
                            object-cover object-bottom select-none pointer-events-none
                            origin-bottom
                            [transform:scaleY(.55)] sm:[transform:scaleY(.6)] md:[transform:scaleY(.65)] lg:[transform:scaleY(.7)]
                          "
                        />

                        {/* Turtle */}
                        <Image
                            src="/stickers/footer_obi.svg"
                            alt="Obi the turtle"
                            width={230}
                            height={290}
                            className="
                        absolute left-1/2 -translate-x-1/2 md:left-[48%]
                        bottom-[50%] sm:bottom-[50%] md:bottom-[50%]
                        w-[180px] h-auto md:h-[290px] md:w-[230px]
                      "
                        />

                        {/* Copyright + X on the hill */}
                        <div className="absolute bottom-[10%] md:bottom-[20%] md:right-[3%] z-20 w-full">
                            <div
                                className="
                            w-full max-w-none sm:max-w-[1120px]
                            mx-auto px-4 md:px-6 py-4
                            flex flex-col sm:flex-row
                            items-stretch sm:items-center
                            justify-between
                            gap-3 sm:gap-0
                            text-[#6C584C]
                          "
                            >
                                <a
                                    href="https://x.com/your_handle"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="
                                order-1 sm:order-2
                                flex w-full items-center gap-2 hover:opacity-80
                                font-bold text-[16px] md:text-[18px] leading-[1.18]
                              "
                                >
                                    <span>Follow us on</span>
                                    <span className="underline">X</span>
                                </a>

                                <div
                                    className="order-2 sm:order-1 w-full font-medium text-[14px] md:text-[16px] leading-[1.18]">
                                    © {new Date().getFullYear()} Data Gateways. All rights reserved.
                                    <br/>
                                    <a
                                        href="/"
                                        className="underline decoration-[#6C584C]/40 hover:decoration-[#6C584C] font-bold text-[16px] md:text-[18px]"
                                    >
                                        Data Gateways LLC
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                </footer>
            </div>
        </main>
);
}

/* ——— Components ——— */

type BubbleStickerProps = {
    src: string;
    width: number;
    height: number;
    className?: string;
    textClassName?: string;
};

export function BubbleSticker({
                                  src,
                                  width,
                                  height,
                                  className = "",
                                  textClassName = "",
                              }: BubbleStickerProps) {
    return (
        <div className={`relative inline-block ${className}`} style={{width, height}}>
            <Image
                src={src}
                alt=""
                width={width}
                height={height}
                draggable={false}
                priority={false}
                className="w-full h-auto"  // <-- не даём вылезать из своей обёртки
            />
            <p className={`absolute inset-0 flex items-center px-6 md:px-7 text-left
                     text-[16px] font-medium leading-[1.18] tracking-[0.03em] text-white
                     ${textClassName}`}>
            </p>
        </div>
    );
}


function Step({
                  n,
                  children,
                  className = "",
                  cardClassName = "",
              }: {
    n: number;
    children: React.ReactNode;
    className?: string;
    cardClassName?: string;
}) {
    return (
        <li className={`relative pl-[25px] ${className}`}>
            <div className="absolute -left-6 top-1/2 -translate-y-1/2 z-10">
                <Image
                    src={`/stickers/${n}.svg`}
                    alt={`Step ${n}`}
                    width={64}
                    height={64}
                    className="object-contain"
                />
            </div>

            <div
                className={`inline-block rounded-2xl border bg-brand-paper px-5 py-4 md:px-6 md:py-5 shadow-[0_1px_0_rgba(0,0,0,0.04)] 
  w-[334px] ${cardClassName}`}
            >
                <p className="text-[16px] font-medium leading-[1.18] tracking-[0.03em] text-[#6C584C]">
                    {children}
                </p>
            </div>

        </li>
    );
}

function Persona({title, text, img}: { title: string; text: string; img: string }) {
    return (
        <article className="text-center space-y-3">
            <div className="relative mx-auto h-24 w-24">
                <Image src={img} alt={title} fill className="object-contain"/>
            </div>

            {/* Title */}
            <div className="font-black text-[22px] leading-[1.18] tracking-[0.03em] text-[#95654D]">
                {title}
            </div>

            {/* Text */}
            <div className="font-bold text-[16px] leading-[1.18] tracking-[0em] text-[#6C584C] max-w-[220px] mx-auto">
                {text}
            </div>
        </article>
    );
}


function Details({
                     title,
                     description,
                     items,
                     badge,
                     defaultOpen = false,
                 }: {
    title: string;
    description?: string;
    items?: string[];
    badge?: string; // теперь это путь до SVG
    defaultOpen?: boolean;
}) {
    return (
        <details
            className="group rounded-[20px] bg-[#FAF2DD] p-0 overflow-hidden"
            open={defaultOpen}
        >
            <summary
                className="list-none cursor-pointer select-none flex items-center justify-between gap-[10px] px-[25px] py-[25px]">
                {/* Title — занимает всё оставшееся место */}
                <span className="flex-1 min-w-0 font-bold text-[22px] leading-[1.18] tracking-[0.03em] text-[#6C584C]">
    {title}
  </span>

                {/* Правый блок: бейдж + стрелка */}
                <div className="flex items-center gap-2 shrink-0 whitespace-nowrap">
                    {badge ? (
                        <Image
                            src={badge}
                            alt="badge"
                            width={140}
                            height={30}
                            className="object-contain pointer-events-none w-[96px] h-[20px] md:w-[140px] md:h-[30px]"
                        />
                    ) : null}

                    <svg
                        className="size-5 text-[#6C584C] transition-transform duration-200 group-open:rotate-180 shrink-0"
                        viewBox="0 0 20 20"
                        fill="none"
                        aria-hidden="true"
                    >
                        <path
                            d="M4 8 L10 14 L16 8"
                            stroke="currentColor"
                            strokeWidth="2.2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </svg>
                </div>
            </summary>

            <div className="px-[25px] pb-[25px] space-y-3">
                {/* Description text */}
                {description && (
                    <p className="font-medium text-[16px] leading-[1.18] tracking-[0.03em] text-[#6C584C]">
                        {description}
                    </p>
                )}

                {/* Bullets */}
                {items?.length ? (
                    <ul className="list-disc pl-5 space-y-2">
                        {items.map((i) => (
                            <li
                                key={i}
                                className="font-medium text-[16px] leading-[1.18] tracking-[0.03em] text-[#6C584C]"
                            >
                                {i}
                            </li>
                        ))}
                    </ul>
                ) : null}
            </div>
        </details>
    );
}