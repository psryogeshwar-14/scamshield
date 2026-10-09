import { analyzeUrlTarget, analyzeMessageTarget } from '../services/analysisService.js';

/**
 * Controller for POST /api/analyze/url
 */
export async function analyzeUrl(req, res, next) {
  try {
    const raw = req.body.url;
    const result = await analyzeUrlTarget(raw);
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Controller for POST /api/analyze/message
 */
export async function analyzeMessage(req, res, next) {
  try {
    const raw = req.body.message;
    const result = await analyzeMessageTarget(raw);
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Controller for unified POST /api/analyze
 */
export async function analyzeUnified(req, res, next) {
  try {
    const { inputType, userInput } = req.body;

    if (inputType === 'url') {
      const result = await analyzeUrlTarget(userInput);
      return res.status(200).json({
        success: true,
        data: result,
      });
    }

    if (inputType === 'message') {
      const result = await analyzeMessageTarget(userInput);
      return res.status(200).json({
        success: true,
        data: result,
      });
    }

    res.status(400).json({
      success: false,
      error: {
        message: 'Invalid inputType. Must be "url" or "message".',
        code: 'INVALID_INPUT_TYPE',
        requestId: req.id,
      },
    });
  } catch (err) {
    next(err);
  }
}

export default {
  analyzeUrl,
  analyzeMessage,
  analyzeUnified,
};
