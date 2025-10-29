import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function generateTestToken() {
  try {
    // Buscar o usuário admin
    const user = await prisma.user.findFirst({
      where: {
        email: 'jonadab.leite@gmail.com'
      }
    });

    if (!user) {
      console.log('Usuário não encontrado!');
      return;
    }

    console.log('=== USUÁRIO ENCONTRADO ===');
    console.log('ID:', user.id);
    console.log('Nome:', user.name);
    console.log('Email:', user.email);
    console.log('Role:', user.role);
    console.log('TenantId:', user.tenantId);

    // Gerar token JWT
    const payload = {
      id: user.id,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
      type: 'access'
    };

    const secret = process.env.JWT_SECRET || 'your-secret-key';
    const token = jwt.sign(payload, secret, { expiresIn: '24h' });

    console.log('\n=== TOKEN GERADO ===');
    console.log('Token:', token);
    
    // Verificar se o token é válido
    try {
      const decoded = jwt.verify(token, secret);
      console.log('\n=== TOKEN DECODIFICADO ===');
      console.log(decoded);
    } catch (error) {
      console.error('Erro ao verificar token:', error);
    }

    console.log('\n=== INSTRUÇÕES ===');
    console.log('1. Copie o token acima');
    console.log('2. No navegador, abra o DevTools (F12)');
    console.log('3. Vá para a aba Console');
    console.log('4. Execute: localStorage.setItem("@membrosflix:token", "SEU_TOKEN_AQUI")');
    console.log('5. Recarregue a página e tente criar um curso');

  } catch (error) {
    console.error('Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

generateTestToken();