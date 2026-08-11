import Image from "next/image";

export default function Logo({ className, priority }: { className?: string; priority?: boolean }) {
  return (
    <>
      <Image
        src="/logo.jpg"
        alt="AlFahd Car Rental"
        width={128}
        height={70}
        className={`${className} dark:hidden`}
        priority={priority}
      />
      <Image
        src="/logo-dark.png"
        alt="AlFahd Car Rental"
        width={128}
        height={70}
        className={`hidden ${className} dark:block`}
        priority={priority}
      />
    </>
  );
}
