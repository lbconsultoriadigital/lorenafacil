import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const listMissions = query({
  args: {
    activeOnly: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    if (args.activeOnly) {
      return await ctx.db
        .query("missions")
        .withIndex("by_active_order", (q) => q.eq("active", true))
        .collect();
    }

    const all = await ctx.db.query("missions").collect();
    return all.sort((a, b) => a.order - b.order);
  },
});

export const completeMission = mutation({
  args: {
    studentSlug: v.string(),
    missionId: v.string(),
  },
  handler: async (ctx, args) => {
    const mission = await ctx.db
      .query("missions")
      .withIndex("by_mission_id", (q) => q.eq("missionId", args.missionId))
      .first();
    if (!mission) throw new Error("Missão não encontrada");

    const existing = await ctx.db
      .query("progress")
      .withIndex("by_student_mission", (q) =>
        q.eq("studentSlug", args.studentSlug).eq("missionId", args.missionId),
      )
      .first();

    if (!existing) {
      await ctx.db.insert("progress", {
        studentSlug: args.studentSlug,
        missionId: mission.missionId,
        subjectId: mission.subjectId,
        xp: mission.xp,
        completedAt: Date.now(),
      });
    }

    const unlocked = await ctx.db
      .query("stickerUnlocks")
      .withIndex("by_student_sticker", (q) =>
        q.eq("studentSlug", args.studentSlug).eq("stickerId", mission.stickerId),
      )
      .first();

    if (!unlocked) {
      await ctx.db.insert("stickerUnlocks", {
        studentSlug: args.studentSlug,
        stickerId: mission.stickerId,
        unlockedAt: Date.now(),
      });
    }

    return {
      missionId: mission.missionId,
      subjectId: mission.subjectId,
      xp: existing ? 0 : mission.xp,
      stickerId: mission.stickerId,
      reward: mission.reward,
    };
  },
});

export const getProgress = query({
  args: {
    studentSlug: v.string(),
  },
  handler: async (ctx, args) => {
    const rows = await ctx.db
      .query("progress")
      .withIndex("by_student", (q) => q.eq("studentSlug", args.studentSlug))
      .collect();
    return {
      completedMissionIds: rows.map((row) => row.missionId),
      xp: rows.reduce((sum, row) => sum + row.xp, 0),
    };
  },
});
