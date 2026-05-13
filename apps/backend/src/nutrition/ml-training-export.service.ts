import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs/promises';
import * as path from 'path';

export type VisionTrainingExportRow = {
  imageUrl: string;
  capturedAt: string;
  source: 'google_vision';
  labels: { description: string; score: number }[];
  localizedObjects: {
    name: string;
    score: number;
    yoloNormBox: { cx: number; cy: number; w: number; h: number };
  }[];
};

@Injectable()
export class MlTrainingExportService {
  private readonly logger = new Logger(MlTrainingExportService.name);

  constructor(private readonly configService: ConfigService) {}

  // fire-and-forget from nutrition path; failures should not break requests
  queueExport(row: VisionTrainingExportRow): void {
    const enabled = this.configService.get<boolean>('ml.exportTrainingSamples');
    if (!enabled) return;
    void this.appendRow(row).catch((e) =>
      this.logger.warn(`ml training export failed: ${e instanceof Error ? e.message : e}`),
    );
  }

  private async appendRow(row: VisionTrainingExportRow): Promise<void> {
    const dir =
      this.configService.get<string>('ml.trainingExportDir') ||
      path.join(process.cwd(), 'var', 'ml-training-exports');
    await fs.mkdir(dir, { recursive: true });
    const filePath = path.join(dir, 'google_vision_pseudo_labels.jsonl');
    await fs.appendFile(filePath, `${JSON.stringify(row)}\n`, 'utf8');
  }
}
