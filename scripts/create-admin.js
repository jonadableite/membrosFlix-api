import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";

const prisma = new PrismaClient();

async function createAdminUser() {
  try {
    console.log("🚀 Iniciando criação do usuário admin...");

    // Dados do usuário admin
    const adminData = {
      name: "Jonadab Leite",
      email: "jonadab.leite@gmail.com",
      password: "Brayan2802",
      role: "ADMIN",
    };

    // Verificar se já existe um tenant padrão
    let defaultTenant = await prisma.tenant.findFirst({
      where: { name: "Default Tenant" },
    });

    if (!defaultTenant) {
      console.log("📝 Criando tenant padrão...");
      defaultTenant = await prisma.tenant.create({
        data: {
          id: uuidv4(),
          name: "Default Tenant",
          domain: "localhost",
          settings: {
            allowRegistration: true,
            maxUsers: 1000,
            features: ["notifications", "analytics", "multiTenant"],
          },
          isActive: true,
        },
      });
      console.log("✅ Tenant padrão criado:", defaultTenant.id);
    } else {
      console.log("✅ Tenant padrão já existe:", defaultTenant.id);
    }

    // Verificar se o usuário já existe
    const existingUser = await prisma.user.findFirst({
      where: {
        email: adminData.email,
        tenantId: defaultTenant.id,
      },
    });

    if (existingUser) {
      console.log("⚠️  Usuário admin já existe!");
      console.log("📋 Dados do usuário existente:");
      console.log(`   ID: ${existingUser.id}`);
      console.log(`   Nome: ${existingUser.name}`);
      console.log(`   Email: ${existingUser.email}`);
      console.log(`   Role: ${existingUser.role}`);
      console.log(`   Tenant: ${existingUser.tenantId}`);
      return;
    }

    // Hash da senha
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(adminData.password, saltRounds);

    // Criar usuário admin
    const adminUser = await prisma.user.create({
      data: {
        id: uuidv4(),
        tenantId: defaultTenant.id,
        name: adminData.name,
        email: adminData.email,
        passwordHash: passwordHash,
        role: adminData.role,
        status: true,
        points: 0,
        referralPoints: 0,
        referralCode: `ADMIN-${Date.now().toString(36).toUpperCase()}`,
        ultimoAcesso: new Date(),
      },
    });

    console.log("✅ Usuário admin criado com sucesso!");
    console.log("📋 Dados do usuário:");
    console.log(`   ID: ${adminUser.id}`);
    console.log(`   Nome: ${adminUser.name}`);
    console.log(`   Email: ${adminUser.email}`);
    console.log(`   Role: ${adminUser.role}`);
    console.log(`   Tenant: ${adminUser.tenantId}`);
    console.log(`   Referral Code: ${adminUser.referralCode}`);
    console.log(`   Status: ${adminUser.status ? "Ativo" : "Inativo"}`);
    console.log(`   Criado em: ${adminUser.createdAt}`);

    // Criar perfil de instrutor se necessário
    const instructorProfile = await prisma.instructor.create({
      data: {
        tenantId: defaultTenant.id,
        userId: adminUser.id,
        bio: "Administrador do sistema MembrosFlix",
        specialties: ["Administração", "Desenvolvimento", "Gestão"],
        experience:
          "Experiência em administração de sistemas e desenvolvimento de software",
        socialLinks: {
          linkedin: "",
          github: "",
          website: "",
        },
        isActive: true,
      },
    });

    console.log("✅ Perfil de instrutor criado:", instructorProfile.id);

    console.log("\n🎉 Usuário admin criado com sucesso!");
    console.log("🔑 Você pode fazer login com:");
    console.log(`   Email: ${adminData.email}`);
    console.log(`   Senha: ${adminData.password}`);
    console.log(`   Tenant ID: ${defaultTenant.id}`);
  } catch (error) {
    console.error("❌ Erro ao criar usuário admin:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Executar o script
createAdminUser()
  .then(() => {
    console.log("\n✨ Script executado com sucesso!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 Erro ao executar script:", error);
    process.exit(1);
  });
