// components/modal/ModalCard.tsx
import React from 'react';


interface Props {
  children: React.ReactNode;
  width?: 'sm' | 'md' | 'lg';
}

const widthMap = {
  sm: 'max-w-[450px]',
  md: 'max-w-[560px]',
  lg: 'max-w-[700px]',
};

export default function ModalCard({ children }: Props) {
  return <div className="modal-card">{children}</div>;
}