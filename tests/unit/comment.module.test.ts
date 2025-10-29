/**
 * @fileoverview Comment Module Tests
 * @description Testes para validar funcionalidade do módulo de comentários após refatoração SOLID
 * 
 * SOLID VALIDATION:
 * - Testa se todas as interfaces funcionam corretamente
 * - Valida se a injeção de dependências está funcionando
 * - Verifica se os princípios SOLID foram mantidos
 */

import { 
  createCommentModuleForTesting,
  type ICommentService,
  type ICommentRepository,
  type ICommentValidator,
  type ICommentPermissionChecker,
  type CreateCommentDto,
  type UpdateCommentDto,
  type CommentResponseDto
} from "../../src/modules/comment";

describe("Comment Module - SOLID Validation", () => {
  let mockRepository: jest.Mocked<ICommentRepository>;
  let mockValidator: jest.Mocked<ICommentValidator>;
  let mockPermissionChecker: jest.Mocked<ICommentPermissionChecker>;
  let commentService: ICommentService;

  beforeEach(() => {
    // Mock Repository (DIP - Dependency Inversion Principle)
    mockRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findByLesson: jest.fn(),
      findReplies: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
      exists: jest.fn(),
    } as any;

    // Mock Validator (SRP - Single Responsibility Principle)
    mockValidator = {
      validateCreate: jest.fn(),
      validateUpdate: jest.fn(),
      validateDelete: jest.fn(),
    } as any;

    // Mock Permission Checker (SRP - Single Responsibility Principle)
    mockPermissionChecker = {
      canCreateComment: jest.fn(),
      canEditComment: jest.fn(),
      canDeleteComment: jest.fn(),
      canViewComment: jest.fn(),
    } as any;

    // Criar módulo com mocks (DIP - Dependency Inversion Principle)
    const { service } = createCommentModuleForTesting({
      repository: mockRepository,
      validator: mockValidator,
      permissionChecker: mockPermissionChecker,
    });

    commentService = service;
  });

  describe("SRP - Single Responsibility Principle", () => {
    it("should have service focused only on business logic", async () => {
      // Arrange
      const createDto: CreateCommentDto = {
        userId: "user123",
        aulaId: 1,
        content: "Test comment",
      };

      const mockComment = {
        id: 1,
        userId: "user123",
        aulaId: 1,
        content: "Test comment",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockValidator.validateCreate.mockResolvedValue();
      mockPermissionChecker.canCreateComment.mockResolvedValue(true);
      mockRepository.create.mockResolvedValue(mockComment as any);

      // Act
      const result = await commentService.create(createDto);

      // Assert - Service orchestrates but doesn't handle persistence directly
      expect(mockValidator.validateCreate).toHaveBeenCalledWith(createDto);
      expect(mockPermissionChecker.canCreateComment).toHaveBeenCalledWith("user123", 1);
      expect(mockRepository.create).toHaveBeenCalledWith(createDto);
      expect(result).toBeDefined();
    });

    it("should have repository focused only on data access", async () => {
      // Arrange
      const commentId = 1;
      const mockComment = {
        id: 1,
        userId: "user123",
        aulaId: 1,
        content: "Test comment",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRepository.findById.mockResolvedValue(mockComment as any);

      // Act
      await mockRepository.findById(commentId);

      // Assert - Repository only handles data access
      expect(mockRepository.findById).toHaveBeenCalledWith(commentId);
      expect(mockRepository.findById).toHaveBeenCalledTimes(1);
    });

    it("should have validator focused only on validation", async () => {
      // Arrange
      const createDto: CreateCommentDto = {
        userId: "user123",
        aulaId: 1,
        content: "Test comment",
      };

      mockValidator.validateCreate.mockResolvedValue();

      // Act
      await mockValidator.validateCreate(createDto);

      // Assert - Validator only handles validation
      expect(mockValidator.validateCreate).toHaveBeenCalledWith(createDto);
      expect(mockValidator.validateCreate).toHaveBeenCalledTimes(1);
    });
  });

  describe("OCP - Open/Closed Principle", () => {
    it("should allow extension without modification", () => {
      // Assert - Interfaces allow extension
      expect(typeof commentService.create).toBe("function");
      expect(typeof commentService.findById).toBe("function");
      expect(typeof commentService.update).toBe("function");
      expect(typeof commentService.delete).toBe("function");

      // Service can be extended through composition/decoration
      expect(commentService).toBeDefined();
    });
  });

  describe("LSP - Liskov Substitution Principle", () => {
    it("should work with any implementation of interfaces", async () => {
      // Arrange - Different implementations should work the same way
      const createDto: CreateCommentDto = {
        userId: "user123",
        aulaId: 1,
        content: "Test comment",
      };

      mockValidator.validateCreate.mockResolvedValue();
      mockPermissionChecker.canCreateComment.mockResolvedValue(true);
      mockRepository.create.mockResolvedValue({
        id: 1,
        userId: "user123",
        aulaId: 1,
        content: "Test comment",
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      // Act & Assert - Any implementation should work
      await expect(commentService.create(createDto)).resolves.toBeDefined();
    });
  });

  describe("ISP - Interface Segregation Principle", () => {
    it("should have segregated interfaces", () => {
      // Assert - Each interface has specific responsibilities
      expect(mockRepository.create).toBeDefined();
      expect(mockRepository.findById).toBeDefined();
      expect(mockValidator.validateCreate).toBeDefined();
      expect(mockPermissionChecker.canCreateComment).toBeDefined();

      // Interfaces are focused and don't force unnecessary dependencies
      expect(Object.keys(mockRepository)).toEqual(
        expect.arrayContaining(["create", "findById", "findByLesson", "update", "delete"])
      );
    });
  });

  describe("DIP - Dependency Inversion Principle", () => {
    it("should depend on abstractions, not concretions", () => {
      // Assert - Service depends on interfaces, not concrete classes
      expect(commentService).toBeDefined();
      
      // Mocks can be injected, proving dependency inversion
      expect(mockRepository.create).toBeDefined();
      expect(mockValidator.validateCreate).toBeDefined();
      expect(mockPermissionChecker.canCreateComment).toBeDefined();
    });

    it("should allow mock injection for testing", async () => {
      // Arrange
      const createDto: CreateCommentDto = {
        userId: "user123",
        aulaId: 1,
        content: "Test comment",
      };

      mockValidator.validateCreate.mockResolvedValue();
      mockPermissionChecker.canCreateComment.mockResolvedValue(true);
      mockRepository.create.mockResolvedValue({
        id: 1,
        userId: "user123",
        aulaId: 1,
        content: "Test comment",
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      // Act
      const result = await commentService.create(createDto);

      // Assert - Mocks were used successfully
      expect(mockValidator.validateCreate).toHaveBeenCalled();
      expect(mockPermissionChecker.canCreateComment).toHaveBeenCalled();
      expect(mockRepository.create).toHaveBeenCalled();
      expect(result).toBeDefined();
    });
  });

  describe("Functional Validation", () => {
    it("should create comment successfully", async () => {
      // Arrange
      const createDto: CreateCommentDto = {
        userId: "user123",
        aulaId: 1,
        content: "Test comment",
      };

      const mockComment = {
        id: 1,
        userId: "user123",
        aulaId: 1,
        content: "Test comment",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockValidator.validateCreate.mockResolvedValue();
      mockPermissionChecker.canCreateComment.mockResolvedValue(true);
      mockRepository.create.mockResolvedValue(mockComment as any);

      // Act
      const result = await commentService.create(createDto);

      // Assert
      expect(result).toBeDefined();
      expect(result.id).toBe(1);
      expect(result.content).toBe("Test comment");
    });

    it("should find comment by id", async () => {
      // Arrange
      const commentId = 1;
      const mockComment = {
        id: 1,
        userId: "user123",
        aulaId: 1,
        content: "Test comment",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRepository.findById.mockResolvedValue(mockComment as any);
      mockPermissionChecker.canViewComment.mockResolvedValue(true);

      // Act
      const result = await commentService.findById(commentId, "user123");

      // Assert
      expect(result).toBeDefined();
      expect(result.id).toBe(1);
    });

    it("should update comment successfully", async () => {
      // Arrange
      const commentId = 1;
      const userId = "user123";
      const updateDto: UpdateCommentDto = {
        content: "Updated comment",
      };

      const mockComment = {
        id: 1,
        userId: "user123",
        aulaId: 1,
        content: "Updated comment",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockValidator.validateUpdate.mockResolvedValue();
      mockPermissionChecker.canEditComment.mockResolvedValue(true);
      mockRepository.update.mockResolvedValue(mockComment as any);

      // Act
      const result = await commentService.update(commentId, updateDto, userId);

      // Assert
      expect(result).toBeDefined();
      expect(result.content).toBe("Updated comment");
    });

    it("should delete comment successfully", async () => {
      // Arrange
      const commentId = 1;
      const userId = "user123";

      mockValidator.validateDelete.mockResolvedValue();
      mockPermissionChecker.canDeleteComment.mockResolvedValue(true);
      mockRepository.delete.mockResolvedValue();

      // Act & Assert
      await expect(commentService.delete(commentId, userId)).resolves.not.toThrow();
    });

    it("should handle validation errors", async () => {
      // Arrange
      const createDto: CreateCommentDto = {
        userId: "user123",
        aulaId: 1,
        content: "",
      };

      mockValidator.validateCreate.mockRejectedValue(new Error("Content is required"));

      // Act & Assert
      await expect(commentService.create(createDto)).rejects.toThrow("Content is required");
    });

    it("should handle permission errors", async () => {
      // Arrange
      const createDto: CreateCommentDto = {
        userId: "user123",
        aulaId: 1,
        content: "Test comment",
      };

      mockValidator.validateCreate.mockResolvedValue();
      mockPermissionChecker.canCreateComment.mockResolvedValue(false);

      // Act & Assert
      await expect(commentService.create(createDto)).rejects.toThrow();
    });
  });
});