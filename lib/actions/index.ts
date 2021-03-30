import { NrfConnectAction } from 'pc-nrfconnect-shared';
import { ThunkAction, ThunkDispatch } from 'redux-thunk';

import { State } from '../reducers/index';
import {
    Action as JLinkTargetAction,
    ActionType as JLinkTargetActionType,
} from './settingsActions';

/**
 * A union type of all the possible actions in the application.
 */
export type Action = NrfConnectAction | JLinkTargetAction;

/**
 * An intersectionised enum containing all the available application
 * action types.
 */
export const ActionType = {
    ...JLinkTargetActionType,
};

/**
 * A typed Redux Thunk function that knows about the app state and all
 * the possible actions that can be dispatched.
 */
export type AppThunk<ReturnType = void> = ThunkAction<
    ReturnType,
    State,
    unknown,
    Action
>;

/**
 * A typed Redux dispatch function.
 */
export type AppThunkDispatch<ReturnType = void> = ThunkDispatch<
    State,
    ReturnType,
    Action
>;
