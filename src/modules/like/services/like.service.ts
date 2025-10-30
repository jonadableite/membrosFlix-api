import { prisma } from '../../../shared/database/prisma.js';
import logger from '../../../shared/logger/logger.js';
import { ILikeService, LikeStatsDto } from '../interfaces/like.interface.js';

export class LikeService implements ILikeService {
  async toggleLessonLike(
    userId: string,
    aulaId: number
  ): Promise<LikeStatsDto> {
    try {
      // Check if user already liked this lesson
      const existingLike = await prisma.like.findFirst({
        where: {
          aulaId: aulaId,
          userId,
        },
      });

      if (existingLike) {
        // Unlike: Remove like
        await prisma.like.delete({
          where: {
            id: existingLike.id,
          },
        });

        // Count remaining likes
        const totalLikes = await prisma.like.count({
          where: { aulaId: aulaId },
        });

        logger.info("Lesson unliked", { aulaId, userId, totalLikes });

        return {
          totalLikes,
          userHasLiked: false,
        };
      }

      // Like: Create new like
      await prisma.like.create({
        data: {
          userId,
          aulaId: aulaId,
        },
      });

      // Count total likes
      const totalLikes = await prisma.like.count({
        where: { aulaId: aulaId },
      });

      logger.info("Lesson liked", { aulaId, userId, totalLikes });

      return {
        totalLikes,
        userHasLiked: true,
      };
    } catch (error) {
      logger.error("Error toggling lesson like", { error, aulaId, userId });
      throw error;
    }
  }

  async toggleCommentLike(
    userId: string,
    commentId: number
  ): Promise<LikeStatsDto> {
    try {
      // Check if user already liked this comment
      const existingLike = await prisma.like.findFirst({
        where: {
          commentId,
          userId,
        },
      });

      if (existingLike) {
        // Unlike: Remove like
        await prisma.like.delete({
          where: {
            id: existingLike.id,
          },
        });

        // Count remaining likes
        const totalLikes = await prisma.like.count({
          where: { commentId },
        });

        logger.info("Comment unliked", { commentId, userId, totalLikes });

        return {
          totalLikes,
          userHasLiked: false,
        };
      }

      // Like: Create new like
      await prisma.like.create({
        data: {
          userId,
          commentId,
        },
      });

      // Count total likes
      const totalLikes = await prisma.like.count({
        where: { commentId },
      });

      logger.info("Comment liked", { commentId, userId, totalLikes });

      return {
        totalLikes,
        userHasLiked: true,
      };
    } catch (error) {
      logger.error("Error toggling comment like", { error, commentId, userId });
      throw error;
    }
  }

  async getLessonLikeStats(
    userId: string,
    aulaId: number
  ): Promise<LikeStatsDto> {
    try {
      const existingLike = await prisma.like.findFirst({
        where: {
          aulaId: aulaId,
          userId,
        },
      });

      const totalLikes = await prisma.like.count({
        where: { aulaId: aulaId },
      });

      return {
        userHasLiked: !!existingLike,
        totalLikes,
      };
    } catch (error) {
      logger.error("Error getting lesson like status", {
        error,
        aulaId,
        userId,
      });
      return { userHasLiked: false, totalLikes: 0 };
    }
  }

  async getCommentLikeStats(
    userId: string,
    commentId: number
  ): Promise<LikeStatsDto> {
    try {
      const existingLike = await prisma.like.findFirst({
        where: {
          commentId,
          userId,
        },
      });

      const totalLikes = await prisma.like.count({
        where: { commentId },
      });

      return {
        userHasLiked: !!existingLike,
        totalLikes,
      };
    } catch (error) {
      logger.error("Error getting comment like status", {
        error,
        commentId,
        userId,
      });
      return { userHasLiked: false, totalLikes: 0 };
    }
  }
}
