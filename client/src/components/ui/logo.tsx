import { brandColors } from "@/lib/colors";

interface LogoProps {
  width?: number;
  height?: number;
  showText?: boolean;
}

export function Logo({ width = 40, height = 40, showText = true }: LogoProps) {
  return (
    <div className="flex items-center gap-2">
      <div className="relative" style={{ width, height }}>
        {/* Quadrado azul marinho maior */}
        <div 
          className="absolute" 
          style={{ 
            width: width * 0.8, 
            height: height * 0.8, 
            backgroundColor: brandColors.navyBlue,
            bottom: 0,
            left: 0
          }}
        />
        
        {/* Quadrado dourado */}
        <div 
          className="absolute" 
          style={{ 
            width: width * 0.5, 
            height: height * 0.5, 
            backgroundColor: brandColors.gold,
            top: 0,
            right: width * 0.2
          }}
        />
        
        {/* Quadrado azul marinho menor */}
        <div 
          className="absolute" 
          style={{ 
            width: width * 0.4, 
            height: height * 0.4, 
            backgroundColor: brandColors.navyBlue,
            bottom: height * 0.1,
            right: 0
          }}
        />
      </div>
      
      {showText && (
        <div className="flex flex-col">
          <span className="font-bold text-sm md:text-lg tracking-wider" style={{ color: brandColors.navyBlue }}>
            GRANDUVALE
          </span>
          <span className="text-[10px] md:text-xs tracking-wide" style={{ color: brandColors.gold }}>
            MINERAÇÃO
          </span>
        </div>
      )}
    </div>
  );
}