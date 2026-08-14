import Image from "next/image";

export default function Logo({ className, priority }: { className?: string; priority?: boolean }) {
  return (
    <>
      <Image
        src="/logo-light.png"
        alt="AlFahd Car Rental"
        width={709}
        height={709}
        className={`${className} dark:hidden`}
        priority={priority}
      />
      <Image
        src="/logo-dark.jpg"
        alt="AlFahd Car Rental"
        width={1024}
        height={1024}
        className={`hidden ${className} dark:block`}
        priority={priority}
      />
    </>
  );
}
