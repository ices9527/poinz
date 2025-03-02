import {createSelector} from 'reselect';
import {getOwnEstimate} from '../estimations/estimationsSelectors';

const getPendingCmds = (state) => state.commandTracking.pendingCommands;

/**
 * Returns pending commands as array. Never returns undefined.
 */
const getPendingCmdsAsArray = createSelector([getPendingCmds], (pendingCmds) =>
  Object.values(pendingCmds || {})
);

/**
 * Returns true if this card (specified by its value) should be shown "waiting".
 * (either because you just estimated or cleared your estimation)
 */
export const isThisCardWaiting = (state, cardValue) => {
  return isGivingEstimate(state, cardValue) || isClearingEstimate(state, cardValue);
};

const isGivingEstimate = (state, cardValue) => {
  const pendingEstimationCommand = getMatchingPendingCommand(state, 'giveStoryEstimate');
  const estimationWaiting = pendingEstimationCommand
    ? pendingEstimationCommand.payload.value
    : undefined;

  return cardValue === estimationWaiting;
};

const isClearingEstimate = (state, cardValue) => {
  const hasPendingClearCommand = hasMatchingPendingCommand(state, 'clearStoryEstimate');
  const ownEstimate = getOwnEstimate(state);
  const hasEstimate = ownEstimate !== undefined;
  return hasPendingClearCommand && hasEstimate && cardValue === ownEstimate.value;
};

/**
 * Will return an array of objects containing "storyId" and "value" for every currently pending "settleEstimation" command.
 * Array can of course be empty. Array will most probably contain one story at a time (if any).
 *
 * @param state
 * @return {object[]}
 */
export const getSettlingStories = (state) => {
  const pendingSettleCommands = getAllMatchingPendingCommands(state, 'settleEstimation');
  if (!pendingSettleCommands || pendingSettleCommands.length < 1) {
    return [];
  }

  return pendingSettleCommands.map((sCmd) => sCmd.payload);
};

/**
 * Returns true if this story (in the backlog) (specified by its id) should be shown "waiting".
 * (either because you selected it or trashed it)
 */
export const isThisStoryWaiting = (state, storyId) => {
  const pendingSelectCommands = getAllMatchingPendingCommands(state, 'selectStory');
  const pendingTrashCommand = getAllMatchingPendingCommands(state, 'trashStory');

  return !!(
    pendingSelectCommands.find((cmd) => cmd.payload.storyId === storyId) ||
    pendingTrashCommand.find((cmd) => cmd.payload.storyId === storyId)
  );
};

/**
 * Returns true if this story (in edit mode in the backlog) (specified by its id) should be shown "waiting".
 * (because you saved your changes (= sent changeStory command))
 */
export const isThisStoryEditFormWaiting = (state, storyId) => {
  const pendingChangeCommands = getAllMatchingPendingCommands(state, 'changeStory');
  return !!pendingChangeCommands.find((cmd) => cmd.payload.storyId === storyId);
};

/**
 * Returns true if the client is currently waiting for a (event) response to a sent command that matches the given commandName
 */
export const hasMatchingPendingCommand = (state, commandName) =>
  !!getMatchingPendingCommand(state, commandName);

/**
 * Returns a matching pending command that was sent by this client (the client is currently waiting for a (event) response).
 * Can also return undefined
 */
const getMatchingPendingCommand = (state, commandName) =>
  getPendingCmdsAsArray(state).find((cmd) => cmd.name === commandName);

/**
 * Returns all matching pending commands for the given commandName.
 * Can return an empty array. never returns undefined.
 */
const getAllMatchingPendingCommands = (state, commandName) =>
  getPendingCmdsAsArray(state).filter((cmd) => cmd.name === commandName);
