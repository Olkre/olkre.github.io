import BoltCard, { type BenefitIcon } from "./BoltCard";

type Props = {
  title: string;
  description: string;
  variant: BenefitIcon;
};

/** Interactive benefit tile for the gym preview scroller (BoltCard + copy). */
export default function GymBenefitWrCard({
  title,
  description,
  variant,
}: Props) {
  return (
    <div className="flex h-full w-full flex-col items-start gap-2 px-3.5 pb-3.5 pt-3">
      <div className="relative flex w-max max-w-full shrink-0 select-none flex-col items-start justify-center [&_*]:select-none">
        <BoltCard variant={variant} />
      </div>
      <div className="mt-auto w-full min-w-0">
        <h3 className="mb-1 text-balance text-[15px] font-extrabold leading-tight tracking-tight text-[#101010]">
          {title}
        </h3>
        <p className="text-balance text-[12px] font-[450] leading-[1.42] tracking-tight text-[#101010] opacity-[0.72]">
          {description}
        </p>
      </div>
    </div>
  );
}
