'use client';

import React, { useState } from 'react';
import { RequirementData, UserSession } from '@/lib/types';
import { RequirementsMatrixSheet } from './RequirementsMatrixSheet';
import {
  FileSpreadsheet,
  Layers,
  Sparkles,
} from 'lucide-react';

interface ActionRequiredCentreProps {
  requirements: RequirementData[];
  onRequirementSubmit?: (id: string, value: string, fileUrl?: string) => Promise<void>;
  onRequirementReview?: (id: string, status: 'ACCEPTED' | 'NEEDS_REVISION', reason?: string) => Promise<void>;
  isInternalUser?: boolean;
  projectId?: string;
  projectName?: string;
  currentUser?: UserSession;
  onReload?: () => Promise<void>;
}

export function ActionRequiredCentre({
  requirements,
  onRequirementSubmit,
  onRequirementReview,
  isInternalUser = false,
  projectId,
  projectName = 'Website',
  currentUser,
  onReload,
}: ActionRequiredCentreProps) {
  // Resolve Project ID
  const resolvedProjectId = projectId || requirements[0]?.projectId || '';

  const handleReload = async () => {
    if (onReload) {
      await onReload();
    } else {
      window.location.reload();
    }
  };

  return (
    <div className="space-y-6">
      <RequirementsMatrixSheet
        projectId={resolvedProjectId}
        projectName={projectName}
        requirements={requirements}
        currentUser={currentUser}
        isInternalUser={isInternalUser}
        onReload={handleReload}
      />
    </div>
  );
}
