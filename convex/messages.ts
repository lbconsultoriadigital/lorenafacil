import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const listMessages = query({
  args: {
    studentSlug: v.string(),
    subjectId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const rows = args.subjectId
      ? await ctx.db
          .query("messages")
          .withIndex("by_student_subject_created_at", (q) =>
            q.eq("studentSlug", args.studentSlug).eq("subjectId", args.subjectId!),
          )
          .order("desc")
          .take(50)
      : await ctx.db
          .query("messages")
          .withIndex("by_student_created_at", (q) => q.eq("studentSlug", args.studentSlug))
          .order("desc")
          .take(50);

    return rows.reverse();
  },
});

export const recordMessage = mutation({
  args: {
    studentSlug: v.string(),
    subjectId: v.string(),
    role: v.union(v.literal("user"), v.literal("assistant")),
    text: v.string(),
    provider: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("messages", {
      ...args,
      createdAt: Date.now(),
    });
  },
});
