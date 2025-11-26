import { ContentPlanItem } from '../../database/models/ContentPlanItem.js';

export interface ContentPlan {
  id: string;
  title: string;
  posts: ContentPlanItem[];
  createdAt: string;
  updatedAt: string;
}

