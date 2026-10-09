import {
  getHistoryRecords,
  getHistoryRecordById,
  deleteHistoryRecord,
  updateRecommendationStatus,
} from '../services/historyService.js';

/**
 * Controller for GET /api/history
 */
export async function getHistory(req, res, next) {
  try {
    const { page, limit, type } = req.query;
    const result = await getHistoryRecords({ page, limit, type });

    res.status(200).json({
      success: true,
      data: result.records,
      pagination: result.pagination,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Controller for GET /api/history/:id
 */
export async function getHistoryById(req, res, next) {
  try {
    const record = await getHistoryRecordById(req.params.id);
    res.status(200).json({
      success: true,
      data: record,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Controller for DELETE /api/history/:id
 */
export async function deleteHistory(req, res, next) {
  try {
    const result = await deleteHistoryRecord(req.params.id);
    res.status(200).json({
      success: true,
      message: result.message,
      deletedId: result.deletedId,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Controller for PATCH /api/history/:id/recommendations/:recId
 */
export async function updateRecommendation(req, res, next) {
  try {
    const { id, recId } = req.params;
    const completed = req.body?.completed;
    const updated = await updateRecommendationStatus(id, recId, completed);

    res.status(200).json({
      success: true,
      data: updated,
    });
  } catch (err) {
    next(err);
  }
}

export default {
  getHistory,
  getHistoryById,
  deleteHistory,
  updateRecommendation,
};
