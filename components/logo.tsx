import Image from "next/image";
import Link from "next/link";
import React from "react";

const Logo = () => {
  return (
    <Link href="/" className="group flex items-center gap-3 outline-none">
      <Image src={"/icon.svg"} alt="icon" width={40} height={40} />
      <div className="hidden sm:block">
        <p className="text-sm font-bold uppercase tracking-[0.2rem] text-primary leading-none mb-1">
          Bella
          <br />
          <span className="ms-3">Crosta</span>
        </p>
      </div>
    </Link>
  );
};

export default Logo;
