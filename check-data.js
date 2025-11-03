import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkData() {
  try {
    console.log('🔍 Verificando dados do banco...\n');
    
    // Verificar usuários
    const users = await prisma.user.count();
    console.log(`👥 Total de usuários: ${users}`);
    
    // Verificar cursos
    const courses = await prisma.curso.count();
    console.log(`📚 Total de cursos: ${courses}`);
    
    // Verificar aulas
    const lessons = await prisma.aula.count();
    console.log(`🎓 Total de aulas: ${lessons}`);
    
    // Verificar inscrições
    const enrollments = await prisma.enrollment.count();
    console.log(`📝 Total de inscrições: ${enrollments}`);
    
    // Verificar notificações
    const notifications = await prisma.notification.count();
    console.log(`🔔 Total de notificações: ${notifications}`);
    
    if (enrollments === 0) {
      console.log('\n⚠️  Não há inscrições no sistema!');
      console.log('Isso explica por que as notificações não estão sendo enviadas.');
      
      // Verificar se há usuários e cursos para criar inscrições de teste
      if (users > 0 && courses > 0) {
        console.log('\n💡 Sugestão: Criar inscrições de teste');
        
        const sampleUsers = await prisma.user.findMany({ take: 3 });
        const sampleCourses = await prisma.curso.findMany({ take: 2 });
        
        console.log('\n📋 Usuários disponíveis:');
        sampleUsers.forEach(user => {
          console.log(`  - ${user.name} (${user.email}) - Role: ${user.role}`);
        });
        
        console.log('\n📋 Cursos disponíveis:');
        sampleCourses.forEach(course => {
          console.log(`  - ${course.title} (ID: ${course.id})`);
        });
      }
    } else {
      console.log('\n✅ Há inscrições no sistema. Verificando detalhes...');
      
      const enrollmentDetails = await prisma.enrollment.findMany({
        take: 5,
        include: {
          user: { select: { name: true, email: true, role: true } },
          course: { select: { title: true } }
        }
      });
      
      console.log('\n📋 Inscrições encontradas:');
      enrollmentDetails.forEach(enrollment => {
        console.log(`  - ${enrollment.user.name} inscrito em "${enrollment.course.title}"`);
      });
    }
    
  } catch (error) {
    console.error('❌ Erro ao verificar dados:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkData();