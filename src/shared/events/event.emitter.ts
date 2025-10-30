import { EventEmitter as NodeEventEmitter } from "events";
import type { AppEvent, EventHandler } from "./event.types";
import logger from "../logger/logger.js";

export class AppEventEmitter {
  private static instance: AppEventEmitter;
  private emitter: NodeEventEmitter;

  private constructor() {
    this.emitter = new NodeEventEmitter();
    this.emitter.setMaxListeners(50); // Increase limit for multiple handlers
  }

  static getInstance(): AppEventEmitter {
    if (!AppEventEmitter.instance) {
      AppEventEmitter.instance = new AppEventEmitter();
    }
    return AppEventEmitter.instance;
  }

  async emit<T extends AppEvent>(event: T): Promise<void> {
    try {
      logger.info("Event emitted", {
        eventType: event.type,
        eventId: event.id,
        tenantId: event.tenantId,
        userId: event.userId,
      });

      this.emitter.emit(event.type, event);
    } catch (error) {
      logger.error("Failed to emit event", {
        eventType: event.type,
        eventId: event.id,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  }

  subscribe<T extends AppEvent>(
    eventType: string,
    handler: EventHandler<T>
  ): void {
    const wrappedHandler = async (event: T) => {
      try {
        await handler.handle(event);
        logger.debug("Event handled successfully", {
          eventType: event.type,
          eventId: event.id,
          handlerName: handler.constructor.name,
        });
      } catch (error) {
        logger.error("Event handler failed", {
          eventType: event.type,
          eventId: event.id,
          handlerName: handler.constructor.name,
          error: error instanceof Error ? error.message : "Unknown error",
        });
        // Don't throw - let other handlers continue
      }
    };

    this.emitter.on(eventType, wrappedHandler);
    logger.info("Event handler registered", {
      eventType,
      handlerName: handler.constructor.name,
    });
  }

  unsubscribe(eventType: string, handler: EventHandler): void {
    this.emitter.removeListener(eventType, handler.handle);
    logger.info("Event handler unregistered", {
      eventType,
      handlerName: handler.constructor.name,
    });
  }

  // Helper method to create events
  static createEvent<T extends AppEvent>(
    type: T["type"],
    tenantId: string,
    userId: string | undefined,
    data: T["data"]
  ): T {
    return {
      id: crypto.randomUUID(),
      type,
      timestamp: new Date(),
      tenantId,
      userId,
      data,
    } as T;
  }
}

// Export singleton instance
export const eventEmitter = AppEventEmitter.getInstance();
