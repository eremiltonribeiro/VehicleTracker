import { brandColors } from "@/lib/colors";

export function Logo() {
  return (
    <div className="flex items-center justify-center">
      <svg
        width="240"
        height="60"
        viewBox="0 0 240 60"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M20 10H40V20H30V50H20V10Z"
          fill={brandColors.navyBlue}
        />
        <path
          d="M45 10H70C75 10 80 15 80 20V40C80 45 75 50 70 50H45V10ZM55 20V40H65C67.5 40 70 37.5 70 35V25C70 22.5 67.5 20 65 20H55Z"
          fill={brandColors.navyBlue}
        />
        <path
          d="M85 10H95L105 30L115 10H125V50H115V25L105 45L95 25V50H85V10Z"
          fill={brandColors.navyBlue}
        />
        <path
          d="M130 10H145C150 10 155 15 155 20V40C155 45 150 50 145 50H130V10ZM140 20V40H145C147.5 40 145 37.5 145 35V25C145 22.5 147.5 20 145 20H140Z"
          fill={brandColors.gold}
        />
        <path
          d="M160 10H185V20H170V25H180V35H170V40H185V50H160V10Z"
          fill={brandColors.gold}
        />
        <path
          d="M190 10H200L213 35V10H223V50H213L200 25V50H190V10Z"
          fill={brandColors.gold}
        />
      </svg>
    </div>
  );
}