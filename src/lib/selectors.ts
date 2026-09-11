import type { Bootstrap, CategoryDto, ProblemDto, TagDto } from "@/types/tracker";
import { computeDue, type DueInfo } from "./due";

export interface SubNode {
  category: CategoryDto;
  problems: ProblemDto[];
}

export interface MainNode {
  category: CategoryDto;
  subs: SubNode[];
}

const byPosition = <T extends { position: number }>(a: T, b: T) => a.position - b.position;

export function buildTree(data: Bootstrap): MainNode[] {
  const problemsByCategory = new Map<string, ProblemDto[]>();
  for (const p of data.problems) {
    const list = problemsByCategory.get(p.categoryId) ?? [];
    list.push(p);
    problemsByCategory.set(p.categoryId, list);
  }
  const subsByParent = new Map<string, CategoryDto[]>();
  const mains: CategoryDto[] = [];
  for (const c of data.categories) {
    if (c.parentId) {
      const list = subsByParent.get(c.parentId) ?? [];
      list.push(c);
      subsByParent.set(c.parentId, list);
    } else {
      mains.push(c);
    }
  }
  return mains.sort(byPosition).map((main) => ({
    category: main,
    subs: (subsByParent.get(main.id) ?? []).sort(byPosition).map((sub) => ({
      category: sub,
      problems: (problemsByCategory.get(sub.id) ?? []).sort(byPosition),
    })),
  }));
}

export function computeDueMap(data: Bootstrap, today: Date): Map<string, DueInfo> {
  return new Map(data.problems.map((p) => [p.id, computeDue(p, data.settings, today)]));
}

export function indexById<T extends { id: string }>(items: T[]): Map<string, T> {
  return new Map(items.map((i) => [i.id, i]));
}

export function problemTags(problem: ProblemDto, tagsById: Map<string, TagDto>): TagDto[] {
  return problem.tagIds.map((id) => tagsById.get(id)).filter((t): t is TagDto => Boolean(t));
}

export function categoryPath(categoryId: string, categoriesById: Map<string, CategoryDto>) {
  const sub = categoriesById.get(categoryId);
  const main = sub?.parentId ? categoriesById.get(sub.parentId) : undefined;
  return { main, sub };
}
