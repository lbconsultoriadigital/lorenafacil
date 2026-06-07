import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const listStickers = query({
  args: {
    studentSlug: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const all = await ctx.db.query("stickers").collect();
    const unlocks = args.studentSlug
      ? await ctx.db
          .query("stickerUnlocks")
          .withIndex("by_student", (q) => q.eq("studentSlug", args.studentSlug!))
          .collect()
      : [];
    const unlockedIds = new Set(unlocks.map((unlock) => unlock.stickerId));

    return all
      .sort((a, b) => a.order - b.order)
      .map((sticker) => ({
        ...sticker,
        unlocked: unlockedIds.has(sticker.stickerId),
      }));
  },
});

export const unlockSticker = mutation({
  args: {
    studentSlug: v.string(),
    stickerId: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("stickerUnlocks")
      .withIndex("by_student_sticker", (q) =>
        q.eq("studentSlug", args.studentSlug).eq("stickerId", args.stickerId),
      )
      .first();

    if (existing) return existing._id;

    return await ctx.db.insert("stickerUnlocks", {
      studentSlug: args.studentSlug,
      stickerId: args.stickerId,
      unlockedAt: Date.now(),
    });
  },
});
