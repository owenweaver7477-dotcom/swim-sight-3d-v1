import triggerHandler from '../_lib/ai/triggerHandler.js';
import callbackHandler from '../_lib/ai/callbackHandler.js';
import cancelHandler from '../_lib/ai/cancelHandler.js';

const handlers = {
  trigger: triggerHandler,
  callback: callbackHandler,
  cancel: cancelHandler,
};

export default async function handler(req, res) {
  const action = Array.isArray(req.query?.action)
    ? req.query.action[0]
    : req.query?.action;

  const selectedHandler = handlers[action];

  if (!selectedHandler) {
    return res.status(404).json({
      error: 'Unknown AI action',
      allowed_actions: Object.keys(handlers),
    });
  }

  return selectedHandler(req, res);
}
