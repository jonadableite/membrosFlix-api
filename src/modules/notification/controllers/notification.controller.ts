import { Request, Response, NextFunction } from "express";
import { NotificationService } from "../services/notification.service";
import { AppError } from "@/shared/errors/app.error";
import { coloredLogger } from "@/shared/logger/colored.logger";

export class NotificationController {
  constructor(private notificationService: NotificationService) {}

  async getUserNotifications(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      console.log('🔔 [CONTROLLER] getUserNotifications START');
      const userId = (req as any).user?.id;
      console.log('🔔 [CONTROLLER] userId:', userId);
      
      const tenantId = (req as any).tenantId || 'default';
      console.log('🔔 [CONTROLLER] tenantId:', tenantId);
      
      const { page = 1, limit = 10, tipo, lida } = req.query;
      console.log('🔔 [CONTROLLER] Query params:', { page, limit, tipo, lida });

      const options = {
        page: Number(page),
        limit: Number(limit),
        where: {
          ...(tipo && { tipo: tipo as any }),
          ...(lida !== undefined && { lida: lida === 'true' }),
        },
      };
      console.log('🔔 [CONTROLLER] Options:', options);

      console.log('🔔 [CONTROLLER] Calling notificationService.getUserNotifications...');
      const notifications = await this.notificationService.getUserNotifications(
        userId,
        tenantId,
        options
      );
      console.log('🔔 [CONTROLLER] Notifications fetched:', notifications.length);

      console.log('🔔 [CONTROLLER] Calling notificationService.getUnreadCount...');
      const unreadCount = await this.notificationService.getUnreadCount(
        userId,
        tenantId
      );
      console.log('🔔 [CONTROLLER] Unread count:', unreadCount);

      coloredLogger.notification(`User ${userId} retrieved ${notifications.length} notifications`, {
        userId,
        tenantId,
        page,
        limit,
        unreadCount,
      });

      res.status(200).json({
        success: true,
        message: "Notificações recuperadas com sucesso",
        data: notifications,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: notifications.length,
        },
        unreadCount,
      });
    } catch (error) {
      next(error);
    }
  }

  async getNotification(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;
      const userId = (req as any).user.id;
      const tenantId = (req as any).tenantId;

      if (!id) {
        throw new AppError("ID da notificação é obrigatório", 400);
      }

      const notification = await this.notificationService.findById(id);

      if (!notification) {
        throw new AppError("Notificação não encontrada", 404);
      }

      // Verificar se a notificação pertence ao usuário
      if (notification.userId !== userId) {
        throw new AppError("Acesso negado", 403);
      }

      coloredLogger.notification(`User ${userId} viewed notification ${id}`, {
        userId,
        tenantId,
        notificationId: id,
      });

      res.status(200).json({
        success: true,
        message: "Notificação recuperada com sucesso",
        data: notification,
      });
    } catch (error) {
      next(error);
    }
  }

  async markAsRead(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;
      const userId = (req as any).user.id;
      const tenantId = (req as any).tenantId;

      if (!id) {
        throw new AppError("ID da notificação é obrigatório", 400);
      }

      await this.notificationService.markAsRead(id, userId, tenantId);

      coloredLogger.notification(`User ${userId} marked notification ${id} as read`, {
        userId,
        tenantId,
        notificationId: id,
      });

      res.status(200).json({
        success: true,
        message: "Notificação marcada como lida",
      });
    } catch (error) {
      next(error);
    }
  }

  async markAllAsRead(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = (req as any).user.id;
      const tenantId = (req as any).tenantId;

      await this.notificationService.markAllAsRead(userId, tenantId);

      coloredLogger.notification(`User ${userId} marked all notifications as read`, {
        userId,
        tenantId,
      });

      res.status(200).json({
        success: true,
        message: "Todas as notificações foram marcadas como lidas",
      });
    } catch (error) {
      next(error);
    }
  }

  async getUnreadCount(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = (req as any).user.id;
      const tenantId = (req as any).tenantId;

      const unreadCount = await this.notificationService.getUnreadCount(
        userId,
        tenantId
      );

      coloredLogger.notification(`User ${userId} checked unread count: ${unreadCount}`, {
        userId,
        tenantId,
        unreadCount,
      });

      res.status(200).json({
        success: true,
        message: "Contagem de notificações não lidas",
        data: {
          unreadCount,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteNotification(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;
      const userId = (req as any).user.id;
      const tenantId = (req as any).tenantId;

      if (!id) {
        throw new AppError("ID da notificação é obrigatório", 400);
      }

      const notification = await this.notificationService.findById(id);

      if (!notification) {
        throw new AppError("Notificação não encontrada", 404);
      }

      // Verificar se a notificação pertence ao usuário
      if (notification.userId !== userId) {
        throw new AppError("Acesso negado", 403);
      }

      await this.notificationService.delete(id);

      coloredLogger.notification(`User ${userId} deleted notification ${id}`, {
        userId,
        tenantId,
        notificationId: id,
      });

      res.status(200).json({
        success: true,
        message: "Notificação excluída com sucesso",
      });
    } catch (error) {
      next(error);
    }
  }
}
