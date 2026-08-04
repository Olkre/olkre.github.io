import BoltCard, { type BenefitIcon } from "./BoltCard";

const CARDS: {
  title: string;
  description: string;
  variant: BenefitIcon;
}[] = [
  {
    title: "Progressive overload",
    description:
      "Suggested values, beat your PR, and track progress on reps and weight.",
    variant: "bolt",
  },
  {
    title: "Compete with friends",
    description:
      "See what your friends are up to in the app and stay motivated together.",
    variant: "friends",
  },
  {
    title: "Track your rest",
    description:
      "Use a customizable built-in timer to optimize recovery between sets.",
    variant: "timer",
  },
];

/** Feature cards from Sasha's Gym landing — liquid-metal sticker icons. */
export default function GymBenefitCards() {
  return (
    <section
      className="w-full px-2 pb-4 pt-1"
      aria-labelledby="gym-benefit-heading"
    >
      <h2
        id="gym-benefit-heading"
        className="mb-7 px-2 text-center text-[clamp(1.35rem,3.5vw,1.75rem)] font-extrabold tracking-tight text-[#101010] sm:text-left"
      >
        Everything between sets
      </h2>
      <div className="grid grid-cols-1 gap-7 sm:grid-cols-3 sm:justify-between sm:gap-x-4 sm:gap-y-8">
        {CARDS.map((card) => (
          <article
            key={card.variant}
            className="flex w-full min-w-0 flex-col gap-2 sm:items-start sm:gap-0"
          >
            <div className="relative flex w-max max-w-full shrink-0 select-none flex-col items-center justify-center self-center sm:self-start sm:items-start [&_*]:select-none">
              <BoltCard variant={card.variant} />
            </div>
            <div className="mx-auto mt-3 w-full min-w-0 max-w-[min(100%,30ch)] px-0.5 text-center sm:mx-0 sm:max-w-none sm:text-left">
              <h3 className="mb-1 text-balance text-[clamp(0.95rem,2.2vw,1.0625rem)] font-extrabold leading-tight tracking-tight text-[#101010] sm:mb-0.5">
                {card.title}
              </h3>
              <p className="mt-2 text-balance break-words text-[0.8125rem] font-[450] leading-[1.42] tracking-tight text-[#101010] opacity-[0.72]">
                {card.description}
              </p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
