import fs from 'fs';
import path from 'path';
import pdf from 'pdf-parse/lib/pdf-parse.js';
import { DataStore } from '../models/dataStore.js';
import { DocumentQueue } from '../queues/documentQueue.js';
import { AppError } from '../middleware/errorMiddleware.js';

export class DocumentController {
  static async upload(req, res, next) {
    try {
      if (!req.file) {
        throw new AppError('No document file was uploaded', 400, 'MISSING_FIELDS');
      }

      const filePath = req.file.path;
      const ext = path.extname(req.file.originalname).toLowerCase();
      let extractedText = '';

      try {
        if (ext === '.pdf') {
          const dataBuffer = fs.readFileSync(filePath);
          const pdfData = await pdf(dataBuffer);
          extractedText = pdfData.text || '';
        } else if (ext === '.txt') {
          extractedText = fs.readFileSync(filePath, 'utf8');
        } else {
          extractedText = `Uploaded document: ${req.file.originalname}`;
        }
      } catch (parseErr) {
        console.warn('[DocumentController] PDF/Text parsing error:', parseErr.message);
        extractedText = `Document: ${req.file.originalname} (Plain text extraction fallback)`;
      }

      const doc = await DataStore.documents.create({
        owner: req.user.id,
        fileName: req.file.originalname,
        filePath,
        fileType: ext.replace('.', '').toUpperCase(),
        fileSize: req.file.size,
        extractedText,
        processingStatus: 'PENDING',
        uploadedAt: new Date(),
      });

      // Dispatch background agent processing
      await DocumentQueue.addDocumentJob(doc._id || doc.id, req.user.id);

      res.status(201).json({
        success: true,
        message: 'Document uploaded and enqueued for AI obligation extraction',
        data: { document: doc },
      });
    } catch (err) {
      next(err);
    }
  }

  static async list(req, res, next) {
    try {
      const documents = await DataStore.documents.find({ owner: req.user.id }, { uploadedAt: -1 }, 100);
      res.status(200).json({
        success: true,
        data: { documents },
      });
    } catch (err) {
      next(err);
    }
  }

  static async getById(req, res, next) {
    try {
      const doc = await DataStore.documents.findById(req.params.id);
      if (!doc || String(doc.owner) !== String(req.user.id)) {
        throw new AppError('Document not found', 404, 'NOT_FOUND');
      }
      res.status(200).json({
        success: true,
        data: { document: doc },
      });
    } catch (err) {
      next(err);
    }
  }

  static async process(req, res, next) {
    try {
      const doc = await DataStore.documents.findById(req.params.id);
      if (!doc || String(doc.owner) !== String(req.user.id)) {
        throw new AppError('Document not found', 404, 'NOT_FOUND');
      }

      await DocumentQueue.addDocumentJob(doc._id || doc.id, req.user.id);

      res.status(200).json({
        success: true,
        message: 'Document extraction re-triggered',
        data: { documentId: doc._id || doc.id },
      });
    } catch (err) {
      next(err);
    }
  }

  static async delete(req, res, next) {
    try {
      const doc = await DataStore.documents.findById(req.params.id);
      if (!doc || String(doc.owner) !== String(req.user.id)) {
        throw new AppError('Document not found', 404, 'NOT_FOUND');
      }

      // Remove physical file if exists
      if (doc.filePath && fs.existsSync(doc.filePath)) {
        try {
          fs.unlinkSync(doc.filePath);
        } catch (e) {}
      }

      await DataStore.documents.findByIdAndDelete(req.params.id);

      res.status(200).json({
        success: true,
        message: 'Document deleted successfully',
      });
    } catch (err) {
      next(err);
    }
  }
}
