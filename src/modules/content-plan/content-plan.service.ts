import { JsonDatabase } from '../../database/db.js';
import { ContentPlan } from './content-plan.types.js';
import { SchedulerService } from '../scheduler/scheduler.js';
import { generateId } from '../scheduler/scheduler.utils.js';
import { ContentPlanItem } from '../../database/models/ContentPlanItem.js';
import { formatDateTime } from '../../utils/time.js';

export interface ContentPlanDraftPost {
  channelId: string;
  content: string;
  scheduledTime: Date;
  mediaUrls?: string[];
}

export class ContentPlanService {
  private plans = new Map<string, ContentPlan>();

  constructor(
    private readonly db: JsonDatabase,
    private readonly scheduler: SchedulerService,
  ) {}

  async init(): Promise<void> {
    const stored = this.db.getState().contentPlans ?? [];
    stored.forEach((plan) => this.plans.set(plan.id, plan));
  }

  async createPlan(title: string, posts: ContentPlanDraftPost[]): Promise<string> {
    const planId = generateId();
    const items: ContentPlanItem[] = [];

    for (const post of posts) {
      const scheduledId = await this.scheduler.schedulePost(
        post.channelId,
        post.content,
        post.scheduledTime,
        post.mediaUrls,
      );

      items.push({
        id: scheduledId,
        channelId: post.channelId,
        content: post.content,
        scheduledTime: post.scheduledTime.toISOString(),
        status: 'pending',
        createdAt: new Date().toISOString(),
      });
    }

    const plan: ContentPlan = {
      id: planId,
      title,
      posts: items,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.plans.set(planId, plan);
    await this.persist();
    return planId;
  }

  listPlans(): ContentPlan[] {
    return Array.from(this.plans.values());
  }

  buildPlansMessage(): string {
    const plans = this.listPlans();
    if (plans.length === 0) {
      return '📋 No content plans';
    }

    let message = '📋 *Content Plans:*\n\n';
    plans.forEach((plan, index) => {
      const pending = plan.posts.filter((post) => post.status === 'pending').length;
      message += `${index + 1}. *${plan.title}*\n`;
      message += `   *ID:* \`${plan.id}\`\n`;
      message += `   *Posts:* ${plan.posts.length} (${pending} pending)\n`;
      message += `   *Updated:* ${formatDateTime(plan.updatedAt)}\n\n`;
    });

    return message;
  }

  private async persist(): Promise<void> {
    await this.db.update({
      contentPlans: this.listPlans(),
    });
  }
}

