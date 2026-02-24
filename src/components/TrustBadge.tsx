'use client';

import { Badge } from '@/components/ui/badge';
import { TRUST_LEVELS, getTrustLevelInfo } from '@/types';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface TrustBadgeProps {
  trustLevel: number;
  totalPoints?: number;
  size?: 'sm' | 'md' | 'lg';
  showPoints?: boolean;
}

const sizeClasses = {
  sm: 'text-xs px-1.5 py-0.5',
  md: 'text-sm px-2 py-1',
  lg: 'text-base px-3 py-1.5',
};

const colorClasses: Record<string, string> = {
  gray: 'bg-gray-500/20 text-gray-300 border-gray-500/30',
  bronze: 'bg-orange-600/20 text-orange-300 border-orange-500/30',
  silver: 'bg-slate-400/20 text-slate-200 border-slate-400/30',
  gold: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  purple: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
};

export function TrustBadge({
  trustLevel,
  totalPoints,
  size = 'md',
  showPoints = false,
}: TrustBadgeProps) {
  const info = getTrustLevelInfo(trustLevel);

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant="outline"
            className={`${sizeClasses[size]} ${colorClasses[info.color]} cursor-help`}
          >
            <span className="mr-1">{info.icon}</span>
            Lv.{trustLevel}
            {showPoints && totalPoints !== undefined && (
              <span className="ml-1 opacity-70">({totalPoints}pt)</span>
            )}
          </Badge>
        </TooltipTrigger>
        <TooltipContent className="bg-gray-800 border-gray-700 text-white">
          <div className="text-center">
            <div className="font-bold">
              {info.icon} {info.name}
            </div>
            <div className="text-xs text-gray-400">
              {info.minPoints.toLocaleString()}pt 〜
            </div>
            {totalPoints !== undefined && (
              <div className="text-xs text-purple-400 mt-1">
                現在: {totalPoints.toLocaleString()}pt
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// Trust level progress bar
interface TrustProgressProps {
  currentPoints: number;
}

export function TrustProgress({ currentPoints }: TrustProgressProps) {
  const currentLevel = Math.min(5, Math.floor(currentPoints / 100) + 1);
  const nextLevel = Math.min(5, currentLevel + 1);
  const currentInfo = getTrustLevelInfo(currentLevel);
  const nextInfo = nextLevel <= 5 ? getTrustLevelInfo(nextLevel) : null;

  const progress =
    nextLevel <= 5
      ? Math.min(
          100,
          ((currentPoints - currentInfo.minPoints) /
            (nextInfo!.minPoints - currentInfo.minPoints)) *
            100
        )
      : 100;

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className={colorClasses[currentInfo.color].split(' ')[1]}>
          {currentInfo.icon} {currentInfo.name}
        </span>
        {nextInfo && (
          <span className="text-gray-400">{nextInfo.name}まで</span>
        )}
      </div>
      <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
        <div
          className={`h-full bg-gradient-to-r ${
            currentLevel === 1
              ? 'from-gray-500 to-gray-400'
              : currentLevel === 2
              ? 'from-orange-600 to-orange-400'
              : currentLevel === 3
              ? 'from-slate-500 to-slate-300'
              : currentLevel === 4
              ? 'from-yellow-600 to-yellow-400'
              : 'from-purple-600 to-purple-400'
          }`}
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="text-right text-xs text-gray-400">
        {currentPoints.toLocaleString()}pt
      </div>
    </div>
  );
}
