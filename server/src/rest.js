import Immutable from 'immutable';
import express from 'express';

/**
 * This module handles incoming requests to the REST api.
 * Currently there is only one endpoint: /api/status
 *
 * All other communication between client and server (story-, estimation- and user-related)
 * is done via websocket connection.
 *
 */

/**
 *
 * @param app the express app object
 * @param store the roomsStore object
 */
function init(app, store) {
  const restRouter = express.Router();

  restRouter.get('/status', (req, res) =>
    buildStatusObject(store).then((status) => res.json(status))
  );
  restRouter.get('/room/:roomId', (req, res) =>
    buildRoomExportObject(store, req.params.roomId).then((roomExport) => {
      if (roomExport) {
        res.json(roomExport);
      } else {
        res.status(404).json({message: 'room not found'});
      }
    })
  );

  app.use('/api', restRouter);
}

export default {init};

export async function buildStatusObject(store) {
  const allRooms = await store.getAllRooms();
  const rooms = allRooms
    .map(
      (room) =>
        new Immutable.Map({
          storyCount: room.get('stories').size,
          userCount: room.get('users').size,
          userCountDisconnected: room.get('users').filter((user) => user.get('disconnected')).size,
          lastActivity: room.get('lastActivity'),
          markedForDeletion: room.get('markedForDeletion'),
          created: room.get('created')
        })
    )
    .toList()
    .toJS();

  return {
    rooms,
    roomCount: rooms.length,
    uptime: Math.floor(process.uptime())
  };
}

export async function buildRoomExportObject(store, roomId) {
  const room = await store.getRoomById(roomId);
  if (!room) {
    return undefined;
  }

  const users = room.get('users').toJS();

  return {
    roomId: room.get('id'),
    stories: Object.values(room.get('stories').toJS()).map((story) =>
      buildStoryExportObject(story, users)
    )
  };
}

const buildStoryExportObject = (story, users) => ({
  title: story.title,
  description: story.description,
  estimations: Object.entries(story.estimations).map((entry) => {
    const matchingUser = users[entry[0]];
    return {username: matchingUser ? matchingUser.username : entry[0], value: entry[1]};
  })
});
