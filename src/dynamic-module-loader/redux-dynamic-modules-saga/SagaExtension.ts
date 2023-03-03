import { default as createSagaMiddleware, SagaMiddleware, SagaMonitor } from 'redux-saga';
import {
  IExtension,
  IItemManager,
  getRefCountedManager,
  IModuleManager,
} from '../redux-dynamic-modules-core';
import { ISagaRegistration, ISagaModule } from './Contracts';
import { getSagaManager } from './SagaManager';
import { sagaEquals } from './SagaComparer';

/**
 * Get an extension that integrates saga with the store
 * @param sagaContext The context to provide to the saga
 */
export function getSagaExtension<C>(sagaContext?: C, onError?: (error: Error) => void): IExtension {
  let sagaMonitor = undefined;

  //@ts-ignore
  if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
    sagaMonitor = window['__SAGA_MONITOR_EXTENSION__' as any] || undefined;
  }

  // Setup the saga middleware
  let sagaMiddleware: SagaMiddleware<any> = createSagaMiddleware<any>({
    context: sagaContext,
    sagaMonitor: sagaMonitor as SagaMonitor | undefined,
    onError,
  });

  let _sagaManager: IItemManager<ISagaRegistration<any>> = getRefCountedManager(
    getSagaManager(sagaMiddleware),
    sagaEquals
  );

  return {
    middleware: [sagaMiddleware],

    onModuleManagerCreated: (moduleManager: IModuleManager) => {
      if (sagaContext) {
        sagaContext['moduleManager' as keyof typeof sagaContext] = moduleManager as any;
      }
    },

    onModuleAdded: (module: ISagaModule<any>): void => {
      if (module.sagas) {
        _sagaManager.add(module.sagas);
      }
    },

    onModuleRemoved: (module: ISagaModule<any>): void => {
      if (module.sagas) {
        _sagaManager.remove(module.sagas);
      }
    },

    dispose: () => {
      _sagaManager.dispose();
    },
  };
}
