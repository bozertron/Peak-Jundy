"use client";

import { MessageOwnerButton } from "@/components/chat/MessageOwnerButton";

interface Props {
  ownerId: string;
  ownerName: string;
  equipmentId: string;
  equipmentTitle: string;
}

export function MessageOwnerButtonWrapper({ ownerId, ownerName, equipmentId, equipmentTitle }: Props) {
  return (
    <MessageOwnerButton
      ownerId={ownerId}
      ownerName={ownerName}
      equipmentId={equipmentId}
      equipmentTitle={equipmentTitle}
    />
  );
}
