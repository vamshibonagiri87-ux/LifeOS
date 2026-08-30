import { ResponsibilityService } from '../services/responsibilityService.js';

export class ResponsibilityController {
  static async list(req, res, next) {
    try {
      const filters = {
        status: req.query.status,
        priority: req.query.priority,
        category: req.query.category,
        search: req.query.search,
        sort: req.query.sort,
        limit: req.query.limit,
        skip: req.query.skip,
      };
      const result = await ResponsibilityService.list(req.user.id, filters);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  static async getById(req, res, next) {
    try {
      const item = await ResponsibilityService.getById(req.params.id, req.user.id);
      res.status(200).json({
        success: true,
        data: { responsibility: item },
      });
    } catch (err) {
      next(err);
    }
  }

  static async create(req, res, next) {
    try {
      const item = await ResponsibilityService.create(req.user.id, req.body);
      res.status(201).json({
        success: true,
        data: { responsibility: item },
      });
    } catch (err) {
      next(err);
    }
  }

  static async update(req, res, next) {
    try {
      const item = await ResponsibilityService.update(req.params.id, req.user.id, req.body);
      res.status(200).json({
        success: true,
        data: { responsibility: item },
      });
    } catch (err) {
      next(err);
    }
  }

  static async updateStatus(req, res, next) {
    try {
      const item = await ResponsibilityService.updateStatus(req.params.id, req.user.id, req.body.status);
      res.status(200).json({
        success: true,
        data: { responsibility: item },
      });
    } catch (err) {
      next(err);
    }
  }

  static async duplicate(req, res, next) {
    try {
      const item = await ResponsibilityService.duplicate(req.params.id, req.user.id);
      res.status(201).json({
        success: true,
        data: { responsibility: item },
      });
    } catch (err) {
      next(err);
    }
  }

  static async delete(req, res, next) {
    try {
      await ResponsibilityService.delete(req.params.id, req.user.id);
      res.status(200).json({
        success: true,
        message: 'Responsibility deleted successfully',
      });
    } catch (err) {
      next(err);
    }
  }

  static async explainPriority(req, res, next) {
    try {
      const explanation = await ResponsibilityService.explainPriority(req.params.id, req.user.id);
      res.status(200).json({
        success: true,
        data: explanation,
      });
    } catch (err) {
      next(err);
    }
  }
}
