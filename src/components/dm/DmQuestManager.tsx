import React from 'react';
import { Quest, NPC, LocationEntry } from '../../types';
import { QuestsTab } from '../quest/QuestsTab';

interface DmQuestManagerProps {
  campaignId: string;
  quests: Quest[];
  npcs?: NPC[];
  locations?: LocationEntry[];
  partyCharacters?: { id: string; name: string }[];
  onToggleObjective: (questId: string, objectiveId: string, done: boolean) => Promise<void>;
  onCreateQuest: (questData: Partial<Quest> & { participantIds?: string[] }) => Promise<void>;
  onUpdateQuest: (questId: string, questData: Partial<Quest> & { participantIds?: string[] }) => Promise<void>;
  onDeleteQuest: (questId: string) => Promise<void>;
  onCompleteQuest: (questId: string, options?: { grantRewards?: boolean }) => Promise<void>;
}

export const DmQuestManager: React.FC<DmQuestManagerProps> = ({
  campaignId,
  quests,
  npcs = [],
  locations = [],
  partyCharacters = [],
  onToggleObjective,
  onCreateQuest,
  onUpdateQuest,
  onDeleteQuest,
  onCompleteQuest,
}) => {
  return (
    <div className="space-y-4" dir="rtl">
      <QuestsTab
        quests={quests}
        campaignId={campaignId}
        isDm={true}
        allowPlayerTickObjectives={true}
        npcs={npcs}
        locations={locations}
        partyCharacters={partyCharacters}
        onToggleObjective={onToggleObjective}
        onCreateQuest={onCreateQuest}
        onUpdateQuest={onUpdateQuest}
        onDeleteQuest={onDeleteQuest}
        onCompleteQuest={onCompleteQuest}
      />
    </div>
  );
};
