import React, { createContext, useContext, useRef } from 'react';

type EventType = 'EXPENSE_UPDATED' | 'INCOME_UPDATED' | 'TRAVEL_UPDATED';

interface EventContextType {
  triggerEvent: (eventType: EventType) => void;
  subscribeToEvent: (eventType: EventType, callback: () => void) => () => void;
}

const EventContext = createContext<EventContextType | undefined>(undefined);

export function EventProvider({ children }: { children: React.ReactNode }) {
  // Usar ref em vez de state para evitar re-renderizações desnecessárias
  const listenersRef = useRef<Map<EventType, Set<() => void>>>(new Map());

  const triggerEvent = (eventType: EventType) => {
    console.log(`Evento disparado: ${eventType}`);
    const eventListeners = listenersRef.current.get(eventType);
    if (eventListeners) {
      eventListeners.forEach(callback => {
        try {
          callback();
        } catch (error) {
          console.error(`Erro ao executar callback para evento ${eventType}:`, error);
        }
      });
    }
  };

  const subscribeToEvent = (eventType: EventType, callback: () => void) => {
    console.log(`Inscrevendo em: ${eventType}`);
    
    // Obter o conjunto atual de listeners ou criar um novo
    const listeners = listenersRef.current;
    const eventListeners = listeners.get(eventType) || new Set();
    
    // Adicionar o callback ao conjunto
    eventListeners.add(callback);
    listeners.set(eventType, eventListeners);

    // Retorna uma função para cancelar a inscrição
    return () => {
      console.log(`Cancelando inscrição em: ${eventType}`);
      const listeners = listenersRef.current;
      const eventListeners = listeners.get(eventType);
      
      if (eventListeners) {
        eventListeners.delete(callback);
        if (eventListeners.size === 0) {
          listeners.delete(eventType);
        } else {
          listeners.set(eventType, eventListeners);
        }
      }
    };
  };

  // Usar um valor memorizado para evitar recriação do objeto de contexto
  const contextValue = useRef<EventContextType>({
    triggerEvent,
    subscribeToEvent
  }).current;

  return (
    <EventContext.Provider value={contextValue}>
      {children}
    </EventContext.Provider>
  );
}

export function useEvent() {
  const context = useContext(EventContext);
  if (context === undefined) {
    throw new Error('useEvent must be used within an EventProvider');
  }
  return context;
} 