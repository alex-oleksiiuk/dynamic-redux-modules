import { combineReducers, Reducer, ReducersMapObject, AnyAction, Action } from 'redux';
import { getStringRefCounter } from '../Utils/RefCounter';

export interface IReducerManager<S> {
  reduce: (state: S, action: AnyAction) => S;
  getReducerMap: () => ReducersMapObject<S>;
  add: <ReducerState>(key: string, reducer: Reducer<ReducerState>) => void;
  remove: (key: string) => void;
}

/**
 * Adds reference counting to reducer manager and adds/remove keys only when ref count is zero
 */
export function getRefCountedReducerManager<S>(manager: IReducerManager<S>): IReducerManager<S> {
  const reducerKeyRefCounter = getStringRefCounter();
  for (const key in manager.getReducerMap()) {
    reducerKeyRefCounter.add(key);
  }

  return {
    reduce: manager.reduce,
    getReducerMap: manager.getReducerMap,
    add: <ReducerState>(key: string, reducer: Reducer<ReducerState>) => {
      if (reducerKeyRefCounter.getCount(key) === 0) {
        manager.add(key, reducer);
      }

      reducerKeyRefCounter.add(key);
    },
    remove: (key: string) => {
      reducerKeyRefCounter.remove(key);

      if (reducerKeyRefCounter.getCount(key) === 0) {
        manager.remove(key);
      }
    },
  };
}

/**
 * Create a combined reducer as in the fashion of Redux's combineReducers() function,
 * but allows for the dynamic registration of additional reducers
 * @param initialReducers The initial set of reducers
 * @returns An object with three functions: the reducer, an addReducer function, and a removeReducer function
 */
export function getReducerManager<S extends Record<string, unknown>>(
  initialReducers: ReducersMapObject<S>,
  reducerCombiner: (reducers: ReducersMapObject<S, any>) => Reducer<S> = combineReducers
): IReducerManager<S> {
  let combinedReducer = reducerCombiner(initialReducers);
  const reducers: ReducersMapObject<S> = {
    ...(initialReducers as Record<string, unknown>),
  } as ReducersMapObject<S>;
  let keysToRemove: any[] = [];

  const reduce = (state: S, action: AnyAction) => {
    if (keysToRemove.length > 0) {
      state = { ...(state as any) };
      for (const key of keysToRemove) {
        delete state[key as keyof typeof state];
      }
      keysToRemove = [];
    }

    if (state === undefined) {
      state = {} as S;
    }

    return combinedReducer(state, action);
  };

  return {
    getReducerMap: () => reducers,
    reduce,
    add: <ReducerState>(key: string, reducer: Reducer<ReducerState>) => {
      if (!key || reducers[key as keyof typeof reducers]) {
        return;
      }

      reducers[key as keyof typeof reducers] = reducer as Reducer<S[keyof S], Action<any>>;
      combinedReducer = getCombinedReducer(reducers, reducerCombiner);
    },
    remove: (key: string) => {
      if (!key || !reducers[key as keyof typeof reducers]) {
        return;
      }

      delete reducers[key as keyof typeof reducers];
      keysToRemove.push(key);
      combinedReducer = getCombinedReducer(reducers, reducerCombiner);
    },
  };
}

function getCombinedReducer<S extends Record<string, unknown>>(
  reducerMap: ReducersMapObject<any>,
  reducerCombiner: (reducers: ReducersMapObject<S, any>) => Reducer<S> = combineReducers
) {
  if (!reducerMap || Object.keys(reducerMap).length === 0) {
    return (state: any, action: any) => state || null;
  }
  return reducerCombiner(reducerMap);
}
