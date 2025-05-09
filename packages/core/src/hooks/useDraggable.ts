import {
  Transform,
  useIsomorphicLayoutEffect,
  useLatestValue,
  useNodeRef,
  useUniqueId,
} from '@dnd-kit/utilities';
import { createContext, useContext, useMemo } from 'react';

import { ActiveDraggableContext } from '../components/DndContext';
import { Data, InternalContext } from '../store';
import type { UniqueIdentifier } from '../types';
import { SyntheticListenerMap, useSyntheticListeners } from './utilities';

export interface UseDraggableArguments {
  id: UniqueIdentifier;
  data?: Data;
  disabled?: boolean;
  attributes?: {
    role?: string;
    roleDescription?: string;
    tabIndex?: number;
  };
  register?: boolean;
}

export interface DraggableAttributes {
  role: string;
  tabIndex: number;
  'aria-disabled': boolean;
  'aria-pressed': boolean | undefined;
  'aria-roledescription': string;
  'aria-describedby': string;
}

export type DraggableSyntheticListeners = SyntheticListenerMap | undefined;

const NullContext = createContext<any>(null);

const defaultRole = 'button';

const ID_PREFIX = 'Draggable';

export function useDraggable({
  id,
  data,
  disabled = false,
  attributes,
  register = true,
}: UseDraggableArguments) {
  const key = useUniqueId(ID_PREFIX);
  const {
    activators,
    activatorEvent,
    active,
    activeNodeRect,
    ariaDescribedById,
    draggableNodes,
    over,
  } = useContext(InternalContext);
  const {
    role = defaultRole,
    roleDescription = 'draggable',
    tabIndex = 0,
  } = attributes ?? {};
  const isDragging = active?.id === id;
  const transform: Transform | null = useContext(
    isDragging ? ActiveDraggableContext : NullContext,
  );
  const [node, setNodeRef] = useNodeRef();
  const [activatorNode, setActivatorNodeRef] = useNodeRef();
  const listeners = useSyntheticListeners(activators, id);
  const dataRef = useLatestValue(data);

  useIsomorphicLayoutEffect(
    () => {
      if (!register) {
        return;
      }
      draggableNodes.set(id, { id, key, node, activatorNode, data: dataRef });

      return () => {
        const node = draggableNodes.get(id);

        if (node && node.key === key) {
          draggableNodes.delete(id);
        }
      };
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [draggableNodes, id],
  );

  const memoizedAttributes: DraggableAttributes = useMemo(
    () => ({
      role,
      tabIndex,
      'aria-disabled': disabled,
      'aria-pressed': isDragging && role === defaultRole ? true : undefined,
      'aria-roledescription': roleDescription,
      'aria-describedby': ariaDescribedById.draggable,
    }),
    [
      disabled,
      role,
      tabIndex,
      isDragging,
      roleDescription,
      ariaDescribedById.draggable,
    ],
  );

  return {
    active,
    activatorEvent,
    activeNodeRect,
    attributes: memoizedAttributes,
    isDragging,
    listeners: disabled ? undefined : listeners,
    node,
    over,
    setNodeRef,
    setActivatorNodeRef,
    transform,
  };
}
