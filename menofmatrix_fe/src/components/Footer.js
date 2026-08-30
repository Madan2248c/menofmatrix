import Image from "next/image";
import { HiOutlineEnvelopeOpen, HiOutlinePencilSquare } from "react-icons/hi2";
import { SiInstagram, SiYoutube, SiX } from "react-icons/si";
import { FloatingDock } from "@/components/ui/floating-dock";

const items = [
  { title: "Newsletter", icon: <HiOutlineEnvelopeOpen className="h-full w-full" />, href: "/news" },
  { title: "Blog", icon: <HiOutlinePencilSquare className="h-full w-full" />, href: "/blogs" },
  {
    title: "MenOfMatrix",
    large: true,
    iconScale: 2,
    icon: (
      <Image
        src="/brand/menofmatrix-logo-onblack.svg"
        alt="MenOfMatrix"
        width={40}
        height={40}
        priority
        className="h-full w-full rounded-full object-contain"
      />
    ),
    href: "/",
  },
  {
    title: "Social",
    wide: true,
    href: "/social",
    icons: [
      <SiInstagram key="ig" className="h-4 w-4" />,
      <SiYoutube key="yt" className="h-4 w-4" />,
      <SiX key="x" className="h-4 w-4" />,
    ],
  },
];

// FloatingDock is position:fixed internally (see floating-dock.jsx), so this
// footer stays a plain semantic landmark and doesn't occupy layout space.
export default function Footer() {
  return (
    <footer>
      <FloatingDock items={items} />
    </footer>
  );
}
