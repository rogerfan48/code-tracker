import { describe, expect, it } from "vitest";
import { pickQuestion } from "./leetcode";

const raw = [
  { questionFrontendId: "1169", title: "Invalid Transactions", titleSlug: "invalid-transactions", difficulty: "Medium", paidOnly: false, topicTags: [] },
  { questionFrontendId: "169", title: "Majority Element", titleSlug: "majority-element", difficulty: "Easy", paidOnly: false, topicTags: [{ name: "Array" }, { name: "Hash Table" }] },
];

describe("pickQuestion", () => {
  it("matches the exact frontend id, not substring hits", () => {
    expect(pickQuestion(raw, "169")).toMatchObject({ title: "Majority Element", difficulty: "EASY", url: "https://leetcode.com/problems/majority-element/", topicTags: ["Array", "Hash Table"] });
  });
  it("returns null when absent", () => {
    expect(pickQuestion(raw, "2")).toBeNull();
  });
});
