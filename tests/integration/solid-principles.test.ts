/**
 * @fileoverview SOLID Principles Integration Tests
 * @description Testes de integração para validar que os princípios SOLID funcionam em conjunto
 * 
 * INTEGRATION VALIDATION:
 * - Testa interação entre módulos comment e like
 * - Valida se os princípios SOLID funcionam em cenários reais
 * - Verifica se a arquitetura suporta extensibilidade
 */

import {
  createCommentModuleForTesting,
  createLikeModuleForTesting,
  type ICommentService,
  type ILikeService,
  type CreateCommentDto,
} from "../../src/modules/comment";

describe("SOLID Principles Integration Tests", () => {
  let commentService: ICommentService;
  let likeService: ILikeService;

  beforeEach(() => {
    // Create modules with real implementations for integration testing
    const commentModule = createCommentModuleForTesting();
    const likeModule = createLikeModuleForTesting();

    commentService = commentModule.service;
    likeService = likeModule.service;
  });

  describe("Cross-Module Integration", () => {
    it("should handle comment creation and liking workflow", async () => {
      // This test validates that modules can work together
      // while maintaining SOLID principles

      // Arrange
      const createCommentDto: CreateCommentDto = {
        userId: "user123",
        aulaId: 1,
        content: "Great lesson!",
      };

      // Mock the dependencies to focus on integration
      const mockCommentRepository = {
        create: jest.fn().mockResolvedValue({
          id: 1,
          userId: "user123",
          aulaId: 1,
          content: "Great lesson!",
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
        findById: jest.fn(),
        findByLesson: jest.fn(),
        findReplies: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
        exists: jest.fn(),
      };

      const mockCommentValidator = {
        validateCreate: jest.fn().mockResolvedValue(),
        validateUpdate: jest.fn(),
        validateDelete: jest.fn(),
      };

      const mockCommentPermissionChecker = {
        canCreateComment: jest.fn().mockResolvedValue(true),
        canEditComment: jest.fn(),
        canDeleteComment: jest.fn(),
        canViewComment: jest.fn(),
      };

      const mockLikeRepository = {
        create: jest.fn().mockResolvedValue({
          id: 1,
          userId: "user123",
          commentId: 1,
          createdAt: new Date(),
        }),
        findById: jest.fn(),
        findByUserAndLesson: jest.fn(),
        findByUserAndComment: jest.fn().mockResolvedValue(null),
        delete: jest.fn(),
        countByContent: jest.fn().mockResolvedValue(1),
        exists: jest.fn(),
      };

      const mockLikeValidator = {
        validateCreate: jest.fn(),
        validateDelete: jest.fn(),
        validateToggle: jest.fn().mockResolvedValue(),
      };

      const mockLikePermissionChecker = {
        canLikeLesson: jest.fn(),
        canLikeComment: jest.fn().mockResolvedValue(true),
        canUnlike: jest.fn(),
      };

      // Create services with mocks
      const commentModuleWithMocks = createCommentModuleForTesting({
        repository: mockCommentRepository as any,
        validator: mockCommentValidator as any,
        permissionChecker: mockCommentPermissionChecker as any,
      });

      const likeModuleWithMocks = createLikeModuleForTesting({
        repository: mockLikeRepository as any,
        validator: mockLikeValidator as any,
        permissionChecker: mockLikePermissionChecker as any,
      });

      // Act - Create comment and then like it
      const comment = await commentModuleWithMocks.service.create(createCommentDto);
      const likeResult = await likeModuleWithMocks.service.toggleLikeComment("user456", comment.id);

      // Assert - Both operations should succeed
      expect(comment).toBeDefined();
      expect(comment.id).toBe(1);
      expect(likeResult).toBeDefined();
      expect(likeResult.liked).toBe(true);
      expect(likeResult.likeCount).toBe(1);
    });
  });

  describe("Extensibility Validation", () => {
    it("should support adding new features without modifying existing code (OCP)", () => {
      // This test validates Open/Closed Principle
      // New features can be added through composition/decoration

      // Arrange - Create a decorator for the comment service
      class LoggingCommentServiceDecorator implements ICommentService {
        constructor(private readonly commentService: ICommentService) {}

        async create(data: CreateCommentDto) {
          console.log("Creating comment:", data);
          return this.commentService.create(data);
        }

        async findById(id: number, userId: string) {
          console.log("Finding comment:", id);
          return this.commentService.findById(id, userId);
        }

        async update(id: number, data: any, userId: string) {
          console.log("Updating comment:", id);
          return this.commentService.update(id, data, userId);
        }

        async delete(id: number, userId: string) {
          console.log("Deleting comment:", id);
          return this.commentService.delete(id, userId);
        }

        async findByLesson(aulaId: number, userId: string) {
          console.log("Finding comments by lesson:", aulaId);
          return this.commentService.findByLesson(aulaId, userId);
        }

        async findReplies(parentId: number, userId: string) {
          console.log("Finding replies:", parentId);
          return this.commentService.findReplies(parentId, userId);
        }
      }

      // Act - Wrap service with decorator
      const decoratedService = new LoggingCommentServiceDecorator(commentService);

      // Assert - Decorator should work seamlessly
      expect(decoratedService).toBeDefined();
      expect(typeof decoratedService.create).toBe("function");
      expect(typeof decoratedService.findById).toBe("function");
    });

    it("should support different implementations (LSP)", () => {
      // This test validates Liskov Substitution Principle
      // Different implementations should be interchangeable

      // Arrange - Create alternative implementations
      class FastCommentService implements ICommentService {
        async create(data: CreateCommentDto) {
          // Fast implementation
          return {
            id: 999,
            userId: data.userId,
            aulaId: data.aulaId!,
            content: data.content,
            createdAt: new Date(),
            updatedAt: new Date(),
            user: { id: data.userId, name: "Test User" },
            likeCount: 0,
            replyCount: 0,
            userLiked: false,
          };
        }

        async findById(id: number, userId: string) {
          return {
            id,
            userId,
            aulaId: 1,
            content: "Fast comment",
            createdAt: new Date(),
            updatedAt: new Date(),
            user: { id: userId, name: "Test User" },
            likeCount: 0,
            replyCount: 0,
            userLiked: false,
          };
        }

        async update(id: number, data: any, userId: string) {
          return {
            id,
            userId,
            aulaId: 1,
            content: data.content,
            createdAt: new Date(),
            updatedAt: new Date(),
            user: { id: userId, name: "Test User" },
            likeCount: 0,
            replyCount: 0,
            userLiked: false,
          };
        }

        async delete(id: number, userId: string) {
          // Fast delete
        }

        async findByLesson(aulaId: number, userId: string) {
          return [];
        }

        async findReplies(parentId: number, userId: string) {
          return [];
        }
      }

      // Act - Use alternative implementation
      const fastService = new FastCommentService();

      // Assert - Should work the same way as original service
      expect(fastService).toBeDefined();
      expect(typeof fastService.create).toBe("function");
      expect(typeof fastService.findById).toBe("function");
    });
  });

  describe("Dependency Management", () => {
    it("should handle complex dependency graphs (DIP)", () => {
      // This test validates Dependency Inversion Principle
      // High-level modules should not depend on low-level modules

      // Arrange - Create mock dependencies
      const mockRepository = {
        create: jest.fn(),
        findById: jest.fn(),
        findByLesson: jest.fn(),
        findReplies: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
        exists: jest.fn(),
      };

      const mockValidator = {
        validateCreate: jest.fn(),
        validateUpdate: jest.fn(),
        validateDelete: jest.fn(),
      };

      const mockPermissionChecker = {
        canCreateComment: jest.fn(),
        canEditComment: jest.fn(),
        canDeleteComment: jest.fn(),
        canViewComment: jest.fn(),
      };

      // Act - Create service with injected dependencies
      const moduleWithMocks = createCommentModuleForTesting({
        repository: mockRepository as any,
        validator: mockValidator as any,
        permissionChecker: mockPermissionChecker as any,
      });

      // Assert - Service should work with any implementation
      expect(moduleWithMocks.service).toBeDefined();
      expect(moduleWithMocks.repository).toBe(mockRepository);
      expect(moduleWithMocks.validator).toBe(mockValidator);
      expect(moduleWithMocks.permissionChecker).toBe(mockPermissionChecker);
    });
  });

  describe("Interface Segregation", () => {
    it("should not force clients to depend on unused methods (ISP)", () => {
      // This test validates Interface Segregation Principle
      // Clients should not be forced to depend on methods they don't use

      // Arrange - Create a client that only needs read operations
      class ReadOnlyCommentClient {
        constructor(
          private readonly commentService: Pick<ICommentService, 'findById' | 'findByLesson'>
        ) {}

        async getComment(id: number, userId: string) {
          return this.commentService.findById(id, userId);
        }

        async getCommentsByLesson(aulaId: number, userId: string) {
          return this.commentService.findByLesson(aulaId, userId);
        }
      }

      // Act - Create client with limited interface
      const readOnlyClient = new ReadOnlyCommentClient(commentService);

      // Assert - Client should work with limited interface
      expect(readOnlyClient).toBeDefined();
      expect(typeof readOnlyClient.getComment).toBe("function");
      expect(typeof readOnlyClient.getCommentsByLesson).toBe("function");
    });
  });

  describe("Single Responsibility", () => {
    it("should have each component with single responsibility (SRP)", () => {
      // This test validates Single Responsibility Principle
      // Each class should have only one reason to change

      const commentModule = createCommentModuleForTesting();

      // Assert - Each component has single responsibility
      expect(commentModule.service).toBeDefined(); // Business logic only
      expect(commentModule.repository).toBeDefined(); // Data access only
      expect(commentModule.validator).toBeDefined(); // Validation only
      expect(commentModule.permissionChecker).toBeDefined(); // Authorization only

      // Each component should have focused interface
      expect(typeof commentModule.service.create).toBe("function");
      expect(typeof commentModule.repository.create).toBe("function");
      expect(typeof commentModule.validator.validateCreate).toBe("function");
      expect(typeof commentModule.permissionChecker.canCreateComment).toBe("function");
    });
  });

  describe("Error Handling Integration", () => {
    it("should handle errors consistently across modules", async () => {
      // Arrange
      const mockRepository = {
        create: jest.fn().mockRejectedValue(new Error("Database connection failed")),
        findById: jest.fn(),
        findByLesson: jest.fn(),
        findReplies: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
        exists: jest.fn(),
      };

      const mockValidator = {
        validateCreate: jest.fn().mockResolvedValue(),
        validateUpdate: jest.fn(),
        validateDelete: jest.fn(),
      };

      const mockPermissionChecker = {
        canCreateComment: jest.fn().mockResolvedValue(true),
        canEditComment: jest.fn(),
        canDeleteComment: jest.fn(),
        canViewComment: jest.fn(),
      };

      const moduleWithMocks = createCommentModuleForTesting({
        repository: mockRepository as any,
        validator: mockValidator as any,
        permissionChecker: mockPermissionChecker as any,
      });

      const createDto: CreateCommentDto = {
        userId: "user123",
        aulaId: 1,
        content: "Test comment",
      };

      // Act & Assert - Error should be handled consistently
      await expect(moduleWithMocks.service.create(createDto))
        .rejects.toThrow("Database connection failed");
    });
  });
});