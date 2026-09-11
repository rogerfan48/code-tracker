import type { Difficulty } from "@/types/tracker";

export interface LeetCodeLookup {
  number: string;
  title: string;
  slug: string;
  url: string;
  difficulty: Difficulty;
  topicTags: string[];
  paidOnly: boolean;
}

// Unofficial GraphQL endpoint used by leetcode.com itself; shape may change without notice.
const ENDPOINT = "https://leetcode.com/graphql";
const QUERY = `
  query problemsetQuestionList($limit: Int, $filters: QuestionListFilterInput) {
    problemsetQuestionList: questionList(categorySlug: "", limit: $limit, skip: 0, filters: $filters) {
      questions: data {
        questionFrontendId
        title
        titleSlug
        difficulty
        paidOnly: isPaidOnly
        topicTags { name }
      }
    }
  }
`;

interface RawQuestion {
  questionFrontendId: string;
  title: string;
  titleSlug: string;
  difficulty: string;
  paidOnly: boolean;
  topicTags: { name: string }[];
}

export function pickQuestion(questions: RawQuestion[], number: string): LeetCodeLookup | null {
  const q = questions.find((x) => x.questionFrontendId === number);
  if (!q) return null;
  return {
    number: q.questionFrontendId,
    title: q.title,
    slug: q.titleSlug,
    url: `https://leetcode.com/problems/${q.titleSlug}/`,
    difficulty: q.difficulty.toUpperCase() as Difficulty,
    topicTags: q.topicTags.map((t) => t.name),
    paidOnly: q.paidOnly,
  };
}

export async function lookupLeetCode(number: string): Promise<LeetCodeLookup | null> {
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json", Referer: "https://leetcode.com/problemset/" },
    body: JSON.stringify({ query: QUERY, variables: { limit: 20, filters: { searchKeywords: number } } }),
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`LeetCode responded ${res.status}`);
  const body = (await res.json()) as { data?: { problemsetQuestionList?: { questions: RawQuestion[] } } };
  const questions = body.data?.problemsetQuestionList?.questions;
  if (!questions) throw new Error("Unexpected LeetCode response");
  return pickQuestion(questions, number);
}
