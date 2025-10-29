import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function addInstructorProfile() {
  try {
    console.log("🚀 Adicionando perfil de instrutor ao usuário admin...");

    // Buscar o usuário admin
    const adminUser = await prisma.user.findFirst({
      where: {
        email: "jonadab.leite@gmail.com",
        role: "ADMIN",
      },
    });

    if (!adminUser) {
      console.log("❌ Usuário admin não encontrado!");
      return;
    }

    console.log("✅ Usuário admin encontrado:", adminUser.name);

    // Verificar se já tem perfil de instrutor
    const existingInstructor = await prisma.instructor.findFirst({
      where: { userId: adminUser.id },
    });

    if (existingInstructor) {
      console.log("⚠️  Usuário admin já possui perfil de instrutor!");
      console.log("📋 Dados do perfil existente:");
      console.log(`   ID: ${existingInstructor.id}`);
      console.log(`   Bio: ${existingInstructor.bio}`);
      console.log(
        `   Especialidades: ${existingInstructor.expertise.join(", ")}`
      );
      return;
    }

    // Criar perfil de instrutor
    const instructorProfile = await prisma.instructor.create({
      data: {
        tenantId: adminUser.tenantId,
        userId: adminUser.id,
        bio: "Administrador do sistema MembrosFlix",
        expertise: ["Administração", "Desenvolvimento", "Gestão"],
      },
    });

    console.log("✅ Perfil de instrutor criado com sucesso!");
    console.log("📋 Dados do perfil:");
    console.log(`   ID: ${instructorProfile.id}`);
    console.log(`   Bio: ${instructorProfile.bio}`);
    console.log(`   Especialidades: ${instructorProfile.expertise.join(", ")}`);

    console.log("\n🎉 Perfil de instrutor adicionado com sucesso!");
  } catch (error) {
    console.error("❌ Erro ao adicionar perfil de instrutor:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Executar o script
addInstructorProfile()
  .then(() => {
    console.log("\n✨ Script executado com sucesso!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 Erro ao executar script:", error);
    process.exit(1);
  });
