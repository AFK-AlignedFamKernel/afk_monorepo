"use client"
import React, { useEffect, useMemo, useState } from "react";
import { ContentCreator } from "@/types";

interface RewardsCenterProps {
  slug?: string;
  creator?: ContentCreator;
}

const RewardsCenter: React.FC<RewardsCenterProps> = ({ }) => {





  return (
    <div className="shadow flex flex-col items-center dark:bg-contrast-100">


      <div className="flex flex-col items-center">
        <h2 className="text-xl font-semibold mb-4 italic">Rewards Center</h2>
        <p className="text-sm text-contrast-500">
          Earn rewards by engaging with the platform and participating in activities.
        </p>
        <p className="text-sm text-contrast-500">More announcement coming soon</p>
      </div>
    </div>
  );
};

export default RewardsCenter; 