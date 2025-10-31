import React from 'react';
import useGameStore from '../../store/useGameStore';

type Props = {
  index: number;
  className?: string;
  ariaLabel?: string;
};

const ExplainButton: React.FC<Props> = ({ index, className, ariaLabel }) => {
  const { showExplainFor, toggleExplain } = useGameStore();
  const isOpen = showExplainFor === index;
  return (
    <button
      onClick={() => toggleExplain(isOpen ? null : index)}
      aria-label={ariaLabel ?? `Explain file ${index + 1}`}
      className={
       className ??
        'px-3 py-1.5 rounded-md bg-mff-blue/10 text-mff-blue hover:bg-mff-blue/20 focus:ring-mff-blue'
      }
    >
      Why?
    </button>
  );
};

export default ExplainButton;