interface LogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  dark?: boolean;
}

export default function Logo({ size = "md", dark = false }: LogoProps) {
  const sizes = { sm: 32, md: 56, lg: 96, xl: 140 };
  const s = sizes[size];
  const stroke = dark ? "#fdfcf8" : "#5d4470";

  return (
    <svg
      width={s}
      height={s}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Sintonia"
    >
      <g
        stroke={stroke}
        strokeWidth="1.4"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M50 50 Q30 25 12 32 Q5 40 15 50 Q25 55 50 50" />
        <path d="M50 50 Q35 65 20 72 Q12 70 18 60 Q30 54 50 50" />
        <path d="M50 50 Q70 25 88 32 Q95 40 85 50 Q75 55 50 50" />
        <path d="M50 50 Q65 65 80 72 Q88 70 82 60 Q70 54 50 50" />
        <line x1="50" y1="28" x2="50" y2="74" strokeWidth="1.6" />
        <path d="M50 28 Q47 22 44 20" />
        <path d="M50 28 Q53 22 56 20" />
        <circle cx="44" cy="20" r="0.8" fill={stroke} />
        <circle cx="56" cy="20" r="0.8" fill={stroke} />
      </g>
      <text
        x="38"
        y="56"
        fontFamily="Cormorant Garamond, serif"
        fontSize="14"
        fontStyle="italic"
        fontWeight="500"
        fill={stroke}
      >
        R
      </text>
      <text
        x="54"
        y="60"
        fontFamily="Cormorant Garamond, serif"
        fontSize="14"
        fontStyle="italic"
        fontWeight="500"
        fill={stroke}
      >
        B
      </text>
    </svg>
  );
}
