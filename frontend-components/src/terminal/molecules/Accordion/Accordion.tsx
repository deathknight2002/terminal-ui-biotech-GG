import React, { useState } from 'react';
import clsx from 'clsx';
import styles from './Accordion.module.css';

export interface AccordionItem {
  id: string;
  title: string;
  content: React.ReactNode;
  disabled?: boolean;
}

export interface AccordionProps {
  items: AccordionItem[];
  allowMultiple?: boolean;
  defaultOpenIds?: string[];
  className?: string;
}

export const Accordion: React.FC<AccordionProps> = ({
  items,
  allowMultiple = false,
  defaultOpenIds = [],
  className,
}) => {
  const [openIds, setOpenIds] = useState<string[]>(defaultOpenIds);

  const toggleItem = (id: string) => {
    if (allowMultiple) {
      setOpenIds(prev =>
        prev.includes(id)
          ? prev.filter(itemId => itemId !== id)
          : [...prev, id]
      );
    } else {
      setOpenIds(prev => (prev.includes(id) ? [] : [id]));
    }
  };

  return (
    <div className={clsx(styles.accordion, className)}>
      {items.map(item => (
        <AccordionItemComponent
          key={item.id}
          item={item}
          isOpen={openIds.includes(item.id)}
          onToggle={() => toggleItem(item.id)}
        />
      ))}
    </div>
  );
};

interface AccordionItemComponentProps {
  item: AccordionItem;
  isOpen: boolean;
  onToggle: () => void;
}

const AccordionItemComponent: React.FC<AccordionItemComponentProps> = ({
  item,
  isOpen,
  onToggle,
}) => {
  return (
    <div className={clsx(styles.item, isOpen && styles.open)}>
      <button
        className={clsx(styles.header, item.disabled && styles.disabled)}
        onClick={onToggle}
        disabled={item.disabled}
        aria-expanded={isOpen}
        aria-controls={`accordion-content-${item.id}`}
      >
        <span className={styles.title}>{item.title}</span>
        <span className={styles.icon}>{isOpen ? '−' : '+'}</span>
      </button>
      <div
        id={`accordion-content-${item.id}`}
        className={styles.content}
        aria-hidden={!isOpen}
      >
        <div className={styles.contentInner}>{item.content}</div>
      </div>
    </div>
  );
};
