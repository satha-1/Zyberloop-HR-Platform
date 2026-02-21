// This file should only be imported when Redis/BullMQ is available
// Workers are initialized lazily to avoid errors if dependencies are missing

let documentWorker: any = null;
let bulkDocumentWorker: any = null;

export async function initializeDocumentWorkers() {
  try {
    const { Worker } = await import('bullmq');
    const Redis = (await import('ioredis')).default;
    const { config } = await import('../../../config');
    
    const connection = new Redis({
      host: config.redis.host,
      port: config.redis.port,
      password: config.redis.password,
      maxRetriesPerRequest: null,
      retryStrategy: () => null,
    });

    const { templateService } = await import('../services/template.service');
    const { mergeContextResolver } = await import('../services/mergeContextResolver.service');
    const { documentRenderService } = await import('../services/documentRender.service');
    const { documentService } = await import('../services/document.service');
    const { DocumentJob } = await import('../documentJob.model');
    const { storageService } = await import('../services/storage.service');
    const mongoose = await import('mongoose');

    // Document generation worker
    documentWorker = new Worker(
      'document:generate',
      async (job: any) => {
        const { documentId, templateId, subjectType, subjectId, effectiveOn, tenantId } = job.data;

        try {
          const template = await templateService.getTemplateById(templateId);
          if (!template) {
            throw new Error('Template not found');
          }

          const { context, contextHash } = await mergeContextResolver.resolveContext(
            template.docType,
            subjectType,
            subjectId,
            effectiveOn ? new Date(effectiveOn) : undefined
          );

          const { pdfBuffer, pdfHash, objectKey } = await documentRenderService.generateDocument(
            template,
            context,
            contextHash,
            documentId,
            tenantId
          );

          await documentService.addArtefact(documentId, {
            kind: 'PDF_MASTER',
            objectKey,
            contentType: 'application/pdf',
            sha256: pdfHash,
            sizeBytes: pdfBuffer.length,
          });

          return { success: true, documentId, objectKey };
        } catch (error: any) {
          console.error('Document generation failed:', error);
          throw error;
        }
      },
      {
        connection,
        concurrency: 5,
        limiter: {
          max: 10,
          duration: 1000,
        },
      }
    );

    // Bulk document generation worker
    bulkDocumentWorker = new Worker(
      'document:bulkGenerate',
      async (job: any) => {
        const { jobId, payrollRunId, docType, templateId, tenantId } = job.data;

        try {
          const documentJob = await DocumentJob.findById(jobId);
          if (!documentJob) {
            throw new Error('Document job not found');
          }

          documentJob.status = 'RUNNING';
          documentJob.startedAt = new Date();
          await documentJob.save();

          const { PayrollEntry } = await import('../../payroll/payrollEntry.model');
          const entries = await PayrollEntry.find({ payrollRunId }).select('employeeId');
          const employeeIds = entries.map((e: any) => e.employeeId.toString());

          documentJob.progress.total = employeeIds.length;
          await documentJob.save();

          const errors: Array<{ employeeId: string; error: string }> = [];
          const batchSize = config.documents.bulkBatchSize;

          for (let i = 0; i < employeeIds.length; i += batchSize) {
            const batch = employeeIds.slice(i, i + batchSize);

            await Promise.allSettled(
              batch.map(async (employeeId: string) => {
                try {
                  const { context, contextHash } = await mergeContextResolver.resolveContext(
                    docType as any,
                    'EMPLOYEE',
                    employeeId,
                    documentJob.inputsRef.effectiveOn ? new Date(documentJob.inputsRef.effectiveOn) : undefined
                  );

                  const doc = await documentService.createDocument({
                    tenantId: tenantId ? new mongoose.Types.ObjectId(tenantId) : undefined,
                    docType,
                    templateId: new mongoose.Types.ObjectId(templateId),
                    templateVersion: documentJob.templateVersion || 1,
                    subjectType: 'EMPLOYEE',
                    subjectId: employeeId,
                    renderInputSnapshot: {
                      sha256: contextHash,
                      redactedPreview: { employeeId },
                    },
                    artefacts: [],
                    createdBy: new mongoose.Types.ObjectId(documentJob.inputsRef.createdBy),
                  });

                  const template = await templateService.getTemplateById(templateId);
                  if (!template) {
                    throw new Error('Template not found');
                  }

                  const { pdfBuffer, pdfHash, objectKey } = await documentRenderService.generateDocument(
                    template,
                    context,
                    contextHash,
                    doc._id.toString(),
                    tenantId
                  );

                  await documentService.addArtefact(doc._id.toString(), {
                    kind: 'PDF_MASTER',
                    objectKey,
                    contentType: 'application/pdf',
                    sha256: pdfHash,
                    sizeBytes: pdfBuffer.length,
                  });

                  documentJob.progress.succeeded += 1;
                } catch (error: any) {
                  errors.push({ employeeId, error: error.message });
                  documentJob.progress.failed += 1;
                }
              })
            );

            await documentJob.save();
          }

          if (errors.length > 0) {
            const csvContent = 'Employee ID,Error\n' + errors.map((e) => `${e.employeeId},${e.error}`).join('\n');
            const csvBuffer = Buffer.from(csvContent);
            const csvKey = storageService.generateDocumentKey(tenantId, jobId, 'ERROR_REPORT', 'csv');
            await storageService.putObject(csvKey, csvBuffer, 'text/csv');
            documentJob.errorReportObjectKey = csvKey;
          }

          documentJob.status = errors.length === employeeIds.length ? 'FAILED' : 'COMPLETED';
          documentJob.finishedAt = new Date();
          if (errors.length > 0) {
            documentJob.errorMessage = `${errors.length} documents failed to generate`;
          }
          await documentJob.save();

          return { success: true, succeeded: documentJob.progress.succeeded, failed: documentJob.progress.failed };
        } catch (error: any) {
          const documentJob = await DocumentJob.findById(jobId);
          if (documentJob) {
            documentJob.status = 'FAILED';
            documentJob.errorMessage = error.message;
            documentJob.finishedAt = new Date();
            await documentJob.save();
          }
          throw error;
        }
      },
      {
        connection,
        concurrency: 1,
      }
    );

    // Handle worker events
    documentWorker.on('completed', (job: any) => {
      console.log(`Document generation job ${job.id} completed`);
    });

    documentWorker.on('failed', (job: any, err: any) => {
      console.error(`Document generation job ${job?.id} failed:`, err);
    });

    bulkDocumentWorker.on('completed', (job: any) => {
      console.log(`Bulk document generation job ${job.id} completed`);
    });

    bulkDocumentWorker.on('failed', (job: any, err: any) => {
      console.error(`Bulk document generation job ${job?.id} failed:`, err);
    });

    return { documentWorker, bulkDocumentWorker };
  } catch (error) {
    console.warn('Failed to initialize document workers:', error);
    return null;
  }
}

export { documentWorker, bulkDocumentWorker };
