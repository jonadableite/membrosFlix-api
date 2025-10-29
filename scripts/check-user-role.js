import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkUserRole() {
  try {
    // Buscar o usuário pelo email e tenantId (chave composta)
    const users = await prisma.user.findMany({
      where: {
        email: 'jonadab.leite@gmail.com'
      },
      include: {
        instructor: true
      }
    });
    
    const user = users[0]; // Pegar o primeiro usuário encontrado

    if (user) {
      console.log('=== INFORMAÇÕES DO USUÁRIO ===');
      console.log('ID:', user.id);
      console.log('Nome:', user.name);
      console.log('Email:', user.email);
      console.log('Role:', user.role);
      console.log('Status:', user.status);
      console.log('TenantId:', user.tenantId);
      console.log('Tem perfil de instrutor:', user.instructor ? 'SIM' : 'NÃO');
      
      if (user.instructor) {
        console.log('=== PERFIL DE INSTRUTOR ===');
        console.log('Instructor ID:', user.instructor.id);
        console.log('Bio:', user.instructor.bio);
        console.log('Especialidades:', user.instructor.specialties);
      }
    } else {
      console.log('Usuário não encontrado!');
    }

    // Buscar todos os usuários para debug
    console.log('\n=== TODOS OS USUÁRIOS ===');
    const allUsers = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true
      }
    });
    
    allUsers.forEach(u => {
      console.log(`${u.name} (${u.email}) - Role: ${u.role} - Status: ${u.status}`);
    });

  } catch (error) {
    console.error('Erro ao verificar usuário:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUserRole();