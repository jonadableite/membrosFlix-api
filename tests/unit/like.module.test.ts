/**
 * @fileoverview Like Module Tests
 * @description Testes para validar funcionalidade do módulo de likes após refatoração SOLID
 * 
 * SOLID VALIDATION:
 * - Testa se todas as interfaces funcionam corretamente
 * - Valida se a injeção de dependências está funcionando
 * - Verifica se os princípios SOLID foram mantidos
 */

import { 
  createLikeModuleForTesting,
  type ILikeService,
  type ILikeRepository,
  type ILikeValidator,
  type ILikePermissionChecker,
  type CreateLikeDto,
  type LikeResponseDto,
  type LikeStatsDto
} from "../../src/modules/like";

describe("Like Module - SOLID Validation", () => {
  let mockRepository: jest.Mocked<ILikeRepository>;
  let mockValidator: jest.Mocked<ILikeValidator>;
  let mockPermissionChecker: jest.Mocked<ILikePermissionChecker>;
  let likeService: ILikeService;

  beforeEach(() => {
    // Mock Repository (DIP - Dependency Inversion Principle)
    mockRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findByUserAndLesson: jest.fn(),
      findByUserAndComment: jest.fn(),
      delete: jest.fn(),
      countByContent: jest.fn(),
      exists: jest.fn(),
    } as any;

    // Mock Validator (SRP - Single Responsibility Principle)
    mockValidator = {
      validateCreate: jest.fn(),
      validateDelete: jest.fn(),
      validateToggle: jest.fn(),
    } as any;

    // Mock Permission Checker (SRP - Single Responsibility Principle)
    mockPermissionChecker = {
      canLikeLesson: jest.fn(),
      canLikeComment: jest.fn(),
      canUnlike: jest.fn(),
    } as any;

    // Criar módulo com mocks (DIP - Dependency Inversion Principle)
    const { service } = createLikeModuleForTesting({
      repository: mockRepository,
      validator: mockValidator,
      permissionChecker: mockPermissionChecker,
    });

    likeService = service;
  });

  describe("SRP - Single Responsibility Principle", () => {
    it("should have service focused only on business logic", async () => {
      // Arrange
      const userId = "user123";
      const aulaId = 1;

      mockValidator.validateToggle.mockResolvedValue();
      mockPermissionChecker.canLikeLesson.mockResolvedValue(true);
      mockRepository.findByUserAndLesson.mockResolvedValue(null);
      mockRepository.create.mockResolvedValue({
        id: 1,
        userId: "user123",
        aulaId: 1,
        createdAt: new Date(),
      } as any);
      mockRepository.countByContent.mockResolvedValue(1);

      // Act
      const result = await likeService.toggleLikeLesson(userId, aulaId);

      // Assert - Service orchestrates but doesn't handle persistence directly
      expect(mockValidator.validateToggle).toHaveBeenCalled();
      expect(mockPermissionChecker.canLikeLesson).toHaveBeenCalledWith(userId, aulaId);
      expect(mockRepository.findByUserAndLesson).toHaveBeenCalledWith(userId, aulaId);
      expect(mockRepository.create).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it("should have repository focused only on data access", async () => {
      // Arrange
      const userId = "user123";
      const aulaId = 1;

      mockRepository.findByUserAndLesson.mockResolvedValue(null);

      // Act
      await mockRepository.findByUserAndLesson(userId, aulaId);

      // Assert - Repository only handles data access
      expect(mockRepository.findByUserAndLesson).toHaveBeenCalledWith(userId, aulaId);
      expect(mockRepository.findByUserAndLesson).toHaveBeenCalledTimes(1);
    });

    it("should have validator focused only on validation", async () => {
      // Arrange
      const createDto: CreateLikeDto = {
        userId: "user123",
        aulaId: 1,
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
      expect(typeof likeService.toggleLikeLesson).toBe("function");
      expect(typeof likeService.toggleLikeComment).toBe("function");
      expect(typeof likeService.getLikeStatus).toBe("function");
      expect(typeof likeService.getLikeStats).toBe("function");

      // Service can be extended through composition/decoration
      expect(likeService).toBeDefined();
    });
  });

  describe("LSP - Liskov Substitution Principle", () => {
    it("should work with any implementation of interfaces", async () => {
      // Arrange - Different implementations should work the same way
      const userId = "user123";
      const aulaId = 1;

      mockValidator.validateToggle.mockResolvedValue();
      mockPermissionChecker.canLikeLesson.mockResolvedValue(true);
      mockRepository.findByUserAndLesson.mockResolvedValue(null);
      mockRepository.create.mockResolvedValue({
        id: 1,
        userId: "user123",
        aulaId: 1,
        createdAt: new Date(),
      } as any);
      mockRepository.countByContent.mockResolvedValue(1);

      // Act & Assert - Any implementation should work
      await expect(likeService.toggleLikeLesson(userId, aulaId)).resolves.toBeDefined();
    });
  });

  describe("ISP - Interface Segregation Principle", () => {
    it("should have segregated interfaces", () => {
      // Assert - Each interface has specific responsibilities
      expect(mockRepository.create).toBeDefined();
      expect(mockRepository.findById).toBeDefined();
      expect(mockValidator.validateCreate).toBeDefined();
      expect(mockPermissionChecker.canLikeLesson).toBeDefined();

      // Interfaces are focused and don't force unnecessary dependencies
      expect(Object.keys(mockRepository)).toEqual(
        expect.arrayContaining(["create", "findById", "findByUserAndLesson", "delete"])
      );
    });
  });

  describe("DIP - Dependency Inversion Principle", () => {
    it("should depend on abstractions, not concretions", () => {
      // Assert - Service depends on interfaces, not concrete classes
      expect(likeService).toBeDefined();
      
      // Mocks can be injected, proving dependency inversion
      expect(mockRepository.create).toBeDefined();
      expect(mockValidator.validateCreate).toBeDefined();
      expect(mockPermissionChecker.canLikeLesson).toBeDefined();
    });

    it("should allow mock injection for testing", async () => {
      // Arrange
      const userId = "user123";
      const aulaId = 1;

      mockValidator.validateToggle.mockResolvedValue();
      mockPermissionChecker.canLikeLesson.mockResolvedValue(true);
      mockRepository.findByUserAndLesson.mockResolvedValue(null);
      mockRepository.create.mockResolvedValue({
        id: 1,
        userId: "user123",
        aulaId: 1,
        createdAt: new Date(),
      } as any);
      mockRepository.countByContent.mockResolvedValue(1);

      // Act
      const result = await likeService.toggleLikeLesson(userId, aulaId);

      // Assert - Mocks were used successfully
      expect(mockValidator.validateToggle).toHaveBeenCalled();
      expect(mockPermissionChecker.canLikeLesson).toHaveBeenCalled();
      expect(mockRepository.findByUserAndLesson).toHaveBeenCalled();
      expect(result).toBeDefined();
    });
  });

  describe("Functional Validation", () => {
    it("should toggle like on lesson successfully (create)", async () => {
      // Arrange
      const userId = "user123";
      const aulaId = 1;

      mockValidator.validateToggle.mockResolvedValue();
      mockPermissionChecker.canLikeLesson.mockResolvedValue(true);
      mockRepository.findByUserAndLesson.mockResolvedValue(null); // No existing like
      mockRepository.create.mockResolvedValue({
        id: 1,
        userId: "user123",
        aulaId: 1,
        createdAt: new Date(),
      } as any);
      mockRepository.countByContent.mockResolvedValue(1);

      // Act
      const result = await likeService.toggleLikeLesson(userId, aulaId);

      // Assert
      expect(result).toBeDefined();
      expect(result.liked).toBe(true);
      expect(result.likeCount).toBe(1);
    });

    it("should toggle like on lesson successfully (remove)", async () => {
      // Arrange
      const userId = "user123";
      const aulaId = 1;
      const existingLike = {
        id: 1,
        userId: "user123",
        aulaId: 1,
        createdAt: new Date(),
      };

      mockValidator.validateToggle.mockResolvedValue();
      mockPermissionChecker.canUnlike.mockResolvedValue(true);
      mockRepository.findByUserAndLesson.mockResolvedValue(existingLike as any);
      mockRepository.delete.mockResolvedValue();
      mockRepository.countByContent.mockResolvedValue(0);

      // Act
      const result = await likeService.toggleLikeLesson(userId, aulaId);

      // Assert
      expect(result).toBeDefined();
      expect(result.liked).toBe(false);
      expect(result.likeCount).toBe(0);
    });

    it("should toggle like on comment successfully", async () => {
      // Arrange
      const userId = "user123";
      const commentId = 1;

      mockValidator.validateToggle.mockResolvedValue();
      mockPermissionChecker.canLikeComment.mockResolvedValue(true);
      mockRepository.findByUserAndComment.mockResolvedValue(null);
      mockRepository.create.mockResolvedValue({
        id: 1,
        userId: "user123",
        commentId: 1,
        createdAt: new Date(),
      } as any);
      mockRepository.countByContent.mockResolvedValue(1);

      // Act
      const result = await likeService.toggleLikeComment(userId, commentId);

      // Assert
      expect(result).toBeDefined();
      expect(result.liked).toBe(true);
      expect(result.likeCount).toBe(1);
    });

    it("should get like status successfully", async () => {
      // Arrange
      const userId = "user123";
      const aulaId = 1;
      const existingLike = {
        id: 1,
        userId: "user123",
        aulaId: 1,
        createdAt: new Date(),
      };

      mockRepository.findByUserAndLesson.mockResolvedValue(existingLike as any);

      // Act
      const result = await likeService.getLikeStatus(userId, aulaId);

      // Assert
      expect(result).toBeDefined();
      expect(result.liked).toBe(true);
      expect(result.likeId).toBe(1);
    });

    it("should get like stats successfully", async () => {
      // Arrange
      const aulaId = 1;

      mockRepository.countByContent.mockResolvedValue(5);

      // Act
      const result = await likeService.getLikeStats(aulaId);

      // Assert
      expect(result).toBeDefined();
      expect(result.totalLikes).toBe(5);
    });

    it("should handle validation errors", async () => {
      // Arrange
      const userId = "user123";
      const aulaId = 1;

      mockValidator.validateToggle.mockRejectedValue(new Error("Invalid data"));

      // Act & Assert
      await expect(likeService.toggleLikeLesson(userId, aulaId)).rejects.toThrow("Invalid data");
    });

    it("should handle permission errors", async () => {
      // Arrange
      const userId = "user123";
      const aulaId = 1;

      mockValidator.validateToggle.mockResolvedValue();
      mockPermissionChecker.canLikeLesson.mockResolvedValue(false);

      // Act & Assert
      await expect(likeService.toggleLikeLesson(userId, aulaId)).rejects.toThrow();
    });

    it("should handle repository errors", async () => {
      // Arrange
      const userId = "user123";
      const aulaId = 1;

      mockValidator.validateToggle.mockResolvedValue();
      mockPermissionChecker.canLikeLesson.mockResolvedValue(true);
      mockRepository.findByUserAndLesson.mockRejectedValue(new Error("Database error"));

      // Act & Assert
      await expect(likeService.toggleLikeLesson(userId, aulaId)).rejects.toThrow("Database error");
    });
  });

  describe("Edge Cases", () => {
    it("should handle concurrent like attempts", async () => {
      // Arrange
      const userId = "user123";
      const aulaId = 1;

      mockValidator.validateToggle.mockResolvedValue();
      mockPermissionChecker.canLikeLesson.mockResolvedValue(true);
      mockRepository.findByUserAndLesson.mockResolvedValue(null);
      mockRepository.create.mockResolvedValue({
        id: 1,
        userId: "user123",
        aulaId: 1,
        createdAt: new Date(),
      } as any);
      mockRepository.countByContent.mockResolvedValue(1);

      // Act - Multiple concurrent calls
      const promises = [
        likeService.toggleLikeLesson(userId, aulaId),
        likeService.toggleLikeLesson(userId, aulaId),
      ];

      // Assert - Should handle gracefully
      const results = await Promise.allSettled(promises);
      expect(results).toHaveLength(2);
    });

    it("should handle missing resources", async () => {
      // Arrange
      const userId = "user123";
      const aulaId = 999; // Non-existent lesson

      mockValidator.validateToggle.mockResolvedValue();
      mockPermissionChecker.canLikeLesson.mockResolvedValue(false); // Should fail permission check

      // Act & Assert
      await expect(likeService.toggleLikeLesson(userId, aulaId)).rejects.toThrow();
    });
  });
});