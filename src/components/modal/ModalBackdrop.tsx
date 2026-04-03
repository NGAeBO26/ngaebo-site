// components/modal/ModalBackdrop.tsx
import React from 'react';

interface Props {
  onClose: () => void;
}

export default function ModalBackdrop({ onClose }: Props) {
  return <div onClick={onClose} className="modal-backdrop" />;

}